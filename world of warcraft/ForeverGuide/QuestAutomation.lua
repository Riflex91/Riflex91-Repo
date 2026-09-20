local addonName, FG = ...

FG.automationStatus = FG.automationStatus or "bereit"
FG.automationBusyUntil = 0

local function now()
    return GetTime and GetTime() or 0
end

local function isBusy()
    return now() < (FG.automationBusyUntil or 0)
end

local function setBusy(seconds)
    FG.automationBusyUntil = now() + (seconds or 0.5)
end

local function currentQuestID()
    if GetQuestID then
        local ok, id = pcall(GetQuestID)
        if ok then return tonumber(id) end
    end
    return nil
end

function FG:TryAutoGossip()
    if isBusy() then return end
    if InCombatLockdown and InCombatLockdown() then
        self:Log("INFO", "quest.auto.skip_combat", "Quest-Automatik wartet bis nach dem Kampf.")
        return
    end

    if self.db.settings.autoTurnInQuests and C_GossipInfo and C_GossipInfo.GetActiveQuests and C_GossipInfo.SelectActiveQuest then
        local ok, quests = pcall(C_GossipInfo.GetActiveQuests)
        if ok and type(quests) == "table" then
            for _, info in ipairs(quests) do
                if info and info.questID and info.isComplete then
                    setBusy(0.7)
                    self.automationStatus = "Waehle fertige Quest zur Abgabe"
                    self:Log("INFO", "quest.auto.select_turnin", "Fertige Gossip-Quest automatisch ausgewaehlt.", {
                        questID = info.questID,
                        title = info.title,
                    })
                    local selected, err = pcall(C_GossipInfo.SelectActiveQuest, info.questID)
                    if not selected then
                        self:Log("WARN", "quest.auto.select_turnin_failed", tostring(err), { questID = info.questID })
                    end
                    return
                end
            end
        end
    end

    if self.db.settings.autoAcceptQuests and C_GossipInfo and C_GossipInfo.GetAvailableQuests and C_GossipInfo.SelectAvailableQuest then
        local ok, quests = pcall(C_GossipInfo.GetAvailableQuests)
        if ok and type(quests) == "table" then
            for _, info in ipairs(quests) do
                if info and info.questID and not info.isIgnored then
                    setBusy(0.7)
                    self.automationStatus = "Waehle neue Quest zur Annahme"
                    self:Log("INFO", "quest.auto.select_available", "Verfuegbare Gossip-Quest automatisch ausgewaehlt.", {
                        questID = info.questID,
                        title = info.title,
                        trivial = info.isTrivial and true or false,
                    })
                    local selected, err = pcall(C_GossipInfo.SelectAvailableQuest, info.questID)
                    if not selected then
                        self:Log("WARN", "quest.auto.select_available_failed", tostring(err), { questID = info.questID })
                    end
                    return
                end
            end
        end
    end

    -- Legacy Forever/Classic fallback if the structured gossip API is unavailable.
    if self.db.settings.autoTurnInQuests and GetNumActiveQuests and SelectActiveQuest then
        local ok, count = pcall(GetNumActiveQuests)
        if ok and tonumber(count) and count > 0 then
            for index = 1, count do
                local title, complete
                if GetActiveTitle then
                    local titleOk
                    titleOk, title, complete = pcall(GetActiveTitle, index)
                    if not titleOk then title, complete = nil, nil end
                end
                if complete then
                    setBusy(0.7)
                    self:Log("INFO", "quest.auto.legacy_turnin", "Legacy-Quest zur Abgabe ausgewaehlt.", {
                        index = index,
                        title = title,
                    })
                    pcall(SelectActiveQuest, index)
                    return
                end
            end
        end
    end

    if self.db.settings.autoAcceptQuests and GetNumAvailableQuests and SelectAvailableQuest then
        local ok, count = pcall(GetNumAvailableQuests)
        if ok and tonumber(count) and count > 0 then
            setBusy(0.7)
            self:Log("INFO", "quest.auto.legacy_accept", "Legacy-Quest zur Annahme ausgewaehlt.", { index = 1 })
            pcall(SelectAvailableQuest, 1)
        end
    end
end

function FG:HandleQuestAutomationEvent(event)
    if not self.db or not self.db.settings then return end

    if event == "GOSSIP_SHOW" or event == "QUEST_GREETING" then
        self:TryAutoGossip()
        return
    end

    if event == "QUEST_DETAIL" and self.db.settings.autoAcceptQuests then
        if InCombatLockdown and InCombatLockdown() then return end

        local questID = currentQuestID()
        self.automationStatus = "Quest wird automatisch angenommen"
        self:Log("INFO", "quest.auto.accept_attempt", "Quest wird automatisch angenommen.", { questID = questID })

        if AcceptQuest then
            local ok, err = pcall(AcceptQuest)
            if not ok then
                self:Log("WARN", "quest.auto.accept_failed", tostring(err), { questID = questID })
            end
        else
            self:Log("WARN", "quest.auto.accept_missing", "AcceptQuest API fehlt.", { questID = questID })
        end
        return
    end

    if event == "QUEST_PROGRESS" and self.db.settings.autoTurnInQuests then
        local completable = false
        if IsQuestCompletable then
            local ok, value = pcall(IsQuestCompletable)
            completable = ok and value and true or false
        end

        if completable and CompleteQuest then
            local questID = currentQuestID()
            self.automationStatus = "Quest wird fuer die Abgabe vorbereitet"
            self:Log("INFO", "quest.auto.complete_attempt", "Fertige Quest wird automatisch fortgesetzt.", {
                questID = questID,
            })
            local ok, err = pcall(CompleteQuest)
            if not ok then
                self:Log("WARN", "quest.auto.complete_failed", tostring(err), { questID = questID })
            end
        end
        return
    end

    if event == "QUEST_COMPLETE" and self.db.settings.autoTurnInQuests then
        local questID = currentQuestID()
        local choices = 0

        if GetNumQuestChoices then
            local ok, value = pcall(GetNumQuestChoices)
            if ok and tonumber(value) then choices = value end
        end

        if choices > 1 then
            self.automationStatus = "Belohnung manuell waehlen"
            self:Log("INFO", "quest.auto.reward_choice_required",
                "Mehrere Questbelohnungen verfuegbar; automatische Auswahl ist aus Sicherheitsgruenden pausiert.",
                { questID = questID, choices = choices })
            self:RefreshUI()
            return
        end

        if GetQuestReward then
            self.automationStatus = "Quest wird automatisch abgegeben"
            self:Log("INFO", "quest.auto.turnin_attempt", "Quest wird automatisch abgegeben.", {
                questID = questID,
                choices = choices,
            })

            local choiceIndex = 1
            local ok, err = pcall(GetQuestReward, choiceIndex)
            if not ok then
                self:Log("WARN", "quest.auto.turnin_failed", tostring(err), {
                    questID = questID,
                    choices = choices,
                })
            end
        else
            self:Log("WARN", "quest.auto.turnin_missing", "GetQuestReward API fehlt.", { questID = questID })
        end
    end
end
