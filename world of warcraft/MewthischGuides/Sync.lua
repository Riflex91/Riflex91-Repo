local addonName, MG = ...

MG.Sync = MG.Sync or {}
local Sync = MG.Sync

function Sync:Full(reason)
    reason = reason or "full"

    if MG.DataLoader then MG.DataLoader:SelectActiveGuide() end
    if MG.QuestTracking then MG.QuestTracking:Refresh(reason) end
    if MG.Inventory then MG.Inventory:Refresh(reason) end
    if MG.BuildState then MG.BuildState:Refresh(reason) end
    if MG.TalentAdvisor then MG.TalentAdvisor:Refresh(reason) end
    if MG.GearAdvisor then MG.GearAdvisor:Refresh(reason) end
    if MG.State then MG.State:Refresh(reason) end
    if MG.Diagnostics then MG.Diagnostics:Collect() end
    if MG.Telemetry then MG.Telemetry:Count("sync.full", { reason = reason }) end

    if MG.db then
        MG.db.runtime = MG.db.runtime or {}
        MG.db.runtime.sync = {
            reason = reason,
            at = time and time() or 0,
            full = true,
        }
    end
end

function Sync:Quest(reason)
    if MG.QuestTracking then MG.QuestTracking:Refresh(reason or "quest") end
    if MG.State then MG.State:Refresh(reason or "quest") end
    if MG.Telemetry then MG.Telemetry:Count("sync.quest", { reason = reason }) end
end

function Sync:Inventory(reason)
    if MG.Inventory then MG.Inventory:Refresh(reason or "inventory") end
    if MG.GearAdvisor then MG.GearAdvisor:Refresh(reason or "inventory") end
    if MG.Telemetry then MG.Telemetry:Count("sync.inventory", { reason = reason }) end
end

function Sync:Build(reason)
    if MG.BuildState then MG.BuildState:Refresh(reason or "build") end
    if MG.TalentAdvisor then MG.TalentAdvisor:Refresh(reason or "build") end
    if MG.Telemetry then MG.Telemetry:Count("sync.build", { reason = reason }) end
end
