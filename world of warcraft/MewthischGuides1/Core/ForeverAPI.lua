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

function A:Probe()
    local caps={
        C_Map=present("C_Map"),
        worldFromMap=present("C_Map.GetWorldPosFromMapPos"),
        mapFromWorld=present("C_Map.GetMapPosFromWorldPos"),
        questLog=present("C_QuestLog"),
        questObjectives=present("C_QuestLog.GetQuestObjectives"),
        questMapPOI=present("C_QuestLog.GetQuestsOnMap"),
        spell=present("C_Spell"),
        item=present("C_Item"),
        container=present("C_Container"),
        specialization=type(GetSpecialization)=="function",
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
