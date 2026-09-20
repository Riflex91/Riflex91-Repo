local addonName, MG = ...

MG.steps = MG.steps or {}
MG.currentStepIndex = 1
MG.manualOffset = 0
MG.lastProgressSignature = nil
MG.lastSuperTrackedQuestID = nil
MG.poiRefreshGeneration = 0

local function questComplete(questID, info)
    if C_QuestLog and C_QuestLog.ReadyForTurnIn then
        local ok, value = pcall(C_QuestLog.ReadyForTurnIn, questID)
        if ok and value ~= nil then return value and true or false end
    end

    if C_QuestLog and C_QuestLog.IsComplete then
        local ok, value = pcall(C_QuestLog.IsComplete, questID)
        if ok and value ~= nil then return value and true or false end
    end

    return info and info.isComplete and true or false
end

local function getObjectives(questID)
    if not C_QuestLog or not C_QuestLog.GetQuestObjectives then return {} end

    local ok, objectives = pcall(C_QuestLog.GetQuestObjectives, questID)
    if ok and type(objectives) == "table" then
        return objectives
    end

    return {}
end

local function seedRank(questID)
    local seed = MG.Data and MG.Data.observedQuests and MG.Data.observedQuests[questID]
    return seed and seed.order or 10000
end

function MG:BuildLiveSteps()
    local steps = {}

    if not C_QuestLog or not C_QuestLog.GetNumQuestLogEntries or not C_QuestLog.GetInfo then
        self:Log("WARN", "guide.quest_api_missing", "Questlog-API ist nicht verfuegbar.")
        return steps
    end

    local count = C_QuestLog.GetNumQuestLogEntries()

    for index = 1, count do
        local info = C_QuestLog.GetInfo(index)

        if info and not info.isHeader and info.questID then
            local questID = info.questID
            local objectives = getObjectives(questID)
            local complete = questComplete(questID, info)
            local seed = self.Data and self.Data.observedQuests and self.Data.observedQuests[questID]
            local goals = self:BuildQuestGoals(questID, objectives, complete)
            local activeGoal = self:GetActiveGoal(goals)

            steps[#steps + 1] = {
                questID = questID,
                title = info.title or (seed and seed.title) or ("Quest " .. tostring(questID)),
                level = info.level,
                complete = complete,
                action = complete and "Quest abgeben" or "Questziel erledigen",
                detail = activeGoal and activeGoal.instruction or "Quest fortsetzen",
                goals = goals,
                goal = activeGoal,
                goalSummary = self:GetGoalSummary(goals),
                objectives = objectives,
                source = seed and seed.status or "LIVE",
                seedOrder = seedRank(questID),
                questLogIndex = index,
            }
        end
    end

    table.sort(steps, function(a, b)
        if a.complete ~= b.complete then return a.complete end
        if a.seedOrder ~= b.seedOrder then return a.seedOrder < b.seedOrder end

        local al = tonumber(a.level) or 999
        local bl = tonumber(b.level) or 999
        if al ~= bl then return al < bl end

        return (a.title or "") < (b.title or "")
    end)

    return steps
end

function MG:BuildProgressSignature(steps)
    local parts = {}

    for _, step in ipairs(steps or {}) do
        parts[#parts + 1] = tostring(step.questID)
        parts[#parts + 1] = step.complete and "done" or "open"
        parts[#parts + 1] = self:GoalSignature(step.goals)
    end

    return table.concat(parts, "|")
end

function MG:ChooseStep(reason)
    self.steps = self:BuildLiveSteps()
    local oldQuestID = self.currentStep and self.currentStep.questID or nil
    local oldGoalID = self.currentStep and self.currentStep.goal and self.currentStep.goal.id or nil

    if #self.steps == 0 then
        self.currentStepIndex = 0
        self.currentStep = nil

        if oldQuestID then
            self:Log("INFO", "guide.no_steps", "Keine aktiven Quests im Questlog.", { reason = reason })
        end

        self.lastProgressSignature = self:BuildProgressSignature(self.steps)
        return
    end

    local desired = 1 + (self.manualOffset or 0)
    if desired < 1 then desired = 1 end
    if desired > #self.steps then desired = #self.steps end

    self.currentStepIndex = desired
    self.currentStep = self.steps[desired]
    self.lastProgressSignature = self:BuildProgressSignature(self.steps)

    local newGoalID = self.currentStep.goal and self.currentStep.goal.id or nil

    if oldQuestID ~= self.currentStep.questID then
        self:Log("INFO", "guide.step_changed", "Aktiver Guide-Schritt geaendert.", {
            reason = reason,
            previousQuestID = oldQuestID,
            questID = self.currentStep.questID,
            title = self.currentStep.title,
            complete = self.currentStep.complete,
            source = self.currentStep.source,
            goalID = newGoalID,
            instruction = self.currentStep.goal and self.currentStep.goal.instruction or nil,
        })
    elseif oldGoalID ~= newGoalID then
        self:Log("INFO", "goal.changed", "Aktives Questziel geaendert.", {
            reason = reason,
            questID = self.currentStep.questID,
            previousGoalID = oldGoalID,
            goalID = newGoalID,
            instruction = self.currentStep.goal and self.currentStep.goal.instruction or nil,
        })
    end

    self:ApplyQuestTracking(self.currentStep.questID)
end

function MG:RefreshGuide(reason)
    self:ChooseStep(reason or "refresh")
    self:RefreshNavigation(reason or "refresh")
    self:RefreshUI()
    self:RefreshNavigator()
end

function MG:PollQuestProgress()
    if not self.db then return end

    local steps = self:BuildLiveSteps()
    local signature = self:BuildProgressSignature(steps)

    if self.lastProgressSignature == nil then
        self.lastProgressSignature = signature
        return
    end

    if signature ~= self.lastProgressSignature then
        self.lastProgressSignature = signature

        self:Log("INFO", "quest.progress_changed", "Questfortschritt automatisch erkannt.", {
            questID = self.currentStep and self.currentStep.questID or nil,
            goalID = self.currentStep and self.currentStep.goal and self.currentStep.goal.id or nil,
        })

        self:RefreshGuide("progress_changed")
    end
end

function MG:SelectRelativeStep(delta, reason)
    if not self.steps or #self.steps == 0 then return end

    self.manualOffset = (self.manualOffset or 0) + delta
    if self.manualOffset < 0 then self.manualOffset = 0 end
    if self.manualOffset > (#self.steps - 1) then self.manualOffset = #self.steps - 1 end

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
