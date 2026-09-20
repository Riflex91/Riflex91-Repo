local addonName, MG = ...

MG.State = MG.State or {}
local State = MG.State

function State:Refresh(reason)
    local quests = MG.QuestTracking and MG.QuestTracking:GetSnapshot() or {}
    local activeQuestCount = 0
    for _ in pairs(quests) do activeQuestCount = activeQuestCount + 1 end

    self.current = {
        reason = reason,
        updatedAt = time and time() or 0,
        profile = MG:GetPlayerProfile(),
        position = MG:GetPosition(),
        activeQuestCount = activeQuestCount,
        build = MG.BuildState and MG.BuildState:GetState() or nil,
        activeGuideID = MG:GetActiveGuideDefinition() and MG:GetActiveGuideDefinition().id or nil,
    }

    if MG.db then
        MG.db.runtime = MG.db.runtime or {}
        MG.db.runtime.state = self.current
    end
    return self.current
end

function State:Get()
    return self.current or self:Refresh("lazy")
end
