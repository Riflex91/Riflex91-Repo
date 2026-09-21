local addonName, MG = ...

MG.RequirementResolver = MG.RequirementResolver or {}
local R = MG.RequirementResolver

function R:Resolve(goal, facts)
    local profile = facts and facts.player or MG:GetPlayerProfile()
    local requirements = goal and goal.requirements or {}
    local stepOk, stepReason = MG.RestedXPSelector:Matches(
        requirements.stepSelector or "", profile)
    if not stepOk then
        return { met=false, reason=stepReason, layer="step_selector" }
    end

    local actionOk, actionReason = MG.RestedXPSelector:Matches(
        requirements.actionSelector or "", profile)
    if not actionOk then
        return { met=false, reason=actionReason, layer="action_selector" }
    end

    local tagsOk, tagsReason = MG.RestedXPSelector:TagsMatch(
        requirements.tags or {}, profile)
    if not tagsOk then
        return { met=false, reason=tagsReason, layer="tags" }
    end

    return { met=true, reason="requirements_met" }
end
