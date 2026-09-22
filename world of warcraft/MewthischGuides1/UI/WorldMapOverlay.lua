local addonName, MG = ...

MG.WorldMapOverlay = MG.WorldMapOverlay or {}
local W = MG.WorldMapOverlay
local UI = MG.UICompat
local UPDATE_INTERVAL = 0.15

local function shown(frame)
    return frame and frame.IsShown and frame:IsShown()
end

local function mapID()
    if not WorldMapFrame then return nil end
    if WorldMapFrame.GetMapID then
        local ok,value=pcall(WorldMapFrame.GetMapID,WorldMapFrame)
        if ok and tonumber(value) then return tonumber(value) end
    end
    return tonumber(WorldMapFrame.mapID)
end

local function canvas()
    if not WorldMapFrame then return nil end
    if WorldMapFrame.ScrollContainer then
        if WorldMapFrame.ScrollContainer.Child then
            return WorldMapFrame.ScrollContainer.Child
        end
        return WorldMapFrame.ScrollContainer
    end
    return WorldMapFrame
end

function W:Create()
    if self.driver then return self.driver end
    local driver=CreateFrame("Frame",nil,UIParent)
    self.driver=driver
    self.elapsed=0

    local marker=CreateFrame("Frame","MewthischGuides1WorldMapMarker",UIParent)
    UI:SetSize(marker,18,18)
    UI:SetFrameStrata(marker,"TOOLTIP")
    marker:EnableMouse(true)

    local shadow=marker:CreateTexture(nil,"BACKGROUND")
    shadow:SetPoint("CENTER",1,-1);UI:SetSize(shadow,18,18)
    UI:SetSolid(shadow,0,0,0,.85)

    local fill=marker:CreateTexture(nil,"ARTWORK")
    fill:SetPoint("CENTER");UI:SetSize(fill,13,13)
    UI:SetSolid(fill,1,.62,.06,1)

    local center=marker:CreateTexture(nil,"OVERLAY")
    center:SetPoint("CENTER");UI:SetSize(center,5,5)
    UI:SetSolid(center,.08,.05,.01,1)

    marker:SetScript("OnEnter",function()
        if GameTooltip then
            GameTooltip:SetOwner(marker,"ANCHOR_RIGHT")
            GameTooltip:SetText("Mewthisch Guides")
            local runtime=MG.RuntimeStore and MG.RuntimeStore:Get() or nil
            local goal=runtime and runtime.destinationGoal
            if goal and goal.targetName then GameTooltip:AddLine(tostring(goal.targetName),1,1,1) end
            GameTooltip:Show()
        end
    end)
    marker:SetScript("OnLeave",function() if GameTooltip then GameTooltip:Hide() end end)
    marker:Hide()
    self.marker=marker
    self.frame=marker

    driver:SetScript("OnUpdate",function(_,delta)
        W.elapsed=W.elapsed+(tonumber(delta) or 0)
        if W.elapsed<UPDATE_INTERVAL then return end
        W.elapsed=0
        W:Refresh()
    end)
    if MG.ThemeManager then MG.ThemeManager:ApplyAll() end
    return driver
end

function W:Refresh()
    self:Create()
    local settings=MG.db and MG.db.settings or {}
    if settings.showWorldMapMarker==false or not shown(WorldMapFrame) then
        self.marker:Hide();return
    end

    local runtime=MG.RuntimeStore and MG.RuntimeStore:Get() or nil
    local waypoint=runtime and runtime.currentRouteSegment and
        runtime.currentRouteSegment.waypoint or
        (runtime and runtime.destinationWaypoint)
    if not waypoint or not MG.CoordinateConverter then
        self.marker:Hide();return
    end

    local point,reason=MG.CoordinateConverter:WaypointToMap(waypoint)
    local currentMap=mapID()
    local targetMap=point and tonumber(point.mapID) or tonumber(waypoint.mapID)

    if not point or not currentMap or targetMap~=currentMap then
        self.marker:Hide()
        if MG.db then
            MG.db.runtime=MG.db.runtime or {}
            MG.db.runtime.worldMap={
                visible=false,reason=reason or "different_map",
                currentMap=currentMap,targetMap=targetMap,waypoint=waypoint,
            }
        end
        return
    end

    local host=canvas()
    if not host or not host.GetWidth or not host.GetHeight then
        self.marker:Hide();return
    end
    local width,height=host:GetWidth(),host:GetHeight()
    if not width or not height or width<=0 or height<=0 then
        self.marker:Hide();return
    end

    local x,y=tonumber(point.x),tonumber(point.y)
    if not x or not y or x<0 or x>1 or y<0 or y>1 then
        self.marker:Hide();return
    end

    if self.marker.SetParent then self.marker:SetParent(host) end
    self.marker:ClearAllPoints()
    self.marker:SetPoint("CENTER",host,"TOPLEFT",x*width,-y*height)
    self.marker:Show()

    if MG.db then
        MG.db.runtime=MG.db.runtime or {}
        MG.db.runtime.worldMap={
            visible=true,reason=reason,mapID=currentMap,x=x,y=y,waypoint=waypoint,
        }
    end
end
