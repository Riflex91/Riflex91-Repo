local addonName, MG = ...

MG.NavigationTargetResolver = MG.NavigationTargetResolver or {}
local N = MG.NavigationTargetResolver

local function semanticCandidate(state)
    return state and state.visible and state.possible and
        not state.passive and not state.complete
end

local function explicitCandidate(states,source)
    for _,state in ipairs(states or {}) do
        if state.navigationEligible then
            return {
                goalState=state,source=source,waypoint=state.waypoint,
                reason="first_visible_incomplete_waypoint",
            }
        end
    end
    return nil
end

local function liveQuestWaypoint(state)
    if not semanticCandidate(state) or not tonumber(state.questID) or not MG.ForeverAPI then
        return nil
    end
    local live=MG.ForeverAPI.GetPlayerPosition and MG.ForeverAPI:GetPlayerPosition() or nil
    local mapID=live and tonumber(live.mapID) or nil
    if not mapID then return nil end

    local action=state.action
    local waypoint
    if action=="accept" then
        if MG.ForeverAPI.GetQuestLineCoordinate then
            waypoint=MG.ForeverAPI:GetQuestLineCoordinate(state.questID,mapID)
        end
        if not waypoint and MG.ForeverAPI.FindQuestOnMaps then
            waypoint=MG.ForeverAPI:FindQuestOnMaps(state.questID,mapID,"accept")
        end
        if not waypoint and MG.ForeverAPI.GetNextQuestWaypoint then
            waypoint=MG.ForeverAPI:GetNextQuestWaypoint(state.questID,mapID)
        end
    elseif action=="turnin" then
        if MG.ForeverAPI.GetNextQuestWaypoint then
            waypoint=MG.ForeverAPI:GetNextQuestWaypoint(state.questID,mapID)
        end
        if not waypoint and MG.ForeverAPI.FindQuestOnMaps then
            waypoint=MG.ForeverAPI:FindQuestOnMaps(state.questID,mapID,"objectives")
        end
    else
        if MG.ForeverAPI.FindQuestOnMaps then
            waypoint=MG.ForeverAPI:FindQuestOnMaps(state.questID,mapID,"objectives")
        end
        if not waypoint and MG.ForeverAPI.GetNextQuestWaypoint then
            waypoint=MG.ForeverAPI:GetNextQuestWaypoint(state.questID,mapID)
        end
    end

    if waypoint and tonumber(waypoint.x) and tonumber(waypoint.y) then
        waypoint.questID=tonumber(state.questID)
        return waypoint
    end
    return nil
end

local function fallbackCandidate(states,source)
    for _,state in ipairs(states or {}) do
        if semanticCandidate(state) and not state.waypoint and tonumber(state.questID) then
            local waypoint=liveQuestWaypoint(state)
            if waypoint then
                return {
                    goalState=state,source=source,waypoint=waypoint,
                    reason="live_quest_coordinate_fallback",
                }
            end
        end
    end
    return nil
end

function N:Resolve(stepStates,stickyStates)
    local current=explicitCandidate(stepStates,"current_step")
    if current then return current end

    for _,sticky in ipairs(stickyStates or {}) do
        local found=explicitCandidate(sticky.goalStates,"sticky")
        if found then
            found.stickyStepID=sticky.step and sticky.step.id or nil
            return found
        end
    end

    current=fallbackCandidate(stepStates,"current_step_live_quest")
    if current then return current end

    for _,sticky in ipairs(stickyStates or {}) do
        local found=fallbackCandidate(sticky.goalStates,"sticky_live_quest")
        if found then
            found.stickyStepID=sticky.step and sticky.step.id or nil
            return found
        end
    end
    return nil
end
