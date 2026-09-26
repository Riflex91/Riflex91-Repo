local addonName, MGR = ...

local function call(fn, ...)
    if type(fn) ~= "function" then return nil end
    local ok, a, b, c, d, e, f, g, h = pcall(fn, ...)
    if not ok then return nil end
    return a, b, c, d, e, f, g, h
end

local function currentQuestID()
    local questID = call(GetQuestID)
    if questID and questID ~= 0 then return questID end
    return nil
end

local function questItems(kind)
    local count
    if kind == "reward" then
        count = call(GetNumQuestRewards)
    elseif kind == "choice" then
        count = call(GetNumQuestChoices)
    else
        return {}
    end

    local items = {}
    for index = 1, tonumber(count) or 0 do
        local name, texture, quantity, quality, isUsable, itemID, itemLevel =
            call(GetQuestItemInfo, kind, index)

        local link = call(GetQuestItemLink, kind, index)
        items[#items + 1] = {
            index = index,
            itemID = itemID,
            name = name,
            itemLink = link,
            quantity = quantity,
            quality = quality,
            isUsable = isUsable,
            itemLevel = itemLevel,
            texture = texture,
        }
    end
    return items
end

local function currencies()
    local result = {}
    local count = call(GetNumQuestLogRewardCurrencies) or 0

    for index = 1, count do
        local currencyInfo = C_QuestLog and C_QuestLog.GetQuestRewardCurrencyInfo
            and call(C_QuestLog.GetQuestRewardCurrencyInfo, index)
            or nil

        if currencyInfo then
            result[#result + 1] = currencyInfo
        end
    end

    return result
end

local function snapshot(stage)
    local questID = currentQuestID()
    local data = {
        stage = stage,
        title = call(GetTitleText),
        questText = call(GetQuestText),
        objectiveText = call(GetObjectiveText),
        progressText = call(GetProgressText),
        rewardText = call(GetRewardText),
        npc = MGR:GetNpc(),
        position = MGR:GetPosition(),
        rewards = questItems("reward"),
        choices = questItems("choice"),
        currencies = currencies(),
    }

    if questID and C_QuestLog then
        if C_QuestLog.GetQuestObjectives then
            data.objectives = call(C_QuestLog.GetQuestObjectives, questID)
        end
        if C_QuestLog.GetQuestInfo then
            data.questInfo = call(C_QuestLog.GetQuestInfo, questID)
        end
        if C_QuestLog.GetQuestTagInfo then
            data.questTagInfo = call(C_QuestLog.GetQuestTagInfo, questID)
        end
    end

    MGR:Record("quest.dialog", questID, data, "gameplay-api")
end

local frame = CreateFrame("Frame")
for _, event in ipairs({
    "QUEST_DETAIL",
    "QUEST_PROGRESS",
    "QUEST_COMPLETE",
}) do
    frame:RegisterEvent(event)
end

frame:SetScript("OnEvent", function(_, event)
    snapshot(event)
end)
