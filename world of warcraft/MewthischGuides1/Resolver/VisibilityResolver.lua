local addonName, MG = ...

MG.VisibilityResolver = MG.VisibilityResolver or {}
local V = MG.VisibilityResolver

local function hasTag(tags, name)
    for _, tag in ipairs(tags or {}) do
        if tag.name == name then return true end
    end
    return false
end

function V:Resolve(goal, requirement, completion)
    if not goal then return { visible=false, reason="missing_goal" } end
    if requirement and not requirement.met then
        return { visible=false, reason="requirements_not_met" }
    end

    if hasTag(goal.requirements and goal.requirements.tags, "hidewhencomplete") and
       completion and completion.complete then
        return { visible=false, reason="hide_when_complete" }
    end

    local settings = MG.db and MG.db.settings or {}
    if completion and completion.complete and settings.showCompletedGoals == false and
       goal.role ~= "condition" then
        return { visible=false, reason="completed_hidden_by_policy" }
    end

    if goal.visibleByDefault == false and goal.role == "annotation" then
        return { visible=false, reason="source_hidden" }
    end

    return { visible=true, reason="visible" }
end
