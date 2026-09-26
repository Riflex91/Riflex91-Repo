local addonName, MG = ...

MG.Localization = MG.Localization or {}
local L = MG.Localization

L.supported = {
  auto={native="Automatic"}, en={native="English"}, zh={native="中文"},
  hi={native="हिन्दी"}, es={native="Español"}, fr={native="Français"},
  de={native="Deutsch"}, ru={native="Русский"},
}
L.order={"auto","en","zh","hi","es","fr","de","ru"}
L.clientMap={enUS="en",enGB="en",zhCN="zh",zhTW="zh",esES="es",esMX="es",frFR="fr",deDE="de",ruRU="ru"}

local en={
 settings_title="Mewthisch Guides - Settings",general="General",guides="Guides",navigation="Navigation",automation="Automation",gear="Gear",
 trainer="Trainer & Talents",map_markers="Map & Markers",display="Display",audio="Audio",data_import="Data & Import",advanced="Advanced",
 general_desc="Basic settings for Mewthisch Guides.",guides_desc="Manage guides, favorites and route synchronization.",
 navigation_desc="Arrow, route calculation and travel methods.",automation_desc="Automatic actions while leveling.",gear_desc="Upgrade detection and safe auto-equip.",
 trainer_desc="Training reminders and talent recommendations.",map_desc="Map display and markers.",display_desc="Visual presentation and themes.",
 audio_desc="Sound notifications.",data_desc="Guide data, imports and validation.",advanced_desc="Diagnostics and advanced options.",
 language="Language",language_auto="Automatic (WoW client)",minimap_button="Show minimap button",show_on_login="Show on login",compact_main="Compact main window",
 tooltips="Tooltips with extra information",character_profiles="Character-specific settings",route_mode="Route mode",manual_mode="Manual",auto_mode="Auto",
 smart_resync="Synchronize guide with quest progress automatically",skip_obsolete="Skip completed steps automatically",open_guides="Open guide selection",
 show_arrow="Show navigation arrow",navigator_locked="Lock arrow position",style="Style",size="Size",transparency="Transparency",preview="Preview",
 flight_paths="Use flight paths automatically",hearthstone="Consider Hearthstone",transports="Use ships and zeppelins",class_teleports="Use class teleports",
 fastest_route="Prefer fastest route",alt_routes="Suggest alternative routes",detailed_travel="Show detailed travel steps",estimated_time="Show estimated travel time",
 mark_next="Mark next flight master",hearth_reminder="Hearthstone reminder",transport_available="Show available transports",reset_arrow="Reset arrow position",
 auto_accept="Accept quests automatically",auto_turnin="Turn in completed quests automatically",auto_single_reward="Select a single quest reward automatically",
 auto_equip="Equip better gear automatically",gear_safe="Use safe mode",protect_boe="Protect Bind-on-Equip items",auto_weapons="Equip weapons automatically",
 high_confidence="Only auto-equip high-confidence upgrades",trainer_hints="Show trainer hints",talent_hints="Show talent recommendations",
 refresh_talent="Refresh talent recommendation",world_marker="Show quest target on world map",auto_supertrack="Track current quest automatically",theme="Theme",
 audio_enabled="Enable audio cues",audio_step="Sound on new guide step",audio_equip="Sound on automatic equip",diagnostics="Enable diagnostics log",
 telemetry="Store local runtime telemetry",open_info="Open diagnostics overview",refresh_data="Validate data again",data_status="Guide and import status",
 reset_all="Reset all settings",recommended="Recommended",all_guides="All Guides",favorites="Favorites",own_guides="Custom Guides",import_export="Import / Export",
 search_guide="Search guides...",faction="Faction",class="Class",category="Category",all="All",horde="Horde",alliance="Alliance",mage_aoe="Mage AoE Farm",
 favorite_add="Add favorite",favorite_remove="Remove favorite",start_guide="Start guide",levels="Levels",recommended_badge="Recommended",no_guides="No matching guides found.",
 step="Step",of="of",targets="Targets",map="Map",details="Details",skip="Skip",manual_mode_title="Manual Mode",target_missing="No reliable waypoint available",
 direction_missing="Direction unavailable",equipped="was equipped.",close="Close",back="Back",next="Next",previous="Previous",page="Page",
 profile="Profile",default_profile="Default",manage_profile="Manage profile",client_language="WoW client language",journey="Journey",quest_search="Quest search",
 route_calc="Route calculation",travel_hints="Travel hints",sound_hints="Sound hints",data_management="Data management",runtime_status="Runtime status",
 quest="Quest",quest_giver="Quest giver",source="Source",location="Location",
 accept_quest='Accept "%s".',accept_quest_at='Accept "%s" from %s.',turnin_quest='Turn in "%s".',turnin_quest_at='Turn in "%s" to %s.',
 kill_count="Kill %dx %s.",kill_target="Kill %s.",collect_count="Collect %dx %s.",collect_count_from="Collect %dx %s from %s.",
 collect_from="Collect %s from %s.",collect_target="Collect %s.",interact_with="Interact with %s.",continue_quest='Continue "%s".',

}

