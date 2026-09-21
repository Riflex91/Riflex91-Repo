local addonName, MG = ...

MG.FactSnapshot = MG.FactSnapshot or {}
local F = MG.FactSnapshot

local function collectRelevantItems(step, stickies)
    local ids = {}
    local function scan(value)
        for _, goal in ipairs(value and value.goals or {}) do
            if goal.itemID then ids[tonumber(goal.itemID)] = true end
        end
    end
    scan(step)
    for _, sticky in ipairs(stickies or {}) do scan(sticky) end
    return ids
end

function F:Build(step, stickies)
    return {
        player = MG:GetPlayerProfile(),
        quests = MG.QuestFacts:Snapshot(),
        inventory = MG.InventoryFacts:Snapshot(collectRelevantItems(step, stickies)),
        position = MG.PositionFacts:Snapshot(),
        capturedAt = GetTime and GetTime() or 0,
    }
end
