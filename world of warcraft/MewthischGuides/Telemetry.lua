local addonName, MG = ...

MG.Telemetry = MG.Telemetry or {}
local T = MG.Telemetry

T.counters = T.counters or {}
T.last = T.last or {}

local function safe(value, depth)
    local valueType = type(value)
    if valueType == "nil" or valueType == "string" or
       valueType == "number" or valueType == "boolean" then
        return value
    end

    if valueType ~= "table" then return tostring(value) end
    depth = depth or 0
    if depth >= 2 then return "<max-depth>" end

    local out, count = {}, 0
    for key, child in pairs(value) do
        count = count + 1
        if count > 16 then
            out["<truncated>"] = true
            break
        end
        local safeKey = type(key) == "string" or type(key) == "number"
        out[safeKey and key or tostring(key)] = safe(child, depth + 1)
    end
    return out
end

function T:Count(name, data)
    name = tostring(name or "unknown")
    self.counters[name] = (self.counters[name] or 0) + 1
    self.last[name] = {
        at = time and time() or 0,
        data = safe(data),
    }

    if MG.db then
        MG.db.runtime = MG.db.runtime or {}
        MG.db.runtime.telemetry = {
            counters = self.counters,
            last = self.last,
            localOnly = true,
        }
    end
end

function T:GetSnapshot()
    return {
        counters = self.counters,
        last = self.last,
        localOnly = true,
    }
end
