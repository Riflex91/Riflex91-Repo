local addonName, MG = ...

MG.steps = MG.steps or {}
MG.currentStepIndex = 1
MG.manualOffset = 0
MG.lastProgressSignature = nil
MG.lastSuperTrackedQuestID = nil
MG.poiRefreshGeneration = 0

function MG:BuildProgressSignature(steps)
    local parts = {}

    for _, step in ipairs(steps or {}) do
        parts[#parts + 1] = tostring(step.questID or "")
        parts[#parts + 1] = tostring(step.phase or "")
        parts[#parts + 1] = tostring(step.complete and "done" or "open")
        parts[#parts + 1] = self:GoalSignature(step.goals)
    end

    return table.concat(parts, "|")
end

function MG:ChooseStep(reason)
    local oldQuestID = self.currentStep and self.currentStep.questID or nil
    local oldPhase = self.currentStep and self.currentStep.phase or nil
    local oldGoalID = self.currentStep and self.currentStep.goal and self.currentStep.goal.id or nil

    local steps, preferredIndex, preferredReason = self:BuildGuideSteps()
    self.steps = steps

    if #self.steps == 0 then
        self.currentStepIndex = 0
        self.currentStep = nil
        self.lastProgressSignature = self:BuildProgressSignature(self.steps)

        if oldQuestID then
            self:Log("INFO", "guide.no_steps", "Keine passenden Guide-Schritte gefunden.", {
                reason = reason,
            })
        end
        return
    end

    local desired = (preferredIndex or 1) + (self.manualOffset or 0)
    if desired < 1 then desired = 1 end
    if desired > #self.steps then desired = #self.steps end

    self.currentStepIndex = desired
    self.currentStep = self.steps[desired]
    self.lastProgressSignature = self:BuildProgressSignature(self.steps)

    local newGoalID = self.currentStep.goal and self.currentStep.goal.id or nil

    if oldQuestID ~= self.currentStep.questID or oldPhase ~= self.currentStep.phase then
        if self.AudioFeedback then self.AudioFeedback:Play("step") end
        self:Log("INFO", "guide.step_changed", "Aktiver Guide-Schritt geändert.", {
            reason = reason,
            resyncReason = preferredReason,
            previousQuestID = oldQuestID,
            previousPhase = oldPhase,
            questID = self.currentStep.questID,
            phase = self.currentStep.phase,
            title = self.currentStep.title,
            source = self.currentStep.source,
            verification = self.currentStep.verification,
            goalID = newGoalID,
            instruction = self.currentStep.goal and self.currentStep.goal.instruction or nil,
        })
    elseif oldGoalID ~= newGoalID then
        self:Log("INFO", "goal.changed", "Aktives Questziel geändert.", {
            reason = reason,
            questID = self.currentStep.questID,
            phase = self.currentStep.phase,
            previousGoalID = oldGoalID,
            goalID = newGoalID,
            instruction = self.currentStep.goal and self.currentStep.goal.instruction or nil,
        })
    end

    if self.currentStep.phase == self.StepPhases.OBJECTIVES or
       self.currentStep.phase == self.StepPhases.TURNIN or
       self.currentStep.phase == self.StepPhases.LIVE then
        self:ApplyQuestTracking(self.currentStep.questID)
    end
end

function MG:RefreshGuide(reason)
    reason = reason or "refresh"
    self:ChooseStep(reason)
    if self.RuntimeEngine then
        self.RuntimeEngine:Commit(
            self.currentStep,
            self.GetActiveGuideDefinition and self:GetActiveGuideDefinition() or nil,
            reason)
    end
    if self.RestEDXPActionEngine then self.RestEDXPActionEngine:Refresh(self.currentStep) end
    if self.TrainerAdvisor then self.TrainerAdvisor:Refresh(reason or "refresh") end
    self:RefreshNavigation(reason or "refresh")
    self:RefreshUI()
    self:RefreshNavigator()
end

function MG:PollQuestProgress()
    if not self.db then return end

    local steps = self:BuildGuideSteps()
    local signature = self:BuildProgressSignature(steps)

    if self.lastProgressSignature == nil then
        self.lastProgressSignature = signature
        return
    end

    if signature ~= self.lastProgressSignature then
        self:Log("INFO", "quest.progress_changed", "Quest-/Guide-Fortschritt automatisch erkannt.", {
            questID = self.currentStep and self.currentStep.questID or nil,
            phase = self.currentStep and self.currentStep.phase or nil,
            goalID = self.currentStep and self.currentStep.goal and self.currentStep.goal.id or nil,
        })

        self.manualOffset = 0
        self:RefreshGuide("progress_changed")
    end
end

function MG:SelectRelativeStep(delta, reason)
    if not self.steps or #self.steps == 0 then return end

    self.manualOffset = (self.manualOffset or 0) + delta

    local _, preferredIndex = self:BuildGuideSteps()
    local desired = (preferredIndex or 1) + self.manualOffset

    if desired < 1 then
        self.manualOffset = 1 - (preferredIndex or 1)
    elseif desired > #self.steps then
        self.manualOffset = #self.steps - (preferredIndex or 1)
    end

    self:RefreshGuide(reason or "manual_step")
end

function MG:SchedulePOIRefresh(questID)
    if not C_Timer or not C_Timer.After then return end

    self.poiRefreshGeneration = (self.poiRefreshGeneration or 0) + 1
    local generation = self.poiRefreshGeneration

    C_Timer.After(0.20, function()
        if generation ~= MG.poiRefreshGeneration then return end
        if not MG.currentStep or MG.currentStep.questID ~= questID then return end

        MG:Safe("navigation.poi_refresh", function()
            if QuestPOIUpdateIcons then pcall(QuestPOIUpdateIcons) end
            MG:RefreshNavigation("poi_refresh")
            MG:RefreshNavigator()
            MG:RefreshInfo()
        end)
    end)
end

function MG:ApplyQuestTracking(questID)
    if not questID or not self.db or not self.db.settings.autoSuperTrack then return end

    if C_QuestLog and C_QuestLog.SetSelectedQuest then
        pcall(C_QuestLog.SetSelectedQuest, questID)
    end

    if C_QuestLog and C_QuestLog.AddQuestWatch and Enum and Enum.QuestWatchType then
        pcall(C_QuestLog.AddQuestWatch, questID, Enum.QuestWatchType.Manual)
    end

    if C_SuperTrack and C_SuperTrack.SetSuperTrackedQuestID then
        local ok, err = pcall(C_SuperTrack.SetSuperTrackedQuestID, questID)

        if ok then
            if QuestPOIUpdateIcons then pcall(QuestPOIUpdateIcons) end

            if self.lastSuperTrackedQuestID ~= questID then
                self.lastSuperTrackedQuestID = questID
                self:Log("INFO", "navigation.supertrack", "Blizzard-SuperTrack gesetzt.", {
                    questID = questID,
                })
            end

            self:SchedulePOIRefresh(questID)
        else
            self:Log("WARN", "navigation.supertrack_failed", tostring(err), {
                questID = questID,
            })
        end
    elseif self.lastSuperTrackedQuestID ~= questID then
        self.lastSuperTrackedQuestID = questID
        self:Log("WARN", "navigation.supertrack_missing",
            "C_SuperTrack.SetSuperTrackedQuestID fehlt.", {
                questID = questID,
            })
    end
end
