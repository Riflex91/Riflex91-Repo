local addonName, MG = ...

MG.RewardAdvisor = MG.RewardAdvisor or {}
local Rewards = MG.RewardAdvisor

function Rewards:Refresh()
    local count = 0
    if GetNumQuestChoices then
        local ok, value = pcall(GetNumQuestChoices)
        if ok then count = tonumber(value) or 0 end
    end

    local choices, best = {}, nil
    for index = 1, count do
        local link = nil
        if GetQuestItemLink then
            local ok, value = pcall(GetQuestItemLink, "choice", index)
            if ok then link = value end
        end

        local evaluation = link and MG.GearAdvisor and MG.GearAdvisor:EvaluateItemLink(link) or nil
        local choice = {
            index = index,
            link = link,
            evaluation = evaluation,
        }
        choices[#choices + 1] = choice

        if evaluation and evaluation.upgrade and
           (not best or evaluation.score > best.evaluation.score) then
            best = choice
        end
    end

    self.choices = choices
    self.recommendation = best

    if MG.db then
        MG.db.runtime = MG.db.runtime or {}
        MG.db.runtime.reward = {
            choices = count,
            recommendedIndex = best and best.index or nil,
            recommendedItemID = best and best.evaluation and best.evaluation.itemID or nil,
            confidence = best and best.evaluation and best.evaluation.confidence or nil,
            autoSelection = false,
        }
    end

    return best
end

function Rewards:GetRecommendation()
    return self.recommendation
end
