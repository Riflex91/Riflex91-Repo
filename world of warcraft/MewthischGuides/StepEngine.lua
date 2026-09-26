local addonName, MG = ...

MG.StepPhases = {
    ACCEPT = "accept",
    OBJECTIVES = "objectives",
    TURNIN = "turnin",
    COMPLETE = "complete",
    LIVE = "live",
}

local function epochNow()
    if time then return time() end
    if os and os.time then return os.time() end
    return 0
end

local function contains(list, value)
    if type(list) ~= "table" then return true end
    for _, item in ipairs(list) do
        if item == value then return true end
    end
    return false
end

local function activeGuide(self)
    if self.GetActiveGuideDefinition then
        local guide = self:GetActiveGuideDefinition()
        if guide then return guide end
    end
    return self.Data and self.Data.guide or nil
end

function MG:IsQuestFlaggedCompletedSafe(questID)
    if C_QuestLog and C_QuestLog.IsQuestFlaggedCompleted then
        local ok, value = pcall(C_QuestLog.IsQuestFlaggedCompleted, questID)
        if ok then return value and true or false end
    end

    if IsQuestFlaggedCompleted then
        local ok, value = pcall(IsQuestFlaggedCompleted, questID)
        if ok then return value and true or false end
    end

    return false
end

function MG:GetQuestLogSnapshot()
    if self.QuestTracking then
        return self.QuestTracking:GetSnapshot()
    end

    -- Compatibility fallback used only when the dedicated tracker is unavailable.
    local snapshot = {}
    if not C_QuestLog or not C_QuestLog.GetNumQuestLogEntries or not C_QuestLog.GetInfo then
        return snapshot
    end

    local count = C_QuestLog.GetNumQuestLogEntries()
    for index = 1, count do
        local info = C_QuestLog.GetInfo(index)
        if info and not info.isHeader and info.questID then
            snapshot[info.questID] = {
                questID = info.questID,
                title = info.title,
                level = info.level,
                questLogIndex = index,
                objectives = {},
                readyForTurnIn = false,
            }
        end
    end
    return snapshot
end

function MG:EvaluateStepApplicability(definition, profile)
    profile = profile or self:GetPlayerProfile()

    if definition.faction and definition.faction ~= profile.faction then
        return false, "faction"
    end

    if definition.races and not contains(definition.races, profile.race) then
        return false, "race"
    end

    if definition.classes and not contains(definition.classes, profile.class) then
        return false, "class"
    end

    local level = tonumber(profile.level) or 0
    if definition.minLevel and level < definition.minLevel then
        return false, "level_low"
    end
    if definition.maxLevel and level > definition.maxLevel then
        return false, "level_high"
    end

    if definition.prerequisiteQuestIDs then
        for _, questID in ipairs(definition.prerequisiteQuestIDs) do
            if not self:IsQuestFlaggedCompletedSafe(questID) then
                return false, "prerequisite"
            end
        end
    end

    if self.RestEDXPImport and definition.rxpOccurrences and
       not self.RestEDXPImport:QuestDefinitionApplies(definition, profile) then
        return false, "restedxp_selector"
    end

    return true, "applicable"
end

local function resolvedQuestTitle(definition, snapshotEntry)
    if snapshotEntry and snapshotEntry.title and snapshotEntry.title ~= "" then
        return snapshotEntry.title
    end

    if definition and definition.title and
       not tostring(definition.title):match("^Quest %d+$") then
        return definition.title
    end

    if C_QuestLog and C_QuestLog.GetTitleForQuestID and definition and definition.questID then
        local ok, value = pcall(C_QuestLog.GetTitleForQuestID, definition.questID)
        if ok and value and value ~= "" then return value end
    end

    return definition and definition.title or
        ("Quest " .. tostring(definition and definition.questID or "?"))
end

