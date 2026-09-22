local addonName, MG = ...

MG.ThemeManager = MG.ThemeManager or {}
local T = MG.ThemeManager

T.order={"Forever Classic","Obsidian","Arcane"}
T.themes={
    ["Forever Classic"]={
        background={.008,.010,.014,.985},
        header={.028,.032,.040,1},
        accent={.96,.57,.05,1},
        progress={.18,.78,.32,1},
        title={1,.74,.08,1},
        text={.95,.95,.95,1},
        muted={.62,.62,.62,1},
        navigatorGlow={0,0,0,.18},
    },
    ["Obsidian"]={
        background={.018,.020,.024,.99},
        header={.035,.040,.046,1},
        accent={.58,.66,.76,1},
        progress={.40,.65,.82,1},
        title={.82,.88,.95,1},
        text={.94,.96,.98,1},
        muted={.52,.57,.63,1},
        navigatorGlow={0,0,0,.28},
    },
    ["Arcane"]={
        background={.032,.018,.068,.985},
        header={.070,.035,.120,1},
        accent={.62,.38,.95,1},
        progress={.52,.25,.92,1},
        title={.82,.62,1,1},
        text={.95,.90,1,1},
        muted={.65,.56,.80,1},
        navigatorGlow={.08,.02,.14,.28},
    },
}

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

function T:GetCurrent()
    local name=MG.db and MG.db.settings and MG.db.settings.theme or "Forever Classic"
    if not self.themes[name] then name="Forever Classic" end
    return self.themes[name],name
end

function T:Set(name)
    if not self.themes[name] then return false end
    MG:EnsureDB().settings.theme=name
    self:ApplyAll()
    if MG.Log then MG:Log("INFO","theme.changed","Theme geändert.",{theme=name}) end
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
end

function T:ApplyNavigator(nav)
    local theme=self:GetCurrent()
    if not nav then return end
    color(nav.glow,theme.navigatorGlow)
    fontColor(nav.distance,theme.title)
    fontColor(nav.route,theme.muted)
end

function T:ApplyAll()
    if MG.GuideViewer then self:ApplyViewer(MG.GuideViewer) end
    if MG.NavigatorFrame then self:ApplyNavigator(MG.NavigatorFrame) end
end
