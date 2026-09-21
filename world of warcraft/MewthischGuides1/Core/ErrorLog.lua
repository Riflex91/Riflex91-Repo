local addonName, MG = ...

local MAX_LOGS = 600

local function timestamp()
    if date then return date("!%Y-%m-%dT%H:%M:%SZ") end
    if os and os.date then return os.date("!%Y-%m-%dT%H:%M:%SZ") end
    return tostring(time and time() or 0)
end

local function sanitize(value, depth, seen)
    depth = depth or 0
    if depth > 5 then return "<max-depth>" end
    if type(value) ~= "table" then
        if type(value) == "function" then return "<function>" end
        if type(value) == "userdata" then return "<userdata>" end
        return value
    end
    seen = seen or {}
    if seen[value] then return "<cycle>" end
    seen[value] = true
    local out = {}
    for key, child in pairs(value) do
        out[tostring(key)] = sanitize(child, depth + 1, seen)
    end
    return out
end

function MG:Log(level, event, message, data)
    local db = self:EnsureDB()
    db.logSequence = db.logSequence + 1
    db.logs[#db.logs + 1] = {
        seq = db.logSequence,
        at = timestamp(),
        level = tostring(level or "INFO"),
        event = tostring(event or "unknown"),
        message = tostring(message or ""),
        data = sanitize(data or {}),
        runtimeRevision = self.RuntimeStore and self.RuntimeStore:GetRevision() or 0,
    }
    while #db.logs > MAX_LOGS do table.remove(db.logs, 1) end
end

function MG:Safe(eventName, fn)
    local ok, result = xpcall(fn, function(err)
        local stack = debugstack and debugstack(2, 12, 12) or nil
        self:Log("ERROR", eventName, tostring(err), { stack = stack })
        return err
    end)
    if not ok and geterrorhandler then
        local handler = geterrorhandler()
        if handler then pcall(handler, result) end
    end
    return ok, result
end

local function flatten(value, prefix, out, depth)
    out = out or {}
    depth = depth or 0
    if depth > 5 then return out end
    if type(value) ~= "table" then
        out[#out + 1] = tostring(prefix or "value") .. "=" .. tostring(value)
        return out
    end
    local keys = {}
    for key in pairs(value) do keys[#keys + 1] = key end
    table.sort(keys, function(a,b) return tostring(a) < tostring(b) end)
    for _, key in ipairs(keys) do
        local p = prefix and (prefix .. "." .. tostring(key)) or tostring(key)
        if type(value[key]) == "table" then
            flatten(value[key], p, out, depth + 1)
        else
            out[#out + 1] = p .. "=" .. tostring(value[key])
        end
    end
    return out
end

function MG:GetErrorLogText(includeInfo)
    local db = self:EnsureDB()
    local source = self.RestEDXPForeverRaw and self.RestEDXPForeverRaw.source or {}
    local runtime = self.RuntimeStore and self.RuntimeStore:Get() or {}
    local lines = {
        "MEWTHISCH GUIDES 1.0 DIAGNOSTICS",
        "Version=" .. tostring(self.VERSION),
        "RestedXPCommit=" .. tostring(source.commit or "-"),
        "RuntimeRevision=" .. tostring(runtime.revision or 0),
        "Guide=" .. tostring(runtime.guideID or "-"),
        "Step=" .. tostring(runtime.stepID or "-"),
        string.rep("-", 72),
    }
    local count = 0
    for _, entry in ipairs(db.logs or {}) do
        if includeInfo or entry.level == "WARN" or entry.level == "ERROR" then
            count = count + 1
            lines[#lines + 1] = string.format(
                "[%s] #%s %s %s rev=%s",
                tostring(entry.level), tostring(entry.seq),
                tostring(entry.at), tostring(entry.event),
                tostring(entry.runtimeRevision or 0))
            lines[#lines + 1] = tostring(entry.message)
            for _, detail in ipairs(flatten(entry.data)) do
                lines[#lines + 1] = "  " .. detail
            end
            lines[#lines + 1] = ""
        end
    end
    if count == 0 then lines[#lines + 1] = "Keine passenden Logeinträge." end
    return table.concat(lines, "\n")
end
