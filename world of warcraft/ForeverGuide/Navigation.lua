local addonName, FG = ...

FG.navigation = FG.navigation or {}

local function tryNextWaypoint(questID)
    if not C_QuestLog or not C_QuestLog.GetNextWaypoint then return nil end
    local ok, mapID, x, y = pcall(C_QuestLog.GetNextWaypoint, questID)
    if not ok then return nil end
    if type(mapID) == "table" then
        local t = mapID
        return { mapID = t.mapID or t.uiMapID, x = t.x or (t.position and t.position.x), y = t.y or (t.position and t.position.y), source = "C_QuestLog.GetNextWaypoint" }
    end
    if mapID and x and y then return { mapID = mapID, x = x, y = y, source = "C_QuestLog.GetNextWaypoint" } end
    return nil
end

local function normalizeAngle(angle)
    while angle > math.pi do angle = angle - math.pi * 2 end
    while angle < -math.pi do angle = angle + math.pi * 2 end
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

function FG:RefreshNavigation(reason)
    local step = self.currentStep
    if not step then self.navigation = { available = false, reason = "no_step" }; return end
    local waypoint = tryNextWaypoint(step.questID)
    local player = self:GetPosition()
    if not waypoint or not waypoint.mapID or not waypoint.x or not waypoint.y then
        self.navigation = { available = false, questID = step.questID, reason = "no_waypoint_api_result", superTrack = true }
        self:Log("INFO", "navigation.fallback", "Kein direkter Quest-Waypoint; Blizzard-SuperTrack wird verwendet.", { questID = step.questID, reason = reason })
        return
    end
    local nav = { available = true, questID = step.questID, target = waypoint, player = player, sameMap = player and player.mapID == waypoint.mapID }
    if nav.sameMap and player.x and player.y then
        local dx, dy = waypoint.x - player.x, waypoint.y - player.y
        nav.normalizedDistance = math.sqrt(dx * dx + dy * dy)
        local facing = GetPlayerFacing and GetPlayerFacing() or nil
        if facing then nav.relativeAngle = normalizeAngle(atan2(dx, dy) - facing) end
    end
    self.navigation = nav
    self:Log("INFO", "navigation.waypoint", "Quest-Waypoint aktualisiert.", { questID = step.questID, mapID = waypoint.mapID, x = waypoint.x, y = waypoint.y, sameMap = nav.sameMap })
end
