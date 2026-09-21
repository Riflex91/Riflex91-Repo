local addonName, MG = ...

MG.GoalStateResolver = MG.GoalStateResolver or {}
local G = MG.GoalStateResolver

function G:Resolve(goal, facts)
    local requirement = MG.RequirementResolver:Resolve(goal, facts)
    local completion = MG.CompletionResolver:Resolve(goal, facts)
    local visibility = MG.VisibilityResolver:Resolve(goal, requirement, completion)

    local possible = requirement.met
    local status
    if not visibility.visible then
        status = "hidden"
    elseif not possible then
        status = "impossible"
    elseif goal.passive then
        status = "passive"
    elseif completion.known and completion.complete then
        status = "complete"
    elseif not completion.known then
        status = "warning"
    else
        status = "incomplete"
    end

    local current = completion.detail and completion.detail.current or nil
    local required = completion.detail and completion.detail.required or goal.required

    return {
        id = goal.id,
        sourceGoal = goal,
        action = goal.action,
        completionKind = goal.completionKind,
        questID = goal.questID,
        objectiveIndex = goal.objectiveIndex,
        itemID = goal.itemID,
        targetName = goal.targetName,
        waypoint = goal.waypoint,
        visible = visibility.visible,
        possible = possible,
        passive = goal.passive and true or false,
        optional = goal.optional and true or false,
        sticky = goal.sticky and true or false,
        completionKnown = completion.known,
        complete = completion.complete,
        status = status,
        current = current,
        required = required,
        navigationEligible =
            visibility.visible and possible and not completion.complete and
            goal.waypoint ~= nil,
        explanation = {
            requirement = requirement,
            completion = completion,
            visibility = visibility,
        },
    }
end
