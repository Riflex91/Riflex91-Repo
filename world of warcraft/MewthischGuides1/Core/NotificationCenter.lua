local addonName, MG = ...

MG.NotificationCenter = MG.NotificationCenter or {}
local N = MG.NotificationCenter
local MAX_HISTORY = 120

local function now()
    return time and time() or 0
end

local function categorySetting(kind)
    kind=tostring(kind or "")
    if kind=="guide" then return "notifyGuideEvents" end
    if kind=="inventory" then return "notifyInventoryEvents" end
    if kind=="merchant" or kind=="repair" then return "notifyMerchantEvents" end
    return nil
end

function N:IsEnabled(kind)
    local settings=MG:EnsureDB().settings
    if settings.notificationsEnabled==false then return false end
    local key=categorySetting(kind)
    if key and settings[key]==false then return false end
    return true
end

function N:GetHistory()
    return MG:EnsureDB().notifications
end

function N:GetUnreadCount()
    local count=0
    for _,entry in ipairs(self:GetHistory()) do
        if entry.unread then count=count+1 end
    end
    return count
end

function N:MarkAllRead()
    for _,entry in ipairs(self:GetHistory()) do entry.unread=false end
    if MG.MinimapButton and MG.MinimapButton.Refresh then MG.MinimapButton:Refresh() end
end

function N:Clear()
    local db=MG:EnsureDB()
    db.notifications={}
    if MG.MinimapButton and MG.MinimapButton.Refresh then MG.MinimapButton:Refresh() end
end

function N:Notify(kind,title,message,data)
    if not self:IsEnabled(kind) then return nil,"disabled" end
    local db=MG:EnsureDB()
    local entry={
        id=(db.notificationSequence or 0)+1,
        at=now(),
        kind=tostring(kind or "general"),
        title=tostring(title or "Mewthisch Guides"),
        message=tostring(message or ""),
        data=MG.Util:Copy(data or {}),
        unread=true,
    }
    db.notificationSequence=entry.id
    db.notifications[#db.notifications+1]=entry
    while #db.notifications>MAX_HISTORY do table.remove(db.notifications,1) end

    if MG.Telemetry then MG.Telemetry:Count("notification."..entry.kind,{id=entry.id}) end
    if db.settings.notificationChat and DEFAULT_CHAT_FRAME and DEFAULT_CHAT_FRAME.AddMessage then
        pcall(DEFAULT_CHAT_FRAME.AddMessage,DEFAULT_CHAT_FRAME,
            "|cffffb000Mewthisch Guides|r "..entry.title..": "..entry.message)
    end
    if db.settings.notificationPopups~=false and MG.NotificationWindow then
        MG.NotificationWindow:ShowToast(entry)
    end
    if MG.MinimapButton and MG.MinimapButton.Refresh then MG.MinimapButton:Refresh() end
    return entry
end
