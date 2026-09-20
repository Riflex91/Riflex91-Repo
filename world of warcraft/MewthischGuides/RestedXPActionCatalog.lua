local addonName, MG = ...

MG.RestEDXPActionCatalog = MG.RestEDXPActionCatalog or {}
local Catalog = MG.RestEDXPActionCatalog

Catalog.actions = {
    goto = { category = "route", label = "Gehe zum markierten Punkt", visible = true },
    waypoint = { category = "route", label = "Wegpunkt", visible = true },
    target = { category = "target", label = "Ziel", visible = true },
    accept = { category = "quest", label = "Quest annehmen", visible = false },
    turnin = { category = "quest", label = "Quest abgeben", visible = false },
    mob = { category = "target", label = "Gegner", visible = true },
    complete = { category = "quest", label = "Questziel abschließen", visible = false },
    collect = { category = "item", label = "Sammle", visible = true },
    train = { category = "character", label = "Trainiere", visible = true },
    itemStat = { category = "item", label = "Gegenstandswerte", visible = false },
    xp = { category = "character", label = "Erreiche XP-Ziel", visible = true },
    use = { category = "item", label = "Benutze", visible = true },
    dungeon = { category = "activity", label = "Dungeon", visible = true },
    itemcount = { category = "item", label = "Gegenstandsanzahl", visible = false },
    isOnQuest = { category = "condition", label = "Quest aktiv", visible = false },
    money = { category = "character", label = "Goldziel", visible = true },
    zoneskip = { category = "route", label = "Zonen-Sprung", visible = true },
    vendor = { category = "interaction", label = "Händler", visible = true },
    isQuestComplete = { category = "condition", label = "Quest abgeschlossen", visible = false },
    isQuestTurnedIn = { category = "condition", label = "Quest abgegeben", visible = false },
    trainer = { category = "character", label = "Trainer", visible = true },
    zone = { category = "route", label = "Zone", visible = true },
    skill = { category = "character", label = "Fertigkeit", visible = true },
    subzoneskip = { category = "route", label = "Teilzonen-Sprung", visible = true },
    group = { category = "activity", label = "Gruppe", visible = true },
    unitscan = { category = "target", label = "Suche Einheit", visible = true },
    isQuestAvailable = { category = "condition", label = "Quest verfügbar", visible = false },
    fly = { category = "route", label = "Fliege", visible = true },
    subzone = { category = "route", label = "Teilzone", visible = true },
    cast = { category = "character", label = "Wirke", visible = true },
    abandon = { category = "quest", label = "Quest abbrechen", visible = true },
    equip = { category = "item", label = "Ausrüsten", visible = true },
    link = { category = "meta", label = "Verknüpfung", visible = false },
    fp = { category = "route", label = "Flugpunkt", visible = true },
    hs = { category = "route", label = "Ruhestein benutzen", visible = true },
    deathskip = { category = "route", label = "Todes-Sprung", visible = true },
    disablecheckbox = { category = "meta", label = "Option deaktivieren", visible = false },
    line = { category = "meta", label = "Routenlinie", visible = false },
    bindlocation = { category = "route", label = "Ruhestein setzen", visible = true },
    cooldown = { category = "character", label = "Abklingzeit", visible = false },
    skipgossip = { category = "interaction", label = "Dialog überspringen", visible = false },
    home = { category = "route", label = "Heimatpunkt", visible = true },
    aura = { category = "character", label = "Aura", visible = true },
    engrave = { category = "character", label = "Gravieren", visible = true },
    maxlevel = { category = "condition", label = "Maximallevel", visible = false },
    destroy = { category = "item", label = "Zerstören", visible = true },
    skipgossipid = { category = "interaction", label = "Dialog überspringen", visible = false },
    usespell = { category = "character", label = "Zauber benutzen", visible = true },
    timer = { category = "interaction", label = "Wartezeit", visible = true },
    solo = { category = "activity", label = "Solo", visible = true },
    bronzetube = { category = "item", label = "Bronzeröhre", visible = true },
    bankdeposit = { category = "item", label = "Einlagern", visible = true },
    isNotOnQuest = { category = "condition", label = "Quest nicht aktiv", visible = false },
    gossipoption = { category = "interaction", label = "Dialogoption", visible = true },
    acceptmultiple = { category = "quest", label = "Mehrere Quests annehmen", visible = true },
    isQuestNotComplete = { category = "condition", label = "Quest nicht abgeschlossen", visible = false },
    reputation = { category = "character", label = "Rufziel", visible = true },
    emote = { category = "interaction", label = "Emote", visible = true },
    bankwithdraw = { category = "item", label = "Aus Bank nehmen", visible = true },
    macro = { category = "interaction", label = "Makro", visible = true },
    addquestitem = { category = "quest", label = "Questgegenstand", visible = true },
    vehicle = { category = "activity", label = "Fahrzeug", visible = true },
    tame = { category = "target", label = "Zähmen", visible = true },
}

function Catalog:Get(kind)
    return self.actions[tostring(kind or "")]
end

function Catalog:IsKnown(kind)
    return self:Get(kind) ~= nil
end

function Catalog:Format(kind, args)
    local definition = self:Get(kind)
    if not definition or definition.visible == false then return nil end

    args = tostring(args or ""):gsub("^%s+", ""):gsub("%s+$", "")

    if kind == "goto" then
        return definition.label
    end

    if args == "" then return definition.label end
    return definition.label .. ": " .. args
end

function Catalog:KnownCount()
    local count = 0
    for _ in pairs(self.actions) do count = count + 1 end
    return count
end
