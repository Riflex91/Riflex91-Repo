local addonName, MG = ...

MG.CompletionResolver = MG.CompletionResolver or {}
local C = MG.CompletionResolver

local function questFacts(goal, facts)
    return facts and facts.quests and goal and goal.questID and
        facts.quests[tonumber(goal.questID)] or nil
end

local function objectiveFacts(goal, facts)
    local quest = questFacts(goal, facts)
    return quest and quest.objectives and goal.objectiveIndex and
        quest.objectives[tonumber(goal.objectiveIndex)] or nil
end

local function boolResult(value, reason, detail)
    return {
        known=true,
        complete=value and true or false,
        reason=reason,
        detail=detail,
    }
end

local function unknown(reason, detail)
    return { known=false, complete=false, reason=reason, detail=detail }
end

local function compare(op, left, right)
    left, right = tonumber(left), tonumber(right)
    if left == nil or right == nil then return nil end
    if op == "<" then return left < right end
    if op == ">" then return left > right end
    if op == "<=" then return left <= right end
    if op == ">=" then return left >= right end
    if op == "=" or op == "==" then return left == right end
    return left >= right
end

local function lower(value)
    return string.lower(tostring(value or ""))
end

local function manual(goal, reason)
    if MG.ActionMemory and MG.ActionMemory:IsManualComplete(goal.id) then
        return boolResult(true, "manual_completion", { reason=reason })
    end
    return nil
end

local function recent(goal, kind, id, seconds)
    if not MG.ActionMemory then return nil end
    return MG.ActionMemory:Recent(kind, id, seconds)
end

