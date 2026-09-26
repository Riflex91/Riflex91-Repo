local addonName, MG = ...

local function settings() return MG.db and MG.db.settings or {} end

MG.ProgressPolicy=MG.ProgressPolicy or {}
function MG.ProgressPolicy:SkipObsolete() return settings().skipObsoleteSteps~=false end

MG.VisibilityPolicy=MG.VisibilityPolicy or {}
function MG.VisibilityPolicy:ShowCompletedGoals() return settings().showCompletedGoals==true end

MG.WaypointPolicy=MG.WaypointPolicy or {}
function MG.WaypointPolicy:WorldMapMarkerEnabled() return settings().showWorldMapMarker~=false end
function MG.WaypointPolicy:AutoSuperTrackEnabled() return settings().autoSuperTrack~=false end

MG.TravelPolicy=MG.TravelPolicy or {}
function MG.TravelPolicy:Use(method)
    local s=settings()
    if method=="flight" then return s.travelUseFlightPaths~=false end
    if method=="hearth" then return s.travelUseHearthstone~=false end
    if method=="transport" then return s.travelUseTransports~=false end
    if method=="class" then return s.travelUseClassTeleports~=false end
    return true
end
function MG.TravelPolicy:PreferFastest() return settings().travelPreferFastest~=false end

MG.AutomationPolicy=MG.AutomationPolicy or {}
function MG.AutomationPolicy:Allows(action,questID)
    local s=settings()
    if action=="accept" and not s.autoAcceptQuests then return false,"disabled" end
    if (action=="turnin" or action=="complete" or action=="gossip") and not s.autoTurnInQuests then return false,"disabled" end
    local scope=tostring(s.automationScope or "all_quests")
    if scope=="all_quests" or not questID then return true,"all_quests" end
    local step=MG.runtimeState and MG.runtimeState.currentStep
    if step and tonumber(step.questID)==tonumber(questID) then return true,"current_step" end
    return false,"outside_current_step"
end

MG.GearPolicy=MG.GearPolicy or {}
function MG.GearPolicy:AutoEquipEnabled() return settings().gearAutoEquip==true end
function MG.GearPolicy:WeaponsEnabled() return settings().gearAutoEquipWeapons==true end

MG.RecommendationPolicy=MG.RecommendationPolicy or {}
function MG.RecommendationPolicy:Score(guide,profile)
    return MG.GuideRegistry and MG.GuideRegistry.RecommendedScore and MG.GuideRegistry:RecommendedScore(guide,profile) or 0
end
