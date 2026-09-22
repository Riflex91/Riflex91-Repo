local addonName, MG = ...

MG.ForeverAPI = MG.ForeverAPI or {}
local A = MG.ForeverAPI

local function present(path)
    local value=_G
    for part in tostring(path):gmatch("[^%.]+") do
        if type(value)~="table" then return false end
        value=value[part]
        if value==nil then return false end
    end
    return true
end

local function vectorXY(value)
    if not value then return nil,nil end
    if tonumber(value.x) and tonumber(value.y) then
        return tonumber(value.x),tonumber(value.y)
    end
    if value.GetXY then
        local ok,x,y=pcall(value.GetXY,value)
        if ok and tonumber(x) and tonumber(y) then return tonumber(x),tonumber(y) end
    end
    return nil,nil
end

function A:Probe()
    local caps={
        C_Map=present("C_Map"),
        bestMapForUnit=present("C_Map.GetBestMapForUnit"),
        playerMapPosition=present("C_Map.GetPlayerMapPosition"),
        mapInfo=present("C_Map.GetMapInfo"),
        mapWorldSize=present("C_Map.GetMapWorldSize"),
        worldFromMap=present("C_Map.GetWorldPosFromMapPos"),
        mapFromWorld=present("C_Map.GetMapPosFromWorldPos"),
        questLog=present("C_QuestLog"),
        questObjectives=present("C_QuestLog.GetQuestObjectives"),
        questMapPOI=present("C_QuestLog.GetQuestsOnMap"),
        questNextWaypoint=present("C_QuestLog.GetNextWaypointForMap") or
            present("C_QuestLog.GetNextWaypoint"),
        questLine=present("C_QuestLine.GetQuestLineInfo"),
        gossip=present("C_GossipInfo"),
        taxiMap=present("C_TaxiMap"),
        spell=present("C_Spell"),
        item=present("C_Item"),
        container=present("C_Container"),
        specialization=type(GetSpecialization)=="function",
        classTalents=present("C_ClassTalents"),
        traits=present("C_Traits"),
        secrets=present("C_Secrets"),
        playerFacing=type(GetPlayerFacing)=="function",
        superTrack=present("C_SuperTrack.SetSuperTrackedQuestID"),
        worldMap=WorldMapFrame~=nil,
    }
    self.capabilities=caps
    if MG.db then
        MG.db.runtime=MG.db.runtime or {}
        MG.db.runtime.capabilities=MG.Util:Copy(caps)
    end
    return caps
end

function A:Has(name)
    local caps=self.capabilities or self:Probe()
    return caps[name] and true or false
end

function A:Safe(name,fn,...)
    if type(fn)~="function" then return nil,"api_missing:"..tostring(name) end
    local ok,a,b,c,d,e=pcall(fn,...)
    if not ok then
        if MG.Log then MG:Log("WARN","api.failure","Forever API-Aufruf fehlgeschlagen.",{
            api=name,error=tostring(a),
        }) end
        return nil,"api_error:"..tostring(name)
    end
    return a,b,c,d,e
end

function A:GetMapInfo(mapID)
    mapID=tonumber(mapID)
    if not mapID or not C_Map or not C_Map.GetMapInfo then return nil end
    local info=self:Safe("C_Map.GetMapInfo",C_Map.GetMapInfo,mapID)
    return type(info)=="table" and info or nil
end

