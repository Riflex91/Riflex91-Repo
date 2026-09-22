local addonName, MG = ...

MG.ThemeManager = MG.ThemeManager or {}
local T = MG.ThemeManager

T.order={"Forever Classic","Obsidian","Arcane","Warcraft Heritage","ElvUI"}
T.themes={
    ["Forever Classic"]={
        background={.008,.010,.014,.985},header={.028,.032,.040,1},
        panel={.050,.040,.025,1},border={.52,.34,.10,1},
        accent={.96,.57,.05,1},progress={.18,.78,.32,1},
        title={1,.74,.08,1},text={.95,.95,.95,1},muted={.62,.62,.62,1},
        navigatorGlow={0,0,0,.18},
    },
    ["Obsidian"]={
        background={.018,.020,.024,.99},header={.035,.040,.046,1},
        panel={.045,.050,.058,1},border={.18,.20,.23,1},
        accent={.58,.66,.76,1},progress={.40,.65,.82,1},
        title={.82,.88,.95,1},text={.94,.96,.98,1},muted={.52,.57,.63,1},
        navigatorGlow={0,0,0,.28},
    },
    ["Arcane"]={
        background={.032,.018,.068,.985},header={.070,.035,.120,1},
        panel={.075,.045,.135,1},border={.45,.27,.78,1},
        accent={.62,.38,.95,1},progress={.52,.25,.92,1},
        title={.82,.62,1,1},text={.95,.90,1,1},muted={.65,.56,.80,1},
        navigatorGlow={.08,.02,.14,.28},
    },
    ["Warcraft Heritage"]={
        background={.075,.025,.018,.985},header={.20,.055,.025,1},
        panel={.135,.045,.025,1},border={.66,.32,.08,1},
        accent={1,.55,.12,1},progress={.95,.34,.06,1},
        title={1,.72,.18,1},text={1,.88,.67,1},muted={.74,.56,.40,1},
        navigatorGlow={.12,.025,.01,.28},
    },
    ["ElvUI"]={
        background={.055,.055,.055,.96},header={.045,.045,.045,1},
        panel={.085,.085,.085,1},border={.15,.15,.15,1},
        accent={.10,.64,.82,1},progress={.10,.64,.82,1},
        title={.90,.90,.90,1},text={.90,.90,.90,1},muted={.58,.58,.58,1},
        navigatorGlow={0,0,0,.24},adaptiveElvUI=true,
    },
}

local function copyColor(value,fallback)
    local source=type(value)=="table" and value or fallback
    if type(source)~="table" then return {1,1,1,1} end
    return {
        tonumber(source[1] or source.r) or 1,
        tonumber(source[2] or source.g) or 1,
        tonumber(source[3] or source.b) or 1,
        tonumber(source[4] or source.a) or 1,
    }
end

local function cloneTheme(theme)
    local out={}
    for key,value in pairs(theme or {}) do
        if type(value)=="table" then out[key]=copyColor(value)
        else out[key]=value end
    end
    return out
end

local function getElvUIEngine()
    local unpackFn=unpack or (table and table.unpack)
    if type(_G.ElvUI)~="table" or type(unpackFn)~="function" then return nil end
    local ok,engine=pcall(function()
        local E=unpackFn(_G.ElvUI)
        return E
    end)
    if ok and type(engine)=="table" then return engine end
    return nil
end

local function validColor(value)
    return type(value)=="table" and
        tonumber(value[1] or value.r)~=nil and
        tonumber(value[2] or value.g)~=nil and
        tonumber(value[3] or value.b)~=nil
end

local function color(region,value)
    if not region or not value then return end
    if region.SetColorTexture then
        pcall(region.SetColorTexture,region,value[1],value[2],value[3],value[4] or 1)
    elseif region.SetVertexColor then
        pcall(region.SetVertexColor,region,value[1],value[2],value[3],value[4] or 1)
    end
end

local function fontColor(font,value)
    if font and font.SetTextColor and value then
        pcall(font.SetTextColor,font,value[1],value[2],value[3],value[4] or 1)
    end
end

