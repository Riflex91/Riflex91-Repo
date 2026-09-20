local addonName, MG = ...

MG.TravelGraph = MG.TravelGraph or {}
local Graph = MG.TravelGraph

Graph.nodes = Graph.nodes or {}
Graph.edges = Graph.edges or {}

function Graph:Load(data)
    self.nodes, self.edges = {}, {}
    data = data or (MG.Data and MG.Data.travelGraph) or {}

    for _, node in ipairs(data.nodes or {}) do
        if node.id then self.nodes[node.id] = node end
    end

    for _, edge in ipairs(data.edges or {}) do
        if edge.from and edge.to then
            self.edges[edge.from] = self.edges[edge.from] or {}
            self.edges[edge.from][#self.edges[edge.from] + 1] = edge
            if edge.bidirectional then
                self.edges[edge.to] = self.edges[edge.to] or {}
                local reverse = {}
                for key, value in pairs(edge) do reverse[key] = value end
                reverse.from, reverse.to = edge.to, edge.from
                self.edges[edge.to][#self.edges[edge.to] + 1] = reverse
            end
        end
    end

    if MG.db then
        MG.db.runtime = MG.db.runtime or {}
        local nodeCount, edgeCount = 0, 0
        for _ in pairs(self.nodes) do nodeCount = nodeCount + 1 end
        for _, list in pairs(self.edges) do edgeCount = edgeCount + #list end
        MG.db.runtime.travelGraph = {
            nodes = nodeCount,
            edges = edgeCount,
            loaded = true,
        }
    end
end

local function edgeAllowed(edge, context)
    if edge.disabled then return false end
    if type(edge.condition) == "function" then
        local ok, value = pcall(edge.condition, context)
        return ok and value and true or false
    end
    return true
end

function Graph:Plan(fromID, toID, context)
    if not fromID or not toID or not self.nodes[fromID] or not self.nodes[toID] then
        return nil, "unknown_node"
    end

    if fromID == toID then return { self.nodes[fromID] }, "already_there" end

    local dist, prev, visited = {}, {}, {}
    for id in pairs(self.nodes) do dist[id] = math.huge end
    dist[fromID] = 0

    while true do
        local current, best = nil, math.huge
        for id, value in pairs(dist) do
            if not visited[id] and value < best then current, best = id, value end
        end
        if not current then break end
        if current == toID then break end
        visited[current] = true

        for _, edge in ipairs(self.edges[current] or {}) do
            if self.nodes[edge.to] and edgeAllowed(edge, context) then
                local cost = tonumber(edge.cost or edge.seconds or edge.distance) or 1
                if cost < 0 then cost = 0 end
                local candidate = best + cost
                if candidate < (dist[edge.to] or math.huge) then
                    dist[edge.to] = candidate
                    prev[edge.to] = { node = current, edge = edge }
                end
            end
        end
    end

    if not prev[toID] then return nil, "no_path" end

    local reversed = {}
    local cursor = toID
    while cursor do
        reversed[#reversed + 1] = {
            node = self.nodes[cursor],
            via = prev[cursor] and prev[cursor].edge or nil,
        }
        if cursor == fromID then break end
        cursor = prev[cursor] and prev[cursor].node or nil
    end

    local route = {}
    for index = #reversed, 1, -1 do route[#route + 1] = reversed[index] end

    if MG.db then
        MG.db.runtime = MG.db.runtime or {}
        MG.db.runtime.travelPlan = {
            from = fromID,
            to = toID,
            hops = #route,
            cost = dist[toID],
        }
    end

    return route, "resolved"
end

function Graph:GetNextHopTarget(step)
    local travel = step and step.definition and step.definition.travel or nil
    if type(travel) ~= "table" or not travel.from or not travel.to then return nil end

    local route = self:Plan(travel.from, travel.to, {
        profile = MG:GetPlayerProfile(),
        step = step,
    })
    if not route or #route < 2 then return nil end

    local node = route[2].node
    if node and tonumber(node.mapID) and tonumber(node.x) and tonumber(node.y) then
        return {
            mapID = tonumber(node.mapID),
            x = tonumber(node.x),
            y = tonumber(node.y),
            source = "TravelGraph",
            phaseMatch = true,
            travelNodeID = node.id,
        }
    end
    return nil
end
