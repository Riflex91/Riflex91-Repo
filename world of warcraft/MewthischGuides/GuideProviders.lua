local addonName, MG = ...

MG.GuideProviders = MG.GuideProviders or {}
local P = MG.GuideProviders
P.providers = P.providers or {}
P.order = P.order or {}

local function copyList(list)
    local out = {}
    for _, value in ipairs(list or {}) do out[#out + 1] = value end
    return out
end

function P:Register(id, provider)
    id=tostring(id or "")
    if id=="" or type(provider)~="table" then return false,"invalid_provider" end
    if self.providers[id] then return false,"duplicate_provider" end
    provider.id=id;self.providers[id]=provider;self.order[#self.order+1]=id
    return true,provider
end
function P:Get(id) return self.providers[tostring(id or "")] end

function P:Collect()
    local legacy,compiled={},{}
    local stats={providers=0,legacyGuides=0,compiledGuides=0,errors={}}
    for _,id in ipairs(self.order) do
        local provider=self.providers[id];stats.providers=stats.providers+1
        if provider.LoadLegacyGuides then
            local ok,values=pcall(provider.LoadLegacyGuides,provider)
            if ok and type(values)=="table" then
                for _,guide in ipairs(values) do guide.providerID=guide.providerID or id;legacy[#legacy+1]=guide;stats.legacyGuides=stats.legacyGuides+1 end
            elseif not ok then
                stats.errors[#stats.errors+1]={provider=id,stage="legacy",error=tostring(values)}
                if MG.Log then MG:Log("ERROR","guide.provider_legacy_failed",tostring(values),{provider=id}) end
            end
        end
        if provider.LoadCompiledGuides then
            local ok,values=pcall(provider.LoadCompiledGuides,provider)
            if ok and type(values)=="table" then
                for _,guide in ipairs(values) do guide.providerID=guide.providerID or id;compiled[#compiled+1]=guide;stats.compiledGuides=stats.compiledGuides+1 end
            elseif not ok then
                stats.errors[#stats.errors+1]={provider=id,stage="compiled",error=tostring(values)}
                if MG.Log then MG:Log("ERROR","guide.provider_compiled_failed",tostring(values),{provider=id}) end
            end
        end
    end
    return legacy,compiled,stats
end

function MG:RegisterGuideProvider(id,provider) return P:Register(id,provider) end
function MG:RegisterGuideData(id,guides,options)
    options=options or {}
    return P:Register(id,{label=options.label or id,capabilities=options.capabilities,
        LoadLegacyGuides=function() return copyList(guides or {}) end,
        LoadCompiledGuides=options.LoadCompiledGuides})
end

P:Register("local-data",{label="Mewthisch local data",LoadLegacyGuides=function()
    local out={}
    if MG.Data then
        for _,guide in ipairs(MG.Data.guides or {}) do out[#out+1]=guide end
        if type(MG.Data.guide)=="table" then out[#out+1]=MG.Data.guide end
    end
    return out
end})

P:Register("restedxp-forever",{label="RestedXP Forever public data",
    LoadLegacyGuides=function() return MG.RestEDXPImport and MG.RestEDXPImport:BuildGuides() or {} end,
    LoadCompiledGuides=function() return MG.GuideCompiler and MG.GuideCompiler:BuildRestedXPCompiledGuides() or {} end})
