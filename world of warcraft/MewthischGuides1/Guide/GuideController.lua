local addonName, MG = ...

MG.GuideController = MG.GuideController or {}
local C = MG.GuideController

function C:CollectRecoveryRelevant(guide)
    local quests, items = {}, {}
    for _, step in ipairs(guide and guide.steps or {}) do
        for _, goal in ipairs(step.goals or {}) do
            if goal.questID then quests[tonumber(goal.questID)] = true end
            for _, questID in ipairs(goal.questIDs or {}) do
                quests[tonumber(questID)] = true
            end
            if goal.itemID then items[tonumber(goal.itemID)] = true end
            for _, itemID in ipairs(goal.itemIDs or {}) do
                items[tonumber(itemID)] = true
            end
        end
        for _, condition in ipairs(step.conditions or {}) do
            if condition.questID then quests[tonumber(condition.questID)] = true end
        end
    end
    return quests, items
end

function C:BuildRecoveryFacts(guide)
    local quests, items = self:CollectRecoveryRelevant(guide)
    return {
        quests=MG.QuestFacts:Snapshot(quests),
        inventory=MG.InventoryFacts and MG.InventoryFacts:Snapshot(items) or {},
        player=MG:GetPlayerProfile(),
    }
end

function C:Start(guide, reason, resume)
    if not guide then return nil, "no_guide" end
    MG:EnsureDB()

    local index = 1
    local recoveryReason = "guide_start"
    if resume ~= false then
        local facts = self:BuildRecoveryFacts(guide)
        index, recoveryReason = MG.RecoveryPolicy:FindResumeIndex(guide, facts)
    end

    MG.db.guide.selectedID = guide.id
    local runtime, err = MG.RuntimeEngine:StartGuide(guide, index)
    if runtime then
        MG:Log("INFO", "guide.recovered", "Guide-Position bestimmt.", {
            guideID=guide.id,
            index=index,
            reason=recoveryReason,
            trigger=reason or "controller",
        })
        if MG.RefreshUI then MG:RefreshUI() end
    end
    return runtime, err
end

function C:StartByQuery(query, reason)
    local guide = MG.GuideCatalog:Find(query)
    if not guide then return nil, "guide_not_found" end
    return self:Start(guide, reason or "query", true)
end

function C:StartSuggested(reason)
    local guide = MG.GuideCatalog:Suggest()
    if not guide then return nil, "no_applicable_guide" end
    return self:Start(guide, reason or "suggested", true)
end

function C:CurrentGuide()
    local runtime = MG.RuntimeStore and MG.RuntimeStore:Get() or nil
    return runtime and runtime.guide or nil
end