function A:GetMapChain(mapID)
    local result,seen={},{}
    local current=tonumber(mapID)
    for _=1,10 do
        if not current or current==0 or seen[current] then break end
        result[#result+1]=current;seen[current]=true
        local info=self:GetMapInfo(current)
        current=info and tonumber(info.parentMapID) or nil
    end
    return result
end

function A:GetPlayerPosition()
    if not C_Map or not C_Map.GetBestMapForUnit or not C_Map.GetPlayerMapPosition then return nil end
    local mapID=self:Safe("C_Map.GetBestMapForUnit",C_Map.GetBestMapForUnit,"player")
    mapID=tonumber(mapID);if not mapID then return nil end
    local pos=self:Safe("C_Map.GetPlayerMapPosition",C_Map.GetPlayerMapPosition,mapID,"player")
    local x,y=vectorXY(pos)
    return {mapID=mapID,x=x,y=y}
end

function A:GetQuestsOnMap(mapID)
    mapID=tonumber(mapID)
    if not mapID or not C_QuestLog or not C_QuestLog.GetQuestsOnMap then return nil end
    local rows=self:Safe("C_QuestLog.GetQuestsOnMap",C_QuestLog.GetQuestsOnMap,mapID)
    return type(rows)=="table" and rows or nil
end

function A:FindQuestOnMaps(questID,startingMapID,phase)
    questID,startingMapID=tonumber(questID),tonumber(startingMapID)
    if not questID or not startingMapID then return nil end
    local fallback
    for _,mapID in ipairs(self:GetMapChain(startingMapID)) do
        for _,row in ipairs(self:GetQuestsOnMap(mapID) or {}) do
            if tonumber(row.questID)==questID and tonumber(row.x) and tonumber(row.y) then
                local phaseMatch=true
                if phase=="accept" and row.isQuestStart~=nil then
                    phaseMatch=row.isQuestStart and true or false
                elseif phase=="objectives" and row.inProgress~=nil then
                    phaseMatch=row.inProgress and true or false
                end
                local candidate={
                    mapID=tonumber(row.mapID) or mapID,x=tonumber(row.x),y=tonumber(row.y),
                    source="QuestMapPOI",phaseMatch=phaseMatch,isQuestStart=row.isQuestStart,
                    inProgress=row.inProgress,numObjectives=row.numObjectives,
                }
                if phaseMatch then return candidate end
                fallback=fallback or candidate
            end
        end
    end
    return fallback
end

function A:GetQuestLineCoordinate(questID,preferredMapID)
    questID=tonumber(questID)
    if not questID or not C_QuestLine or not C_QuestLine.GetQuestLineInfo then return nil end
    local info=self:Safe("C_QuestLine.GetQuestLineInfo",
        C_QuestLine.GetQuestLineInfo,questID,tonumber(preferredMapID),false)
    if type(info)~="table" or not tonumber(info.x) or not tonumber(info.y) then return nil end
    return {
        mapID=tonumber(info.startMapID) or tonumber(preferredMapID),
        x=tonumber(info.x),y=tonumber(info.y),source="QuestLine",
        questLineID=info.questLineID,isQuestStart=info.isQuestStart,inProgress=info.inProgress,
    }
end

function A:GetNextQuestWaypoint(questID,mapID)
    questID,mapID=tonumber(questID),tonumber(mapID)
    if not questID or not C_QuestLog then return nil end

    if mapID and C_QuestLog.GetNextWaypointForMap then
        local a,b,c=self:Safe("C_QuestLog.GetNextWaypointForMap",
            C_QuestLog.GetNextWaypointForMap,questID,mapID)
        if type(a)=="table" then
            local x=a.x or (a.position and a.position.x)
            local y=a.y or (a.position and a.position.y)
            if tonumber(x) and tonumber(y) then
                return {mapID=tonumber(a.mapID or a.uiMapID) or mapID,
                    x=tonumber(x),y=tonumber(y),source="QuestNextWaypointForMap"}
            end
        elseif tonumber(a) and tonumber(b) and c==nil then
            return {mapID=mapID,x=tonumber(a),y=tonumber(b),source="QuestNextWaypointForMap"}
        elseif tonumber(a) and tonumber(b) and tonumber(c) then
            return {mapID=tonumber(a),x=tonumber(b),y=tonumber(c),source="QuestNextWaypointForMap"}
        end
    end

    if C_QuestLog.GetNextWaypoint then
        local a,b,c=self:Safe("C_QuestLog.GetNextWaypoint",C_QuestLog.GetNextWaypoint,questID)
        if type(a)=="table" then
            local x=a.x or (a.position and a.position.x)
            local y=a.y or (a.position and a.position.y)
            if tonumber(x) and tonumber(y) then
                return {mapID=tonumber(a.mapID or a.uiMapID),
                    x=tonumber(x),y=tonumber(y),source="QuestNextWaypoint"}
            end
        elseif tonumber(a) and tonumber(b) and tonumber(c) then
            return {mapID=tonumber(a),x=tonumber(b),y=tonumber(c),source="QuestNextWaypoint"}
        end
    end
    return nil
end
