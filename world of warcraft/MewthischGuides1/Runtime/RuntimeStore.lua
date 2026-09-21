local addonName, MG = ...

MG.RuntimeStore = MG.RuntimeStore or {}
local R = MG.RuntimeStore
R.revision = R.revision or 0
R.state = R.state or { revision = 0 }

function R:Reset(reason)
    self.revision = self.revision + 1
    self.state = {
        revision = self.revision,
        reason = reason or "reset",
        guideID = nil,
        stepID = nil,
        goalStates = {},
        currentStickies = {},
        destinationGoal = nil,
        destinationWaypoint = nil,
        route = nil,
        currentRouteSegment = nil,
    }
    return self.state
end

function R:Commit(snapshot)
    snapshot = snapshot or {}
    self.revision = self.revision + 1
    snapshot.revision = self.revision
    self.state = snapshot
    return snapshot
end

function R:Get()
    return self.state
end

function R:GetRevision()
    return self.revision or 0
end
