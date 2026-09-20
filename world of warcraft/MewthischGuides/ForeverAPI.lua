local addonName, MG = ...

local API = {}
MG.ForeverAPI = API

API.MODE = "forever-modern-capability"
API.capabilities = {}
API.errors = {}

local function nowEpoch()
    if time then return time() end
    if os and os.time then return os.time() end
    return 0
end

local function exists(value)
    return type(value) == "function"
end

local function vectorXY(value)
    if not value then return nil, nil end

    local x, y = value.x, value.y
    if (x == nil or y == nil) and value.GetXY then
        local ok, rx, ry = pcall(value.GetXY, value)
        if ok then x, y = rx, ry end
    end

    if tonumber(x) and tonumber(y) then
        return x, y
    end

    return nil, nil
end

function API:SafeCall(label, fn, ...)
    if type(fn) ~= "function" then
        return false, nil, "missing"
    end

    local ok, a, b, c, d, e, f = pcall(fn, ...)

    if not ok then
        self.errors[label] = tostring(a)

        if MG and MG.Log then
            MG:Log("WARN", "api.call_failed", "Forever API-Aufruf fehlgeschlagen.", {
                api = label,
                error = tostring(a),
            })
        end

        return false, nil, tostring(a)
    end

    return true, a, b, c, d, e, f
end

function API:BuildCapabilityMatrix()
    local q = C_QuestLog or {}
    local m = C_Map or {}
    local ql = C_QuestLine or {}
    local g = C_GossipInfo or {}
    local item = C_Item or {}
    local spec = C_SpecializationInfo or {}
    local traits = C_Traits or {}
    local talents = C_ClassTalents or {}
    local spell = C_Spell or {}
    local nav = C_Navigation or {}
    local container = C_Container or {}
    local taxi = C_TaxiMap or {}
    local secrets = C_Secrets or {}

    return {
        quest = {
            getInfo = exists(q.GetInfo),
            getObjectives = exists(q.GetQuestObjectives),
            getLogIndex = exists(q.GetLogIndexForQuestID),
            getQuestsOnMap = exists(q.GetQuestsOnMap),
            nextWaypointForMap = exists(q.GetNextWaypointForMap),
            nextWaypoint = exists(q.GetNextWaypoint),
            readyForTurnIn = exists(q.ReadyForTurnIn),
            selectedQuest = exists(q.SetSelectedQuest),
            superTrack = C_SuperTrack and exists(C_SuperTrack.SetSuperTrackedQuestID) or false,
            legacyQuestPOI = exists(QuestPOIGetIconInfo),
        },
        questLine = {
            info = exists(ql.GetQuestLineInfo),
        },
        map = {
            bestMapForUnit = exists(m.GetBestMapForUnit),
            playerPosition = exists(m.GetPlayerMapPosition),
            mapInfo = exists(m.GetMapInfo),
            worldFromMap = exists(m.GetWorldPosFromMapPos),
            mapFromWorld = exists(m.GetMapPosFromWorldPos),
            mapWorldSize = exists(m.GetMapWorldSize),
            userWaypoint = exists(m.SetUserWaypoint),
            clearUserWaypoint = exists(m.ClearUserWaypoint),
            getUserWaypoint = exists(m.GetUserWaypoint),
            uiMapPoint = type(UiMapPoint) == "table" and
                exists(UiMapPoint.CreateFromCoordinates),
        },
        gossip = {
            availableQuests = exists(g.GetAvailableQuests),
            activeQuests = exists(g.GetActiveQuests),
            selectAvailable = exists(g.SelectAvailableQuest),
            selectActive = exists(g.SelectActiveQuest),
        },
        navigation = {
            distance = exists(nav.GetDistance),
            waypointForMap = exists(nav.GetNextWaypointForMap),
            superTrackUserWaypoint = C_SuperTrack and
                exists(C_SuperTrack.SetSuperTrackedUserWaypoint) or false,
        },
        item = {
            statDelta = exists(item.GetItemStatDelta),
            equipped = exists(item.IsEquippedItem),
            equippable = exists(item.IsEquippableItem) or exists(IsEquippableItem),
            detailedItemLevel = exists(item.GetDetailedItemLevelInfo) or exists(GetDetailedItemLevelInfo),
            itemCount = exists(item.GetItemCount),
            containerQuestInfo = exists(container.GetContainerItemQuestInfo),
            containerInfo = exists(container.GetContainerItemInfo),
            containerLink = exists(container.GetContainerItemLink),
            pickupContainerItem = exists(container.PickupContainerItem),
        },
        reward = {
            choices = exists(GetNumQuestChoices),
            itemLink = exists(GetQuestItemLink),
            reward = exists(GetQuestReward),
        },
        travel = {
            taxiMap = type(C_TaxiMap) == "table",
            taxiNodesForMap = exists(taxi.GetTaxiNodesForMap),
        },
        build = {
            specializationInfo = exists(spec.GetSpecializationInfo) or exists(GetSpecializationInfo),
            getSpecialization = exists(GetSpecialization),
            traitTreeHash = exists(traits.GetTreeHash),
            initializeViewLoadout = exists(talents.InitializeViewLoadout),
        },
        spell = {
            getSpellInfo = exists(spell.GetSpellInfo),
            getSpellName = exists(spell.GetSpellName),
        },
        security = {
            secretsNamespace = type(C_Secrets) == "table",
            unitIdentitySecretCheck = exists(secrets.ShouldUnitIdentityBeSecret),
            chatLockdown = C_ChatInfo and exists(C_ChatInfo.InChatMessagingLockdown) or false,
        },
        moduleSystem = {
            requireFunction = type(require) == "function",
        },
        performance = {
            addonCPU = exists(GetAddOnCPUUsage),
        },
    }
