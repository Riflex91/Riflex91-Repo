local addonName, MB = ...

MB.Locale = MB.Locale or {}

local strings = {
    enUS = {
        TITLE = "Bag",
        SEARCH = "Search...",
        EQUIPPED_BAGS = "Equipped Bags",
        AVAILABLE_BAGS = "Available Bags",
        BAG_PANEL = "Bags",
        CAPACITY = "%d slots",
        RESET_DONE = "Window position reset.",
    },
    enGB = {
        TITLE = "Bag",
        SEARCH = "Search...",
        EQUIPPED_BAGS = "Equipped Bags",
        AVAILABLE_BAGS = "Available Bags",
        BAG_PANEL = "Bags",
        CAPACITY = "%d slots",
        RESET_DONE = "Window position reset.",
    },
    deDE = {
        TITLE = "Tasche",
        SEARCH = "Suchen...",
        EQUIPPED_BAGS = "Angelegte Taschen",
        AVAILABLE_BAGS = "Verfügbare Taschen",
        BAG_PANEL = "Taschen",
        CAPACITY = "%d Plätze",
        RESET_DONE = "Fensterposition zurückgesetzt.",
    },
    frFR = {
        TITLE = "Sac",
        SEARCH = "Rechercher...",
        EQUIPPED_BAGS = "Sacs équipés",
        AVAILABLE_BAGS = "Sacs disponibles",
        BAG_PANEL = "Sacs",
        CAPACITY = "%d emplacements",
        RESET_DONE = "Position de la fenêtre réinitialisée.",
    },
    esES = {
        TITLE = "Bolsa",
        SEARCH = "Buscar...",
        EQUIPPED_BAGS = "Bolsas equipadas",
        AVAILABLE_BAGS = "Bolsas disponibles",
        BAG_PANEL = "Bolsas",
        CAPACITY = "%d huecos",
        RESET_DONE = "Posición de la ventana restablecida.",
    },
    esMX = {
        TITLE = "Bolsa",
        SEARCH = "Buscar...",
        EQUIPPED_BAGS = "Bolsas equipadas",
        AVAILABLE_BAGS = "Bolsas disponibles",
        BAG_PANEL = "Bolsas",
        CAPACITY = "%d espacios",
        RESET_DONE = "Posición de la ventana restablecida.",
    },
    itIT = {
        TITLE = "Borsa",
        SEARCH = "Cerca...",
        EQUIPPED_BAGS = "Borse equipaggiate",
        AVAILABLE_BAGS = "Borse disponibili",
        BAG_PANEL = "Borse",
        CAPACITY = "%d scomparti",
        RESET_DONE = "Posizione della finestra ripristinata.",
    },
    ptBR = {
        TITLE = "Bolsa",
        SEARCH = "Buscar...",
        EQUIPPED_BAGS = "Bolsas equipadas",
        AVAILABLE_BAGS = "Bolsas disponíveis",
        BAG_PANEL = "Bolsas",
        CAPACITY = "%d espaços",
        RESET_DONE = "Posição da janela redefinida.",
    },
    ruRU = {
        TITLE = "Сумка",
        SEARCH = "Поиск...",
        EQUIPPED_BAGS = "Надетые сумки",
        AVAILABLE_BAGS = "Доступные сумки",
        BAG_PANEL = "Сумки",
        CAPACITY = "%d ячеек",
        RESET_DONE = "Положение окна сброшено.",
    },
    koKR = {
        TITLE = "가방",
        SEARCH = "검색...",
        EQUIPPED_BAGS = "장착한 가방",
        AVAILABLE_BAGS = "사용 가능한 가방",
        BAG_PANEL = "가방",
        CAPACITY = "%d칸",
        RESET_DONE = "창 위치를 초기화했습니다.",
    },
    zhCN = {
        TITLE = "背包",
        SEARCH = "搜索...",
        EQUIPPED_BAGS = "已装备背包",
        AVAILABLE_BAGS = "可用背包",
        BAG_PANEL = "背包",
        CAPACITY = "%d格",
        RESET_DONE = "窗口位置已重置。",
    },
    zhTW = {
        TITLE = "背包",
        SEARCH = "搜尋...",
        EQUIPPED_BAGS = "已裝備背包",
        AVAILABLE_BAGS = "可用背包",
        BAG_PANEL = "背包",
        CAPACITY = "%d格",
        RESET_DONE = "視窗位置已重設。",
    },
}

local locale = "enUS"
if type(GetLocale) == "function" then
    local ok, value = pcall(GetLocale)
    if ok and type(value) == "string" then
        locale = value
    end
end

MB.Locale.code = locale
MB.L = strings[locale] or strings.enUS

MB.Locale.slotWords = {
    "slot", "slots",
    "platz", "plätze",
    "emplacement", "emplacements",
    "hueco", "huecos", "espacio", "espacios",
    "scomparto", "scomparti",
    "espaço", "espaços",
    "ячейка", "ячейки", "ячеек",
    "칸",
    "格",
}
