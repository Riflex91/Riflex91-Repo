local addonName, MG = ...

MG.ManualRoute = MG.ManualRoute or {}
local Manual = MG.ManualRoute

local HUGE_DISTANCE = 1000000000

function MG:GetRouteMode()
    local mode = self.db and self.db.settings and self.db.settings.routeMode or "auto"
    -- Old experimental "preset" profiles migrate fail-closed to manual.
    if mode == "preset" then mode = "manual" end
    if mode ~= "manual" and mode ~= "auto" then mode = "auto" end
    return mode
end

function MG:SetRouteMode(mode)
    if mode ~= "manual" and mode ~= "auto" then return false, "invalid_mode" end

    if mode == "auto" and
       (not self.DataLoader or not self.DataLoader:IsAutoRouteReady()) then
        self.db.settings.routeMode = "manual"
        if self.RefreshSettings then self:RefreshSettings() end
        return false, "auto_route_unavailable"
    end

    self.db.settings.routeMode = mode
    self.manualOffset = 0

    if self.DataLoader and mode == "auto" then
        self.DataLoader:SelectActiveGuide()
    end

    self:Log("INFO", "routing.mode_changed", "Routenmodus geändert.", {
        mode = mode,
    })

    self:RefreshGuide("route_mode_changed")
    if self.RefreshSettings then self:RefreshSettings() end
    return true
end

local function routeDistance(step, player)
    if not MG.RouteEngine then return nil, nil, nil end

    local target = MG.RouteEngine:Resolve(step, { preview = true })
    if not target then return nil, nil, nil end

    local distance, source = MG.RouteEngine:EstimateDistanceToTarget(target, player)
    return distance, target, source
end

function MG:BuildManualRouteSteps()
    local snapshot = self:GetQuestLogSnapshot()
    local player = self.ForeverAPI and self.ForeverAPI:GetPlayerPosition() or nil
    local steps = {}

    for _, entry in pairs(snapshot or {}) do
        local step = self:BuildLiveFallbackStep(entry)

        -- Accepted quests in manual mode are always routed to their current
        -- objective (or turn-in), never back to a quest-start marker.
        if not entry.readyForTurnIn then
            step.phase = self.StepPhases.OBJECTIVES
        end

        local distance, target, distanceSource = routeDistance(step, player)
        step.manualDistance = distance
        step.manualTarget = target
        step.manualDistanceSource = distanceSource

        steps[#steps + 1] = step
    end

    table.sort(steps, function(a, b)
        local ad = tonumber(a.manualDistance) or HUGE_DISTANCE
        local bd = tonumber(b.manualDistance) or HUGE_DISTANCE
        if ad ~= bd then return ad < bd end

        local aTurnIn = a.phase == MG.StepPhases.TURNIN
        local bTurnIn = b.phase == MG.StepPhases.TURNIN
        if aTurnIn ~= bTurnIn then return aTurnIn end

        return (tonumber(a.questLogIndex) or HUGE_DISTANCE) <
            (tonumber(b.questLogIndex) or HUGE_DISTANCE)
    end)

    local reason = #steps > 0 and "manual_nearest_active_quest" or "manual_no_active_quest"

    if self.db then
        self.db.runtime = self.db.runtime or {}
        self.db.runtime.manualRoute = {
            mode = "manual",
            activeQuests = #steps,
            selectedQuestID = steps[1] and steps[1].questID or nil,
            selectedDistance = steps[1] and steps[1].manualDistance or nil,
            selectedDistanceSource = steps[1] and steps[1].manualDistanceSource or nil,
            updatedAt = time and time() or 0,
        }
    end

    return steps, #steps > 0 and 1 or 0, reason
end