local de={
 settings_title="Mewthisch Guides - Einstellungen",general="Allgemein",guides="Guides",navigation="Navigation",automation="Automation",gear="Ausrüstung",
 trainer="Trainer & Talente",map_markers="Karte & Marker",display="Anzeige",audio="Audio",data_import="Daten & Import",advanced="Erweitert",
 general_desc="Grundlegende Einstellungen für Mewthisch Guides.",guides_desc="Verwalte Guides, Favoriten und Routensynchronisation.",
 navigation_desc="Einstellungen für Pfeil, Routenberechnung und Reisemethoden.",automation_desc="Automatische Aktionen beim Leveln.",gear_desc="Upgrade-Erkennung und sicheres Auto-Equip.",
 trainer_desc="Trainingserinnerungen und Talentempfehlungen.",map_desc="Kartenanzeige und Markierungen.",display_desc="Visuelle Darstellung und Designs.",
 audio_desc="Sound- und Hinweisfunktionen.",data_desc="Guide-Daten, Import und Validierung.",advanced_desc="Diagnose und erweiterte Optionen.",
 language="Sprache",language_auto="Automatisch (WoW-Client)",minimap_button="Minimap-Button anzeigen",show_on_login="Beim Einloggen anzeigen",compact_main="Kompaktes Hauptfenster",
 tooltips="Tooltips mit Zusatzinformationen",character_profiles="Charakterspezifische Einstellungen",route_mode="Routenmodus",manual_mode="Manuell",auto_mode="Auto",
 smart_resync="Guide automatisch mit Questfortschritt synchronisieren",skip_obsolete="Bereits erledigte Schritte automatisch überspringen",open_guides="Guide-Auswahl öffnen",
 show_arrow="Navigationspfeil anzeigen",navigator_locked="Pfeilposition sperren",style="Stil",size="Größe",transparency="Transparenz",preview="Vorschau",
 flight_paths="Flugpunkte automatisch nutzen",hearthstone="Hearthstone berücksichtigen",transports="Schiffe und Zeppeline nutzen",class_teleports="Klassen-Teleports nutzen",
 fastest_route="Schnellste Route bevorzugen",alt_routes="Alternativrouten vorschlagen",detailed_travel="Detaillierte Reiseschritte anzeigen",estimated_time="Geschätzte Reisezeit anzeigen",
 mark_next="Nächsten Flugmeister markieren",hearth_reminder="Hearthstone-Erinnerung",transport_available="Verfügbare Transportmittel anzeigen",reset_arrow="Pfeilposition zurücksetzen",
 auto_accept="Quests automatisch annehmen",auto_turnin="Fertige Quests automatisch abgeben",auto_single_reward="Einzelne Questbelohnung automatisch auswählen",
 auto_equip="Bessere Ausrüstung automatisch anlegen",gear_safe="Sicherheitsmodus verwenden",protect_boe="BoE-Gegenstände schützen",auto_weapons="Waffen automatisch anlegen",
 high_confidence="Nur sichere Upgrades automatisch anlegen",trainer_hints="Trainer-Hinweise anzeigen",talent_hints="Talentempfehlungen anzeigen",
 refresh_talent="Talentempfehlung aktualisieren",world_marker="Questziel auf der Weltkarte markieren",auto_supertrack="Aktuelle Quest automatisch verfolgen",theme="Design",
 audio_enabled="Audiohinweise aktivieren",audio_step="Ton bei neuem Guide-Schritt",audio_equip="Ton bei Auto-Equip",diagnostics="Diagnoseprotokoll aktivieren",
 telemetry="Lokale Runtime-Telemetrie speichern",open_info="Diagnoseübersicht öffnen",refresh_data="Daten neu validieren",data_status="Guide- und Importstatus",
 reset_all="Alle Einstellungen zurücksetzen",recommended="Empfohlen",all_guides="Alle Guides",favorites="Favoriten",own_guides="Eigene Guides",import_export="Import / Export",
 search_guide="Guide suchen...",faction="Fraktion",class="Klasse",category="Kategorie",all="Alle",horde="Horde",alliance="Alliance",mage_aoe="Mage AoE Farm",
 favorite_add="Als Favorit markieren",favorite_remove="Favorit entfernen",start_guide="Guide starten",levels="Stufen",recommended_badge="Empfohlen",no_guides="Keine passenden Guides gefunden.",
 step="Schritt",of="von",targets="Ziele",map="Karte",details="Details",skip="Überspringen",manual_mode_title="Manueller Modus",target_missing="Kein zuverlässiger Wegpunkt verfügbar",
 direction_missing="Richtung nicht verfügbar",equipped="wurde angelegt.",close="Schließen",back="Zurück",next="Weiter",previous="Zurück",page="Seite",
 profile="Profil",default_profile="Standard",manage_profile="Profil verwalten",client_language="WoW-Client-Sprache",journey="Verlauf",quest_search="Questsuche",
 route_calc="Routenberechnung",travel_hints="Reisehinweise",sound_hints="Soundhinweise",data_management="Datenverwaltung",runtime_status="Runtime-Status",
 quest="Quest",quest_giver="Questgeber",source="Quelle",location="Gebiet",
 accept_quest='Nimm „%s“ an.',accept_quest_at='Nimm „%s“ bei %s an.',turnin_quest='Gib „%s“ ab.',turnin_quest_at='Gib „%s“ bei %s ab.',
 kill_count="Töte %dx %s.",kill_target="Töte %s.",collect_count="Sammle %dx %s.",collect_count_from="Sammle %dx %s von %s.",
 collect_from="Sammle %s von %s.",collect_target="Sammle %s.",interact_with="Interagiere mit %s.",continue_quest='Setze „%s“ fort.',

}

