local addonName, MG = ...

MG.RoutePlanner = MG.RoutePlanner or {}
local R = MG.RoutePlanner

local function distance(position, waypoint)
    if not MG.NavigationDistance then return nil end
    local value = MG.NavigationDistance:Between(position, waypoint)
    return tonumber(value)
end

local function arrivalRadius(waypoint)
    local radius = waypoint and tonumber(waypoint.radius)
    if radius and radius > 0 then return radius end
    return 18
end

local function nearestIndex(position, route)
    local bestIndex, bestDistance
    for index, waypoint in ipairs(route or {}) do
        local d = distance(position, waypoint)
        if d and (bestDistance == nil or d < bestDistance) then
            bestIndex, bestDistance = index, d
        end
    end
    return bestIndex or 1, bestDistance
end

function R:Plan(step, navigation, facts, previous)
    local position = facts and facts.position
    local route = step and step.route or {}
    local destination = navigation and navigation.waypoint or nil

    if #route == 0 then
        return {
            stepID=step and step.id or nil,
            kind="direct",
            waypoints=destination and {MG.Util:Copy(destination)} or {},
            currentIndex=destination and 1 or nil,
            currentWaypoint=destination and MG.Util:Copy(destination) or nil,
            destinationWaypoint=destination and MG.Util:Copy(destination) or nil,
            loop=false,
            reason=destination and "direct_destination" or "no_route",
        }
    end

    local index
    if previous and previous.stepID == step.id and previous.currentIndex and
       tonumber(previous.currentIndex) <= #route then
        index = tonumber(previous.currentIndex)
        local current = route[index]
        local d = position and distance(position, current)
        if d and d <= arrivalRadius(current) then
            if step.loop then
                index = index % #route + 1
            elseif index < #route then
                index = index + 1
            end
        end
    else
        index = position and nearestIndex(position, route) or 1
    end

    local current = route[index]
    return {
        stepID=step.id,
        kind=step.loop and "loop" or "route",
        waypoints=MG.Util:Copy(route),
        currentIndex=index,
        currentWaypoint=current and MG.Util:Copy(current) or nil,
        destinationWaypoint=destination and MG.Util:Copy(destination) or nil,
        loop=step.loop and true or false,
        reason=step.loop and "loop_nearest_segment" or "route_segment",
    }
end

function R:Segment(plan)
    if not plan or not plan.currentWaypoint then return nil end
    return {
        routeKind=plan.kind,
        index=plan.currentIndex,
        count=#(plan.waypoints or {}),
        waypoint=plan.currentWaypoint,
        destinationWaypoint=plan.destinationWaypoint,
        loop=plan.loop,
    }
end
