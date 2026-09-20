local addonName, MG = ...

MG.GuideParser = MG.GuideParser or {}
local Parser = MG.GuideParser

local function copyTable(value)
    if type(value) ~= "table" then return value end
    local out = {}
    for key, child in pairs(value) do out[key] = copyTable(child) end
    return out
end

function Parser:NormalizeGuide(input)
    if type(input) ~= "table" then return nil, "guide_not_table" end

    local guide = copyTable(input)
    guide.id = tostring(guide.id or "")
    guide.title = tostring(guide.title or guide.id)
    guide.verification = tostring(guide.verification or "UNVERIFIED")
    guide.steps = guide.steps or {}

    for index, step in ipairs(guide.steps) do
        step.order = tonumber(step.order) or (index * 10)
        step.questID = tonumber(step.questID)
        step.title = step.title and tostring(step.title) or nil
        step.verification = tostring(step.verification or guide.verification)
        step.guideID = guide.id
    end

    table.sort(guide.steps, function(a, b)
        if (a.order or 0) == (b.order or 0) then
            return tostring(a.id or "") < tostring(b.id or "")
        end
        return (a.order or 0) < (b.order or 0)
    end)

    return guide
end

function Parser:ParseMany(inputs)
    local guides, rejected = {}, {}

    for index, input in ipairs(inputs or {}) do
        local guide, reason = self:NormalizeGuide(input)
        if guide then
            guides[#guides + 1] = guide
        else
            rejected[#rejected + 1] = { index = index, reason = reason }
        end
    end

    return guides, rejected
end
