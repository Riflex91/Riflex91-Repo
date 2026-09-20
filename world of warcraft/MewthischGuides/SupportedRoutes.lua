local addonName, MG = ...

MG.SupportedRoutes = MG.SupportedRoutes or {}
local Routes = MG.SupportedRoutes

Routes.sourceCommit = "a688a75d595f5884dba8044a5ba4e7d7bd859c09"
Routes.specs = {
    { sourceFile = "Guides/Forever/RestedXP-Skyborne.lua", title = "1-14 Zephras Isle", categories = { "horde", "ally" } },

    { sourceFile = "Guides/forever/Alliance-1-10_NightElf.lua", title = "1-6 Shadowglen", categories = { "ally" } },
    { sourceFile = "Guides/forever/Alliance-1-10_NightElf.lua", title = "6-11 Teldrassil", categories = { "ally" } },

    { sourceFile = "Guides/forever/Alliance-1-13_Human.lua", title = "1-6 Northshire", categories = { "ally" } },
    { sourceFile = "Guides/forever/Alliance-1-13_Human.lua", title = "6-11 Elwynn Forest", categories = { "ally" } },
    { sourceFile = "Guides/forever/Alliance-1-13_Human.lua", title = "11-13 Loch Modan", categories = { "ally" } },

    { sourceFile = "Guides/forever/Alliance-1-14_DwarfGnome.lua", title = "1-6 Coldridge Valley", categories = { "ally" } },
    { sourceFile = "Guides/forever/Alliance-1-14_DwarfGnome.lua", title = "6-11 Dun Morogh", categories = { "ally" } },
    { sourceFile = "Guides/forever/Alliance-1-14_DwarfGnome.lua", title = "11-12 Voidwalker Quest", categories = { "ally" } },
    { sourceFile = "Guides/forever/Alliance-1-14_DwarfGnome.lua", title = "11-12 Elwynn (Dwarf/Gnome)", categories = { "ally" } },
    { sourceFile = "Guides/forever/Alliance-1-14_DwarfGnome.lua", title = "12-14 Loch Modan (Dwarf/Gnome)", categories = { "ally" } },
    { sourceFile = "Guides/forever/Alliance-1-14_DwarfGnome.lua", title = "6-11 Dun Morogh (Hunter)", categories = { "ally" } },
    { sourceFile = "Guides/forever/Alliance-1-14_DwarfGnome.lua", title = "11-13 Loch Modan (Hunter)", categories = { "ally" } },

    { sourceFile = "Guides/forever/Alliance-11-20.lua", title = "13-15 Westfall", categories = { "ally" } },
    { sourceFile = "Guides/forever/Alliance-11-20.lua", title = "14-16 Darkshore", categories = { "ally" } },
    { sourceFile = "Guides/forever/Alliance-11-20.lua", title = "16-19 Darkshore", categories = { "ally" } },
    { sourceFile = "Guides/forever/Alliance-11-20.lua", title = "19-20 Redridge", categories = { "ally" } },
    { sourceFile = "Guides/forever/Alliance-11-20.lua", title = "19-21 Darkshore/Ashenvale", categories = { "ally" } },
    { sourceFile = "Guides/forever/Alliance-11-20.lua", title = "20-21 Darkshore/Ashenvale", categories = { "ally" } },

    { sourceFile = "Guides/forever/Horde-01-12_Durotar.lua", title = "1-6 Durotar", categories = { "horde" } },
    { sourceFile = "Guides/forever/Horde-01-12_Durotar.lua", title = "6-10 Durotar", categories = { "horde" } },
    { sourceFile = "Guides/forever/Horde-01-12_Durotar.lua", title = "10-12 Durotar", categories = { "horde" } },
    { sourceFile = "Guides/forever/Horde-01-12_Durotar.lua", title = "10-12 Tirisfal", categories = { "horde" } },
    { sourceFile = "Guides/forever/Horde-01-12_Durotar.lua", title = "1-7 Durotar", categories = { "horde" } },
    { sourceFile = "Guides/forever/Horde-01-12_Durotar.lua", title = "7-13 Durotar", categories = { "horde" } },

    { sourceFile = "Guides/forever/Horde-01-14_Undead.lua", title = "1-6 Tirisfal Glades", categories = { "horde" } },
    { sourceFile = "Guides/forever/Horde-01-14_Undead.lua", title = "6-11 Tirisfal Glades", categories = { "horde" } },
    { sourceFile = "Guides/forever/Horde-01-14_Undead.lua", title = "12-14 Silverpine Forest", categories = { "horde" } },

    { sourceFile = "Guides/forever/Horde-1-12_Mulgore.lua", title = "1-6 Mulgore", categories = { "horde" } },
    { sourceFile = "Guides/forever/Horde-1-12_Mulgore.lua", title = "6-12 Mulgore", categories = { "horde" } },
    { sourceFile = "Guides/forever/Horde-1-12_Mulgore.lua", title = "1-7 Mulgore", categories = { "horde" } },
    { sourceFile = "Guides/forever/Horde-1-12_Mulgore.lua", title = "7-13 Mulgore", categories = { "horde" } },

    { sourceFile = "Guides/forever/Horde-12-22_Barrens.lua", title = "12-17 The Barrens", categories = { "horde" } },
    { sourceFile = "Guides/forever/Horde-12-22_Barrens.lua", title = "17-22 Stonetalon/Barrens/Ashenvale", categories = { "horde" } },
    { sourceFile = "Guides/forever/Horde-12-22_Barrens.lua", title = "13-20 The Barrens", categories = { "horde" } },
    { sourceFile = "Guides/forever/Horde-12-22_Barrens.lua", title = "20-24 Stonetalon/Barrens", categories = { "horde" } },

    { sourceFile = "Guides/forever/Alliance-Mage-1-12.lua", title = "1-10 Elwynn Forest Mage AoE", categories = { "mage" } },
    { sourceFile = "Guides/forever/Alliance-Mage-1-12.lua", title = "1-10 Dun Morogh Mage AoE", categories = { "mage" } },
    { sourceFile = "Guides/forever/Alliance-Mage-1-12.lua", title = "10-12 Loch Modan Mage AoE", categories = { "mage" } },
    { sourceFile = "Guides/forever/Alliance-Mage-12-21.lua", title = "12-18 Darkshore Mage AoE", categories = { "mage" } },
    { sourceFile = "Guides/forever/Alliance-Mage-12-21.lua", title = "18-21 Redridge Mage AoE", categories = { "mage" } },

    { sourceFile = "Guides/forever/Horde-Mage-12-21.lua", title = "12-17 The Barrens AoE", categories = { "mage" } },
    { sourceFile = "Guides/forever/Horde-Mage-12-21.lua", title = "17-21 Stonetalon/Barrens AoE", categories = { "mage" } },
}