local es={
 settings_title="Mewthisch Guides - Ajustes",general="General",guides="Guías",navigation="Navegación",automation="Automatización",gear="Equipo",
 trainer="Entrenador y talentos",map_markers="Mapa y marcadores",display="Pantalla",audio="Audio",data_import="Datos e importación",advanced="Avanzado",
 general_desc="Ajustes básicos de Mewthisch Guides.",guides_desc="Gestiona guías, favoritos y sincronización.",navigation_desc="Flecha, rutas y métodos de viaje.",
 automation_desc="Acciones automáticas al subir de nivel.",gear_desc="Mejoras y autoequipamiento seguro.",trainer_desc="Recordatorios de entrenador y talentos.",
 map_desc="Mapa y marcadores.",display_desc="Presentación visual y temas.",audio_desc="Avisos de sonido.",data_desc="Datos, importación y validación.",advanced_desc="Diagnóstico y opciones avanzadas.",
 language="Idioma",language_auto="Automático (cliente de WoW)",minimap_button="Mostrar botón del minimapa",show_on_login="Mostrar al iniciar sesión",compact_main="Ventana principal compacta",
 tooltips="Tooltips con información adicional",character_profiles="Ajustes por personaje",route_mode="Modo de ruta",manual_mode="Manual",auto_mode="Auto",
 smart_resync="Sincronizar guía con el progreso",skip_obsolete="Omitir pasos completados",open_guides="Abrir selección de guías",show_arrow="Mostrar flecha",
 navigator_locked="Bloquear posición de la flecha",style="Estilo",size="Tamaño",transparency="Transparencia",preview="Vista previa",flight_paths="Usar rutas de vuelo",
 hearthstone="Considerar Piedra de hogar",transports="Usar barcos y zepelines",class_teleports="Usar teletransportes de clase",fastest_route="Preferir ruta más rápida",
 alt_routes="Sugerir rutas alternativas",detailed_travel="Mostrar pasos de viaje detallados",estimated_time="Mostrar tiempo estimado",mark_next="Marcar siguiente maestro de vuelo",
 hearth_reminder="Recordatorio de Piedra de hogar",transport_available="Mostrar transportes disponibles",reset_arrow="Restablecer posición de flecha",
 auto_accept="Aceptar misiones automáticamente",auto_turnin="Entregar misiones automáticamente",auto_single_reward="Elegir recompensa única automáticamente",
 auto_equip="Equipar mejoras automáticamente",gear_safe="Usar modo seguro",protect_boe="Proteger objetos BoE",auto_weapons="Equipar armas automáticamente",
 high_confidence="Solo equipar mejoras seguras",trainer_hints="Mostrar avisos de entrenador",talent_hints="Mostrar recomendaciones de talentos",refresh_talent="Actualizar recomendación",
 world_marker="Mostrar objetivo en el mapa",auto_supertrack="Seguir misión actual automáticamente",theme="Tema",audio_enabled="Activar avisos de audio",
 audio_step="Sonido al cambiar de paso",audio_equip="Sonido al equipar automáticamente",diagnostics="Activar registro de diagnóstico",telemetry="Guardar telemetría local",
 open_info="Abrir diagnóstico",refresh_data="Validar datos de nuevo",data_status="Estado de guías e importación",reset_all="Restablecer todos los ajustes",
 recommended="Recomendado",all_guides="Todas las guías",favorites="Favoritos",own_guides="Guías propias",import_export="Importar / Exportar",search_guide="Buscar guía...",
 faction="Facción",class="Clase",category="Categoría",all="Todos",horde="Horda",alliance="Alianza",mage_aoe="Mage AoE Farm",favorite_add="Añadir favorito",
 favorite_remove="Quitar favorito",start_guide="Iniciar guía",levels="Niveles",recommended_badge="Recomendado",no_guides="No hay guías coincidentes.",
 step="Paso",of="de",targets="Objetivos",map="Mapa",details="Detalles",skip="Omitir",manual_mode_title="Modo manual",target_missing="No hay punto fiable",
 direction_missing="Dirección no disponible",equipped="se equipó.",close="Cerrar",back="Atrás",next="Siguiente",previous="Anterior",page="Página",
 profile="Perfil",default_profile="Predeterminado",manage_profile="Gestionar perfil",client_language="Idioma del cliente WoW",journey="Historial",quest_search="Buscar misiones",
 route_calc="Cálculo de ruta",travel_hints="Indicaciones de viaje",sound_hints="Avisos de sonido",data_management="Gestión de datos",runtime_status="Estado de ejecución",
 quest="Misión",quest_giver="Dador de misión",source="Fuente",location="Zona",
 accept_quest='Acepta "%s".',accept_quest_at='Acepta "%s" de %s.',turnin_quest='Entrega "%s".',turnin_quest_at='Entrega "%s" a %s.',
 kill_count="Mata %dx %s.",kill_target="Mata %s.",collect_count="Recoge %dx %s.",collect_count_from="Recoge %dx %s de %s.",
 collect_from="Recoge %s de %s.",collect_target="Recoge %s.",interact_with="Interactúa con %s.",continue_quest='Continúa "%s".',

}

