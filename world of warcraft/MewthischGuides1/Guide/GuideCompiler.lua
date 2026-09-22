local addonName, MG = ...

MG.GuideCompiler = MG.GuideCompiler or {}
local C = MG.GuideCompiler

local function first(value)
    if type(value) == "table" then return value[1] end
    return value
end

local function trim(value)
    return MG.Util:Trim(value)
end

local function levelRange(name)
    local a, b = tostring(name or ""):match("(%d+)%s*%-%s*(%d+)")
    return tonumber(a), tonumber(b)
end

local function splitCondition(args)
    return MG.Util:SplitCondition(args)
end

local function csv(value)
    local out = {}
    for token in tostring(value or ""):gmatch("[^,]+") do
        out[#out + 1] = trim(token)
    end
    return out
end

local function parseQuestArgs(args)
    local base, selector = splitCondition(args)
    local questID, objective = tostring(base or ""):match("^%s*(%d+)%s*,?%s*(%d*)")
    return tonumber(questID), objective ~= "" and tonumber(objective) or nil, selector
end

local function parseCollectArgs(args)
    local base, selector = splitCondition(args)
    local itemID, amount, questID, objective =
        tostring(base or ""):match("^%s*(%d+)%s*,?%s*(%d*)%s*,?%s*(%d*)%s*,?%s*(%d*)")
    return tonumber(itemID),
        amount ~= "" and tonumber(amount) or nil,
        questID ~= "" and tonumber(questID) or nil,
        objective ~= "" and tonumber(objective) or nil,
        selector
end

local function parseCoordinate(args)
    local base, selector = splitCondition(args)
    local parts = csv(base)
    if #parts < 3 then return nil, selector end

    local mapSpec = parts[1]
    local mapID, floor = mapSpec:match("^(%d+)/(%d+)$")
    if not mapID then mapID = mapSpec:match("^(%d+)$") end

    local a, b = tonumber(parts[2]), tonumber(parts[3])
    local waypoint = {
        mapID = tonumber(mapID),
        mapName = mapSpec,
        floor = tonumber(floor),
        radius = tonumber(parts[4]),
        flags = parts[5],
        source = "ImportedRoute",
    }

    if a and b then
        if floor or math.abs(a) > 100 or math.abs(b) > 100 then
            waypoint.worldX, waypoint.worldY = a, b
        else
            waypoint.x, waypoint.y = a / 100, b / 100
        end
    end
    return waypoint, selector
end

local function parseComparator(value, defaultOp)
    value = trim(value)
    local op, number = value:match("^([<>]=?)([%-%d%.]+)$")
    if op then return op, tonumber(number) end
    return defaultOp or ">=", tonumber(value)
end

local function parseMoney(args)
    local base, selector = splitCondition(args)
    local op, amount = parseComparator(base, ">=")
    return {
        operator=op,
        gold=amount,
        copper=amount and math.floor(amount * 10000 + 0.5) or nil,
    }, selector
end

local function parseXP(args)
    local base, selector = splitCondition(args)
    base = trim(base)
    local level, amount = base:match("^(%d+)%+(%d+)$")
    if level then
        return { mode="earned", level=tonumber(level), amount=tonumber(amount), raw=base }, selector
    end
    level, amount = base:match("^(%d+)%-(%d+)$")
    if level then
        return { mode="remaining", level=tonumber(level), amount=tonumber(amount), raw=base }, selector
    end
    local op, target = base:match("^([<>]=?)(%d+)")
    if op then
        return { mode="level_compare", operator=op, level=tonumber(target), raw=base }, selector
    end
    level = tonumber(base:match("^(%d+)"))
    return { mode="level", level=level, raw=base }, selector
end

local function parseSkill(args)
    local base, selector = splitCondition(args)
    local parts = csv(base)
    local op, amount = parseComparator(parts[2] or "", ">=")
    return {
        name=string.lower(parts[1] or ""),
        operator=op,
        amount=amount,
        flag=parts[3],
    }, selector
end

local STANDING = {
    hated=1, hostile=2, unfriendly=3, neutral=4,
    friendly=5, honored=6, revered=7, exalted=8,
}

local function parseReputation(args)
    local base, selector = splitCondition(args)
    local parts = csv(base)
    local standingName = string.lower(parts[2] or "")
    local progressOp, progress = parseComparator(parts[3] or "", ">=")
    return {
        factionID=tonumber(parts[1]),
        standing=STANDING[standingName],
        standingName=standingName,
        progressOperator=progressOp,
        progress=progress,
        flag=parts[4],
    }, selector
end

local COMPLETION_KIND = {
    accept="quest_accept",
    turnin="quest_turnin",
    complete="quest_objective",
    collect="collect",
    itemcount="itemcount",
    isOnQuest="quest_active",
    isNotOnQuest="quest_inactive",
    isQuestComplete="quest_complete",
    isQuestNotComplete="quest_not_complete",
    isQuestTurnedIn="quest_turned_in",
    isQuestAvailable="quest_available",
    maxlevel="maxlevel",
    goto="position",
    waypoint="position",
    zone="location",
    subzone="location",
    zoneskip="location",
    subzoneskip="location",
    xp="xp",
    money="money",
    skill="skill",
    reputation="reputation",
    aura="aura",
    train="train",
    trainer="manual",
    vendor="manual",
    use="manual",
    equip="equip",
    tame="manual",
    fly="travel",
    fp="travel",
    hs="travel",
    home="travel",
    deathskip="manual",
    bindlocation="manual",
    cast="spell_action",
    usespell="spell_action",
    timer="timer",
    engrave="manual",
    abandon="manual",
    destroy="manual",
    emote="manual",
    bankdeposit="manual",
    bankwithdraw="manual",
    macro="manual",
    vehicle="manual",
    gossipoption="manual",
    acceptmultiple="quest_accept_multiple",
    addquestitem="manual",
    bronzetube="manual",
}

local PRIMARY_ACTION = {
    accept=true, turnin=true, complete=true, collect=true, itemcount=true,
    xp=true, money=true, skill=true, reputation=true, aura=true,
    train=true, trainer=true, vendor=true, use=true, equip=true, tame=true,
    fly=true, fp=true, hs=true, home=true, deathskip=true,
    zone=true, subzone=true, zoneskip=true, subzoneskip=true,
    bindlocation=true, cast=true, usespell=true, timer=true, engrave=true,
    abandon=true, destroy=true, emote=true, bankdeposit=true,
    bankwithdraw=true, macro=true, vehicle=true, gossipoption=true,
    acceptmultiple=true, addquestitem=true, bronzetube=true,
}

local CONDITION_ACTION = {
    isOnQuest=true, isNotOnQuest=true, isQuestComplete=true,
    isQuestNotComplete=true, isQuestTurnedIn=true, isQuestAvailable=true,
    maxlevel=true,
}

local PASSIVE_ACTION = {
    target=true, mob=true, goto=true, waypoint=true, line=true,
    unitscan=true, group=true, dungeon=true, solo=true,
    itemStat=true, cooldown=true, link=true, disablecheckbox=true,
    skipgossip=true, skipgossipid=true,
}

local function hasTag(tags, name)
    for _, tag in ipairs(tags or {}) do
        if tag.name == name then return true end
    end
    return false
end

local function lastTagValue(tags, name)
    local value
    for _, tag in ipairs(tags or {}) do
        if tag.name == name then value = tag.value end
    end
    return value
end

local function relationKey(value)
    value = string.lower(trim(value))
    return value:gsub("[^%w]+", "")
end

function C:CompileEntry(step, rawStep, action, actionIndex, lastWaypoint)
    local kind = tostring(action.kind or "")
    local base, selector = splitCondition(action.args)
    local role =
        PRIMARY_ACTION[kind] and "goal" or
        CONDITION_ACTION[kind] and "condition" or
        "annotation"

    local entry = {
        id = step.id .. ":entry:" .. tostring(actionIndex),
        order = actionIndex,
        action = kind,
        kind = kind,
        args = base,
        rawArgs = action.args,
        role = role,
        passive = PASSIVE_ACTION[kind] and true or false,
        optional = step.optional,
        sticky = step.sticky or step.completeWith ~= nil,
        visibleByDefault = role == "goal" or PASSIVE_ACTION[kind] == true,
        completionKind = COMPLETION_KIND[kind] or
            (role == "annotation" and "none" or "manual"),
        waypoint = lastWaypoint and MG.Util:Copy(lastWaypoint) or nil,
        arrowText = step.arrowText,
        requirements = {
            stepSelector = rawStep.selector or "",
            actionSelector = selector or "",
            tags = MG.Util:Copy(rawStep.tags or {}),
            requiresLabel = step.requires,
        },
        source = "ImportedRoute",
        raw = {
            stepIndex = rawStep.rawIndex,
            actionIndex = action.rawIndex or actionIndex,
        },
    }

    if kind == "accept" or kind == "turnin" or kind == "complete" or
       kind == "isOnQuest" or kind == "isNotOnQuest" or
       kind == "isQuestComplete" or kind == "isQuestNotComplete" or
       kind == "isQuestTurnedIn" or kind == "isQuestAvailable" then
        entry.questID, entry.objectiveIndex, entry.requirements.actionSelector =
            parseQuestArgs(action.args)
    elseif kind == "acceptmultiple" then
        local raw, actionSelector = splitCondition(action.args)
        entry.questIDs = {}
        for _, value in ipairs(csv(raw)) do
            if tonumber(value) then entry.questIDs[#entry.questIDs + 1] = tonumber(value) end
        end
        entry.requirements.actionSelector = actionSelector
    elseif kind == "collect" then
        entry.itemID, entry.required, entry.questID, entry.objectiveIndex,
            entry.requirements.actionSelector = parseCollectArgs(action.args)
    elseif kind == "itemcount" then
        local raw, actionSelector = splitCondition(action.args)
        local parts = csv(raw)
        entry.itemID = tonumber(parts[1])
        entry.required = tonumber(parts[2])
        entry.requirements.actionSelector = actionSelector
    elseif kind == "goto" or kind == "waypoint" then
        entry.waypoint, entry.requirements.actionSelector = parseCoordinate(action.args)
    elseif kind == "target" or kind == "mob" or kind == "unitscan" then
        entry.targetName = trim(base):gsub("^%+", ""):gsub("::.*$", "")
    elseif kind == "use" or kind == "destroy" or kind == "addquestitem" or
           kind == "bronzetube" then
        entry.itemID = tonumber(tostring(base or ""):match("^%s*(%d+)"))
    elseif kind == "equip" then
        local parts = csv(base)
        entry.equipSlot = tonumber(parts[1])
        entry.itemID = tonumber(parts[2])
    elseif kind == "bankdeposit" or kind == "bankwithdraw" then
        entry.itemIDs = {}
        for _, value in ipairs(csv(base)) do
            if tonumber(value) then entry.itemIDs[#entry.itemIDs + 1] = tonumber(value) end
        end
    elseif kind == "train" or kind == "cast" or kind == "usespell" then
        entry.spellID = tonumber(tostring(base or ""):match("^%s*(%d+)"))
    elseif kind == "aura" then
        local signed = tonumber(tostring(base or ""):match("^%s*([%-]?%d+)"))
        entry.auraSpellID = signed and math.abs(signed) or nil
        entry.auraWanted = signed and signed >= 0 or false
    elseif kind == "timer" then
        local parts = csv(base)
        entry.timerSeconds = tonumber(parts[1])
        entry.timerLabel = parts[2]
    elseif kind == "xp" then
        entry.xpTarget, entry.requirements.actionSelector = parseXP(action.args)
    elseif kind == "money" then
        entry.moneyTarget, entry.requirements.actionSelector = parseMoney(action.args)
    elseif kind == "skill" then
        entry.skillTarget, entry.requirements.actionSelector = parseSkill(action.args)
    elseif kind == "reputation" then
        entry.reputationTarget, entry.requirements.actionSelector =
            parseReputation(action.args)
    elseif kind == "zone" or kind == "subzone" or kind == "zoneskip" or
           kind == "subzoneskip" or kind == "fly" or kind == "fp" or
           kind == "hs" or kind == "home" then
        entry.location = trim(base)
    elseif kind == "vendor" or kind == "trainer" or kind == "tame" then
        entry.targetID = tonumber(tostring(base or ""):match("^%s*(%d+)"))
    elseif kind == "gossipoption" then
        entry.optionID = tonumber(tostring(base or ""):match("^%s*(%d+)"))
    elseif kind == "bindlocation" then
        entry.locationID = tonumber(tostring(base or ""):match("^%s*(%d+)"))
    elseif kind == "maxlevel" then
        local parts = csv(base)
        entry.maxLevel = tonumber(parts[1])
        entry.jumpLabel = parts[2]
    elseif kind == "macro" then
        local parts = csv(base)
        entry.macroName = parts[1]
        entry.macroIcon = tonumber(parts[2])
    end

    return entry
end

function C:CompileStep(guide, rawStep, stepIndex)
    local completeWith = lastTagValue(rawStep.tags, "completewith")
    local step = {
        id = guide.id .. ":step:" .. tostring(stepIndex),
        order = stepIndex,
        rawStepIndex = rawStep.rawIndex or stepIndex,
        selector = rawStep.selector or "",
        tags = MG.Util:Copy(rawStep.tags or {}),
        sticky = hasTag(rawStep.tags, "sticky"),
        optional = hasTag(rawStep.tags, "optional"),
        completeWith = completeWith and trim(completeWith) ~= "" and trim(completeWith) or nil,
        label = lastTagValue(rawStep.tags, "label"),
        requires = lastTagValue(rawStep.tags, "requires"),
        arrowText = lastTagValue(rawStep.tags, "arrowtext"),
        mapHint = lastTagValue(rawStep.tags, "map"),
        loop = hasTag(rawStep.tags, "loop"),
        hideWindow = hasTag(rawStep.tags, "hidewindow"),
        entries = {},
        goals = {},
        annotations = {},
        conditions = {},
        route = {},
    }
    step.deferred = step.completeWith ~= nil
    step.stickyRelation = step.sticky or step.deferred

    local lastWaypoint = nil
    local lastGoal = nil
    local pendingTarget = nil

    for actionIndex, action in ipairs(rawStep.actions or {}) do
        local entry = self:CompileEntry(step, rawStep, action, actionIndex, lastWaypoint)
        step.entries[#step.entries + 1] = entry

        if entry.action == "goto" or entry.action == "waypoint" then
            lastWaypoint = entry.waypoint
            if lastWaypoint then
                step.route[#step.route + 1] = MG.Util:Copy(lastWaypoint)
                if lastGoal and not lastGoal.waypoint then
                    lastGoal.waypoint = MG.Util:Copy(lastWaypoint)
                end
            end
        elseif entry.action == "target" or entry.action == "mob" or
               entry.action == "unitscan" then
            pendingTarget = entry.targetName
            if lastGoal and not lastGoal.targetName and pendingTarget and pendingTarget ~= "" then
                lastGoal.targetName = pendingTarget
            end
        end

        if entry.role == "goal" then
            if pendingTarget and not entry.targetName and pendingTarget ~= "" then
                entry.targetName = pendingTarget
            end
            if step.arrowText and not entry.arrowText then entry.arrowText = step.arrowText end
            lastGoal = entry
            step.goals[#step.goals + 1] = entry
        elseif entry.role == "condition" then
            step.conditions[#step.conditions + 1] = entry
        else
            step.annotations[#step.annotations + 1] = entry
        end
    end

    if #step.goals == 0 then
        for _, entry in ipairs(step.entries) do
            if entry.action == "goto" or entry.action == "waypoint" then
                local promoted = MG.Util:Copy(entry)
                promoted.id = entry.id .. ":travel-goal"
                promoted.role = "goal"
                promoted.passive = false
                promoted.visibleByDefault = true
                promoted.completionKind = "position"
                promoted.arrowText = step.arrowText
                step.goals[#step.goals + 1] = promoted
            end
        end
    end

    return step
end

function C:LinkGuideRelations(guide)
    local labels = {}
    for index, step in ipairs(guide.steps or {}) do
        if step.label and trim(step.label) ~= "" then
            labels[relationKey(step.label)] = index
        end
    end
    guide.labelIndex = labels

    for index, step in ipairs(guide.steps or {}) do
        if step.completeWith then
            if string.lower(trim(step.completeWith)) == "next" then
                step.completeWithIndex = math.min(#guide.steps, index + 1)
                step.completeWithReason = "next"
            else
                step.completeWithIndex = labels[relationKey(step.completeWith)]
                step.completeWithReason = step.completeWithIndex and "label" or "unresolved_label"
            end
        end

        if step.requires and trim(step.requires) ~= "" then
            step.requiresIndex = labels[relationKey(step.requires)]
            step.requiresResolved = step.requiresIndex ~= nil
        end

        for _, entry in ipairs(step.entries or {}) do
            entry.requirements = entry.requirements or {}
            entry.requirements.requiresLabel = step.requires
            entry.requirements.requiresIndex = step.requiresIndex
            entry.requirements.requiresResolved =
                step.requires == nil or trim(step.requires) == "" or step.requiresResolved
        end
    end
    return guide
end

function C:CompileGuide(rawGuide, index)
    local metadata = rawGuide.metadata or {}
    local name = first(metadata.name) or ("Guide " .. tostring(index))
    local minLevel, maxLevel = levelRange(name)
    local guide = {
        id = "rxp:" .. MG.Util:Slug(rawGuide.sourceFile) .. ":" ..
            MG.Util:Slug(name) .. ":" .. tostring(index),
        title = name,
        displayName = first(metadata.displayname),
        sourceFile = rawGuide.sourceFile,
        source = "ImportedRoute",
        group = first(metadata.group),
        subgroup = first(metadata.subgroup),
        selector = first(metadata.selector),
        defaultFor = first(metadata.defaultfor),
        nextGuide = first(metadata.next),
        minLevel = minLevel,
        maxLevel = maxLevel,
        metadata = MG.Util:Copy(metadata),
        steps = {},
    }

    for stepIndex, rawStep in ipairs(rawGuide.steps or {}) do
        guide.steps[#guide.steps + 1] =
            self:CompileStep(guide, rawStep, stepIndex)
    end
    return self:LinkGuideRelations(guide)
end

function C:CompileAll(force)
    if self.cache and not force then return self.cache end
    local out = {}
    for index, rawGuide in ipairs(MG.RestEDXPParser:Parse()) do
        out[#out + 1] = self:CompileGuide(rawGuide, index)
    end
    self.cache = out
    return out
end

function C:GetStats()
    local guides, steps, entries, goals = 0, 0, 0, 0
    local stickies, deferred, loops, labels = 0, 0, 0, 0
    for _, guide in ipairs(self:CompileAll()) do
        guides = guides + 1
        for _, step in ipairs(guide.steps or {}) do
            steps = steps + 1
            entries = entries + #(step.entries or {})
            goals = goals + #(step.goals or {})
            if step.sticky then stickies = stickies + 1 end
            if step.deferred then deferred = deferred + 1 end
            if step.loop then loops = loops + 1 end
            if step.label then labels = labels + 1 end
        end
    end
    return {
        guides=guides, steps=steps, entries=entries, goals=goals,
        stickies=stickies, deferred=deferred, loops=loops, labels=labels,
        levelCapAssumption=false,
    }
end
