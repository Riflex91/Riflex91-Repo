local addonName, MG = ...

MG.TalentAdvisor = MG.TalentAdvisor or {}
local T = MG.TalentAdvisor

function T:GetProfile()
    local state=MG.BuildState and MG.BuildState:GetState() or {}
    local profiles=MG.RestEDXPTalentProfiles or {}
    for _,profile in ipairs(profiles) do
        if (not profile.class or profile.class==state.class) and
           (not profile.specializationID or
            tonumber(profile.specializationID)==tonumber(state.specializationID)) then
            return profile
        end
    end
    return nil
end

function T:Refresh(reason)
    local profile=self:GetProfile()
    local state=MG.BuildState and MG.BuildState:Refresh(reason or "talent_refresh") or {}
    local recommendation=nil

    if profile and type(profile.talents)=="table" then
        local level=tonumber(state.level) or 0
        for _,entry in ipairs(profile.talents) do
            if tonumber(entry.level) and tonumber(entry.level)<=level and entry.spellID then
                local known=MG.PlayerFacts and MG.PlayerFacts:IsSpellKnown(entry.spellID)
                if known==false then
                    recommendation={
                        spellID=tonumber(entry.spellID),
                        name=entry.name,
                        level=tonumber(entry.level),
                        profileID=profile.id,
                        confidence="data-backed",
                    }
                    break
                end
            end
        end
    end

    self.recommendation=recommendation
    if MG.db then
        MG.db.runtime=MG.db.runtime or {}
        MG.db.runtime.talent={
            reason=reason,
            profileID=profile and profile.id or nil,
            recommendedSpellID=recommendation and recommendation.spellID or nil,
            confidence=recommendation and recommendation.confidence or "none",
            automaticSpending=false,
            source=profile and "RestedXP-compatible local profile" or "no_profile",
        }
    end
    return recommendation
end

function T:GetRecommendation()
    return self.recommendation
end