local fr={
 settings_title="Mewthisch Guides - Paramètres",general="Général",guides="Guides",navigation="Navigation",automation="Automatisation",gear="Équipement",
 trainer="Entraîneur & Talents",map_markers="Carte & Marqueurs",display="Affichage",audio="Audio",data_import="Données & Import",advanced="Avancé",
 general_desc="Paramètres de base de Mewthisch Guides.",guides_desc="Gérez les guides, favoris et la synchronisation.",navigation_desc="Flèche, itinéraires et moyens de transport.",
 automation_desc="Actions automatiques pendant la montée de niveau.",gear_desc="Détection d'améliorations et équipement automatique sûr.",trainer_desc="Rappels d'entraîneur et talents.",
 map_desc="Carte et marqueurs.",display_desc="Présentation visuelle et thèmes.",audio_desc="Alertes sonores.",data_desc="Données, import et validation.",advanced_desc="Diagnostic et options avancées.",
 language="Langue",language_auto="Automatique (client WoW)",minimap_button="Afficher le bouton de minicarte",show_on_login="Afficher à la connexion",compact_main="Fenêtre principale compacte",
 tooltips="Infobulles détaillées",character_profiles="Paramètres par personnage",route_mode="Mode d'itinéraire",manual_mode="Manuel",auto_mode="Auto",
 smart_resync="Synchroniser le guide avec la progression",skip_obsolete="Ignorer les étapes terminées",open_guides="Ouvrir la sélection des guides",
 show_arrow="Afficher la flèche",navigator_locked="Verrouiller la position de la flèche",style="Style",size="Taille",transparency="Transparence",preview="Aperçu",
 flight_paths="Utiliser les trajets aériens",hearthstone="Prendre en compte la pierre de foyer",transports="Utiliser bateaux et zeppelins",class_teleports="Utiliser les téléportations de classe",
 fastest_route="Préférer l'itinéraire le plus rapide",alt_routes="Proposer des itinéraires alternatifs",detailed_travel="Afficher les étapes de voyage détaillées",
 estimated_time="Afficher le temps estimé",mark_next="Marquer le prochain maître de vol",hearth_reminder="Rappel de pierre de foyer",
 transport_available="Afficher les transports disponibles",reset_arrow="Réinitialiser la flèche",auto_accept="Accepter automatiquement les quêtes",
 auto_turnin="Rendre automatiquement les quêtes",auto_single_reward="Choisir automatiquement une récompense unique",auto_equip="Équiper automatiquement les améliorations",
 gear_safe="Utiliser le mode sécurisé",protect_boe="Protéger les objets LQE",auto_weapons="Équiper automatiquement les armes",high_confidence="Seulement les améliorations sûres",
 trainer_hints="Afficher les conseils d'entraîneur",talent_hints="Afficher les conseils de talents",refresh_talent="Actualiser le conseil de talent",
 world_marker="Afficher l'objectif sur la carte",auto_supertrack="Suivre automatiquement la quête actuelle",theme="Thème",audio_enabled="Activer les alertes audio",
 audio_step="Son lors d'une nouvelle étape",audio_equip="Son lors d'un équipement automatique",diagnostics="Activer le journal de diagnostic",telemetry="Stocker la télémétrie locale",
 open_info="Ouvrir le diagnostic",refresh_data="Revalider les données",data_status="État des guides et imports",reset_all="Réinitialiser tous les paramètres",
 recommended="Recommandé",all_guides="Tous les guides",favorites="Favoris",own_guides="Guides personnalisés",import_export="Import / Export",search_guide="Rechercher un guide...",
 faction="Faction",class="Classe",category="Catégorie",all="Tous",horde="Horde",alliance="Alliance",mage_aoe="Mage AoE Farm",favorite_add="Ajouter aux favoris",
 favorite_remove="Retirer des favoris",start_guide="Démarrer le guide",levels="Niveaux",recommended_badge="Recommandé",no_guides="Aucun guide correspondant.",
 step="Étape",of="sur",targets="Objectifs",map="Carte",details="Détails",skip="Passer",manual_mode_title="Mode manuel",target_missing="Aucun point fiable",
 direction_missing="Direction indisponible",equipped="a été équipé.",close="Fermer",back="Retour",next="Suivant",previous="Précédent",page="Page",
 profile="Profil",default_profile="Par défaut",manage_profile="Gérer le profil",client_language="Langue du client WoW",journey="Historique",quest_search="Recherche de quêtes",
 route_calc="Calcul d'itinéraire",travel_hints="Indications de voyage",sound_hints="Alertes sonores",data_management="Gestion des données",runtime_status="État d'exécution",
 quest="Quête",quest_giver="Donneur de quête",source="Source",location="Zone",
 accept_quest='Acceptez « %s ».',accept_quest_at='Acceptez « %s » auprès de %s.',turnin_quest='Rendez « %s ».',turnin_quest_at='Rendez « %s » à %s.',
 kill_count="Tuez %dx %s.",kill_target="Tuez %s.",collect_count="Ramassez %dx %s.",collect_count_from="Ramassez %dx %s sur %s.",
 collect_from="Ramassez %s sur %s.",collect_target="Ramassez %s.",interact_with="Interagissez avec %s.",continue_quest='Continuez « %s ».',

}