function C:Resolve(goal, facts)
    if not goal then return unknown("missing_goal") end

    if MG.ActionMemory then MG.ActionMemory:Seen(goal.id) end
    local marked = manual(goal, goal.action)
    if marked then return marked end

    local kind = goal.completionKind
    local quest = questFacts(goal, facts)
    local playerState = facts and facts.playerState or {}

    if kind == "none" or goal.role == "annotation" then
        return boolResult(true, "annotation")

    elseif kind == "quest_accept" then
        return boolResult(
            quest and (quest.active or quest.completed),
            quest and "quest_known" or "quest_not_known")

    elseif kind == "quest_accept_multiple" then
        local total, done = 0, 0
        for _, questID in ipairs(goal.questIDs or {}) do
            total = total + 1
            local q = facts and facts.quests and facts.quests[tonumber(questID)]
            if q and (q.active or q.completed) then done = done + 1 end
        end
        if total == 0 then return unknown("quest_list_missing") end
        return boolResult(done == total, "quest_multiple_fact", {
            current=done,required=total,
        })

    elseif kind == "quest_turnin" or kind == "quest_turned_in" then
        return boolResult(
            quest and quest.completed,
            quest and "quest_completion_fact" or "quest_not_in_snapshot")

    elseif kind == "quest_objective" then
        if quest and quest.completed then return boolResult(true, "quest_completed") end
        local objective = objectiveFacts(goal, facts)
        if objective then
            return boolResult(objective.finished, "objective_fact", {
                current=objective.current,
                required=objective.required,
                text=objective.text,
            })
        end
        return unknown("objective_fact_missing")

    elseif kind == "collect" then
        local objective = objectiveFacts(goal, facts)
        if objective then
            return boolResult(objective.finished, "collect_objective_fact", {
                current=objective.current,
                required=objective.required,
                text=objective.text,
            })
        end
        local current = facts and facts.inventory and
            facts.inventory[tonumber(goal.itemID)] or 0
        if goal.required then
            return boolResult(current >= tonumber(goal.required), "inventory_count", {
                current=current,required=goal.required,
            })
        end
        return unknown("collect_requirement_missing")

    elseif kind == "itemcount" then
        local current = facts and facts.inventory and
            facts.inventory[tonumber(goal.itemID)] or 0
        if goal.required then
            return boolResult(current >= tonumber(goal.required), "inventory_count", {
                current=current,required=goal.required,
            })
        end
        return unknown("itemcount_requirement_missing")

    elseif kind == "quest_active" then
        return boolResult(quest and quest.active, "quest_active_fact")

    elseif kind == "quest_inactive" then
        return boolResult(not quest or not quest.active, "quest_inactive_fact")

    elseif kind == "quest_complete" then
        return boolResult(
            quest and (quest.readyForTurnIn or quest.completed),
            "quest_complete_fact")

    elseif kind == "quest_not_complete" then
        return boolResult(
            not quest or (not quest.readyForTurnIn and not quest.completed),
            "quest_not_complete_fact")

    elseif kind == "quest_available" then
        if quest and quest.completed then
            return boolResult(false, "quest_already_completed")
        end
        if quest and quest.active then
            return boolResult(true, "quest_already_active")
        end
        -- Forever has no universally reliable availability API. For the
        -- RestedXP branch directive, an uncompleted inactive quest is the
        -- least surprising fail-open heuristic and is explicitly explained.
        return boolResult(true, "quest_available_heuristic")

    elseif kind == "maxlevel" then
        local maxLevel = tonumber(goal.maxLevel)
        if not maxLevel then return unknown("maxlevel_missing") end
        local level = tonumber(playerState.level) or
            tonumber(facts and facts.player and facts.player.level) or 1
        return boolResult(level <= maxLevel, "maxlevel_condition", {
            current=level,required=maxLevel,
        })

    elseif kind == "position" then
        local waypoint = goal.waypoint
        local position = facts and facts.position
        if not waypoint or not position or not MG.NavigationDistance then
            return unknown("position_not_comparable")
        end
        local distance, mode = MG.NavigationDistance:Between(position, waypoint)
        if distance == nil then return unknown("position_not_comparable:" .. tostring(mode)) end
        local threshold
        if mode == "normalized_map_distance" then
            threshold = 0.005
        else
            threshold = tonumber(waypoint.radius)
            if not threshold or threshold <= 0 then threshold = 18 end
        end
        return boolResult(distance <= threshold, "position_distance", {
            current=distance,required=threshold,mode=mode,
        })

    elseif kind == "location" then
        local target = lower(goal.location)
        if target == "" then return unknown("location_missing") end
        local zone = lower(playerState.zone)
        local subzone = lower(playerState.subzone)
        local matched =
            (zone ~= "" and (zone == target or string.find(zone,target,1,true))) or
            (subzone ~= "" and (subzone == target or string.find(subzone,target,1,true)))
        return boolResult(matched, "location_name", {
            target=goal.location,zone=playerState.zone,subzone=playerState.subzone,
        })

    elseif kind == "xp" then
        local target = goal.xpTarget or {}
        local level = tonumber(playerState.level) or 1
        local xp = tonumber(playerState.xp) or 0
        local xpMax = tonumber(playerState.xpMax) or 0
        local complete
        if target.mode == "earned" and target.level then
            complete = level > target.level or
                (level == target.level and xp >= (tonumber(target.amount) or 0))
        elseif target.mode == "remaining" and target.level then
            complete = level > target.level or
                (level == target.level and xpMax > 0 and
                    (xpMax - xp) <= (tonumber(target.amount) or 0))
        elseif target.mode == "level_compare" and target.level then
            complete = compare(target.operator, level, target.level)
        elseif target.level then
            complete = level >= target.level
        else
            return unknown("xp_target_invalid")
        end
        return boolResult(complete, "xp_target", {
            level=level,xp=xp,xpMax=xpMax,target=target,
        })

    elseif kind == "money" then
        local target = goal.moneyTarget or {}
        if target.copper == nil then return unknown("money_target_invalid") end
        local current = tonumber(playerState.money) or 0
        return boolResult(
            compare(target.operator, current, target.copper),
            "money_target",
            {current=current,required=target.copper,operator=target.operator})

    elseif kind == "skill" then
        local target = goal.skillTarget or {}
        if not target.name or target.name == "" or target.amount == nil then
            return unknown("skill_target_invalid")
        end
        local fact = playerState.skills and playerState.skills[target.name]
        local current = fact and tonumber(fact.effective) or 0
        return boolResult(
            compare(target.operator, current, target.amount),
            "skill_target",
            {current=current,required=target.amount,operator=target.operator,name=target.name})

    elseif kind == "reputation" then
        local target = goal.reputationTarget or {}
        local fact = playerState.reputations and
            playerState.reputations[tonumber(target.factionID)]
        if not fact then return unknown("reputation_fact_missing") end
        local reaction = tonumber(fact.reaction) or 0
        local required = tonumber(target.standing) or 0
        local complete = reaction > required
        if reaction == required then
            if target.progress ~= nil then
                local within = (tonumber(fact.currentStanding) or 0) -
                    (tonumber(fact.currentReactionThreshold) or 0)
                complete = compare(target.progressOperator, within, target.progress)
            else
                complete = true
            end
        end
        return boolResult(complete, "reputation_target", {
            reaction=reaction,requiredStanding=required,factionID=target.factionID,
        })

    elseif kind == "aura" then
        local value = playerState.auras and
            playerState.auras[tonumber(goal.auraSpellID)]
        if value == nil then return unknown("aura_fact_missing") end
        return boolResult(
            goal.auraWanted and value or (not value),
            "aura_target",
            {spellID=goal.auraSpellID,wanted=goal.auraWanted,active=value})

    elseif kind == "train" then
        if not goal.spellID then return unknown("train_spell_missing") end
        local known = playerState.spells and playerState.spells[tonumber(goal.spellID)]
        if known ~= nil then
            return boolResult(known, "spell_known", {spellID=goal.spellID})
        end
        return unknown("spell_known_fact_missing")

    elseif kind == "equip" then
        if not goal.equipSlot then return unknown("equip_slot_missing") end
        local equipped = playerState.equipment and
            playerState.equipment[tonumber(goal.equipSlot)]
        local complete
        if goal.itemID then
            complete = tonumber(equipped) == tonumber(goal.itemID)
        else
            complete = tonumber(equipped) ~= nil
        end
        return boolResult(complete, "equipment_fact", {
            slot=goal.equipSlot,current=equipped,required=goal.itemID,
        })

    elseif kind == "timer" then
        if not goal.timerSeconds or not MG.ActionMemory then
            return unknown("timer_unavailable")
        end
        local elapsed = MG.ActionMemory:Elapsed(goal.id)
        return boolResult(elapsed >= tonumber(goal.timerSeconds), "timer_elapsed", {
            current=elapsed,required=goal.timerSeconds,label=goal.timerLabel,
        })

    elseif kind == "spell_action" then
        if goal.spellID and recent(goal, "spell", goal.spellID, 12) then
            return boolResult(true, "recent_spell_action", {spellID=goal.spellID})
        end
        return unknown("spell_action_waiting", {spellID=goal.spellID})

    elseif kind == "travel" then
        if recent(goal, "travel", goal.action, 20) or
           recent(goal, goal.action, goal.location or "*", 20) then
            return boolResult(true, "recent_travel_action")
        end
        local target = lower(goal.location)
        if target ~= "" then
            local zone, subzone = lower(playerState.zone), lower(playerState.subzone)
            if zone == target or subzone == target then
                return boolResult(true, "travel_arrived", {target=goal.location})
            end
        end
        return unknown("travel_waiting")

    elseif kind == "manual" or kind == "action" then
        local id = goal.targetID or goal.optionID or goal.itemID or
            goal.spellID or goal.location or "*"
        if recent(goal, goal.action, id, 12) then
            return boolResult(true, "recent_action_event", {action=goal.action,id=id})
        end
        return unknown("manual_action_waiting:" .. tostring(goal.action))
    end

    return unknown("unsupported_completion_kind:" .. tostring(kind))
end
