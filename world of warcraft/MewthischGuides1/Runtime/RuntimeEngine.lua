local addonName, MG = ...

MG.RuntimeEngine = MG.RuntimeEngine or {}
local R = MG.RuntimeEngine
R.stepHistory = R.stepHistory or {}
R.routeMemory = R.routeMemory or {}

local function resolveStep(step, facts)
    local states = {}
    local function resolveList(list)
        for _, goal in ipairs(list or {}) do
            states[#states + 1] = MG.GoalStateResolver:Resolve(goal, facts)
        end
    end
    resolveList(step and step.goals)
    resolveList(step and step.conditions)

    local prior = R.stepHistory[step and step.id or ""]
    local stepState = MG.StepStateResolver:Resolve(step, states, prior)
    if step then
        R.stepHistory[step.id] = {
            anyWasCompletable=stepState.anyWasCompletable,
        }
    end
    return states, stepState
end

function R:FocusSession(session, reason)
    if not session then return nil, "missing_session" end
    local step = MG.GuideSession:GetCurrentStep(session)
    if not step then return nil, "missing_step" end

    MG.GuideSession:SyncStickies(session)
    local stickySteps = MG.GuideSession:GetStickySteps(session)
    local facts = MG.FactSnapshot:Build(step, stickySteps, session)
    local goalStates, stepState = resolveStep(step, facts)

    local stickyRuntime = {}
    for _, stickyStep in ipairs(stickySteps) do
        local stickyGoals, stickyState = resolveStep(stickyStep, facts)
        stickyRuntime[#stickyRuntime + 1] = {
            step=stickyStep,
            goalStates=stickyGoals,
            stepState=stickyState,
        }
    end

    MG.GuideSession:PruneCompletedStickies(session, stickyRuntime)

    local destination = MG.NavigationTargetResolver:Resolve(goalStates, stickyRuntime)
    local route = MG.RoutePlanner and
        MG.RoutePlanner:Plan(
            step,
            destination,
            facts,
            R.routeMemory[step.id]) or nil
    if route then R.routeMemory[step.id] = route end
    local segment = MG.RoutePlanner and MG.RoutePlanner:Segment(route) or nil

    local navigation = destination and MG.Util:Copy(destination) or nil
    if navigation then
        navigation.destinationWaypoint =
            destination.waypoint and MG.Util:Copy(destination.waypoint) or nil
        navigation.waypoint =
            segment and segment.waypoint or navigation.destinationWaypoint
        navigation.routeReason = route and route.reason or nil
    elseif segment then
        navigation = {
            goalState=nil,
            source="route",
            destinationWaypoint=nil,
            waypoint=segment.waypoint,
            routeReason=route and route.reason or nil,
            reason="route_without_semantic_destination",
        }
    end

    local travel = destination and MG.TravelPlanner and
        MG.TravelPlanner:Build(destination.goalState) or nil

    local previous = MG.RuntimeStore:Get()
    local snapshot = {
        reason=reason or "focus",
        guideID=session.guideID,
        guide=session.guide,
        session=session,
        stepID=step.id,
        step=step,
        stepIndex=session.currentIndex,
        goalStates=goalStates,
        stepState=stepState,
        stickies=stickyRuntime,
        destinationGoal=destination and destination.goalState or nil,
        destinationWaypoint=destination and destination.waypoint or nil,
        route=route,
        currentRouteSegment=segment,
        navigation=navigation,
        travel=travel,
        facts=facts,
    }

    snapshot.presentation = MG.PresentationResolver:Build(
        step, goalStates, stickyRuntime, facts, navigation)
    local nextStep=session.guide and session.guide.steps and
        session.guide.steps[(session.currentIndex or 1)+1] or nil
    snapshot.presentation.nextStep =
        MG.PresentationResolver:PreviewStep(nextStep,facts)

    snapshot = MG.RuntimeStore:Commit(snapshot)
    snapshot.events = MG.TransitionDetector:Detect(previous, snapshot)
    if MG.Telemetry then
        MG.Telemetry:Count("runtime.commit",{
            revision=snapshot.revision,
            reason=snapshot.reason,
            stepID=snapshot.stepID,
            guideID=snapshot.guideID,
        })
    end

    if MG.SuperTrackPolicy then
        local ok,trackReason=MG.SuperTrackPolicy:Apply(snapshot)
        snapshot.superTrack={ok=ok,reason=trackReason}
    end

    MG:Log("INFO", "runtime.snapshot", "Semantischer Runtime-Snapshot aktualisiert.", {
        revision=snapshot.revision,
        reason=snapshot.reason,
        guideID=snapshot.guideID,
        stepID=snapshot.stepID,
        stepIndex=snapshot.stepIndex,
        destinationGoalID=snapshot.destinationGoal and snapshot.destinationGoal.id or nil,
        destinationAction=snapshot.destinationGoal and snapshot.destinationGoal.action or nil,
        destinationWaypoint=snapshot.destinationWaypoint,
        route=snapshot.route,
        currentRouteSegment=snapshot.currentRouteSegment,
        travel=snapshot.travel,
        position=snapshot.facts and snapshot.facts.position or nil,
        stepState=snapshot.stepState,
    })

    for _, event in ipairs(snapshot.events) do
        MG:Log("INFO", "runtime." .. string.lower(event.type), event.type, event)
    end
    return snapshot
end

function R:Refresh(reason)
    if not self.session then return nil, "no_active_session" end
    return self:FocusSession(self.session, reason or "refresh")
end

function R:StartGuide(guide, index)
    local session, err = MG.GuideSession:Create(guide, index)
    if not session then return nil, err end
    self.session = session
    self.stepHistory = {}
    self.routeMemory = {}
    if MG.ActionMemory then MG.ActionMemory:ResetGuide() end

    MG:Log("INFO", "guide.started", "Guide gestartet.", {
        guideID=guide.id,title=guide.title,startIndex=session.currentIndex,
    })
    return self:FocusSession(session, "guide_started")
end

function R:MoveStep(delta, reason)
    if not self.session then return nil, "no_active_session" end
    local current = MG.RuntimeStore:Get()
    if tonumber(delta) and tonumber(delta) > 0 and
       current and current.stepState and current.stepState.complete then
        MG.GuideSession:MarkStepCompleted(self.session, current.step)
    end
    MG.GuideSession:Move(self.session, delta)
    return self:FocusSession(self.session, reason or "manual_step")
end

function R:AutoAdvance()
    local current = MG.RuntimeStore:Get()
    if not current or not current.stepState then return false, "missing_state" end

    local safe = current.stepState.autoAdvanceSafe or current.stepState.skipSafe
    if not safe then return false, "not_safe" end

    if current.stepState.complete then
        MG.GuideSession:MarkStepCompleted(self.session, current.step)
    end

    local total = current.guide and #(current.guide.steps or {}) or 0
    if current.stepIndex and current.stepIndex >= total then
        local nextGuide, nextReason = MG.GuideCatalog:ResolveNext(
            current.guide, MG:GetPlayerProfile())
        if nextGuide then
            if MG.db and MG.db.guide then MG.db.guide.selectedID = nextGuide.id end
            self:StartGuide(nextGuide, 1)
            MG:Log("INFO", "guide.chained", "Folgeguide automatisch gestartet.", {
                from=current.guideID,to=nextGuide.id,reason=nextReason,
            })
            return true, "guide_chained"
        end
        return false, "guide_finished"
    end

    self:MoveStep(1, current.stepState.skipSafe and "auto_skip" or "auto_advance")
    return true, current.stepState.skipSafe and "skipped" or "advanced"
end

function R:AdvanceWhileSafe(maxSteps)
    maxSteps = tonumber(maxSteps) or 25
    local advanced = 0
    while advanced < maxSteps do
        local current = MG.RuntimeStore:Get()
        if not current or not current.stepState then break end
        if not (current.stepState.autoAdvanceSafe or current.stepState.skipSafe) then break end
        local ok = self:AutoAdvance()
        if not ok then break end
        advanced = advanced + 1
    end
    return advanced
end
