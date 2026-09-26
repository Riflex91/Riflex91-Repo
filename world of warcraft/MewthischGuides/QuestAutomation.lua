local addonName, MG = ...

MG.automationStatus = MG.automationStatus or "bereit"
MG.automationBusyUntil = 0

local function now()
    return GetTime and GetTime() or 0
end

local function isBusy()
    return now() < (MG.automationBusyUntil or 0)
end

local function setBusy(seconds)
    MG.automationBusyUntil = now() + (seconds or 0.5)
end

local function currentQuestID()
    if GetQuestID then
        local ok, id = pcall(GetQuestID)
        if ok then return tonumber(id) end
    end
    return nil
end

function MG:LogAutomationBlocked(action, questID, reason)
    self.automationStatus = "Automatik pausiert"
    self:Log("INFO", "quest.auto.blocked",
        "Quest-Automatik hat keine Aktion ausgeführt.", {
            action = action,
            questID = questID,
            reason = reason,
        })
end

function MG:TryAutoGossip()
    if isBusy() then return end
    if InCombatLockdown and InCombatLockdown() then
        self:LogAutomationBlocked("gossip", nil, "combat")
        return
    end

    if self.db.settings.autoTurnInQuests and C_GossipInfo and
       C_GossipInfo.GetActiveQuests and C_GossipInfo.SelectActiveQuest then
        local ok, quests = pcall(C_GossipInfo.GetActiveQuests)
        if ok and type(quests) == "table" then
            for _, info in ipairs(quests) do
                if info and info.questID and info.isComplete then
                    setBusy(0.7)
                    self.automationStatus = "Fertige Quest wird zur Abgabe geöffnet"
                    self:Log("INFO", "quest.auto.select_turnin",
                        "Fertige Quest automatisch ausgewählt.", {
                            questID = info.questID,
                            title = info.title,
                        })
                    local selected, err = pcall(
                        C_GossipInfo.SelectActiveQuest, info.questID)
                    if not selected then
                        self:Log("WARN", "quest.auto.select_turnin_failed",
                            tostring(err), { questID = info.questID })
                    end
                    return
                end
            end
        end
    end

    if self.db.settings.autoAcceptQuests and C_GossipInfo and
       C_GossipInfo.GetAvailableQuests and C_GossipInfo.SelectAvailableQuest then
        local ok, quests = pcall(C_GossipInfo.GetAvailableQuests)
        if ok and type(quests) == "table" then
            for _, info in ipairs(quests) do
                if info and info.questID and not info.isIgnored then
                    setBusy(0.7)
                    self.automationStatus = "Quest wird automatisch geöffnet"
                    self:Log("INFO", "quest.auto.select_available",
                        "Verfügbare Quest automatisch ausgewählt.", {
                            questID = info.questID,
                            title = info.title,
                        })
                    local selected, err = pcall(
                        C_GossipInfo.SelectAvailableQuest, info.questID)
                    if not selected then
                        self:Log("WARN", "quest.auto.select_available_failed",
                            tostring(err), { questID = info.questID })
                    end
                    return
                end
            end
        end
    end
end

function MG:HandleQuestAutomationEvent(event)
    if not self.db or not self.db.settings then return end

    local policyAction =
        event == "QUEST_DETAIL" and "accept" or
        event == "QUEST_PROGRESS" and "complete" or
        event == "QUEST_COMPLETE" and "turnin" or
        (event == "GOSSIP_SHOW" or event == "QUEST_GREETING") and "gossip" or nil

    if policyAction and self.AutomationPolicy then
        local allowed, reason = self.AutomationPolicy:Allows(policyAction, currentQuestID())
        if not allowed then
            self:LogAutomationBlocked(
                policyAction, currentQuestID(), "policy_" .. tostring(reason))
            return
        end
    end

    if event == "GOSSIP_SHOW" or event == "QUEST_GREETING" then
        self:TryAutoGossip()
        return
    end

    if event == "QUEST_DETAIL" and self.db.settings.autoAcceptQuests then
        local questID = currentQuestID()

        if InCombatLockdown and InCombatLockdown() then
            self:LogAutomationBlocked("accept", questID, "combat")
            return
        end
        if not AcceptQuest then
            self:LogAutomationBlocked("accept", questID, "AcceptQuest_api_missing")
            return
        end

        self.automationStatus = "Quest wird automatisch angenommen"
        self:Log("INFO", "quest.auto.accept_attempt",
            "Quest wird automatisch angenommen.", { questID = questID })

        local ok, err = pcall(AcceptQuest)
        if not ok then
            self:Log("WARN", "quest.auto.accept_failed", tostring(err), {
                questID = questID,
            })
        end
        return
    end

    if event == "QUEST_PROGRESS" and self.db.settings.autoTurnInQuests then
        local questID = currentQuestID()
        local completable = false

        if IsQuestCompletable then
            local ok, value = pcall(IsQuestCompletable)
            completable = ok and value and true or false
        end

        if not completable then return end
        if not CompleteQuest then
            self:LogAutomationBlocked("complete", questID, "CompleteQuest_api_missing")
            return
        end

        self.automationStatus = "Quest wird für die Abgabe vorbereitet"
        self:Log("INFO", "quest.auto.complete_attempt",
            "Fertige Quest wird automatisch fortgesetzt.", {
                questID = questID,
            })

        local ok, err = pcall(CompleteQuest)
        if not ok then
            self:Log("WARN", "quest.auto.complete_failed", tostring(err), {
                questID = questID,
            })
        end
        return
    end

    if event == "QUEST_COMPLETE" and self.db.settings.autoTurnInQuests then
        local questID = currentQuestID()
        local choices = 0

        if GetNumQuestChoices then
            local ok, value = pcall(GetNumQuestChoices)
            if ok and tonumber(value) then choices = tonumber(value) end
        end

        if choices > 1 then
            self.automationStatus = "Belohnung manuell wählen"
            local recommendation = self.RewardAdvisor and
                self.RewardAdvisor:Refresh() or nil
            self:Log("INFO", "quest.auto.reward_choice_required",
                "Mehrere Questbelohnungen verfügbar; Auswahl bleibt manuell.", {
                    questID = questID,
                    choices = choices,
                    recommendedIndex = recommendation and recommendation.index or nil,
                })
            self:RefreshUI()
            return
        end

        if not GetQuestReward then
            self:LogAutomationBlocked("turnin", questID, "GetQuestReward_api_missing")
            return
        end

        self.automationStatus = "Quest wird automatisch abgegeben"
        self:Log("INFO", "quest.auto.turnin_attempt",
            "Fertige Quest wird automatisch abgegeben.", {
                questID = questID,
                choices = choices,
            })

        local ok, err = pcall(GetQuestReward, 1)
        if not ok then
            self:Log("WARN", "quest.auto.turnin_failed", tostring(err), {
                questID = questID,
                choices = choices,
            })
        end
    end
end