local ru={
 settings_title="Mewthisch Guides - Настройки",general="Общие",guides="Гайды",navigation="Навигация",automation="Автоматизация",gear="Экипировка",
 trainer="Тренеры и таланты",map_markers="Карта и метки",display="Интерфейс",audio="Звук",data_import="Данные и импорт",advanced="Дополнительно",
 general_desc="Основные настройки Mewthisch Guides.",guides_desc="Управление гайдами, избранным и синхронизацией.",navigation_desc="Стрелка, маршруты и способы перемещения.",
 automation_desc="Автоматические действия во время прокачки.",gear_desc="Поиск улучшений и безопасная автоэкипировка.",trainer_desc="Напоминания тренеров и таланты.",
 map_desc="Карта и метки.",display_desc="Внешний вид и темы.",audio_desc="Звуковые уведомления.",data_desc="Данные, импорт и проверка.",advanced_desc="Диагностика и расширенные параметры.",
 language="Язык",language_auto="Автоматически (клиент WoW)",minimap_button="Показывать кнопку миникарты",show_on_login="Показывать при входе",compact_main="Компактное главное окно",
 tooltips="Подробные подсказки",character_profiles="Настройки для персонажа",route_mode="Режим маршрута",manual_mode="Вручную",auto_mode="Авто",
 smart_resync="Синхронизировать гайд с прогрессом заданий",skip_obsolete="Пропускать выполненные шаги",open_guides="Открыть выбор гайда",
 show_arrow="Показывать навигационную стрелку",navigator_locked="Зафиксировать позицию стрелки",style="Стиль",size="Размер",transparency="Прозрачность",preview="Предпросмотр",
 flight_paths="Использовать полётные маршруты",hearthstone="Учитывать камень возвращения",transports="Использовать корабли и дирижабли",class_teleports="Использовать классовые телепорты",
 fastest_route="Предпочитать самый быстрый маршрут",alt_routes="Предлагать альтернативы",detailed_travel="Показывать подробные шаги",estimated_time="Показывать оценку времени",
 mark_next="Отмечать следующего распорядителя полётов",hearth_reminder="Напоминать о камне возвращения",transport_available="Показывать доступный транспорт",
 reset_arrow="Сбросить положение стрелки",auto_accept="Автоматически принимать задания",auto_turnin="Автоматически сдавать задания",
 auto_single_reward="Автоматически выбирать единственную награду",auto_equip="Автоматически надевать улучшения",gear_safe="Использовать безопасный режим",
 protect_boe="Защищать BoE-предметы",auto_weapons="Автоматически надевать оружие",high_confidence="Только надёжные улучшения",
 trainer_hints="Показывать подсказки тренера",talent_hints="Показывать рекомендации талантов",refresh_talent="Обновить рекомендацию",
 world_marker="Показывать цель на карте",auto_supertrack="Автоматически отслеживать текущее задание",theme="Тема",audio_enabled="Включить звуковые уведомления",
 audio_step="Звук нового шага",audio_equip="Звук автоэкипировки",diagnostics="Включить журнал диагностики",telemetry="Хранить локальную телеметрию",
 open_info="Открыть диагностику",refresh_data="Повторно проверить данные",data_status="Состояние гайдов и импорта",reset_all="Сбросить все настройки",
 recommended="Рекомендуемые",all_guides="Все гайды",favorites="Избранное",own_guides="Свои гайды",import_export="Импорт / Экспорт",search_guide="Поиск гайда...",
 faction="Фракция",class="Класс",category="Категория",all="Все",horde="Орда",alliance="Альянс",mage_aoe="Mage AoE Farm",favorite_add="Добавить в избранное",
 favorite_remove="Убрать из избранного",start_guide="Запустить гайд",levels="Уровни",recommended_badge="Рекомендуется",no_guides="Подходящих гайдов нет.",
 step="Шаг",of="из",targets="Цели",map="Карта",details="Детали",skip="Пропустить",manual_mode_title="Ручной режим",target_missing="Нет надёжной точки маршрута",
 direction_missing="Направление недоступно",equipped="экипирован.",close="Закрыть",back="Назад",next="Далее",previous="Назад",page="Страница",
 profile="Профиль",default_profile="Стандарт",manage_profile="Управление профилем",client_language="Язык клиента WoW",journey="История",quest_search="Поиск заданий",
 route_calc="Расчёт маршрута",travel_hints="Подсказки путешествия",sound_hints="Звуковые подсказки",data_management="Управление данными",runtime_status="Состояние выполнения",
 quest="Задание",quest_giver="Выдающий задание",source="Источник",location="Место",
 accept_quest='Возьмите задание «%s».',accept_quest_at='Возьмите задание «%s» у %s.',turnin_quest='Сдайте задание «%s».',turnin_quest_at='Сдайте задание «%s» у %s.',
 kill_count="Убейте %dx %s.",kill_target="Убейте %s.",collect_count="Соберите %dx %s.",collect_count_from="Соберите %dx %s с %s.",
 collect_from="Соберите %s с %s.",collect_target="Соберите %s.",interact_with="Взаимодействуйте с %s.",continue_quest='Продолжайте «%s».',

}

