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

local function sameQuest(expected, actual)
    return expected ~= nil and actual ~= nil and tonumber(expected) == tonumber(actual)
end

function MG:LogAutomationBlocked(action, expectedQuestID, actualQuestID, reason)
    self.automationStatus = "Automatik pausiert"

    self:Log("INFO", "quest.auto.blocked",
        "Quest-Automatik hat keine Aktion ausgefuehrt.", {
            action = action,
            expectedQuestID = expectedQuestID,
            actualQuestID = actualQuestID,
            reason = reason,
            phase = self.currentStep and self.currentStep.phase or nil,
        })
end

function MG:TryAutoGossip()
    if isBusy() then return end

    if InCombatLockdown and InCombatLockdown() then
        self:LogAutomationBlocked("gossip", nil, nil, "combat")
        return
    end

    local expectedTurnIn = self:GetExpectedQuestForAutomation("turnin")
    local expectedAccept = self:GetExpectedQuestForAutomation("accept")

    if expectedTurnIn and self.db.settings.autoTurnInQuests then
        if C_GossipInfo and C_GossipInfo.GetActiveQuests and C_GossipInfo.SelectActiveQuest then
            local ok, quests = pcall(C_GossipInfo.GetActiveQuests)

            if ok and type(quests) == "table" then
                for _, info in ipairs(quests) do
                    if info and sameQuest(expectedTurnIn, info.questID) and info.isComplete then
                        setBusy(0.7)
                        self.automationStatus = "Erwartete Quest wird zur Abgabe geoeffnet"

                        self:Log("INFO", "quest.auto.select_turnin",
                            "Erwartete fertige Guide-Quest automatisch ausgewaehlt.", {
                                expectedQuestID = expectedTurnIn,
                                questID = info.questID,
                                title = info.title,
                            })

                        local selected, err = pcall(C_GossipInfo.SelectActiveQuest, info.questID)

                        if not selected then
                            self:Log("WARN", "quest.auto.select_turnin_failed",
                                tostring(err), {
                                    expectedQuestID = expectedTurnIn,
                                    questID = info.questID,
                                })
                        end

                        return
                    end
                end

                self:LogAutomationBlocked(
                    "select_turnin",
                    expectedTurnIn,
                    nil,
                    "expected_turnin_not_offered")
                return
            end
        end

        self:LogAutomationBlocked(
            "select_turnin",
            expectedTurnIn,
            nil,
            "quest_id_safe_gossip_api_unavailable")
        return
    end

    if expectedAccept and self.db.settings.autoAcceptQuests then
        if C_GossipInfo and C_GossipInfo.GetAvailableQuests and C_GossipInfo.SelectAvailableQuest then
            local ok, quests = pcall(C_GossipInfo.GetAvailableQuests)

            if ok and type(quests) == "table" then
                for _, info in ipairs(quests) do
                    if info and sameQuest(expectedAccept, info.questID) and not info.isIgnored then
                        setBusy(0.7)
                        self.automationStatus = "Erwartete Quest wird geoeffnet"

                        self:Log("INFO", "quest.auto.select_available",
                            "Erwartete Guide-Quest automatisch ausgewaehlt.", {
                                expectedQuestID = expectedAccept,
                                questID = info.questID,
                                title = info.title,
                            })

                        local selected, err = pcall(C_GossipInfo.SelectAvailableQuest, info.questID)

                        if not selected then
                            self:Log("WARN", "quest.auto.select_available_failed",
                                tostring(err), {
                                    expectedQuestID = expectedAccept,
                                    questID = info.questID,
                                })
                        end

                        return
                    end
                end

                self:LogAutomationBlocked(
                    "select_accept",
                    expectedAccept,
                    nil,
                    "expected_accept_not_offered")
                return
            end
        end

        self:LogAutomationBlocked(
            "select_accept",
            expectedAccept,
            nil,
            "quest_id_safe_gossip_api_unavailable")
        return
    end

    -- Intentionally no legacy "first quest" fallback. Without a trustworthy
    -- quest ID, automatically selecting an entry would violate Step 4 safety.
    self:LogAutomationBlocked(
        "gossip",
        expectedAccept or expectedTurnIn,
        nil,
        "current_step_does_not_expect_gossip_action")
end