function MG:BuildRouteStep(definition, snapshotEntry)
    local title = resolvedQuestTitle(definition, snapshotEntry)
    local completed = self:IsQuestFlaggedCompletedSafe(definition.questID)
    local phase
    local goals
    local activeGoal
    local complete = false

    if completed then
        phase = self.StepPhases.COMPLETE
        complete = true
        goals = {
            {
                id = tostring(definition.questID) .. ":complete",
                questID = definition.questID,
                type = "complete",
                state = self.GoalStates.COMPLETE,
                name = title,
                instruction = "Bereits abgeschlossen",
                progressText = "fertig",
                percent = 1,
                finished = true,
            }
        }
        activeGoal = goals[1]
    elseif snapshotEntry then
        if snapshotEntry.readyForTurnIn then
            phase = self.StepPhases.TURNIN
            goals = self:BuildQuestGoals(definition.questID, snapshotEntry.objectives, true)
        else
            phase = self.StepPhases.OBJECTIVES
            goals = self:BuildQuestGoals(definition.questID, snapshotEntry.objectives, false)
        end
        activeGoal = self:GetActiveGoal(goals)
    else
        phase = self.StepPhases.ACCEPT
        goals = {
            {
                id = tostring(definition.questID) .. ":accept",
                questID = definition.questID,
                type = "accept",
                state = self.GoalStates.ACTIVE,
                name = title,
                instruction = "Nimm die Quest „" .. tostring(title) .. "“ an",
                progressText = "",
                percent = nil,
                finished = false,
            }
        }
        activeGoal = goals[1]
    end

    local routeHints = {}
    local routeOrder = definition.order
    if self.RestEDXPImport and definition.rxpOccurrences then
        local objectiveIndex = activeGoal and activeGoal.index or nil
        routeOrder = self.RestEDXPImport:GetProgressOrder(
            definition,
            phase,
            self:GetPlayerProfile(),
            objectiveIndex) or routeOrder
        routeHints = self.RestEDXPImport:GetHints(
            definition,
            phase,
            self:GetPlayerProfile(),
            4,
            objectiveIndex)
    end

    return {
        id = definition.id,
        routeOrder = routeOrder,
        questID = definition.questID,
        title = title,
        level = snapshotEntry and snapshotEntry.level or definition.minLevel,
        phase = phase,
        complete = complete,
        action = activeGoal and activeGoal.instruction or "Quest fortsetzen",
        detail = activeGoal and activeGoal.instruction or "Quest fortsetzen",
        goals = goals,
        goal = activeGoal,
        goalSummary = self:GetGoalSummary(goals),
        objectives = snapshotEntry and snapshotEntry.objectives or {},
        source = definition.verification or "RECORDED",
        verification = definition.verification or "RECORDED",
        guideID = activeGuide(self) and activeGuide(self).id or nil,
        mapID = definition.mapID,
        definition = definition,
        routeHints = routeHints,
        questLogIndex = snapshotEntry and snapshotEntry.questLogIndex or nil,
    }
end

function MG:BuildLiveFallbackStep(entry)
    local goals = self:BuildQuestGoals(entry.questID, entry.objectives, entry.readyForTurnIn)
    local goal = self:GetActiveGoal(goals)

    return {
        id = "live-" .. tostring(entry.questID),
        routeOrder = 100000 + (entry.questLogIndex or 0),
        questID = entry.questID,
        title = entry.title or ("Quest " .. tostring(entry.questID)),
        level = entry.level,
        phase = entry.readyForTurnIn and self.StepPhases.TURNIN or self.StepPhases.OBJECTIVES,
        complete = false,
        action = goal and goal.instruction or "Quest fortsetzen",
        detail = goal and goal.instruction or "Quest fortsetzen",
        goals = goals,
        goal = goal,
        goalSummary = self:GetGoalSummary(goals),
        objectives = entry.objectives,
        source = "LIVE",
        verification = "LIVE",
        questLogIndex = entry.questLogIndex,
    }
end

function MG:RestedXPPhaseApplies(definition, phase, profile, objectiveIndex)
    if not self.RestEDXPImport or not definition or
       not definition.rxpOccurrences then
        return true
    end

    -- Accept/turn-in steps must have an occurrence that applies to this exact
    -- character and phase. This prevents class-specific RestedXP quests from
    -- leaking into another class merely because the same quest has a generic
    -- occurrence later in the guide.
    if phase ~= self.StepPhases.ACCEPT and
       phase ~= self.StepPhases.TURNIN then
        return true
    end

    return self.RestEDXPImport:GetProgressOccurrence(
        definition, phase, profile, objectiveIndex) ~= nil
end

