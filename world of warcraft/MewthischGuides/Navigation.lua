local addonName, MG = ...

MG.navigation = MG.navigation or {}
MG.lastNavigationSignature = nil

local YARDS_TO_METERS = 0.9144
local TWO_PI = math.pi * 2

local function normalizeRelative(angle)
    while angle > math.pi do angle = angle - TWO_PI end
    while angle < -math.pi do angle = angle + TWO_PI end
    return angle
end

local function normalizeAbsolute(angle)
    while angle < 0 do angle = angle + TWO_PI end
    while angle >= TWO_PI do angle = angle - TWO_PI end
    return angle
end

local function atan2(y, x)
    if math.atan2 then return math.atan2(y, x) end
    if x > 0 then return math.atan(y / x) end
    if x < 0 and y >= 0 then return math.atan(y / x) + math.pi end
    if x < 0 and y < 0 then return math.atan(y / x) - math.pi end
    if x == 0 and y > 0 then return math.pi / 2 end
    if x == 0 and y < 0 then return -math.pi / 2 end
    return 0
end

function MG:ComputeAbsoluteBearing(deltaX, deltaY)
    if deltaX == nil or deltaY == nil then return nil end

    -- Same coordinate convention as HereBeDragons/Zygor:
    -- 0 = north/forward, pi/2 = east/right, pi = south, 3pi/2 = west.
    local raw = atan2(-deltaX, deltaY)

    if raw > 0 then
        return TWO_PI - raw
    end

    return -raw
end

function MG:ComputeRelativeBearing(deltaX, deltaY, playerFacing)
    local targetAngle = self:ComputeAbsoluteBearing(deltaX, deltaY)
    if targetAngle == nil or playerFacing == nil then return nil, targetAngle end
    return normalizeRelative(targetAngle - playerFacing), targetAngle
end

local function unpackWaypointResult(a, b, c, fallbackMapID, source)
    if type(a) == "table" then
        local mapID = a.mapID or a.uiMapID or fallbackMapID
        local x = a.x or (a.position and a.position.x)
        local y = a.y or (a.position and a.position.y)

        if tonumber(mapID) and tonumber(x) and tonumber(y) then
            return {
                mapID = mapID,
                x = x,
                y = y,
                source = source,
            }
        end
    end

    if tonumber(a) and tonumber(b) and tonumber(c) then
        return {
            mapID = a,
            x = b,
            y = c,
            source = source,
        }
    end

    if tonumber(b) and tonumber(c) and fallbackMapID then
        return {
            mapID = fallbackMapID,
            x = b,
            y = c,
            source = source,
        }
    end

    if tonumber(a) and tonumber(b) and fallbackMapID and c == nil then
        return {
            mapID = fallbackMapID,
            x = a,
            y = b,
            source = source,
        }
    end

    return nil
end

local function tryQuestWaypointForMap(questID, mapID)
    if not mapID or not C_QuestLog or not C_QuestLog.GetNextWaypointForMap then return nil end

    local ok, a, b, c = pcall(C_QuestLog.GetNextWaypointForMap, questID, mapID)
    if not ok then return nil end

    return unpackWaypointResult(a, b, c, mapID, "QuestWaypointForMap")
end

local function tryQuestWaypoint(questID)
    if not C_QuestLog or not C_QuestLog.GetNextWaypoint then return nil end

    local ok, a, b, c = pcall(C_QuestLog.GetNextWaypoint, questID)
    if not ok then return nil end

    return unpackWaypointResult(a, b, c, nil, "QuestWaypoint")
end

local function tryLegacyQuestPOI(questID, playerMapID)
    if not QuestPOIGetIconInfo or not playerMapID then return nil end

    if QuestPOIUpdateIcons then pcall(QuestPOIUpdateIcons) end

    local ok, completed, x, y, objective = pcall(QuestPOIGetIconInfo, questID)
    if ok and tonumber(x) and tonumber(y) then
        return {
            mapID = playerMapID,
            x = x,
            y = y,
            source = "QuestPOI",
            objective = objective,
            completed = completed and true or false,
        }
    end

    return nil
end