local function key(sourceFile, title)
    return tostring(sourceFile or "") .. "\031" .. tostring(title or "")
end

local function hasCategory(spec, category)
    for _, value in ipairs(spec.categories or {}) do
        if value == category then return true end
    end
    return false
end

function Routes:Validate(guides, sourceCommit)
    local byKey = {}
    for _, guide in ipairs(guides or {}) do
        local k = key(guide.sourceFile, guide.title)
        byKey[k] = byKey[k] or {}
        byKey[k][#byKey[k] + 1] = guide
    end

    self.guideToSpec = {}
    self.available = { horde = {}, ally = {}, mage = {} }
    local missing, duplicates = {}, {}

    for _, spec in ipairs(self.specs) do
        local matches = byKey[key(spec.sourceFile, spec.title)] or {}
        if #matches == 1 then
            local guide = matches[1]
            self.guideToSpec[guide.id] = spec
            for _, category in ipairs(spec.categories or {}) do
                self.available[category][#self.available[category] + 1] = guide
            end
        elseif #matches == 0 then
            missing[#missing + 1] = {
                sourceFile = spec.sourceFile,
                title = spec.title,
            }
        else
            duplicates[#duplicates + 1] = {
                sourceFile = spec.sourceFile,
                title = spec.title,
                count = #matches,
            }
        end
    end

    local function sortGuides(a, b)
        local amin, bmin = tonumber(a.minLevel) or 999, tonumber(b.minLevel) or 999
        if amin ~= bmin then return amin < bmin end
        local amax, bmax = tonumber(a.maxLevel) or 999, tonumber(b.maxLevel) or 999
        if amax ~= bmax then return amax < bmax end
        return tostring(a.title or "") < tostring(b.title or "")
    end

    for _, list in pairs(self.available) do table.sort(list, sortGuides) end

    local commitMatch = tostring(sourceCommit or "") == self.sourceCommit
    self.status = {
        ready = commitMatch and #missing == 0 and #duplicates == 0,
        expectedSourceCommit = self.sourceCommit,
        actualSourceCommit = sourceCommit,
        commitMatch = commitMatch,
        requiredRoutes = #self.specs,
        resolvedRoutes = #self.specs - #missing - #duplicates,
        missing = missing,
        duplicates = duplicates,
    }

    return self.status
end

function Routes:GetStatus()
    return self.status or {
        ready = false,
        expectedSourceCommit = self.sourceCommit,
        requiredRoutes = #self.specs,
        resolvedRoutes = 0,
        missing = {},
        duplicates = {},
    }
end

function Routes:IsSupportedGuide(guide)
    return guide and self.guideToSpec and self.guideToSpec[guide.id] ~= nil
end

function Routes:GetGuides(category)
    return self.available and self.available[category] or {}
end

function Routes:GetSpec(guide)
    return guide and self.guideToSpec and self.guideToSpec[guide.id] or nil
end

function Routes:HasCategory(guide, category)
    local spec = self:GetSpec(guide)
    return spec and hasCategory(spec, category) or false
end