local function fontFace(font,path)
    if not font or type(path)~="string" or path=="" or
       not font.GetFont or not font.SetFont then return end
    local ok,current,size,flags=pcall(font.GetFont,font)
    if ok and size then pcall(font.SetFont,font,path,size,flags) end
end

function T:IsElvUIAvailable()
    return getElvUIEngine()~=nil
end

function T:Resolve(name)
    name=self.themes[name] and name or "Forever Classic"
    local theme=cloneTheme(self.themes[name])
    if name~="ElvUI" or not theme.adaptiveElvUI then return theme,name end

    local E=getElvUIEngine()
    if not E then return theme,name end
    local media=type(E.media)=="table" and E.media or {}
    local db=type(E.db)=="table" and E.db or {}
    local general=type(db.general)=="table" and db.general or {}

    local backdrop=media.backdropfadecolor
    if not validColor(backdrop) then backdrop=general.backdropfadecolor end
    if validColor(backdrop) then
        theme.background=copyColor(backdrop,theme.background)
        theme.panel=copyColor(backdrop,theme.panel)
        theme.header={
            math.max(0,theme.background[1]*.75),
            math.max(0,theme.background[2]*.75),
            math.max(0,theme.background[3]*.75),1,
        }
    end

    local border=media.bordercolor
    if not validColor(border) then border=general.bordercolor end
    if validColor(border) then theme.border=copyColor(border,theme.border) end

    local valueColor=media.rgbvaluecolor
    if validColor(valueColor) then
        theme.accent=copyColor(valueColor,theme.accent)
        theme.progress=copyColor(valueColor,theme.progress)
        theme.title=copyColor(valueColor,theme.title)
    end
    if type(media.normFont)=="string" and media.normFont~="" then
        theme.font=media.normFont
    end
    theme.elvUIDetected=true
    return theme,name
end

function T:GetCurrent()
    local name=MG.db and MG.db.settings and MG.db.settings.theme or "Forever Classic"
    return self:Resolve(name)
end

function T:Set(name)
    if not self.themes[name] then return false end
    MG:EnsureDB().settings.theme=name
    self:ApplyAll()
    if MG.Log then MG:Log("INFO","theme.changed","Theme geändert.",{
        theme=name,elvUIAvailable=self:IsElvUIAvailable(),
    }) end
    return true
end

function T:Next()
    local _,current=self:GetCurrent()
    local index=1
    for i,name in ipairs(self.order) do if name==current then index=i break end end
    index=index%#self.order+1
    self:Set(self.order[index])
    return self.order[index]
end

function T:ApplyViewer(viewer)
    local theme=self:GetCurrent()
    if not viewer then return end
    color(viewer.themeBackground,theme.background)
    color(viewer.themeHeader,theme.header)
    color(viewer.themeTop,theme.accent)
    color(viewer.bar,theme.progress)
    fontColor(viewer.themeTitle,theme.title)
    fontColor(viewer.guideTitle,theme.title)
    fontColor(viewer.stepText,theme.muted)
    fontColor(viewer.footer,theme.muted)
    fontFace(viewer.themeTitle,theme.font)
    fontFace(viewer.guideTitle,theme.font)
    fontFace(viewer.stepText,theme.font)
    fontFace(viewer.footer,theme.font)
    for _,row in ipairs(viewer.rows or {}) do
        fontFace(row.text,theme.font);fontFace(row.marker,theme.font)
    end
end

function T:ApplyNavigator(nav)
    local theme=self:GetCurrent()
    if not nav then return end
    color(nav.glow,theme.navigatorGlow)
    fontColor(nav.distance,theme.title)
    fontColor(nav.route,theme.muted)
    fontFace(nav.distance,theme.font)
    fontFace(nav.target,theme.font)
    fontFace(nav.route,theme.font)
end

function T:ApplyAll()
    if MG.GuideViewer then self:ApplyViewer(MG.GuideViewer) end
    if MG.NavigatorFrame then self:ApplyNavigator(MG.NavigatorFrame) end
    if MG.MinimapButton and MG.MinimapButton.ApplyTheme then
        local theme=self:GetCurrent()
        MG.MinimapButton:ApplyTheme(theme)
    end
end
