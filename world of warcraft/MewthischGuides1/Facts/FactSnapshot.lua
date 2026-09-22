local addonName, MG = ...

MG.FactSnapshot = MG.FactSnapshot or {}
local F = MG.FactSnapshot

local function collectRelevant(step, stickies)
    local relevant = {
        quests={},
        items={},
        skills={},
        reputations={},
        auras={},
        equipment={},
        spells={},
    }

    local function goal(goal)
        if not goal then return end
        if goal.questID then relevant.quests[tonumber(goal.questID)] = true end
        for _, questID in ipairs(goal.questIDs or {}) do
            relevant.quests[tonumber(questID)] = true
        end
        if goal.itemID then relevant.items[tonumber(goal.itemID)] = true end
        for _, itemID in ipairs(goal.itemIDs or {}) do
            relevant.items[tonumber(itemID)] = true
        end
        if goal.skillTarget and goal.skillTarget.name and goal.skillTarget.name ~= "" then
            relevant.skills[goal.skillTarget.name] = true
        end
        if goal.reputationTarget and goal.reputationTarget.factionID then
            relevant.reputations[tonumber(goal.reputationTarget.factionID)] = true
        end
        if goal.auraSpellID then relevant.auras[tonumber(goal.auraSpellID)] = true end
        if goal.equipSlot then relevant.equipment[tonumber(goal.equipSlot)] = true end
        if goal.spellID then relevant.spells[tonumber(goal.spellID)] = true end
    end

    local function scan(value)
        for _, entry in ipairs(value and value.goals or {}) do goal(entry) end
        for _, entry in ipairs(value and value.conditions or {}) do goal(entry) end
    end

    scan(step)
    for _, sticky in ipairs(stickies or {}) do scan(sticky) end
    return relevant
end

function F:Build(step, stickies, session)
    local relevant = collectRelevant(step, stickies)
    return {
        player=MG:GetPlayerProfile(),
        playerState=MG.PlayerFacts and MG.PlayerFacts:Snapshot(relevant) or {},
        quests=MG.QuestFacts:Snapshot(relevant.quests),
        inventory=MG.InventoryFacts:Snapshot(relevant.items),
        position=MG.PositionFacts:Snapshot(),
        session={
            currentIndex=session and session.currentIndex or nil,
            completedLabels=session and MG.Util:Copy(session.completedLabels or {}) or {},
        },
        relevant=relevant,
        capturedAt=GetTime and GetTime() or 0,
    }
end
