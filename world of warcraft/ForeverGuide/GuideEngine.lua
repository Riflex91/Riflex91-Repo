local addonName, FG = ...

FG.steps = FG.steps or {}
FG.currentStepIndex = 1
FG.manualOffset = 0
FG.lastProgressSignature = nil
FG.lastSuperTrackedQuestID = nil

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

local function formatObjectives(questID, objectives)
    if #objectives == 0 then
        return "Quest fortsetzen"
    end

    local lines = {}

    for index, objective in ipairs(objectives) do
        local prefix = objective.finished and "[OK] " or "[ ] "
        local text = objective.text

        if (not text or text == "") and GetQuestObjectiveInfo then
            local ok, apiText = pcall(GetQuestObjectiveInfo, questID, index, false)
            if ok then text = apiText end
        end

        if objective.type == "progressbar" and GetQuestProgressBarPercent then
            local ok, percent = pcall(GetQuestProgressBarPercent, questID)
            if ok and percent then
                text = (text or "Fortschritt") .. " - " .. tostring(math.floor(percent + 0.5)) .. "%"
            end
        end

        lines[#lines + 1] = prefix .. tostring(text or ("Ziel " .. tostring(index)))
    end

    return table.concat(lines, "\n")
end

local function seedRank(questID)
    local seed = FG.Data and FG.Data.observedQuests and FG.Data.observedQuests[questID]
    return seed and seed.order or 10000
end

function FG:BuildLiveSteps()
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

            steps[#steps + 1] = {
                questID = questID,
                title = info.title or (seed and seed.title) or ("Quest " .. tostring(questID)),
                level = info.level,
                complete = complete,
                action = complete and "Quest abgeben" or "Questziel erledigen",
                detail = complete and "Die Quest ist bereit zur Abgabe." or formatObjectives(questID, objectives),
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

function FG:BuildProgressSignature(steps)
    local parts = {}

    for _, step in ipairs(steps or {}) do
        parts[#parts + 1] = tostring(step.questID)
        parts[#parts + 1] = step.complete and "done" or "open"

        for _, objective in ipairs(step.objectives or {}) do
            parts[#parts + 1] = tostring(objective.text or "")
            parts[#parts + 1] = objective.finished and "1" or "0"
        end
    end

    return table.concat(parts, "|")
end

function FG:ChooseStep(reason)
    self.steps = self:BuildLiveSteps()
    local oldQuestID = self.currentStep and self.currentStep.questID or nil

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

    if oldQuestID ~= self.currentStep.questID then
        self:Log("INFO", "guide.step_changed", "Aktiver Guide-Schritt geaendert.", {
            reason = reason,
            previousQuestID = oldQuestID,
            questID = self.currentStep.questID,
            title = self.currentStep.title,
            complete = self.currentStep.complete,
            source = self.currentStep.source,
        })
    end

    self:ApplyQuestTracking(self.currentStep.questID)
end

function FG:RefreshGuide(reason)
    self:ChooseStep(reason or "refresh")
    self:RefreshNavigation(reason or "refresh")
    self:RefreshUI()
end

function FG:PollQuestProgress()
    if not self.db then return end

    local steps = self:BuildLiveSteps()
    local signature = self:BuildProgressSignature(steps)

    if self.lastProgressSignature == nil then
        self.lastProgressSignature = signature
        return
    end

    if signature ~= self.lastProgressSignature then
        local old = self.lastProgressSignature
        self.lastProgressSignature = signature

        self:Log("INFO", "quest.progress_changed", "Questfortschritt automatisch erkannt.", {
            questID = self.currentStep and self.currentStep.questID or nil,
            previousSignatureLength = string.len(old or ""),
            currentSignatureLength = string.len(signature or ""),
        })

        self:RefreshGuide("progress_changed")
    end
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

    if C_QuestLog and C_QuestLog.SetSelectedQuest then
        pcall(C_QuestLog.SetSelectedQuest, questID)
    end

    if C_SuperTrack and C_SuperTrack.SetSuperTrackedQuestID then
        local ok, err = pcall(C_SuperTrack.SetSuperTrackedQuestID, questID)

        if ok then
            if self.lastSuperTrackedQuestID ~= questID then
                self.lastSuperTrackedQuestID = questID
                self:Log("INFO", "navigation.supertrack", "Blizzard-SuperTrack gesetzt.", {
                    questID = questID,
                })
            end
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
