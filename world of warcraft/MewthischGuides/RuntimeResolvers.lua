local addonName, MG = ...

MG.RequirementResolver=MG.RequirementResolver or {}
MG.VisibilityResolver=MG.VisibilityResolver or {}
MG.CompletionResolver=MG.CompletionResolver or {}
MG.GoalStateResolver=MG.GoalStateResolver or {}
MG.StepStateResolver=MG.StepStateResolver or {}
MG.NavigationTargetResolver=MG.NavigationTargetResolver or {}
MG.PresentationResolver=MG.PresentationResolver or {}

function MG.RequirementResolver:Resolve(goal,profile)
    local result={met=true,reasons={}}
    local r=goal and goal.requirements or {}
    if r.stepSelector and r.stepSelector~="" and MG.RestEDXPImport and not MG.RestEDXPImport:SelectorMatches(r.stepSelector,profile) then
        result.met=false;result.reasons[#result.reasons+1]="step_selector"
    end
    if r.actionSelector and r.actionSelector~="" and MG.RestEDXPImport and not MG.RestEDXPImport:SelectorMatches(r.actionSelector,profile) then
        result.met=false;result.reasons[#result.reasons+1]="action_selector"
    end
    return result
end

function MG.VisibilityResolver:Resolve(goal,requirement)
    if not goal then return false,"missing_goal" end
    if goal.hidden then return false,"hidden" end
    if requirement and not requirement.met then return false,"requirements" end
    if goal.visibleByDefault==false and not goal.forceVisible then return false,"source_hidden" end
    return true,"visible"
end

function MG.CompletionResolver:Resolve(goal)
    if not goal then return false,"missing_goal" end
    if goal.finished or goal.complete then return true,"finished" end
    if MG.GoalStates and goal.state==MG.GoalStates.COMPLETE then return true,"goal_state" end
    if tonumber(goal.required) and tonumber(goal.current) and tonumber(goal.required)>0 and tonumber(goal.current)>=tonumber(goal.required) then
        return true,"progress"
    end
    return false,"incomplete"
end

function MG.GoalStateResolver:Resolve(goal,index,step,profile)
    profile=profile or (MG.GetPlayerProfile and MG:GetPlayerProfile()) or {}
    local requirement=MG.RequirementResolver:Resolve(goal,profile)
    local visible,visibilityReason=MG.VisibilityResolver:Resolve(goal,requirement)
    local complete,completionReason=MG.CompletionResolver:Resolve(goal)
    local passive=goal and goal.passive and true or false
    local optional=goal and goal.optional and true or false
    local possible=not (goal and goal.impossible)
    local status
    if not visible then status="hidden"
    elseif goal and goal.obsolete then status="obsolete"
    elseif not possible then status="impossible"
    elseif passive then status="passive"
    elseif complete then status="complete"
    elseif goal and goal.warning then status="warning"
    else status="incomplete" end
    return {
        id=tostring(goal and goal.id or ("goal:"..tostring(index))),index=index,sourceGoal=goal,
        type=goal and (goal.type or goal.goalType or goal.action) or "unknown",
        action=goal and (goal.action or goal.type) or "unknown",
        questID=goal and goal.questID or (step and step.questID),
        objectiveIndex=goal and (goal.objectiveIndex or goal.index) or nil,
        name=goal and goal.name or nil,current=goal and goal.current or nil,required=goal and goal.required or nil,
        progressText=goal and goal.progressText or "",percent=goal and goal.percent or nil,
        visible=visible,complete=complete,passive=passive,optional=optional,possible=possible,status=status,
        navigationEligible=visible and possible and not passive and not complete and not (goal and goal.navigationEligible==false),
        explanation={requirement=requirement.reasons,visibility=visibilityReason,completion=completionReason,status=status},
    }
end

function MG.StepStateResolver:Resolve(step,goalStates,prior)
    local blocking,completed=0,0
    local anyWasCompletable=prior and prior.anyWasCompletable or false
    for _,state in ipairs(goalStates or {}) do
        if state.visible and state.possible and not state.passive and not state.optional then
            blocking=blocking+1
            if state.complete then completed=completed+1 else anyWasCompletable=true end
        end
    end
    local complete
    if blocking>0 then complete=completed==blocking else complete=step and step.complete and true or false end
    return {id=step and step.id or nil,complete=complete,blockingGoals=blocking,completedBlockingGoals=completed,
        anyWasCompletable=anyWasCompletable,explanation=blocking>0 and "blocking_goals" or "step_flag"}
end

function MG.NavigationTargetResolver:Resolve(step,goalStates)
    for _,state in ipairs(goalStates or {}) do if state.navigationEligible then return state,"first_incomplete_visible_goal" end end
    for _,state in ipairs(goalStates or {}) do if state.visible and state.possible and not state.passive then return state,"fallback_visible_goal" end end
    if step and step.goal then return MG.GoalStateResolver:Resolve(step.goal,1,step),"legacy_step_goal" end
    return nil,"no_navigation_goal"
end

local function goalText(state,step)
    local goal=state and state.sourceGoal or {}
    if goal.instruction and goal.instruction~="" then return goal.instruction end
    local name=tostring(state and state.name or step and step.title or "Questziel")
    local typ=tostring(state and state.type or "")
    if typ=="kill" or typ=="kill_player" then return state.required and ("Töte "..tostring(state.required).."x "..name) or ("Töte "..name) end
    if typ=="collect" or typ=="collect_currency" then return state.required and ("Sammle "..tostring(state.required).."x "..name) or ("Sammle "..name) end
    if typ=="turnin" then return "Quest abgeben: "..name end
    if typ=="accept" then return "Quest annehmen: "..name end
    if typ=="interact" then return "Interagiere mit "..name end
    return name
end

function MG.PresentationResolver:Resolve(step,goalStates)
    local rows={}
    for _,state in ipairs(goalStates or {}) do
        if state.visible then
            rows[#rows+1]={id=state.id,type=state.type,status=state.status,text=goalText(state,step),
                progressText=state.progressText,percent=state.percent,passive=state.passive,optional=state.optional}
        end
    end
    if #rows==0 and step then
        rows[1]={id=tostring(step.id or "step"),type=step.phase,status=step.complete and "complete" or "incomplete",
            text=step.detail or step.action or step.title or "Guide-Schritt",progressText=""}
    end
    return {stepID=step and step.id or nil,title=step and step.title or nil,rows=rows,primary=rows[1]}
end
