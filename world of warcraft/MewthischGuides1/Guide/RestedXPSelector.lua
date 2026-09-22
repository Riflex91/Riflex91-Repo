local addonName, MG = ...

MG.RestedXPSelector = MG.RestedXPSelector or {}
local S = MG.RestedXPSelector

local RACES = {
    orc="Orc", troll="Troll", tauren="Tauren", undead="Scourge", scourge="Scourge",
    human="Human", dwarf="Dwarf", gnome="Gnome", nightelf="NightElf",
    ["night elf"]="NightElf", skyborne="Skyborne",
}
local CLASSES = {
    warrior="WARRIOR", paladin="PALADIN", hunter="HUNTER", rogue="ROGUE",
    priest="PRIEST", shaman="SHAMAN", mage="MAGE", warlock="WARLOCK", druid="DRUID",
}

local function normalizeAtom(value)
    value = MG.Util:Trim(value)
    return string.lower(value)
end

local function atomMatches(atom, profile, settings)
    atom = MG.Util:Trim(atom)
    if atom == "" then return true, "empty" end
    local negative = string.sub(atom, 1, 1) == "!"
    if negative then atom = string.sub(atom, 2) end

    local lower = normalizeAtom(atom)
    local matched
    if lower == "skip" then
        matched = false
    elseif lower == "sod" then
        matched = false
    elseif lower == "era" then
        matched = true
    elseif lower == "som" then
        matched = settings.routeSoMMode and true or false
    elseif lower == "ssf" then
        matched = false
    elseif RACES[lower] then
        matched = tostring(profile.race or "") == RACES[lower]
    elseif CLASSES[lower] then
        matched = tostring(profile.class or "") == CLASSES[lower]
    elseif lower == "horde" or lower == "alliance" then
        matched = string.lower(tostring(profile.faction or "")) == lower
    else
        return false, "unknown_selector_atom:" .. tostring(atom)
    end

    if negative then matched = not matched end
    return matched, matched and "matched" or "not_matched"
end

function S:Matches(selector, profile)
    selector = MG.Util:Trim(selector)
    selector = selector:gsub("^<<%s*", "")
    selector = selector:gsub("%s+%-%-.*$", "")
    selector = selector:gsub("%s+#.*$", "")
    selector = MG.Util:Trim(selector)
    if selector == "" then return true, "no_selector" end

    profile = profile or MG:GetPlayerProfile()
    local settings = MG.db and MG.db.settings or {}
    local unknown = nil

    for branch in string.gmatch(selector, "[^/]+") do
        local branchMatches, sawAtom = true, false
        for atom in string.gmatch(MG.Util:Trim(branch), "%S+") do
            sawAtom = true
            local matched, reason = atomMatches(atom, profile, settings)
            if not matched then
                branchMatches = false
                if string.find(reason, "unknown_selector_atom:", 1, true) then
                    unknown = reason
                end
                break
            end
        end
        if sawAtom and branchMatches then return true, "selector_matched" end
    end

    return false, unknown or "selector_not_matched"
end

local function numberCompare(op, left, right)
    if not op or right == nil then return true end
    if op == "<" then return left < right end
    if op == ">" then return left > right end
    if op == "<=" then return left <= right end
    if op == ">=" then return left >= right end
    if op == "=" or op == "==" then return left == right end
    return false
end

local function phaseMatches(value, phase)
    value = MG.Util:Trim(value)
    local a, b = value:match("^(%d+)%s*%-%s*(%d+)$")
    if a then
        return phase >= tonumber(a) and phase <= tonumber(b)
    end
    local exact = tonumber(value)
    if exact then return phase == exact end
    return true
end

function S:TagsMatch(tags, profile)
    profile = profile or MG:GetPlayerProfile()
    local settings = MG.db and MG.db.settings or {}
    local season = tonumber(settings.guideSeason) or 0
    local xpRate = 1
    local hardcore = false
    local phase = 6
    local level = tonumber(profile.level) or 1

    for _, tag in ipairs(tags or {}) do
        local name = string.lower(tostring(tag.name or ""))
        name = name:gsub("%-%-xpgate$", "")
        local value, conditionalSelector = MG.Util:SplitCondition(tag.value)

        if conditionalSelector and conditionalSelector ~= "" then
            local conditional = self:Matches(conditionalSelector, profile)
            if not conditional then
                -- Tag is scoped to a different class/race and therefore does
                -- not constrain this player.
                name = ""
            end
        end

        if name == "hardcore" and not hardcore then
            return false, "hardcore"
        elseif (name == "softcore" or name == "sofcore") and hardcore then
            return false, "softcore"
        elseif name == "hardcoreserver" and not hardcore then
            return false, "hardcore_server"
        elseif name == "softcoreserver" and hardcore then
            return false, "softcore_server"
        elseif name == "som" and not settings.routeSoMMode then
            return false, "som"
        elseif name == "ssf" then
            return false, "ssf"
        elseif name == "ah" and settings.allowAuctionHouse == false then
            return false, "auction_house_disabled"
        elseif name == "season" then
            local accepted = false
            for number in string.gmatch(value or "", "%d+") do
                if tonumber(number) == season then accepted = true break end
            end
            if not accepted then return false, "season" end
        elseif name == "xprate" then
            local op, amount = tostring(value or ""):match("^%s*([<>]=?)%s*([%d%.]+)")
            amount = tonumber(amount)
            if op and amount and not numberCompare(op, xpRate, amount) then
                return false, "xprate"
            end
        elseif name == "phase" then
            if not phaseMatches(value or "", phase) then return false, "phase" end
        elseif name == "level" then
            local op, amount = tostring(value or ""):match("^%s*([<>]=?)%s*(%d+)")
            if not amount then
                amount = tonumber(tostring(value or ""):match("(%d+)"))
                op = ">="
            end
            if amount and not numberCompare(op, level, tonumber(amount)) then
                return false, "level"
            end
        end
        -- Structural tags (completewith, label, requires, loop, sticky,
        -- optional, arrowtext, map, hidewindow) intentionally do not filter.
    end
    return true, "tags_matched"
end
