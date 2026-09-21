local addonName, MG = ...

MG.RuntimeEngine = MG.RuntimeEngine or {}
local R = MG.RuntimeEngine
R.stepHistory = R.stepHistory or {}

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
            anyWasCompletable = stepState.anyWasCompletable,
        }
    end
    return states, stepState
end

function R:FocusSession(session, reason)
    if not session then return nil, "missing_session" end
    local step = MG.GuideSession:GetCurrentStep(session)
    if not step then return nil, "missing_step" end

    local stickySteps = MG.GuideSession:GetStickySteps(session)
    local facts = MG.FactSnapshot:Build(step, stickySteps)
    local goalStates, stepState = resolveStep(step, facts)

    local stickyRuntime = {}
    for _, stickyStep in ipairs(stickySteps) do
        local stickyGoals, stickyState = resolveStep(stickyStep, facts)
        stickyRuntime[#stickyRuntime + 1] = {
            step = stickyStep,
            goalStates = stickyGoals,
            stepState = stickyState,
        }
    end

    MG.GuideSession:PruneCompletedStickies(session, stickyRuntime)
    local navigation = MG.NavigationTargetResolver:Resolve(goalStates, stickyRuntime)

    local previous = MG.RuntimeStore:Get()
    local snapshot = {
        reason = reason or "focus",
        guideID = session.guideID,
        guide = session.guide,
        session = session,
        stepID = step.id,
        step = step,
        stepIndex = session.currentIndex,
        goalStates = goalStates,
        stepState = stepState,
        stickies = stickyRuntime,
        destinationGoal = navigation and navigation.goalState or nil,
        destinationWaypoint = navigation and navigation.waypoint or nil,
        navigation = navigation,
        facts = facts,
    }
    snapshot.presentation = MG.PresentationResolver:Build(
        step, goalStates, stickyRuntime, facts, navigation)

    snapshot = MG.RuntimeStore:Commit(snapshot)
    snapshot.events = MG.TransitionDetector:Detect(previous, snapshot)

    MG:Log("INFO", "runtime.snapshot", "Semantischer Runtime-Snapshot aktualisiert.", {
        revision = snapshot.revision,
        reason = snapshot.reason,
        guideID = snapshot.guideID,
        stepID = snapshot.stepID,
        stepIndex = snapshot.stepIndex,
        destinationGoalID = snapshot.destinationGoal and snapshot.destinationGoal.id or nil,
        destinationAction = snapshot.destinationGoal and snapshot.destinationGoal.action or nil,
        waypoint = snapshot.destinationWaypoint,
        position = snapshot.facts and snapshot.facts.position or nil,
        stepState = snapshot.stepState,
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
    MG:Log("INFO", "guide.started", "Guide gestartet.", {
        guideID=guide.id,title=guide.title,startIndex=session.currentIndex,
    })
    return self:FocusSession(session, "guide_started")
end

function R:MoveStep(delta, reason)
    if not self.session then return nil, "no_active_session" end
    MG.GuideSession:Move(self.session, delta)
    return self:FocusSession(self.session, reason or "manual_step")
end

function R:AutoAdvance()
    local current = MG.RuntimeStore:Get()
    if not current or not current.stepState or not current.stepState.autoAdvanceSafe then
        return false, "not_safe"
    end
    if not MG.db.settings.autoAdvance then return false, "disabled" end
    self:MoveStep(1, "auto_advance")
    return true
end
