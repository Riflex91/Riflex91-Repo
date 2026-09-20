local addonName, MG = ...

MG.Telemetry = MG.Telemetry or {}
local T = MG.Telemetry

T.counters = T.counters or {}
T.last = T.last or {}

function T:Count(name, data)
    name = tostring(name or "unknown")
    self.counters[name] = (self.counters[name] or 0) + 1
    self.last[name] = {
        at = time and time() or 0,
        data = data,
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