local function tryNavigationWaypoint(playerMapID)
    if not playerMapID or not C_Navigation or not C_Navigation.GetNextWaypointForMap then return nil end

    local ok, a, b, c = pcall(C_Navigation.GetNextWaypointForMap, playerMapID)
    if not ok then return nil end

    local waypoint = unpackWaypointResult(a, b, nil, playerMapID, "BlizzardNavigationMap")
    if waypoint then
        waypoint.description = c
        return waypoint
    end

    return nil
end

local function getWaypointText(questID)
    if C_QuestLog and C_QuestLog.GetNextWaypointText then
        local ok, text = pcall(C_QuestLog.GetNextWaypointText, questID)
        if ok and text and text ~= "" then return text end
    end
    return nil
end

local function worldXY(mapID, x, y)
    if not mapID or not x or not y or not C_Map or not C_Map.GetWorldPosFromMapPos then return nil end

    local vector = CreateVector2D and CreateVector2D(x, y) or { x = x, y = y }
    local ok, continentID, world = pcall(C_Map.GetWorldPosFromMapPos, mapID, vector)
    if not ok or not world then return nil end

    local wx = world.x
    local wy = world.y

    if (wx == nil or wy == nil) and world.GetXY then
        local xyOk, rx, ry = pcall(world.GetXY, world)
        if xyOk then wx, wy = rx, ry end
    end

    if tonumber(wx) and tonumber(wy) then
        return continentID, wx, wy
    end

    return nil
end

local function questDistance(questID)
    if C_QuestLog and C_QuestLog.GetDistanceSqToQuest then
        local ok, distanceSq = pcall(C_QuestLog.GetDistanceSqToQuest, questID)
        if ok and tonumber(distanceSq) and distanceSq >= 0 then
            return math.sqrt(distanceSq), "QuestDistance"
        end
    end

    if C_Navigation and C_Navigation.GetDistance then
        local ok, distance = pcall(C_Navigation.GetDistance)
        if ok and tonumber(distance) and distance >= 0 then
            return distance, "BlizzardNavigationDistance"
        end
    end

    return nil
end

local function bearingFromPoints(player, target)
    if not player or not target then return nil, nil end
    if player.mapID ~= target.mapID then return nil, nil end
    if not tonumber(player.x) or not tonumber(player.y) or not tonumber(target.x) or not tonumber(target.y) then
        return nil, nil
    end

    local pc, px, py = worldXY(player.mapID, player.x, player.y)
    local tc, tx, ty = worldXY(target.mapID, target.x, target.y)

    if pc and tc and pc == tc and px and py and tx and ty then
        local deltaX = tx - px
        local deltaY = ty - py
        local angle = MG:ComputeAbsoluteBearing(deltaX, deltaY)
        local distance = math.sqrt(deltaX * deltaX + deltaY * deltaY)
        return angle, distance, "MapWorldPosition"
    end

    -- Normalized map Y grows downward. Convert it to the same north-positive
    -- convention before using the shared bearing formula.
    local deltaX = target.x - player.x
    local deltaY = player.y - target.y
    local angle = MG:ComputeAbsoluteBearing(deltaX, deltaY)
    local normalizedDistance = math.sqrt(deltaX * deltaX + deltaY * deltaY)

    return angle, nil, "MapNormalized"
end

function MG:ResolveWaypoint(questID)
    local player = self:GetPosition()
    local playerMapID = player and player.mapID or nil

    if QuestPOIUpdateIcons then pcall(QuestPOIUpdateIcons) end

    local waypoint = tryQuestWaypointForMap(questID, playerMapID)
    if waypoint then return waypoint end

    waypoint = tryQuestWaypoint(questID)
    if waypoint then return waypoint end

    local questMapID = nil
    if GetQuestUiMapID then
        local ok, value = pcall(GetQuestUiMapID, questID, false)
        if ok then questMapID = value end
    end

    if questMapID then
        waypoint = tryQuestWaypointForMap(questID, questMapID)
        if waypoint then return waypoint end
    end

    waypoint = tryLegacyQuestPOI(questID, playerMapID)
    if waypoint then return waypoint end

    waypoint = tryNavigationWaypoint(playerMapID)
    if waypoint then return waypoint end

    return nil
end

