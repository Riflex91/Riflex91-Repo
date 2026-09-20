local addonName, MG = ...

MG.steps = MG.steps or {}
MG.currentStepIndex = 1
MG.manualOffset = 0
MG.lastProgressSignature = nil
MG.lastSuperTrackedQuestID = nil

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

local function cleanObjectiveName(text, objectiveType)
    text = tostring(text or "")
    local name = text:match("^(.-):%s*%d+%s*/%s*%d+") or text
    name = name:gsub("%s+getoetet$", "")
    name = name:gsub("%s+getötet$", "")
    name = name:gsub("%s+killed$", "")
    name = name:gsub("%s+slain$", "")
    name = name:gsub("^%s+", ""):gsub("%s+$", "")
    if name == "" then
        if objectiveType == "monster" then return "Questgegner" end
        if objectiveType == "item" then return "Questgegenstand" end
        return "Questziel"
    end
    return name
end

local function objectiveNumbers(objective)
    local current = tonumber(objective.numFulfilled)
    local required = tonumber(objective.numRequired)

    if (current == nil or required == nil) and objective.text then
        local a, b = tostring(objective.text):match("(%d+)%s*/%s*(%d+)")
        current = current or tonumber(a)
        required = required or tonumber(b)
    end

    return current, required
end

function MG:DescribeObjective(objective)
    if not objective then
        return {
            instruction = "Quest fortsetzen",
            progressText = "",
            current = nil,
            required = nil,
            percent = nil,
        }
    end

    local current, required = objectiveNumbers(objective)
    local objectiveType = tostring(objective.type or "")
    local name = cleanObjectiveName(objective.text, objectiveType)
    local instruction

    if objective.finished then
        instruction = "Erledigt: " .. name
    elseif objectiveType == "item" then
        instruction = required and ("Sammle " .. required .. "x " .. name) or ("Sammle: " .. name)
    elseif objectiveType == "monster" then
        instruction = required and ("Toete " .. required .. "x " .. name) or ("Toete: " .. name)
    elseif objectiveType == "object" then
        instruction = "Interagiere mit: " .. name
    elseif objectiveType == "player" then
        instruction = required and ("Besiege " .. required .. "x " .. name) or ("Besiege: " .. name)
    elseif objectiveType == "progressbar" then
        instruction = "Erreiche den benoetigten Fortschritt"
    elseif objectiveType == "event" then
        instruction = "Erledige: " .. name
    else
        instruction = "Erledige: " .. name
    end

    local progressText = ""
    local percent = nil

    if current and required and required > 0 then
        progressText = tostring(current) .. " / " .. tostring(required)
        percent = math.max(0, math.min(1, current / required))
    elseif objectiveType == "progressbar" and objective.text then
        local p = tonumber(tostring(objective.text):match("(%d+)%%"))
        if p then
            progressText = tostring(p) .. "%"
            percent = math.max(0, math.min(1, p / 100))
        end
    end

    return {
        instruction = instruction,
        progressText = progressText,
        current = current,
        required = required,
        percent = percent,
        raw = objective.text,
        type = objectiveType,
    }
end

local function currentObjective(objectives)
    for _, objective in ipairs(objectives or {}) do
        if not objective.finished then return objective end
    end
    return objectives and objectives[#objectives] or nil
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
            local objective = currentObjective(objectives)
            local goal = self:DescribeObjective(objective)

            if complete then
                goal = {
                    instruction = "Quest abgeben",
                    progressText = "bereit",
                    percent = 1,
                    type = "turnin",
                }
            end

            steps[#steps + 1] = {
                questID = questID,
                title = info.title or (seed and seed.title) or ("Quest " .. tostring(questID)),
                level = info.level,
                complete = complete,
                action = complete and "Quest abgeben" or "Questziel erledigen",
                detail = goal.instruction,
                goal = goal,
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

        for _, objective in ipairs(step.objectives or {}) do
            parts[#parts + 1] = tostring(objective.text or "")
            parts[#parts + 1] = tostring(objective.numFulfilled or "")
            parts[#parts + 1] = tostring(objective.numRequired or "")
            parts[#parts + 1] = objective.finished and "1" or "0"
        end
    end

    return table.concat(parts, "|")
end

function MG:ChooseStep(reason)
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

function MG:ApplyQuestTracking(questID)
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
