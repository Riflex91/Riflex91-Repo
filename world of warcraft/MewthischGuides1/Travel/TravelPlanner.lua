local addonName, MG = ...

MG.TravelPlanner = MG.TravelPlanner or {}
local T = MG.TravelPlanner

local LABEL = {
    fly="Fliege",
    fp="Flugpunkt",
    hs="Ruhestein",
    home="Heimatpunkt",
    deathskip="Geist-/Todesroute",
    zone="Reise",
    subzone="Reise",
    zoneskip="Zonenroute",
    subzoneskip="Teilzonenroute",
}

function T:Build(goalState)
    if not goalState then return nil end
    local action = tostring(goalState.action or "")
    if not LABEL[action] then return nil end
    local goal = goalState.sourceGoal or {}
    return {
        action=action,
        label=LABEL[action],
        location=goal.location,
        waypoint=goalState.waypoint,
        requiresUserAction=
            action == "fly" or action == "fp" or action == "hs" or
            action == "home" or action == "deathskip",
        reason="restedxp_travel_directive",
    }
end
