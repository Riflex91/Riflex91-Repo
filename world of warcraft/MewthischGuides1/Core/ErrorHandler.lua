local addonName, MG = ...

local MAX_LOGS = 1200

local function clean(value, depth)
    depth = depth or 0
    if depth > 4 then return "<depth-limit>" end
    if type(value) ~= "table" then return value end
    local out = {}
    for key, child in pairs(value) do
        local t = type(child)
        if t == "string" or t == "number" or t == "boolean" or t == "nil" then
            out[tostring(key)] = child
        elseif t == "table" then
            out[tostring(key)] = clean(child, depth + 1)
        else
            out[tostring(key)] = "<" .. t .. ">"
        end
    end
    return out
end

function MG:Log(level, event, message, data)
    local db = self:EnsureDB()
    db.logSequence = db.logSequence + 1
    db.logs[#db.logs + 1] = {
        seq = db.logSequence,
        at = self:Now(),
        level = tostring(level or "INFO"),
        event = tostring(event or "unknown"),
        message = tostring(message or ""),
        data = clean(data),
        revision = self.RuntimeStore and self.RuntimeStore:GetRevision() or 0,
    }
    while #db.logs > MAX_LOGS do table.remove(db.logs, 1) end
end

function MG:Safe(eventName, fn, ...)
    local args = { ... }
    local ok, result = xpcall(function()
        return fn(unpack(args))
    end, function(err)
        local stack = debugstack and debugstack(2, 12, 12) or tostring(err)
        self:Log("ERROR", eventName, tostring(err), { stack = stack })
        return err
    end)
    return ok, result
end