function MG:UpdateNavigationRealtime()
    local nav = self.navigation
    if not nav or not nav.questID then return end

    local player = self:GetPosition()
    nav.player = player

    local distance, distanceSource = questDistance(nav.questID)
    local targetAngle, targetDistance, directionSource = bearingFromPoints(player, nav.target)

    if targetDistance then
        distance = targetDistance
        distanceSource = "MapWorldPosition"
    end

    local facing = GetPlayerFacing and GetPlayerFacing() or nil
    local relativeAngle = nil

    if targetAngle ~= nil and facing ~= nil then
        relativeAngle = normalizeRelative(targetAngle - facing)
    end

    nav.relativeAngle = relativeAngle
    nav.targetAngle = targetAngle
    nav.playerFacing = facing
    nav.directionSource = directionSource
    nav.directionReliable = relativeAngle ~= nil and directionSource ~= nil
    nav.distanceYards = distance
    nav.distanceMeters = distance and (distance * YARDS_TO_METERS) or nil
    nav.distanceSource = distanceSource

    if player and nav.target and player.mapID == nav.target.mapID and
       player.x and player.y and nav.target.x and nav.target.y then
        local dx = nav.target.x - player.x
        local dy = player.y - nav.target.y
        nav.normalizedDistance = math.sqrt(dx * dx + dy * dy)
        nav.sameMap = true
    else
        nav.normalizedDistance = nil
        nav.sameMap = false
    end
end

function MG:RefreshNavigation(reason)
    local step = self.currentStep

    if not step then
        self.navigation = {
            available = false,
            directionReliable = false,
            reason = "no_step",
        }
        return
    end

    local waypoint = self:ResolveWaypoint(step.questID)

    local nav = {
        available = waypoint ~= nil,
        questID = step.questID,
        target = waypoint,
        source = waypoint and waypoint.source or "NoCoordinate",
        waypointText = getWaypointText(step.questID) or
            (waypoint and waypoint.description) or
            (step.goal and step.goal.instruction) or step.detail,
        reason = waypoint and nil or "no_coordinate",
        superTrack = true,
    }

    self.navigation = nav
    self:UpdateNavigationRealtime()

    local signature = table.concat({
        tostring(nav.questID or ""),
        tostring(nav.source or ""),
        tostring(waypoint and waypoint.mapID or ""),
        tostring(waypoint and waypoint.x or ""),
        tostring(waypoint and waypoint.y or ""),
        tostring(nav.directionSource or ""),
    }, "|")

    if self.lastNavigationSignature ~= signature then
        self.lastNavigationSignature = signature

        if waypoint and nav.directionReliable then
            self:Log("INFO", "navigation.direction_ready", "Belastbare Zielrichtung berechnet.", {
                questID = step.questID,
                mapID = waypoint.mapID,
                x = waypoint.x,
                y = waypoint.y,
                source = nav.source,
                directionSource = nav.directionSource,
                targetAngle = nav.targetAngle,
                playerFacing = nav.playerFacing,
                relativeAngle = nav.relativeAngle,
                distanceMeters = nav.distanceMeters,
                reason = reason,
            })
        elseif waypoint then
            self:Log("WARN", "navigation.direction_unavailable",
                "Waypoint vorhanden, aber keine belastbare Pfeilrichtung berechenbar.", {
                    questID = step.questID,
                    mapID = waypoint.mapID,
                    x = waypoint.x,
                    y = waypoint.y,
                    source = nav.source,
                    reason = reason,
                })
        else
            self:Log("WARN", "navigation.no_coordinate",
                "Keine belastbare Questziel-Koordinate gefunden; Pfeil wird nicht geraten.", {
                    questID = step.questID,
                    reason = reason,
                })
        end
    end
end

function MG:GetDirectionLabel(angle)
    if angle == nil then return "Richtung nicht verfuegbar" end

    local degrees = angle * 180 / math.pi
    if degrees < 0 then degrees = degrees + 360 end

    if degrees >= 337.5 or degrees < 22.5 then return "geradeaus" end
    if degrees < 67.5 then return "vorne rechts" end
    if degrees < 112.5 then return "rechts" end
    if degrees < 157.5 then return "hinten rechts" end
    if degrees < 202.5 then return "hinten" end
    if degrees < 247.5 then return "hinten links" end
    if degrees < 292.5 then return "links" end
    return "vorne links"
end