local zh={
 settings_title="Mewthisch Guides - 设置",general="常规",guides="指南",navigation="导航",automation="自动化",gear="装备",trainer="训练师与天赋",
 map_markers="地图与标记",display="显示",audio="音频",data_import="数据与导入",advanced="高级",general_desc="Mewthisch Guides 的基础设置。",
 guides_desc="管理指南、收藏和同步。",navigation_desc="导航箭头、路线计算和旅行方式。",automation_desc="练级时的自动操作。",gear_desc="升级检测与安全自动装备。",
 trainer_desc="训练师提醒和天赋建议。",map_desc="地图和标记。",display_desc="视觉显示与主题。",audio_desc="声音提示。",data_desc="数据、导入和验证。",advanced_desc="诊断和高级选项。",
 language="语言",language_auto="自动（WoW 客户端）",minimap_button="显示小地图按钮",show_on_login="登录时显示",compact_main="紧凑主窗口",tooltips="显示附加提示",
 character_profiles="角色独立设置",route_mode="路线模式",manual_mode="手动",auto_mode="自动",smart_resync="自动同步指南进度",skip_obsolete="自动跳过已完成步骤",
 open_guides="打开指南选择",show_arrow="显示导航箭头",navigator_locked="锁定箭头位置",style="样式",size="大小",transparency="透明度",preview="预览",
 flight_paths="自动使用飞行路线",hearthstone="考虑炉石",transports="使用船只和飞艇",class_teleports="使用职业传送",fastest_route="优先最快路线",
 alt_routes="建议备选路线",detailed_travel="显示详细旅行步骤",estimated_time="显示预计旅行时间",mark_next="标记下一个飞行管理员",hearth_reminder="炉石提醒",
 transport_available="显示可用交通",reset_arrow="重置箭头位置",auto_accept="自动接受任务",auto_turnin="自动交付任务",auto_single_reward="自动选择唯一奖励",
 auto_equip="自动装备更好的物品",gear_safe="使用安全模式",protect_boe="保护装备绑定物品",auto_weapons="自动装备武器",high_confidence="仅装备高可信升级",
 trainer_hints="显示训练师提示",talent_hints="显示天赋建议",refresh_talent="刷新天赋建议",world_marker="在世界地图显示任务目标",auto_supertrack="自动追踪当前任务",
 theme="主题",audio_enabled="启用声音提示",audio_step="新步骤声音",audio_equip="自动装备声音",diagnostics="启用诊断日志",telemetry="保存本地遥测",
 open_info="打开诊断",refresh_data="重新验证数据",data_status="指南和导入状态",reset_all="重置所有设置",recommended="推荐",all_guides="全部指南",
 favorites="收藏",own_guides="自定义指南",import_export="导入 / 导出",search_guide="搜索指南...",faction="阵营",class="职业",category="类别",all="全部",horde="部落",
 alliance="联盟",mage_aoe="法师 AoE",favorite_add="添加收藏",favorite_remove="取消收藏",start_guide="开始指南",levels="等级",recommended_badge="推荐",
 no_guides="没有匹配的指南。",step="步骤",of="/",targets="目标",map="地图",details="详情",skip="跳过",manual_mode_title="手动模式",target_missing="没有可靠路径点",
 direction_missing="方向不可用",equipped="已装备。",close="关闭",back="返回",next="下一步",previous="上一步",page="页",profile="配置",default_profile="默认",
 manage_profile="管理配置",client_language="WoW 客户端语言",journey="历程",quest_search="任务搜索",route_calc="路线计算",travel_hints="旅行提示",
 sound_hints="声音提示",data_management="数据管理",runtime_status="运行状态",
 quest="任务",quest_giver="任务给予者",source="来源",location="区域",
 accept_quest='接受“%s”。',accept_quest_at='接受“%s”，任务给予者：%s。',turnin_quest='提交“%s”。',turnin_quest_at='提交“%s”，交给 %s。',
 kill_count="击杀 %d 个%s。",kill_target="击杀%s。",collect_count="收集 %d 个%s。",collect_count_from="收集 %d 个%s（来源：%s）。",
 collect_from="收集%s（来源：%s）。",collect_target="收集%s。",interact_with="与%s互动。",continue_quest='继续“%s”。',

}

