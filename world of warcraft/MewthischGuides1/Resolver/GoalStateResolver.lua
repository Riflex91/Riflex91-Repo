local addonName, MG = ...

MG.GoalStateResolver = MG.GoalStateResolver or {}
local G = MG.GoalStateResolver

function G:Resolve(goal, facts)
    local requirement = MG.RequirementResolver:Resolve(goal, facts)
    local completion = MG.CompletionResolver:Resolve(goal, facts)
    local visibility = MG.VisibilityResolver:Resolve(goal, requirement, completion)

    local possible = requirement.met
    local semanticRole = goal.role == "goal" or goal.role == "condition"
    local blocking =
        possible and not goal.passive and not goal.optional and semanticRole

    local status
    if not possible then
        status = "impossible"
    elseif not visibility.visible then
        status = completion.known and completion.complete and "complete_hidden" or "hidden"
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
    local manualCompletable =
        possible and goal.role == "goal" and not goal.passive and
        not completion.complete and not completion.known

    return {
        id=goal.id,
        sourceGoal=goal,
        role=goal.role,
        action=goal.action,
        completionKind=goal.completionKind,
        questID=goal.questID,
        questIDs=goal.questIDs,
        objectiveIndex=goal.objectiveIndex,
        itemID=goal.itemID,
        itemIDs=goal.itemIDs,
        targetName=goal.targetName,
        arrowText=goal.arrowText,
        waypoint=goal.waypoint,
        visible=visibility.visible,
        possible=possible,
        passive=goal.passive and true or false,
        optional=goal.optional and true or false,
        sticky=goal.sticky and true or false,
        blocking=blocking,
        completionKnown=completion.known,
        complete=completion.complete,
        status=status,
        current=current,
        required=required,
        manualCompletable=manualCompletable,
        navigationEligible=
            visibility.visible and possible and not goal.passive and
            not completion.complete and goal.waypoint ~= nil,
        explanation={
            requirement=requirement,
            completion=completion,
            visibility=visibility,
            blocking=blocking and "semantic_blocker" or "non_blocking",
            manualCompletable=manualCompletable,
        },
    }
end