end

function API:Survey()
    self.capabilities = self:BuildCapabilityMatrix()

    if MG and MG.db then
        MG.db.runtime = MG.db.runtime or {}
        MG.db.runtime.api = {
            mode = self.MODE,
            capabilities = self.capabilities,
            surveyedAt = nowEpoch(),
            errors = self.errors,
        }
    end

    if MG and MG.Log then
        MG:Log("INFO", "api.capabilities", "Forever API-Fähigkeiten erfasst.", {
            mode = self.MODE,
            questsOnMap = self.capabilities.quest.getQuestsOnMap,
            questLine = self.capabilities.questLine.info,
            worldCoordinates = self.capabilities.map.worldFromMap,
            navigationDistance = self.capabilities.navigation.distance,
            secrets = self.capabilities.security.secretsNamespace,
            modernSpell = self.capabilities.spell.getSpellInfo,
            specialization = self.capabilities.build.specializationInfo,
        })
    end

    return self.capabilities
end

function API:MarkSavedVariablesLoad()
    local existing = type(MewthischGuidesDB) == "table"
    local previousSentinel = existing and MewthischGuidesDB.persistenceSentinel or nil
    local previousBootCount = existing and tonumber(MewthischGuidesDB.persistenceBootCount) or nil

    MG:EnsureDB()

    MG.db.persistenceSentinel = MG.db.persistenceSentinel or
        ("mg-" .. tostring(nowEpoch()) .. "-" .. tostring(math.random(100000, 999999)))
    MG.db.persistenceBootCount = (tonumber(MG.db.persistenceBootCount) or 0) + 1
    MG.db.runtime = MG.db.runtime or {}
    MG.db.runtime.persistence = {
        hadTableAtAddonLoaded = existing,
        hadSentinel = previousSentinel ~= nil,
        previousSentinel = previousSentinel,
        currentSentinel = MG.db.persistenceSentinel,
        previousBootCount = previousBootCount,
        currentBootCount = MG.db.persistenceBootCount,
        observedAt = nowEpoch(),
    }

    MG:Log("INFO", "persistence.load_probe", "SavedVariables-Ladezustand erfasst.", {
        hadTable = existing,
        hadSentinel = previousSentinel ~= nil,
        previousBootCount = previousBootCount,
        currentBootCount = MG.db.persistenceBootCount,
    })
end

function API:GetMapInfo(mapID)
    if not mapID or not C_Map or not exists(C_Map.GetMapInfo) then return nil end

    local ok, info = self:SafeCall("C_Map.GetMapInfo", C_Map.GetMapInfo, mapID)
    if ok and type(info) == "table" then return info end
    return nil
end

