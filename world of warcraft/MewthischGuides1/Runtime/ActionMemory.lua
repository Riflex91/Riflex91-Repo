local addonName, MG = ...

MG.ActionMemory = MG.ActionMemory or {}
local A = MG.ActionMemory
A.manual = A.manual or {}
A.events = A.events or {}
A.goalSeen = A.goalSeen or {}

local function now()
    return GetTime and GetTime() or (time and time() or 0)
end

local function key(kind, id)
    return tostring(kind or "event") .. ":" .. tostring(id or "*")
end

function A:ResetGuide()
    self.manual = {}
    self.events = {}
    self.goalSeen = {}
end

function A:Seen(goalID)
    if not goalID then return nil end
    local value = self.goalSeen[goalID]
    if value == nil then
        value = now()
        self.goalSeen[goalID] = value
    end
    return value
end

function A:Elapsed(goalID)
    local started = self:Seen(goalID)
    return started and math.max(0, now() - started) or 0
end

function A:MarkManual(goalID, reason)
    if not goalID then return false end
    self.manual[goalID] = {
        at=now(),
        reason=reason or "user",
    }
    if MG.Log then
        MG:Log("INFO", "goal.manual_complete", "Ziel manuell als erledigt markiert.", {
            goalID=goalID,reason=reason,
        })
    end
    return true
end

function A:ClearManual(goalID)
    if goalID then self.manual[goalID] = nil end
end

function A:IsManualComplete(goalID)
    return goalID and self.manual[goalID] ~= nil or false
end

function A:Record(kind, id, data)
    local record = {
        kind=kind,
        id=id,
        at=now(),
        data=data,
    }
    self.events[key(kind,id)] = record
    self.events[key(kind,"*")] = record
    return record
end

function A:Recent(kind, id, seconds)
    seconds = tonumber(seconds) or 8
    local record = self.events[key(kind,id)] or self.events[key(kind,"*")]
    if not record then return nil end
    if now() - (tonumber(record.at) or 0) <= seconds then return record end
    return nil
end

function A:Snapshot()
    return {
        manual=MG.Util and MG.Util:Copy(self.manual) or self.manual,
        events=MG.Util and MG.Util:Copy(self.events) or self.events,
        goalSeen=MG.Util and MG.Util:Copy(self.goalSeen) or self.goalSeen,
    }
end
