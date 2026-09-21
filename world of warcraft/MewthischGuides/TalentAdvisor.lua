local addonName, MG = ...

MG.TalentAdvisor = MG.TalentAdvisor or {}
local Talents = MG.TalentAdvisor

function Talents:GetProfile()
    local state = MG.BuildState and MG.BuildState:GetState() or {}
    for _, profile in ipairs(MG.Data and MG.Data.buildProfiles or {}) do
        if (not profile.class or profile.class == state.class) and
           (not profile.specializationID or profile.specializationID == state.specializationID) then
            return profile
        end
    end
    return nil
end

function Talents:Refresh(reason)
    local profile = self:GetProfile()
    local recommendation = nil

    if profile and type(profile.talents) == "table" then
        local level = UnitLevel("player") or 0
        for _, value in ipairs(profile.talents) do
            if tonumber(value.level) and tonumber(value.level) <= level and
               value.spellID then
                local known = false
                if IsSpellKnown then
                    local ok, result = pcall(IsSpellKnown, value.spellID)
                    known = ok and result and true or false
                end
                if not known then
                    recommendation = value
                    break
                end
            end
        end
    end

    self.recommendation = recommendation
    local trainerHints = MG.TrainerAdvisor and MG.TrainerAdvisor:Refresh(reason or "talent_refresh") or {}
    if MG.db then
        MG.db.runtime = MG.db.runtime or {}
        MG.db.runtime.talent = {
            reason = reason,
            profileID = profile and profile.id or nil,
            recommendedSpellID = recommendation and recommendation.spellID or nil,
            confidence = recommendation and "data-backed" or "none",
            automaticSpending = false,
            trainerHints = trainerHints,
        }
    end
    return recommendation
end
