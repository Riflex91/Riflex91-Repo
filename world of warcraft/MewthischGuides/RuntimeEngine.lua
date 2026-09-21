local addonName, MG = ...

MG.RuntimeEngine=MG.RuntimeEngine or {}
local R=MG.RuntimeEngine
R.revision=R.revision or 0
R.history=R.history or {}

local function stateMap(states)
    local out={}
    for _,state in ipairs(states or {}) do out[state.id]=state end
    return out
end

local function transition(oldState,newState)
    if not oldState then return "initial" end
    if oldState.complete~=newState.complete then return newState.complete and "completed" or "uncompleted" end
    if oldState.visible~=newState.visible then return "visibility" end
    if oldState.current~=newState.current or oldState.required~=newState.required or oldState.progressText~=newState.progressText then return "progress" end
    return nil
end

function R:Commit(step,guide,reason)
    local previous=MG.runtimeState
    local previousGoals=stateMap(previous and previous.goalStates or {})
    local profile=MG.GetPlayerProfile and MG:GetPlayerProfile() or {}
    local goals={}
    for index,goal in ipairs(step and step.goals or {}) do goals[#goals+1]=MG.GoalStateResolver:Resolve(goal,index,step,profile) end
    local historyKey=tostring(guide and guide.id or "").."|"..tostring(step and step.id or "")
    local stepState=MG.StepStateResolver:Resolve(step,goals,self.history[historyKey])
    self.history[historyKey]={anyWasCompletable=stepState.anyWasCompletable}
    local destinationGoal,destinationReason=MG.NavigationTargetResolver:Resolve(step,goals)
    local viewer=MG.PresentationResolver:Resolve(step,goals)
    self.revision=self.revision+1
    local runtime={
        revision=self.revision,reason=reason or "refresh",guideID=guide and guide.id or nil,currentGuide=guide,
        currentStep=step,currentStepID=step and step.id or nil,goalStates=goals,stepState=stepState,
        destinationGoal=destinationGoal,destinationReason=destinationReason,
        destinationWaypoint=previous and previous.destinationWaypoint or nil,
        route=previous and previous.route or nil,currentRouteSegment=previous and previous.currentRouteSegment or nil,
        currentStickies=previous and previous.currentStickies or {},viewer=viewer,transitions={},
    }
    for _,state in ipairs(goals) do
        local kind=transition(previousGoals[state.id],state)
        if kind and kind~="initial" then
            runtime.transitions[#runtime.transitions+1]={goalID=state.id,kind=kind}
            if MG.Log then MG:Log(kind=="uncompleted" and "WARN" or "INFO","runtime.goal_"..kind,
                "Semantischer Goal-Zustand geändert.",{goalID=state.id,questID=state.questID,transition=kind,revision=runtime.revision}) end
        end
    end
    MG.runtimeState=runtime
    if MG.db then
        MG.db.runtime=MG.db.runtime or {}
        MG.db.runtime.semantic={revision=runtime.revision,guideID=runtime.guideID,stepID=runtime.currentStepID,
            stepComplete=stepState.complete,goals=#goals,destinationGoalID=destinationGoal and destinationGoal.id or nil,
            destinationReason=destinationReason}
    end
    return runtime
end

function R:UpdateNavigation(target,route,segment)
    local runtime=MG.runtimeState
    if not runtime then return end
    runtime.destinationWaypoint=target;runtime.route=route;runtime.currentRouteSegment=segment
end
function R:Get() return MG.runtimeState end
function R:GetDiagnostics()
    local runtime=MG.runtimeState or {};local statuses={}
    for _,state in ipairs(runtime.goalStates or {}) do statuses[state.status]=(statuses[state.status] or 0)+1 end
    return {revision=runtime.revision or 0,guideID=runtime.guideID,stepID=runtime.currentStepID,
        destinationGoalID=runtime.destinationGoal and runtime.destinationGoal.id or nil,
        destinationReason=runtime.destinationReason,statuses=statuses,transitions=#(runtime.transitions or {})}
end
