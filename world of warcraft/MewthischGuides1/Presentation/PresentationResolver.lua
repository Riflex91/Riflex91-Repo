local addonName, MG = ...

MG.PresentationResolver = MG.PresentationResolver or {}
local P = MG.PresentationResolver

local function questTitle(state, facts)
    local quest = state.questID and facts and facts.quests and facts.quests[state.questID]
    return quest and quest.title or (state.questID and ("Quest " .. tostring(state.questID)) or nil)
end

local function objectiveText(state, facts)
    local quest = state.questID and facts and facts.quests and facts.quests[state.questID]
    local objective = quest and quest.objectives and state.objectiveIndex and
        quest.objectives[state.objectiveIndex]
    return objective and objective.text or nil
end

local function rowText(state, facts)
    local goal = state.sourceGoal or {}
    local action = state.action
    local title = questTitle(state, facts)
    if action == "accept" then return "Nimm „" .. tostring(title or "Quest") .. "“ an" end
    if action == "turnin" then return "Gib „" .. tostring(title or "Quest") .. "“ ab" end
    if action == "complete" then
        return objectiveText(state, facts) or
            ("Schließe Questziel " .. tostring(state.objectiveIndex or "") ..
             " von „" .. tostring(title or "Quest") .. "“ ab")
    end
    if action == "collect" then
        return "Sammle " .. tostring(state.required or "") ..
            (state.required and "x " or "") ..
            (goal.targetName or (state.itemID and ("Item " .. tostring(state.itemID)) or "Gegenstand"))
    end
    if action == "goto" or action == "waypoint" then return "Gehe zum markierten Punkt" end
    if action == "target" or action == "mob" then return tostring(state.targetName or "Ziel") end
    if action == "train" or action == "trainer" then return "Trainiere" .. (goal.targetName and (" bei " .. goal.targetName) or "") end
    if action == "vendor" then return "Besuche den Händler" .. (goal.targetName and (" " .. goal.targetName) or "") end
    if action == "fly" then return "Fliege nach " .. tostring(goal.args or "") end
    if action == "hs" then return "Benutze deinen Ruhestein" end
    if action == "xp" then return "Erreiche das angegebene Erfahrungsziel" end
    if action == "money" then return "Erreiche das angegebene Goldziel" end
    if action == "zone" or action == "subzone" or action == "zoneskip" then
        return "Reise nach " .. tostring(goal.location or goal.args or "")
    end
    local definition = MG.RestEDXPActionCatalog and MG.RestEDXPActionCatalog:Get(action)
    if definition then
        return definition.label .. ((goal.args and goal.args ~= "") and (": " .. goal.args) or "")
    end
    return tostring(action or "Guide-Ziel")
end

function P:GoalRow(state, facts, source)
    local progress
    if state.current ~= nil or state.required ~= nil then
        progress = tostring(state.current or 0) .. " / " .. tostring(state.required or "?")
    end
    return {
        id = state.id,
        source = source or "step",
        status = state.status,
        text = rowText(state, facts),
        progress = progress,
        passive = state.passive,
        optional = state.optional,
        warning = not state.completionKnown and not state.passive,
        navigated = false,
    }
end

function P:Build(step, goalStates, stickyRuntime, facts, navigation)
    local projection = {
        stepID = step and step.id or nil,
        rows = {},
        stickies = {},
    }
    local destinationID = navigation and navigation.goalState and navigation.goalState.id

    for _, state in ipairs(goalStates or {}) do
        if state.visible then
            local row = self:GoalRow(state, facts, "step")
            row.navigated = row.id == destinationID
            projection.rows[#projection.rows + 1] = row
        end
    end

    for _, sticky in ipairs(stickyRuntime or {}) do
        local block = { stepID=sticky.step.id, rows={} }
        for _, state in ipairs(sticky.goalStates or {}) do
            if state.visible then
                local row = self:GoalRow(state, facts, "sticky")
                row.navigated = row.id == destinationID
                block.rows[#block.rows + 1] = row
            end
        end
        if #block.rows > 0 then projection.stickies[#projection.stickies + 1] = block end
    end

    return projection
end