function MG:HandleQuestAutomationEvent(event)
    if not self.db or not self.db.settings then return end

    if event == "GOSSIP_SHOW" or event == "QUEST_GREETING" then
        self:TryAutoGossip()
        return
    end

    if event == "QUEST_DETAIL" and self.db.settings.autoAcceptQuests then
        if InCombatLockdown and InCombatLockdown() then
            self:LogAutomationBlocked("accept", self:GetExpectedQuestForAutomation("accept"), currentQuestID(), "combat")
            return
        end

        local expectedQuestID = self:GetExpectedQuestForAutomation("accept")
        local questID = currentQuestID()

        if not sameQuest(expectedQuestID, questID) then
            self:LogAutomationBlocked(
                "accept",
                expectedQuestID,
                questID,
                expectedQuestID and "dialog_quest_does_not_match_expected" or "guide_not_in_accept_phase")
            return
        end

        if not AcceptQuest then
            self:LogAutomationBlocked("accept", expectedQuestID, questID, "AcceptQuest_api_missing")
            return
        end

        self.automationStatus = "Erwartete Quest wird automatisch angenommen"
        self:Log("INFO", "quest.auto.accept_attempt",
            "Erwartete Guide-Quest wird automatisch angenommen.", {
                expectedQuestID = expectedQuestID,
                questID = questID,
            })

        local ok, err = pcall(AcceptQuest)

        if not ok then
            self:Log("WARN", "quest.auto.accept_failed", tostring(err), {
                expectedQuestID = expectedQuestID,
                questID = questID,
            })
        end

        return
    end

    if event == "QUEST_PROGRESS" and self.db.settings.autoTurnInQuests then
        local expectedQuestID = self:GetExpectedQuestForAutomation("turnin")
        local questID = currentQuestID()

        if not sameQuest(expectedQuestID, questID) then
            self:LogAutomationBlocked(
                "complete",
                expectedQuestID,
                questID,
                expectedQuestID and "progress_quest_does_not_match_expected" or "guide_not_in_turnin_phase")
            return
        end

        local completable = false

        if IsQuestCompletable then
            local ok, value = pcall(IsQuestCompletable)
            completable = ok and value and true or false
        end

        if not completable then
            self:LogAutomationBlocked("complete", expectedQuestID, questID, "quest_not_completable")
            return
        end

        if not CompleteQuest then
            self:LogAutomationBlocked("complete", expectedQuestID, questID, "CompleteQuest_api_missing")
            return
        end

        self.automationStatus = "Erwartete Quest wird fuer die Abgabe vorbereitet"

        self:Log("INFO", "quest.auto.complete_attempt",
            "Erwartete fertige Guide-Quest wird automatisch fortgesetzt.", {
                expectedQuestID = expectedQuestID,
                questID = questID,
            })

        local ok, err = pcall(CompleteQuest)

        if not ok then
            self:Log("WARN", "quest.auto.complete_failed", tostring(err), {
                expectedQuestID = expectedQuestID,
                questID = questID,
            })
        end

        return
    end

    if event == "QUEST_COMPLETE" and self.db.settings.autoTurnInQuests then
        local expectedQuestID = self:GetExpectedQuestForAutomation("turnin")
        local questID = currentQuestID()

        if not sameQuest(expectedQuestID, questID) then
            self:LogAutomationBlocked(
                "turnin",
                expectedQuestID,
                questID,
                expectedQuestID and "complete_quest_does_not_match_expected" or "guide_not_in_turnin_phase")
            return
        end

        local choices = 0

        if GetNumQuestChoices then
            local ok, value = pcall(GetNumQuestChoices)
            if ok and tonumber(value) then choices = value end
        end

        if choices > 1 then
            self.automationStatus = "Belohnung manuell waehlen"
            local recommendation = self.RewardAdvisor and self.RewardAdvisor:Refresh() or nil

            self:Log("INFO", "quest.auto.reward_choice_required",
                "Mehrere Questbelohnungen verfuegbar; Auto-Abgabe wartet auf die Auswahl des Spielers.", {
                    expectedQuestID = expectedQuestID,
                    questID = questID,
                    choices = choices,
                    recommendedIndex = recommendation and recommendation.index or nil,
                    recommendedItemID = recommendation and recommendation.evaluation and
                        recommendation.evaluation.itemID or nil,
                    recommendationConfidence = recommendation and recommendation.evaluation and
                        recommendation.evaluation.confidence or nil,
                })

            self:RefreshUI()
            return
        end

        if not GetQuestReward then
            self:LogAutomationBlocked("turnin", expectedQuestID, questID, "GetQuestReward_api_missing")
            return
        end

        self.automationStatus = "Erwartete Quest wird automatisch abgegeben"

        self:Log("INFO", "quest.auto.turnin_attempt",
            "Erwartete Guide-Quest wird automatisch abgegeben.", {
                expectedQuestID = expectedQuestID,
                questID = questID,
                choices = choices,
            })

        local ok, err = pcall(GetQuestReward, 1)

        if not ok then
            self:Log("WARN", "quest.auto.turnin_failed", tostring(err), {
                expectedQuestID = expectedQuestID,
                questID = questID,
                choices = choices,
            })
        end
    end
end
