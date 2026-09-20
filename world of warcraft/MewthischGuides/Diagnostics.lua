local addonName, MG = ...

MG.Diagnostics = MG.Diagnostics or {}
local D = MG.Diagnostics

function D:Collect()
    local validation = MG.Validation and MG.Validation:GetStatus() or {}
    local quests = MG.QuestTracking and MG.QuestTracking:GetStatus() or {}
    local route = MG.RouteEngine and MG.RouteEngine:GetStatus() or {}
    local build = MG.BuildState and MG.BuildState:GetState() or {}
    local reward = MG.db and MG.db.runtime and MG.db.runtime.reward or {}
    local travel = MG.db and MG.db.runtime and MG.db.runtime.travelGraph or {}
    local inventory = MG.db and MG.db.runtime and MG.db.runtime.inventory or {}
    local gear = MG.db and MG.db.runtime and MG.db.runtime.gear or {}
    local talent = MG.db and MG.db.runtime and MG.db.runtime.talent or {}

    local report = {
        version = MG.VERSION,
        guideID = MG:GetActiveGuideDefinition() and MG:GetActiveGuideDefinition().id or nil,
        validation = validation,
        quests = quests,
        route = route,
        build = build,
        travel = travel,
        inventory = inventory,
        gear = gear,
        reward = reward,
        talent = talent,
    }

    if MG.db then
        MG.db.runtime = MG.db.runtime or {}
        MG.db.runtime.diagnostics = report
    end
    return report
end

function D:Print()
    local r = self:Collect()
    print("|cff62d6ffMewthisch Guides|r Diagnose v" .. tostring(r.version))
    print(" Guide=" .. tostring(r.guideID or "-") ..
        " Validation=" .. tostring(r.validation.valid) ..
        " Quests=" .. tostring(r.quests.activeQuests or 0))
    print(" Route=" .. tostring(r.route.source or "-") ..
        " TravelNodes=" .. tostring(r.travel.nodes or 0) ..
        " BagItems=" .. tostring(r.inventory.bagItems or 0))
    print(" Gear=" .. tostring(r.gear.recommendedItemID or "-") ..
        " Talent=" .. tostring(r.talent.recommendedSpellID or "-") ..
        " Reward=" .. tostring(r.reward.recommendedItemID or "-"))
end
