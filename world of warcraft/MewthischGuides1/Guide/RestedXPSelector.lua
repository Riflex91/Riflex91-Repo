local addonName, MG = ...

MG.RestedXPSelector = MG.RestedXPSelector or {}
local S = MG.RestedXPSelector

local RACES = {
    Orc="Orc", Troll="Troll", Tauren="Tauren", Undead="Scourge", Scourge="Scourge",
    Human="Human", Dwarf="Dwarf", Gnome="Gnome", NightElf="NightElf",
    ["Night Elf"]="NightElf", Skyborne="Skyborne",
}
local CLASSES = {
    Warrior="WARRIOR", Paladin="PALADIN", Hunter="HUNTER", Rogue="ROGUE",
    Priest="PRIEST", Shaman="SHAMAN", Mage="MAGE", Warlock="WARLOCK", Druid="DRUID",
}

local function atomMatches(atom, profile, settings)
    atom = MG.Util:Trim(atom)
    if atom == "" then return true, "empty" end
    local negative = string.sub(atom, 1, 1) == "!"
    if negative then atom = string.sub(atom, 2) end

    local lower = string.lower(atom)
    local matched
    if lower == "skip" then
        matched = false
    elseif lower == "sod" then
        matched = settings.rxpSoDMode and true or false
    elseif RACES[atom] then
        matched = tostring(profile.race or "") == RACES[atom]
    elseif CLASSES[atom] then
        matched = tostring(profile.class or "") == CLASSES[atom]
    elseif atom == "Horde" or atom == "Alliance" then
        matched = tostring(profile.faction or "") == atom
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
                if string.find(reason, "unknown_selector_atom:", 1, true) then unknown = reason end
                break
            end
        end
        if sawAtom and branchMatches then return true, "selector_matched" end
    end

    return false, unknown or "selector_not_matched"
end

function S:TagsMatch(tags, profile)
    local settings = MG.db and MG.db.settings or {}
    local season = tonumber(settings.rxpSeason) or 0
    local xpRate = tonumber(settings.rxpRate) or 1
    local hardcore = settings.rxpHardcoreMode and true or false

    for _, tag in ipairs(tags or {}) do
        local value, conditionalSelector = MG.Util:SplitCondition(tag.value)
        if conditionalSelector and conditionalSelector ~= "" then
            local conditional = self:Matches(conditionalSelector, profile)
            if not conditional then
                -- The tag itself does not apply to this profile.
            elseif tag.name == "hardcore" and not hardcore then
                return false, "hardcore"
            elseif tag.name == "softcore" and hardcore then
                return false, "softcore"
            end
        elseif tag.name == "hardcore" and not hardcore then
            return false, "hardcore"
        elseif tag.name == "softcore" and hardcore then
            return false, "softcore"
        elseif tag.name == "season" then
            local accepted = false
            for number in string.gmatch(value or "", "%d+") do
                if tonumber(number) == season then accepted = true break end
            end
            if not accepted then return false, "season" end
        elseif tag.name == "xprate" then
            local op, amount = tostring(value or ""):match("^%s*([<>]=?)%s*([%d%.]+)")
            amount = tonumber(amount)
            if op and amount then
                if op == "<" and not (xpRate < amount) then return false, "xprate" end
                if op == ">" and not (xpRate > amount) then return false, "xprate" end
                if op == "<=" and not (xpRate <= amount) then return false, "xprate" end
                if op == ">=" and not (xpRate >= amount) then return false, "xprate" end
            end
        end
    end
    return true, "tags_matched"
end
