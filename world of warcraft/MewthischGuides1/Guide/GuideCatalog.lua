local addonName, MG = ...

MG.GuideCatalog = MG.GuideCatalog or {}
local C = MG.GuideCatalog

local function metadataTags(metadata)
    local tags = {}
    for _, key in ipairs({"hardcore","softcore","season","xprate"}) do
        local value = metadata and metadata[key]
        if value ~= nil then
            if type(value) == "table" then
                for _, child in ipairs(value) do tags[#tags + 1] = {name=key,value=child} end
            else
                tags[#tags + 1] = {name=key,value=value}
            end
        end
    end
    return tags
end

function C:Load(force)
    self.guides = MG.GuideCompiler:CompileAll(force)
    return self.guides
end

function C:IsApplicable(guide, profile)
    profile = profile or MG:GetPlayerProfile()
    if not guide then return false, "missing_guide" end

    local selectorOk, selectorReason = MG.RestedXPSelector:Matches(
        guide.selector or "", profile)
    if not selectorOk then return false, selectorReason end

    local tagsOk, tagsReason = MG.RestedXPSelector:TagsMatch(
        metadataTags(guide.metadata), profile)
    if not tagsOk then return false, tagsReason end

    local level = tonumber(profile.level) or 1
    if guide.minLevel and level < guide.minLevel then return false, "level_low" end
    if guide.maxLevel and level > guide.maxLevel + 2 then return false, "level_high" end

    return true, "applicable"
end

function C:Score(guide, profile)
    profile = profile or MG:GetPlayerProfile()
    local ok = self:IsApplicable(guide, profile)
    if not ok then return -100000 end
    local score = 0
    local level = tonumber(profile.level) or 1
    if guide.minLevel and guide.maxLevel and level >= guide.minLevel and level <= guide.maxLevel then
        score = score + 1000
    elseif guide.minLevel then
        score = score - math.abs(level - guide.minLevel) * 10
    end

    local defaultFor = tostring(guide.defaultFor or "")
    if defaultFor ~= "" and defaultFor ~= "none" then
        local matched = MG.RestedXPSelector:Matches(defaultFor, profile)
        if matched then score = score + 250 end
    end

    local group = tostring(guide.group or "")
    local hardcore = MG.db and MG.db.settings and MG.db.settings.rxpHardcoreMode
    if string.find(group, "Forever Guide", 1, true) then score = score + (hardcore and 10 or 100) end
    if string.find(group, "Survival Guide", 1, true) then score = score + (hardcore and 200 or -50) end
    return score
end

function C:ListApplicable(profile)
    local out = {}
    for _, guide in ipairs(self:Load()) do
        if self:IsApplicable(guide, profile) then out[#out + 1] = guide end
    end
    table.sort(out, function(a,b)
        local sa, sb = C:Score(a, profile), C:Score(b, profile)
        if sa ~= sb then return sa > sb end
        return tostring(a.title) < tostring(b.title)
    end)
    return out
end

function C:Suggest(profile)
    return self:ListApplicable(profile)[1]
end