local hi={
 settings_title="Mewthisch Guides - सेटिंग्स",general="सामान्य",guides="गाइड",navigation="नेविगेशन",automation="ऑटोमेशन",gear="उपकरण",
 trainer="ट्रेनर और टैलेंट",map_markers="मैप और मार्कर",display="डिस्प्ले",audio="ऑडियो",data_import="डेटा और इम्पोर्ट",advanced="उन्नत",
 general_desc="Mewthisch Guides की मूल सेटिंग्स।",guides_desc="गाइड, पसंदीदा और सिंक प्रबंधित करें।",navigation_desc="तीर, रूट गणना और यात्रा विकल्प।",
 automation_desc="लेवलिंग के दौरान स्वचालित क्रियाएँ।",gear_desc="अपग्रेड पहचान और सुरक्षित ऑटो-इक्विप।",trainer_desc="ट्रेनर रिमाइंडर और टैलेंट सुझाव।",
 map_desc="मैप और मार्कर।",display_desc="दृश्य प्रस्तुति और थीम।",audio_desc="ध्वनि संकेत।",data_desc="डेटा, इम्पोर्ट और सत्यापन।",advanced_desc="डायग्नोस्टिक्स और उन्नत विकल्प।",
 language="भाषा",language_auto="स्वचालित (WoW क्लाइंट)",minimap_button="मिनिमैप बटन दिखाएँ",show_on_login="लॉगिन पर दिखाएँ",compact_main="कॉम्पैक्ट मुख्य विंडो",
 tooltips="अतिरिक्त जानकारी वाले टूलटिप",character_profiles="चरित्र-विशिष्ट सेटिंग्स",route_mode="रूट मोड",manual_mode="मैनुअल",auto_mode="ऑटो",
 smart_resync="गाइड को क्वेस्ट प्रगति से सिंक करें",skip_obsolete="पूरे हुए चरण छोड़ें",open_guides="गाइड चयन खोलें",show_arrow="नेविगेशन तीर दिखाएँ",
 navigator_locked="तीर स्थिति लॉक करें",style="शैली",size="आकार",transparency="पारदर्शिता",preview="पूर्वावलोकन",flight_paths="फ्लाइट पाथ उपयोग करें",
 hearthstone="हर्थस्टोन ध्यान में रखें",transports="जहाज़ और ज़ेपेलिन उपयोग करें",class_teleports="क्लास टेलीपोर्ट उपयोग करें",fastest_route="सबसे तेज़ रूट चुनें",
 alt_routes="वैकल्पिक रूट सुझाएँ",detailed_travel="विस्तृत यात्रा चरण दिखाएँ",estimated_time="अनुमानित समय दिखाएँ",mark_next="अगला फ्लाइट मास्टर चिन्हित करें",
 hearth_reminder="हर्थस्टोन रिमाइंडर",transport_available="उपलब्ध परिवहन दिखाएँ",reset_arrow="तीर स्थिति रीसेट करें",auto_accept="क्वेस्ट स्वतः स्वीकारें",
 auto_turnin="पूरे क्वेस्ट स्वतः जमा करें",auto_single_reward="एकल पुरस्कार स्वतः चुनें",auto_equip="बेहतर उपकरण स्वतः पहनें",gear_safe="सुरक्षा मोड उपयोग करें",
 protect_boe="BoE आइटम सुरक्षित रखें",auto_weapons="हथियार स्वतः पहनें",high_confidence="केवल सुरक्षित अपग्रेड पहनें",trainer_hints="ट्रेनर संकेत दिखाएँ",
 talent_hints="टैलेंट सुझाव दिखाएँ",refresh_talent="टैलेंट सुझाव अपडेट करें",world_marker="वर्ल्ड मैप पर लक्ष्य दिखाएँ",auto_supertrack="वर्तमान क्वेस्ट स्वतः ट्रैक करें",
 theme="थीम",audio_enabled="ऑडियो संकेत चालू करें",audio_step="नए चरण पर ध्वनि",audio_equip="ऑटो-इक्विप पर ध्वनि",diagnostics="डायग्नोस्टिक लॉग चालू करें",
 telemetry="स्थानीय टेलीमेट्री सहेजें",open_info="डायग्नोस्टिक्स खोलें",refresh_data="डेटा फिर सत्यापित करें",data_status="गाइड और इम्पोर्ट स्थिति",
 reset_all="सभी सेटिंग्स रीसेट करें",recommended="अनुशंसित",all_guides="सभी गाइड",favorites="पसंदीदा",own_guides="अपने गाइड",import_export="इम्पोर्ट / एक्सपोर्ट",
 search_guide="गाइड खोजें...",faction="गुट",class="क्लास",category="श्रेणी",all="सभी",horde="Horde",alliance="Alliance",mage_aoe="Mage AoE Farm",
 favorite_add="पसंदीदा बनाएँ",favorite_remove="पसंदीदा हटाएँ",start_guide="गाइड शुरू करें",levels="लेवल",recommended_badge="अनुशंसित",no_guides="कोई मेल खाने वाला गाइड नहीं।",
 step="चरण",of="में से",targets="लक्ष्य",map="मैप",details="विवरण",skip="छोड़ें",manual_mode_title="मैनुअल मोड",target_missing="विश्वसनीय वेपॉइंट नहीं",
 direction_missing="दिशा उपलब्ध नहीं",equipped="पहनाया गया।",close="बंद करें",back="वापस",next="अगला",previous="पिछला",page="पृष्ठ",
 profile="प्रोफ़ाइल",default_profile="डिफ़ॉल्ट",manage_profile="प्रोफ़ाइल प्रबंधित करें",client_language="WoW क्लाइंट भाषा",journey="इतिहास",quest_search="क्वेस्ट खोज",
 route_calc="रूट गणना",travel_hints="यात्रा संकेत",sound_hints="ध्वनि संकेत",data_management="डेटा प्रबंधन",runtime_status="रनटाइम स्थिति",
 quest="क्वेस्ट",quest_giver="क्वेस्ट देने वाला",source="स्रोत",location="क्षेत्र",
 accept_quest='"%s" क्वेस्ट स्वीकार करें।',accept_quest_at='"%s" क्वेस्ट %s से स्वीकार करें।',turnin_quest='"%s" क्वेस्ट जमा करें।',turnin_quest_at='"%s" क्वेस्ट %s को जमा करें।',
 kill_count="%dx %s को मारें।",kill_target="%s को मारें।",collect_count="%dx %s इकट्ठा करें।",collect_count_from="%dx %s इकट्ठा करें — स्रोत: %s।",
 collect_from="%s इकट्ठा करें — स्रोत: %s।",collect_target="%s इकट्ठा करें।",interact_with="%s से बातचीत करें।",continue_quest='"%s" जारी रखें।',

}

