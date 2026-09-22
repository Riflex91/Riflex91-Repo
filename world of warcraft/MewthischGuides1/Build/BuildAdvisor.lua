local addonName, MG = ...

MG.BuildAdvisor = MG.BuildAdvisor or {}
local B = MG.BuildAdvisor

local function spellName(spellID)
    if C_Spell and C_Spell.GetSpellName then
        local ok,value=pcall(C_Spell.GetSpellName,spellID)
        if ok and value then return value end
    end
    if GetSpellInfo then
        local ok,value=pcall(GetSpellInfo,spellID)
        if ok and value then return value end
    end
    return "Spell " .. tostring(spellID)
end

function B:Snapshot(runtime)
    runtime = runtime or (MG.RuntimeStore and MG.RuntimeStore:Get() or nil)
    local guide = runtime and runtime.guide
    local index = runtime and tonumber(runtime.stepIndex) or 1
    local upcoming = {}

    if guide then
        for stepIndex=index,math.min(#(guide.steps or {}),index+40) do
            for _,goal in ipairs(guide.steps[stepIndex].goals or {}) do
                if goal.action=="train" and goal.spellID then
                    upcoming[#upcoming+1]={
                        stepIndex=stepIndex,
                        spellID=goal.spellID,
                        name=spellName(goal.spellID),
                    }
                    if #upcoming>=8 then break end
                end
            end
            if #upcoming>=8 then break end
        end
    end

    local buildState=MG.BuildState and MG.BuildState:Refresh("build_advisor") or {}
    local talent=MG.TalentAdvisor and MG.TalentAdvisor:Refresh("build_advisor") or nil
    local points=buildState.unspentTalentPoints
    return {
        class=buildState.class or MG:GetPlayerProfile().class,
        level=buildState.level or MG:GetPlayerProfile().level,
        specialization=buildState.specialization,
        specializationID=buildState.specializationID,
        role=buildState.role,
        unspentTalentPoints=points,
        talentRecommendation=talent,
        automaticTalentSpending=false,
        upcomingTraining=upcoming,
        source="Importierte Trainingsdaten + Live-Charakterdaten",
    }
end
