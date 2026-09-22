local addonName, MG = ...

MG.BuildState = MG.BuildState or {}
local B = MG.BuildState

local function safe(fn, ...)
    if type(fn) ~= "function" then return nil end
    local ok,a,b,c,d,e,f = pcall(fn,...)
    if not ok then return nil end
    return a,b,c,d,e,f
end

function B:Refresh(reason)
    local profile=MG:GetPlayerProfile()
    local state={
        reason=reason or "refresh",
        class=profile.class,
        classID=profile.classID,
        level=profile.level,
        specialization=nil,
        specializationID=nil,
        role=nil,
        unspentTalentPoints=MG.PlayerFacts and MG.PlayerFacts:GetTalentPoints() or nil,
    }

    if GetSpecialization and GetSpecializationInfo then
        local index=safe(GetSpecialization)
        if index then
            local specID,name,_,_,role=safe(GetSpecializationInfo,index)
            state.specializationID=tonumber(specID)
            state.specialization=name
            state.role=role
        end
    end

    self.state=state
    if MG.db then
        MG.db.runtime=MG.db.runtime or {}
        MG.db.runtime.buildState=MG.Util:Copy(state)
    end
    return state
end

function B:GetState()
    return self.state or self:Refresh("lazy")
end
