local addonName, MG = ...

MG.GoalStates = {
    ACTIVE = "active",
    PENDING = "pending",
    COMPLETE = "complete",
    OPTIONAL = "optional",
    BLOCKED = "blocked",
}

local function trim(text)
    text = tostring(text or "")
    return text:gsub("^%s+", ""):gsub("%s+$", "")
end

local function extractCounts(objective)
    local current = tonumber(objective and objective.numFulfilled)
    local required = tonumber(objective and objective.numRequired)

    if (current == nil or required == nil) and objective and objective.text then
        local a, b = tostring(objective.text):match("(%d+)%s*/%s*(%d+)")
        current = current or tonumber(a)
        required = required or tonumber(b)
    end

    return current, required
end

local function extractName(objective)
    local text = trim(objective and objective.text or "")
    local name = text:match("^(.-):%s*%d+%s*/%s*%d+") or text

    name = name:gsub("%s+getoetet$", "")
    name = name:gsub("%s+getötet$", "")
    name = name:gsub("%s+killed$", "")
    name = name:gsub("%s+slain$", "")
    name = name:gsub("%s+gesammelt$", "")
    name = trim(name)

    if name ~= "" then return name end

    local objectiveType = tostring(objective and objective.type or "")
    if objectiveType == "monster" then return "Questgegner" end
    if objectiveType == "item" then return "Questgegenstand" end
    if objectiveType == "object" then return "Questobjekt" end
    return "Questziel"
end

local function classify(objective)
    local objectiveType = tostring(objective and objective.type or "")

    if objectiveType == "item" then return "collect" end
    if objectiveType == "monster" then return "kill" end
    if objectiveType == "player" then return "kill_player" end
    if objectiveType == "object" then return "interact" end
    if objectiveType == "progressbar" then return "progress" end
    if objectiveType == "currency" then return "collect_currency" end
    if objectiveType == "event" then return "event" end
    return "complete"
end

local function instructionFor(goal)
    if goal.state == MG.GoalStates.COMPLETE then
        return "Erledigt: " .. goal.name
    end

    if goal.type == "collect" or goal.type == "collect_currency" then
        if goal.required then return "Sammle " .. goal.required .. "x " .. goal.name end
        return "Sammle: " .. goal.name
    end

    if goal.type == "kill" then
        if goal.required then return "Töte " .. goal.required .. "x " .. goal.name end
        return "Töte: " .. goal.name
    end

    if goal.type == "kill_player" then
        if goal.required then return "Besiege " .. goal.required .. "x " .. goal.name end
        return "Besiege: " .. goal.name
    end

    if goal.type == "interact" then
        return "Interagiere mit: " .. goal.name
    end

    if goal.type == "progress" then
        return "Erreiche den benötigten Fortschritt"
    end

    if goal.type == "event" then
        return "Erledige: " .. goal.name
    end

    return "Erledige: " .. goal.name
end

function MG:CreateGoal(questID, objective, index, activeAssigned)
    local current, required = extractCounts(objective)
    local complete = objective and objective.finished and true or false
    local optional = objective and (objective.optional or objective.isOptional) and true or false

    local state
    if complete then
        state = self.GoalStates.COMPLETE
    elseif optional then
        state = self.GoalStates.OPTIONAL
    elseif not activeAssigned then
        state = self.GoalStates.ACTIVE
    else
        state = self.GoalStates.PENDING
    end

    local percent = nil
    local progressText = ""

    if current and required and required > 0 then
        percent = math.max(0, math.min(1, current / required))
        progressText = tostring(current) .. " / " .. tostring(required)
    elseif tostring(objective and objective.type or "") == "progressbar" then
        local p = tonumber(tostring(objective and objective.text or ""):match("(%d+)%%"))
        if p then
            percent = math.max(0, math.min(1, p / 100))
            progressText = tostring(p) .. "%"
        end
    end

    local goal = {
        id = tostring(questID) .. ":" .. tostring(index),
        questID = questID,
        index = index,
        type = classify(objective),
        state = state,
        name = extractName(objective),
        current = current,
        required = required,
        percent = percent,
        progressText = progressText,
        rawText = objective and objective.text or nil,
        objectiveType = objective and objective.type or nil,
        optional = optional,
        finished = complete,
    }

    goal.instruction = instructionFor(goal)
    return goal
end

function MG:BuildQuestGoals(questID, objectives, questIsComplete)
    if questIsComplete then
        return {
            {
                id = tostring(questID) .. ":turnin",
                questID = questID,
                index = 0,
                type = "turnin",
                state = self.GoalStates.ACTIVE,
                name = "Quest abgeben",
                instruction = "Quest abgeben",
                progressText = "bereit",
                percent = 1,
                current = 1,
                required = 1,
            }
        }
    end

    local goals = {}
    local activeAssigned = false

    for index, objective in ipairs(objectives or {}) do
        local goal = self:CreateGoal(questID, objective, index, activeAssigned)
        goals[#goals + 1] = goal
        if goal.state == self.GoalStates.ACTIVE then activeAssigned = true end
    end

    if #goals == 0 then
        goals[1] = {
            id = tostring(questID) .. ":generic",
            questID = questID,
            index = 1,
            type = "complete",
            state = self.GoalStates.ACTIVE,
            name = "Questziel",
            instruction = "Quest fortsetzen",
            progressText = "",
            percent = nil,
        }
    end

    return goals
end

function MG:GetActiveGoal(goals)
    for _, goal in ipairs(goals or {}) do
        if goal.state == self.GoalStates.ACTIVE then return goal end
    end

    for _, goal in ipairs(goals or {}) do
        if goal.state ~= self.GoalStates.COMPLETE then return goal end
    end

    return goals and goals[#goals] or nil
end

function MG:GetGoalSummary(goals)
    local parts = {}

    for _, goal in ipairs(goals or {}) do
        local marker = goal.state == self.GoalStates.COMPLETE and "[OK]" or "[ ]"
        local progress = goal.progressText ~= "" and (" " .. goal.progressText) or ""
        parts[#parts + 1] = marker .. " " .. tostring(goal.name or goal.instruction or "Questziel") .. progress
    end

    return table.concat(parts, "   ")
end

function MG:GoalSignature(goals)
    local parts = {}

    for _, goal in ipairs(goals or {}) do
        parts[#parts + 1] = tostring(goal.id)
        parts[#parts + 1] = tostring(goal.state)
        parts[#parts + 1] = tostring(goal.current or "")
        parts[#parts + 1] = tostring(goal.required or "")
        parts[#parts + 1] = tostring(goal.rawText or "")
    end

    return table.concat(parts, "|")
end
