local addonName, MG = ...

MG.PlayerFacts = MG.PlayerFacts or {}
local P = MG.PlayerFacts

local function safe(fn, ...)
    if type(fn) ~= "function" then return nil end
    local ok, a, b, c, d, e, f, g, h, i, j = pcall(fn, ...)
    if not ok then return nil end
    return a, b, c, d, e, f, g, h, i, j
end

local function lower(value)
    return string.lower(tostring(value or ""))
end

function P:GetSkill(name)
    name = lower(name)
    if name == "" or not GetNumSkillLines or not GetSkillLineInfo then return nil end
    local count = safe(GetNumSkillLines)
    for index = 1, tonumber(count) or 0 do
        local skillName, isHeader, _, rank, _, modifier, maxRank =
            safe(GetSkillLineInfo, index)
        if skillName and not isHeader and lower(skillName) == name then
            return {
                name=skillName,
                rank=tonumber(rank) or 0,
                modifier=tonumber(modifier) or 0,
                effective=(tonumber(rank) or 0) + (tonumber(modifier) or 0),
                maxRank=tonumber(maxRank),
            }
        end
    end
    return nil
end

function P:GetReputation(factionID)
    factionID = tonumber(factionID)
    if not factionID then return nil end

    if C_Reputation and C_Reputation.GetFactionDataByID then
        local data = safe(C_Reputation.GetFactionDataByID, factionID)
        if type(data) == "table" then
            return {
                factionID=factionID,
                name=data.name,
                reaction=tonumber(data.reaction),
                currentStanding=tonumber(data.currentStanding),
                currentReactionThreshold=tonumber(data.currentReactionThreshold),
                nextReactionThreshold=tonumber(data.nextReactionThreshold),
            }
        end
    end

    if GetFactionInfoByID then
        local name, _, standingID, barMin, barMax, barValue =
            safe(GetFactionInfoByID, factionID)
        if name then
            return {
                factionID=factionID,
                name=name,
                reaction=tonumber(standingID),
                currentStanding=tonumber(barValue),
                currentReactionThreshold=tonumber(barMin),
                nextReactionThreshold=tonumber(barMax),
            }
        end
    end
    return nil
end

function P:HasAura(spellID)
    spellID = math.abs(tonumber(spellID) or 0)
    if spellID == 0 then return nil end

    if AuraUtil and AuraUtil.FindAuraBySpellID then
        local name = safe(AuraUtil.FindAuraBySpellID, spellID, "player")
        if name then return true end
    end

    if UnitAura then
        for index = 1, 80 do
            local name, _, _, _, _, _, _, _, _, auraSpellID =
                safe(UnitAura, "player", index)
            if not name then break end
            if tonumber(auraSpellID) == spellID then return true end
        end
        return false
    end
    return nil
end

function P:IsSpellKnown(spellID)
    spellID = tonumber(spellID)
    if not spellID then return nil end
    if C_SpellBook and C_SpellBook.IsSpellKnown then
        local value = safe(C_SpellBook.IsSpellKnown, spellID)
        if value ~= nil then return value and true or false end
    end
    if IsSpellKnown then
        local value = safe(IsSpellKnown, spellID)
        if value ~= nil then return value and true or false end
    end
    return nil
end

function P:GetEquippedItem(slot)
    slot = tonumber(slot)
    if not slot then return nil end
    local itemID = GetInventoryItemID and safe(GetInventoryItemID, "player", slot) or nil
    return tonumber(itemID)
end

function P:GetTalentPoints()
    if GetUnspentTalentPoints then
        local value = safe(GetUnspentTalentPoints)
        if tonumber(value) then return tonumber(value) end
    end
    if UnitCharacterPoints then
        local value = safe(UnitCharacterPoints, "player")
        if tonumber(value) then return tonumber(value) end
    end
    return nil
end

function P:Snapshot(relevant)
    relevant = relevant or {}
    local level = UnitLevel and safe(UnitLevel, "player") or 1
    local xp = UnitXP and safe(UnitXP, "player") or 0
    local xpMax = UnitXPMax and safe(UnitXPMax, "player") or 0
    local money = GetMoney and safe(GetMoney) or 0
    local zone = GetZoneText and safe(GetZoneText) or nil
    local subzone = GetSubZoneText and safe(GetSubZoneText) or nil
    local bind = GetBindLocation and safe(GetBindLocation) or nil

    local skills = {}
    for name in pairs(relevant.skills or {}) do
        skills[name] = self:GetSkill(name)
    end

    local reputations = {}
    for factionID in pairs(relevant.reputations or {}) do
        reputations[tonumber(factionID)] = self:GetReputation(factionID)
    end

    local auras = {}
    for spellID in pairs(relevant.auras or {}) do
        auras[tonumber(spellID)] = self:HasAura(spellID)
    end

    local equipment = {}
    for slot in pairs(relevant.equipment or {}) do
        equipment[tonumber(slot)] = self:GetEquippedItem(slot)
    end

    local spells = {}
    for spellID in pairs(relevant.spells or {}) do
        spells[tonumber(spellID)] = self:IsSpellKnown(spellID)
    end

    return {
        level=tonumber(level) or 1,
        xp=tonumber(xp) or 0,
        xpMax=tonumber(xpMax) or 0,
        money=tonumber(money) or 0,
        zone=zone,
        subzone=subzone,
        bindLocation=bind,
        talentPoints=self:GetTalentPoints(),
        skills=skills,
        reputations=reputations,
        auras=auras,
        equipment=equipment,
        spells=spells,
    }
end
