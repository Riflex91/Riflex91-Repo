local addonName, MG = ...

MG.SuperTrackPolicy = MG.SuperTrackPolicy or {}
local S = MG.SuperTrackPolicy

function S:Apply(runtime)
    local settings=MG.db and MG.db.settings or {}
    if settings.autoSuperTrack==false then return false,"disabled" end
    if not C_SuperTrack or not C_SuperTrack.SetSuperTrackedQuestID then
        return false,"api_unavailable"
    end
    local goal=runtime and runtime.destinationGoal
    local questID=goal and tonumber(goal.questID)
    if not questID then return false,"no_quest_target" end

    if self.lastQuestID==questID then return true,"unchanged" end
    local ok=pcall(C_SuperTrack.SetSuperTrackedQuestID,questID)
    if not ok then return false,"call_failed" end
    self.lastQuestID=questID
    return true,"tracked"
end