function API:GetMapChain(mapID)
    local result = {}
    local seen = {}
    local current = tonumber(mapID)

    for _ = 1, 10 do
        if not current or current == 0 or seen[current] then break end

        result[#result + 1] = current
        seen[current] = true

        local info = self:GetMapInfo(current)
        current = info and tonumber(info.parentMapID) or nil
    end

    return result
end

function API:GetPlayerPosition()
    if not C_Map or not exists(C_Map.GetBestMapForUnit) or not exists(C_Map.GetPlayerMapPosition) then
        return nil
    end

    local okMap, mapID = self:SafeCall(
        "C_Map.GetBestMapForUnit",
        C_Map.GetBestMapForUnit,
        "player")

    if not okMap or not mapID then return nil end

    local okPos, position = self:SafeCall(
        "C_Map.GetPlayerMapPosition",
        C_Map.GetPlayerMapPosition,
        mapID,
        "player")

    if not okPos or not position then
        return { mapID = mapID }
    end

    local x, y = vectorXY(position)

    return {
        mapID = mapID,
        x = x,
        y = y,
    }
end

function API:GetQuestsOnMap(mapID)
    if not mapID or not C_QuestLog or not exists(C_QuestLog.GetQuestsOnMap) then
        return nil
    end

    local ok, rows = self:SafeCall(
        "C_QuestLog.GetQuestsOnMap",
        C_QuestLog.GetQuestsOnMap,
        mapID)

    if ok and type(rows) == "table" then
        return rows
    end

    return nil
end

function API:FindQuestOnMaps(questID, startingMapID, phase)
    if not questID or not startingMapID then return nil end

    local fallback = nil

    for _, mapID in ipairs(self:GetMapChain(startingMapID)) do
        local rows = self:GetQuestsOnMap(mapID)

        for _, row in ipairs(rows or {}) do
            if tonumber(row.questID) == tonumber(questID) and
               tonumber(row.x) and tonumber(row.y) then

                local phaseMatch = true

                if phase == "accept" and row.isQuestStart ~= nil then
                    phaseMatch = row.isQuestStart and true or false
                elseif phase == "objectives" and row.inProgress ~= nil then
                    phaseMatch = row.inProgress and true or false
                end

                local candidate = {
                    mapID = tonumber(row.mapID) or mapID,
                    x = tonumber(row.x),
                    y = tonumber(row.y),
                    source = "QuestMapPOI",
                    phaseMatch = phaseMatch,
                    isQuestStart = row.isQuestStart,
                    inProgress = row.inProgress,
                    numObjectives = row.numObjectives,
                }

                if phaseMatch then
                    return candidate
                end

                fallback = fallback or candidate
            end
        end
    end

    return fallback
end

function API:GetQuestLineCoordinate(questID, preferredMapID)
    if not questID or not C_QuestLine or not exists(C_QuestLine.GetQuestLineInfo) then
        return nil
    end

    local ok, info = self:SafeCall(
        "C_QuestLine.GetQuestLineInfo",
        C_QuestLine.GetQuestLineInfo,
        questID,
        preferredMapID,
        false)

    if not ok or type(info) ~= "table" then return nil end

    if tonumber(info.x) and tonumber(info.y) then
        return {
            mapID = tonumber(info.startMapID) or tonumber(preferredMapID),
            x = tonumber(info.x),
            y = tonumber(info.y),
            source = "QuestLine",
            questLineID = info.questLineID,
            isQuestStart = info.isQuestStart,
            inProgress = info.inProgress,
        }
    end

    return nil
end

function API:GetNextQuestWaypoint(questID, mapID)
    if not questID or not C_QuestLog then return nil end

    if mapID and exists(C_QuestLog.GetNextWaypointForMap) then
        local ok, a, b, c = self:SafeCall(
            "C_QuestLog.GetNextWaypointForMap",
            C_QuestLog.GetNextWaypointForMap,
            questID,
            mapID)

        if ok then
            if type(a) == "table" then
                local x = a.x or (a.position and a.position.x)
                local y = a.y or (a.position and a.position.y)
                local resultMap = a.mapID or a.uiMapID or mapID

                if tonumber(x) and tonumber(y) then
                    return {
                        mapID = tonumber(resultMap),
                        x = tonumber(x),
                        y = tonumber(y),
                        source = "QuestNextWaypointForMap",
                    }
                end
            elseif tonumber(a) and tonumber(b) and c == nil then
                return {
                    mapID = mapID,
                    x = tonumber(a),
                    y = tonumber(b),
                    source = "QuestNextWaypointForMap",
                }
            elseif tonumber(a) and tonumber(b) and tonumber(c) then
                return {
                    mapID = tonumber(a),
                    x = tonumber(b),
                    y = tonumber(c),
                    source = "QuestNextWaypointForMap",
                }
            end
        end
    end

    if exists(C_QuestLog.GetNextWaypoint) then
        local ok, a, b, c = self:SafeCall(
            "C_QuestLog.GetNextWaypoint",
            C_QuestLog.GetNextWaypoint,
            questID)

        if ok then
            if type(a) == "table" then
                local x = a.x or (a.position and a.position.x)
                local y = a.y or (a.position and a.position.y)

                if tonumber(x) and tonumber(y) then
                    return {
                        mapID = tonumber(a.mapID or a.uiMapID),
                        x = tonumber(x),
                        y = tonumber(y),
                        source = "QuestNextWaypoint",
                    }
                end
            elseif tonumber(a) and tonumber(b) and tonumber(c) then
                return {
                    mapID = tonumber(a),
                    x = tonumber(b),
                    y = tonumber(c),
                    source = "QuestNextWaypoint",
                }
            end
        end
    end

    return nil
end

function API:GetLegacyQuestPOI(questID, mapID)
    if not questID or not mapID or not exists(QuestPOIGetIconInfo) then return nil end

    if exists(QuestPOIUpdateIcons) then
        self:SafeCall("QuestPOIUpdateIcons", QuestPOIUpdateIcons)
    end

    local ok, completed, x, y, objective = self:SafeCall(
        "QuestPOIGetIconInfo",
        QuestPOIGetIconInfo,
        questID)

    if ok and tonumber(x) and tonumber(y) then
        return {
            mapID = mapID,
            x = tonumber(x),
            y = tonumber(y),
            source = "LegacyQuestPOI",
            completed = completed and true or false,
            objective = objective,
        }
    end

    return nil
end

function API:GetNavigationCoordinate(mapID)
    if not mapID or not C_Navigation or not exists(C_Navigation.GetNextWaypointForMap) then
        return nil
    end

    local ok, a, b, description = self:SafeCall(
        "C_Navigation.GetNextWaypointForMap",
        C_Navigation.GetNextWaypointForMap,
        mapID)

    if ok and tonumber(a) and tonumber(b) then
        return {
            mapID = mapID,
            x = tonumber(a),
            y = tonumber(b),
            source = "BlizzardNavigationMap",
            description = description,
        }
    end

    return nil
end

function API:GetQuestDistanceYards(questID)
    if C_QuestLog and exists(C_QuestLog.GetDistanceSqToQuest) then
        local ok, distanceSq = self:SafeCall(
            "C_QuestLog.GetDistanceSqToQuest",
            C_QuestLog.GetDistanceSqToQuest,
            questID)

        if ok and tonumber(distanceSq) and distanceSq >= 0 then
            return math.sqrt(distanceSq), "QuestDistance"
        end
    end

    if C_Navigation and exists(C_Navigation.GetDistance) then
        local ok, distance = self:SafeCall(
            "C_Navigation.GetDistance",
            C_Navigation.GetDistance)

        if ok and tonumber(distance) and distance >= 0 then
            return tonumber(distance), "BlizzardNavigationDistance"
        end
    end

    return nil
end

function API:MapToWorld(mapID, x, y)
    if not mapID or not tonumber(x) or not tonumber(y) or
       not C_Map or not exists(C_Map.GetWorldPosFromMapPos) then
        return nil
    end

    local point = CreateVector2D and CreateVector2D(x, y) or { x = x, y = y }

    local ok, continentID, world = self:SafeCall(
        "C_Map.GetWorldPosFromMapPos",
        C_Map.GetWorldPosFromMapPos,
        mapID,
        point)

    if not ok or not world then return nil end

    local wx, wy = vectorXY(world)

    if wx and wy then
        return {
            continentID = continentID,
            x = wx,
            y = wy,
        }
    end

    return nil
end

function API:MapToRestedXPWorld(mapID, x, y)
    local world = self:MapToWorld(mapID, x, y)
    if not world then return nil end

    -- RestedXP/HereBeDragons uses world X for west/east and world Y for
    -- north/south. Blizzard's Vector2D returned by GetWorldPosFromMapPos is
    -- the opposite axis order. Keep the conversion explicit so route data is
    -- never mixed with Blizzard vector axes again.
    return {
        continentID = world.continentID,
        x = world.y,
        y = world.x,
    }
end

function API:RestedXPWorldToMap(mapID, worldX, worldY)
    mapID = tonumber(mapID)
    worldX = tonumber(worldX)
    worldY = tonumber(worldY)

    if not mapID or not worldX or not worldY or not C_Map or
       not exists(C_Map.GetWorldPosFromMapPos) then
        return nil
    end

    -- Match HereBeDragons' map geometry exactly. This is the coordinate
    -- convention used by RestedXP's "mapID/floor, worldX, worldY" directives.
    local centerPoint = CreateVector2D and CreateVector2D(0.5, 0.5) or
        { x = 0.5, y = 0.5 }
    local okCenter, _, center = self:SafeCall(
        "C_Map.GetWorldPosFromMapPos.rxp_center",
        C_Map.GetWorldPosFromMapPos,
        mapID,
        centerPoint)

    if okCenter and center then
        local centerTop, centerLeft = vectorXY(center)
        local width, height = nil, nil

        if exists(C_Map.GetMapWorldSize) then
            local okSize, w, h = self:SafeCall(
                "C_Map.GetMapWorldSize",
                C_Map.GetMapWorldSize,
                mapID)
            if okSize then
                width, height = tonumber(w), tonumber(h)
            end
        end

        if (not width or not height) then
            local topLeftPoint = CreateVector2D and CreateVector2D(0, 0) or
                { x = 0, y = 0 }
            local okTopLeft, _, topLeft = self:SafeCall(
                "C_Map.GetWorldPosFromMapPos.rxp_topleft",
                C_Map.GetWorldPosFromMapPos,
                mapID,
                topLeftPoint)

            if okTopLeft and topLeft then
                local top, left = vectorXY(topLeft)
                if top and left and centerTop and centerLeft then
                    width = (left - centerLeft) * 2
                    height = (top - centerTop) * 2
                end
            end
        end

        if centerTop and centerLeft and width and height and
           width ~= 0 and height ~= 0 then
            local top = centerTop + (height / 2)
            local left = centerLeft + (width / 2)
            local x = (left - worldX) / width
            local y = (top - worldY) / height

            if x >= 0 and x <= 1 and y >= 0 and y <= 1 then
                return {
                    mapID = mapID,
                    x = x,
                    y = y,
                    source = "RestedXPMapGeometry",
                }
            end
        end
    end

    -- Compatibility fallback for clients that expose GetMapPosFromWorldPos.
    -- The vector must still be axis-swapped from RestedXP to Blizzard order.
    if exists(C_Map.GetMapPosFromWorldPos) then
        local worldPoint = CreateVector2D and
            CreateVector2D(worldY, worldX) or { x = worldY, y = worldX }

        local player = self:GetPlayerPosition()
        local playerWorld = player and
            self:MapToWorld(player.mapID, player.x, player.y) or nil
        local continentID = playerWorld and playerWorld.continentID or nil

        if continentID then
            local ok, resultMapID, mapPoint = self:SafeCall(
                "C_Map.GetMapPosFromWorldPos.rxp",
                C_Map.GetMapPosFromWorldPos,
                continentID,
                worldPoint,
                mapID)

            if ok and mapPoint then
                local x, y = vectorXY(mapPoint)
                if x and y then
                    return {
                        mapID = tonumber(resultMapID) or mapID,
                        x = x,
                        y = y,
                        source = "RestedXPMapPosFromWorld",
                    }
                end
            end
        end
    end

    return nil
end

function API:WorldToMap(mapID, worldX, worldY)
    return self:RestedXPWorldToMap(mapID, worldX, worldY)
end

function API:SetWorldMapWaypoint(target)
    if not target or not C_Map or not exists(C_Map.SetUserWaypoint) then
        return false, "waypoint_api_missing"
    end

    local mapID = tonumber(target.mapID)
    local x = tonumber(target.x)
    local y = tonumber(target.y)

    if mapID and (not x or not y) and
       tonumber(target.worldX) and tonumber(target.worldY) then
        local converted = self:RestedXPWorldToMap(
            mapID,
            tonumber(target.worldX),
            tonumber(target.worldY))
        if converted then
            mapID, x, y = converted.mapID, converted.x, converted.y
        end
    end

    if not mapID or not x or not y then
        return false, "map_coordinate_unavailable"
    end

    local point = nil
    if type(UiMapPoint) == "table" and exists(UiMapPoint.CreateFromCoordinates) then
        local ok, value = pcall(UiMapPoint.CreateFromCoordinates, mapID, x, y)
        if ok then point = value end
    end

    if not point then
        point = { uiMapID = mapID, position = CreateVector2D and
            CreateVector2D(x, y) or { x = x, y = y } }
    end

    local ok, err = pcall(C_Map.SetUserWaypoint, point)
    if not ok then return false, tostring(err) end

    if C_SuperTrack and exists(C_SuperTrack.SetSuperTrackedUserWaypoint) then
        pcall(C_SuperTrack.SetSuperTrackedUserWaypoint, true)
    end

    return true, {
        mapID = mapID,
        x = x,
        y = y,
    }
end

function API:ClearWorldMapWaypoint()
    if C_SuperTrack and exists(C_SuperTrack.SetSuperTrackedUserWaypoint) then
        pcall(C_SuperTrack.SetSuperTrackedUserWaypoint, false)
    end
    if C_Map and exists(C_Map.ClearUserWaypoint) then
        pcall(C_Map.ClearUserWaypoint)
        return true
    end
    return false
end

return API
