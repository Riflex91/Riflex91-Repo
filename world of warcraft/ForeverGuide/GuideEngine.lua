local addonName, FG = ...

FG.steps = FG.steps or {}
FG.currentStepIndex = 1
FG.manualOffset = 0

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
    if ok and type(objectives) == "table" then return objectives end
    return {}
end

local function objectiveText(objectives)
    for _, objective in ipairs(objectives) do
        if not objective.finished then return objective.text or "Questziel erledigen" end
    end
    if #objectives > 0 then return objectives[#objectives].text or "Quest abschließen" end
    return "Quest fortsetzen"
end

local function seedRank(questID)
    local seed = FG.Data and FG.Data.observedQuests and FG.Data.observedQuests[questID]
    return seed and seed.order or 10000
end

function FG:BuildLiveSteps()
    local steps = {}
    if not C_QuestLog or not C_QuestLog.GetNumQuestLogEntries or not C_QuestLog.GetInfo then
        self:Log("WARN", "guide.quest_api_missing", "Questlog-API ist nicht verfügbar.")
        return steps
    end

    local count = C_QuestLog.GetNumQuestLogEntries()
    for index = 1, count do
        local info = C_QuestLog.GetInfo(index)
        if info and not info.isHeader and info.questID then
            local questID = info.questID
            local objectives = getObjectives(questID)
            local complete = questComplete(questID, info)
            local seed = self.Data.observedQuests[questID]
            steps[#steps + 1] = {
                questID = questID,
                title = info.title or (seed and seed.title) or ("Quest " .. tostring(questID)),
                level = info.level, complete = complete,
                action = complete and "Quest abgeben" or "Questziel erledigen",
                detail = complete and "Die Quest ist bereit zur Abgabe." or objectiveText(objectives),
                objectives = objectives, source = seed and seed.status or "LIVE",
                seedOrder = seedRank(questID), questLogIndex = index,
            }
        end
    end

    table.sort(steps, function(a, b)
        if a.complete ~= b.complete then return a.complete end
        if a.seedOrder ~= b.seedOrder then return a.seedOrder < b.seedOrder end
        local al, bl = tonumber(a.level) or 999, tonumber(b.level) or 999
        if al ~= bl then return al < bl end
        return (a.title or "") < (b.title or "")
    end)
    return steps
end

function FG:ChooseStep(reason)
    self.steps = self:BuildLiveSteps()
    local oldQuestID = self.currentStep and self.currentStep.questID or nil
    if #self.steps == 0 then
        self.currentStepIndex = 0; self.currentStep = nil
        self:Log("INFO", "guide.no_steps", "Keine aktiven Quests im Questlog.", { reason = reason })
        return
    end
    local desired = 1 + (self.manualOffset or 0)
    if desired < 1 then desired = 1 end
    if desired > #self.steps then desired = #self.steps end
    self.currentStepIndex = desired
    self.currentStep = self.steps[desired]
    if oldQuestID ~= self.currentStep.questID then
        self:Log("INFO", "guide.step_changed", "Aktiver Guide-Schritt geändert.", {
            reason = reason, previousQuestID = oldQuestID, questID = self.currentStep.questID,
            title = self.currentStep.title, complete = self.currentStep.complete, source = self.currentStep.source,
        })
    end
    self:ApplyQuestTracking(self.currentStep.questID)
end

function FG:RefreshGuide(reason)
    self:ChooseStep(reason or "refresh")
    self:RefreshNavigation(reason or "refresh")
    self:RefreshUI()
end

function FG:SelectRelativeStep(delta, reason)
    if not self.steps or #self.steps == 0 then return end
    self.manualOffset = (self.manualOffset or 0) + delta
    if self.manualOffset < 0 then self.manualOffset = 0 end
    if self.manualOffset > (#self.steps - 1) then self.manualOffset = #self.steps - 1 end
    self:RefreshGuide(reason or "manual_step")
end

function FG:ApplyQuestTracking(questID)
    if not questID or not self.db or not self.db.settings.autoSuperTrack then return end
    if C_QuestLog and C_QuestLog.SetSelectedQuest then pcall(C_QuestLog.SetSelectedQuest, questID) end
    if C_SuperTrack and C_SuperTrack.SetSuperTrackedQuestID then
        local ok, err = pcall(C_SuperTrack.SetSuperTrackedQuestID, questID)
        if ok then self:Log("INFO", "navigation.supertrack", "Blizzard-SuperTrack gesetzt.", { questID = questID })
        else self:Log("WARN", "navigation.supertrack_failed", tostring(err), { questID = questID }) end
    else
        self:Log("WARN", "navigation.supertrack_missing", "C_SuperTrack.SetSuperTrackedQuestID fehlt.", { questID = questID })
    end
end
