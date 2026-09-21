local addonName, MG = ...

MG.CompletionResolver = MG.CompletionResolver or {}
local C = MG.CompletionResolver

local function questFacts(goal, facts)
    return facts and facts.quests and goal and goal.questID and
        facts.quests[tonumber(goal.questID)] or nil
end

local function objectiveFacts(goal, facts)
    local quest = questFacts(goal, facts)
    return quest and quest.objectives and goal.objectiveIndex and
        quest.objectives[tonumber(goal.objectiveIndex)] or nil
end

local function boolResult(value, reason, detail)
    return {
        known = true,
        complete = value and true or false,
        reason = reason,
        detail = detail,
    }
end

local function unknown(reason)
    return { known=false, complete=false, reason=reason }
end

function C:Resolve(goal, facts)
    if not goal then return unknown("missing_goal") end
    local kind = goal.completionKind
    local quest = questFacts(goal, facts)

    if kind == "none" or goal.role == "annotation" then
        return boolResult(true, "annotation")
    elseif kind == "quest_accept" then
        return boolResult(
            quest and (quest.active or quest.completed),
            quest and "quest_known" or "quest_not_active")
    elseif kind == "quest_turnin" or kind == "quest_turned_in" then
        return boolResult(
            quest and quest.completed,
            quest and "quest_completion_fact" or "quest_not_in_snapshot")
    elseif kind == "quest_objective" then
        if quest and quest.completed then return boolResult(true, "quest_completed") end
        local objective = objectiveFacts(goal, facts)
        if objective then
            return boolResult(objective.finished, "objective_fact", {
                current=objective.current, required=objective.required, text=objective.text,
            })
        end
        return unknown("objective_fact_missing")
    elseif kind == "collect" then
        local objective = objectiveFacts(goal, facts)
        if objective then
            return boolResult(objective.finished, "collect_objective_fact", {
                current=objective.current, required=objective.required, text=objective.text,
            })
        end
        local current = facts and facts.inventory and facts.inventory[tonumber(goal.itemID)] or 0
        if goal.required then
            return boolResult(current >= tonumber(goal.required), "inventory_count", {
                current=current, required=goal.required,
            })
        end
        return unknown("collect_requirement_missing")
    elseif kind == "itemcount" then
        local current = facts and facts.inventory and facts.inventory[tonumber(goal.itemID)] or 0
        if goal.required then
            return boolResult(current >= tonumber(goal.required), "inventory_count", {
                current=current, required=goal.required,
            })
        end
        return unknown("itemcount_requirement_missing")
    elseif kind == "quest_active" then
        return boolResult(quest and quest.active, "quest_active_fact")
    elseif kind == "quest_inactive" then
        return boolResult(not quest or not quest.active, "quest_inactive_fact")
    elseif kind == "quest_complete" then
        return boolResult(
            quest and (quest.readyForTurnIn or quest.completed),
            "quest_complete_fact")
    elseif kind == "quest_not_complete" then
        return boolResult(
            not quest or (not quest.readyForTurnIn and not quest.completed),
            "quest_not_complete_fact")
    elseif kind == "position" then
        local waypoint = goal.waypoint
        local pos = facts and facts.position
        if waypoint and pos and waypoint.mapID and pos.mapID and
           waypoint.x and waypoint.y and pos.x and pos.y and
           tonumber(waypoint.mapID) == tonumber(pos.mapID) then
            -- Without map scale data this is intentionally conservative.
            local dx, dy = waypoint.x - pos.x, waypoint.y - pos.y
            local normalized = math.sqrt(dx * dx + dy * dy)
            local tolerance = 0.005
            return boolResult(normalized <= tolerance, "normalized_position", {
                normalizedDistance=normalized, tolerance=tolerance,
            })
        end
        return unknown("position_not_comparable")
    elseif kind == "location" then
        return unknown("location_api_not_resolved")
    elseif kind == "xp" or kind == "money" or kind == "skill" or
           kind == "reputation" then
        return unknown(kind .. "_resolver_pending")
    elseif kind == "train" or kind == "vendor" or kind == "use" or
           kind == "equip" or kind == "tame" or kind == "travel" or
           kind == "action" then
        return unknown("manual_or_event_completion")
    end

    return unknown("unsupported_completion_kind:" .. tostring(kind))
end
