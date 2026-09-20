local addonName, MG = ...

MG.BuildState = MG.BuildState or {}
local Build = MG.BuildState

function Build:Refresh(reason)
    local state = {
        reason = reason,
        class = select(2, UnitClass("player")),
        classID = select(3, UnitClass("player")),
        level = UnitLevel("player"),
        specialization = nil,
        specializationID = nil,
    }

    if GetSpecialization and GetSpecializationInfo then
        local okSpec, index = pcall(GetSpecialization)
        if okSpec and index then
            local ok, specID, name, _, _, role = pcall(GetSpecializationInfo, index)
            if ok then
                state.specialization = name
                state.specializationID = specID
                state.role = role
            end
        end
    end

    self.state = state
    if MG.db then
        MG.db.runtime = MG.db.runtime or {}
        MG.db.runtime.build = state
    end
    return state
end

function Build:GetState()
    return self.state or self:Refresh("lazy")
end