L.strings={en=en,de=de,es=es,fr=fr,ru=ru,zh=zh,hi=hi}
function L:DetectClientLanguage() return self.clientMap[GetLocale and GetLocale() or "enUS"] or "en" end
function L:GetConfiguredLanguage()
  local s=MG.db and MG.db.settings and MG.db.settings.language or "auto"; if not self.supported[s] then s="auto" end
  return s=="auto" and self:DetectClientLanguage() or s,s
end
function L:GetLanguageLabel(code)
  code=code or "auto"; if code=="auto" then return self:Get("language_auto") end
  return (self.supported[code] and self.supported[code].native) or code
end
function L:Get(key,...)
  local lang=self:GetConfiguredLanguage(); local t=self.strings[lang] or en; local v=t[key] or en[key] or tostring(key)
  if select("#",...)>0 then local ok,x=pcall(string.format,v,...); if ok then return x end end
  return v
end
function L:SetLanguage(code)
  if not self.supported[code] or not MG.db then return false end; MG.db.settings.language=code
  if MG.RefreshLocalizedUI then MG:RefreshLocalizedUI() end; if MG.RefreshSettings then MG:RefreshSettings() end; if MG.RefreshGuideBrowser then MG:RefreshGuideBrowser() end
  return true
end
function L:NextLanguage()
  local cur=MG.db and MG.db.settings and MG.db.settings.language or "auto"; local idx=1
  for i,c in ipairs(self.order) do if c==cur then idx=i break end end; idx=idx+1;if idx>#self.order then idx=1 end; self:SetLanguage(self.order[idx]); return self.order[idx]
end
function MG:L(key,...) return L:Get(key,...) end