function MG:BuildGuideSteps()
    if self.GetRouteMode and self:GetRouteMode() == "manual" and self.BuildManualRouteSteps then
        return self:BuildManualRouteSteps()
    end

    local snapshot = self:GetQuestLogSnapshot()
    local profile = self:GetPlayerProfile()
    local routeSteps = {}
    local routeQuestIDs = {}
    local skipped = {}
    local maxCompletedOrder = 0

    local guide = activeGuide(self)
    local definitions = guide and guide.steps or {}

    for _, definition in ipairs(definitions) do
        local applicable, reason = self:EvaluateStepApplicability(definition, profile)

        if applicable then
            local step = self:BuildRouteStep(definition, snapshot[definition.questID])
            local objectiveIndex = step.goal and step.goal.index or nil
            if self:RestedXPPhaseApplies(
                definition, step.phase, profile, objectiveIndex) then
                routeQuestIDs[definition.questID] = true
                routeSteps[#routeSteps + 1] = step

                if step.phase == self.StepPhases.COMPLETE then
                    maxCompletedOrder = math.max(
                        maxCompletedOrder, tonumber(step.routeOrder) or 0)
                end
            else
                skipped[#skipped + 1] = {
                    questID = definition.questID,
                    reason = "restedxp_phase_selector",
                }
            end

        else
            skipped[#skipped + 1] = {
                questID = definition.questID,
                reason = reason,
            }
        end
    end

    table.sort(routeSteps, function(a, b)
        return (a.routeOrder or 0) < (b.routeOrder or 0)
    end)

    local steps = {}
    local preferredQuestID = nil
    local preferredReason = nil

    -- Resync rule 1: among active route quests, the furthest matching
    -- RestedXP occurrence wins. Imported quests can stay in the quest log for
    -- several guide steps, so choosing the first active quest incorrectly
    -- pulled the guide backwards.
    local furthestActive = nil
    for _, step in ipairs(routeSteps) do
        if step.phase == self.StepPhases.OBJECTIVES or step.phase == self.StepPhases.TURNIN then
            local order = tonumber(step.routeOrder) or 0
            if order >= maxCompletedOrder and
               (not furthestActive or order > (tonumber(furthestActive.routeOrder) or 0)) then
                furthestActive = step
            end
        end
    end

    if furthestActive then
        preferredQuestID = furthestActive.questID
        preferredReason = "furthest_active_route_quest"
    end

    -- Resync rule 2: if nothing is active, continue after the highest
    -- confirmed completed route step.
    if not preferredQuestID then
        for _, step in ipairs(routeSteps) do
            if step.phase ~= self.StepPhases.COMPLETE and
               (tonumber(step.routeOrder) or 0) > maxCompletedOrder then
                preferredQuestID = step.questID
                preferredReason = maxCompletedOrder > 0 and "after_completed_route" or "route_start"
                break
            end
        end
    end

    -- Keep incomplete route steps in the UI list. Completed historic steps are
    -- omitted so the viewer stays compact.
    for _, step in ipairs(routeSteps) do
        if step.phase ~= self.StepPhases.COMPLETE then
            steps[#steps + 1] = step
        end
    end

    -- Unknown but currently active quests remain usable as live fallback.
    for questID, entry in pairs(snapshot) do
        if not routeQuestIDs[questID] then
            steps[#steps + 1] = self:BuildLiveFallbackStep(entry)
        end
    end

    table.sort(steps, function(a, b)
        return (a.routeOrder or 999999) < (b.routeOrder or 999999)
    end)

    local preferredIndex = 1
    if preferredQuestID then
        for index, step in ipairs(steps) do
            if step.questID == preferredQuestID then
                preferredIndex = index
                break
            end
        end
    elseif #steps > 0 then
        preferredReason = "live_fallback"
    end

    if self.SmartResync and #steps > 0 then
        preferredIndex, preferredReason = self.SmartResync:Choose(steps, preferredIndex, preferredReason, guide)
        local selected = steps[preferredIndex]
        preferredQuestID = selected and selected.questID or preferredQuestID
    end

    local signature = table.concat({
        tostring(guide and guide.id or ""),
        tostring(preferredQuestID or ""),
        tostring(preferredReason or ""),
        tostring(maxCompletedOrder),
        tostring(#steps),
    }, "|")

    if self.lastResyncSignature ~= signature then
        self.lastResyncSignature = signature

        self:Log("INFO", "guide.resync", "Guide-Position automatisch synchronisiert.", {
            guideID = guide and guide.id or nil,
            questID = preferredQuestID,
            reason = preferredReason,
            preferredIndex = preferredIndex,
            maxCompletedOrder = maxCompletedOrder,
            visibleSteps = #steps,
            skippedSteps = #skipped,
        })
    end

    self.db.runtime.guide = {
        guideID = guide and guide.id or nil,
        selectedQuestID = preferredQuestID,
        selectedReason = preferredReason,
        maxCompletedOrder = maxCompletedOrder,
        visibleSteps = #steps,
        updatedAt = epochNow(),
    }

    return steps, preferredIndex, preferredReason
end

function MG:GetExpectedQuestForAutomation(action)
    local step = self.currentStep
    if not step or not step.questID then return nil end

    if action == "accept" and step.phase == self.StepPhases.ACCEPT then
        return step.questID
    end

    if action == "turnin" and step.phase == self.StepPhases.TURNIN then
        return step.questID
    end

    return nil
end
