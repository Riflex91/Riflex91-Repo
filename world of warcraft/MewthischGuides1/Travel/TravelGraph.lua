local addonName, MG = ...

MG.TravelGraph = MG.TravelGraph or {}
local G = MG.TravelGraph

G.nodes = G.nodes or {}
G.edges = G.edges or {}

function G:Load(data)
    self.nodes = {}
    self.edges = {}
    data = data or MG.RestEDXPTravelGraph or {}

    for _, node in ipairs(data.nodes or {}) do
        if node.id then self.nodes[node.id] = MG.Util:Copy(node) end
    end

    for _, edge in ipairs(data.edges or {}) do
        if edge.from and edge.to and self.nodes[edge.from] and self.nodes[edge.to] then
            self.edges[edge.from] = self.edges[edge.from] or {}
            self.edges[edge.from][#self.edges[edge.from] + 1] = MG.Util:Copy(edge)
            if edge.bidirectional then
                self.edges[edge.to] = self.edges[edge.to] or {}
                local reverse = MG.Util:Copy(edge)
                reverse.from, reverse.to = edge.to, edge.from
                self.edges[edge.to][#self.edges[edge.to] + 1] = reverse
            end
        end
    end

    if MG.db then
        local nodeCount, edgeCount = 0, 0
        for _ in pairs(self.nodes) do nodeCount = nodeCount + 1 end
        for _, list in pairs(self.edges) do edgeCount = edgeCount + #list end
        MG.db.runtime = MG.db.runtime or {}
        MG.db.runtime.travelGraph = {
            nodes=nodeCount,
            edges=edgeCount,
            source=data.source or "RestedXP-compatible",
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

function G:Plan(fromID, toID, context)
    if not fromID or not toID or not self.nodes[fromID] or not self.nodes[toID] then
        return nil, "unknown_node"
    end
    if fromID == toID then return {{node=self.nodes[fromID]}}, "already_there" end

    local dist, prev, visited = {}, {}, {}
    for id in pairs(self.nodes) do dist[id] = math.huge end
    dist[fromID] = 0

    while true do
        local current, best
        for id, value in pairs(dist) do
            if not visited[id] and (best == nil or value < best) then
                current, best = id, value
            end
        end
        if not current then break end
        if current == toID then break end
        visited[current] = true

        for _, edge in ipairs(self.edges[current] or {}) do
            if edgeAllowed(edge, context) then
                local cost = tonumber(edge.cost or edge.seconds or edge.distance) or 1
                if cost < 0 then cost = 0 end
                local candidate = best + cost
                if candidate < (dist[edge.to] or math.huge) then
                    dist[edge.to] = candidate
                    prev[edge.to] = { node=current, edge=edge }
                end
            end
        end
    end

    if not prev[toID] then return nil, "no_path" end

    local reversed, cursor = {}, toID
    while cursor do
        reversed[#reversed + 1] = {
            node=self.nodes[cursor],
            via=prev[cursor] and prev[cursor].edge or nil,
        }
        if cursor == fromID then break end
        cursor = prev[cursor] and prev[cursor].node or nil
    end

    local route = {}
    for i=#reversed,1,-1 do route[#route + 1] = reversed[i] end
    return route, "resolved", dist[toID]
end

function G:Snapshot()
    local nodeCount, edgeCount = 0, 0
    for _ in pairs(self.nodes or {}) do nodeCount = nodeCount + 1 end
    for _, list in pairs(self.edges or {}) do edgeCount = edgeCount + #list end
    return {nodes=nodeCount,edges=edgeCount}
end
