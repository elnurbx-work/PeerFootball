import type { Locale } from "@/i18n/config";

export type FeatureIcon = "profile" | "teams" | "matches" | "performance" | "community" | "pitches";

export type LandingCopy = {
  nav: { features: string; players: string; teams: string; matches: string; pitches: string; login: string; join: string; menu: string };
  hero: { eyebrow: string; line1: string; line2: string; line3: string; body: string; primary: string; secondary: string; matches: string; players: string; teams: string };
  stats: Array<{ value: string; label: string }>;
  features: { eyebrow: string; title: string; body: string };
  featureItems: Array<{ title: string; description: string; icon: FeatureIcon; tone: "dark" | "light" | "green"; wide?: boolean }>;
  map: { eyebrow: string; title: string; body: string; distance: string; outdoor: string; surface: string; format: string; next: string; view: string; directions: string; filters: string[]; legend: string[] };
  steps: { eyebrow: string; title: string; items: Array<{ title: string; body: string }> };
  matches: { eyebrow: string; title: string; body: string; today: string; friendly: string; away: string; joined: string; needed: string; positions: string[]; view: string; browse: string };
  player: { eyebrow: string; title: string; body: string; position: string; secondary: string; foot: string; footValue: string; rating: string; matches: string; goals: string; assists: string; winRate: string; form: string; pitch: string };
  community: { eyebrow: string; title: string; body: string; result: string; invite: string; highlight: string; now: string; hour: string; yesterday: string; likes: string; comments: string; repost: string };
  cta: { title: string; body: string; primary: string; secondary: string };
  footer: { tagline: string; explore: string; platform: string; legal: string; about: string; rules: string; help: string; contact: string; privacy: string; terms: string; cookies: string; reserved: string };
};

const featureIcons = ["profile", "teams", "matches", "performance", "community", "pitches"] as const satisfies readonly FeatureIcon[];

const en: LandingCopy = {
  nav: { features: "Features", players: "Players", teams: "Teams", matches: "Matches", pitches: "Pitches", login: "Log in", join: "Join now", menu: "Open navigation" },
  hero: { eyebrow: "Built for local football communities", line1: "YOUR GAME.", line2: "YOUR TEAM.", line3: "YOUR COMMUNITY.", body: "Find players, build your team, organize matches and discover football pitches around you.", primary: "Join PeerFootball", secondary: "Explore matches", matches: "24 matches today", players: "128 players nearby", teams: "12 active teams" },
  stats: [{ value: "12K+", label: "Active Players" }, { value: "850+", label: "Teams Created" }, { value: "4.9K+", label: "Matches Played" }, { value: "340+", label: "Football Pitches" }],
  features: { eyebrow: "One platform. Every match.", title: "Everything your football life needs", body: "PeerFootball brings players, teams, matches and local football activity together in one platform." },
  featureItems: [
    { title: "Player Profiles", description: "Build your football identity and showcase your preferred positions, match history and performance.", icon: featureIcons[0], tone: "dark", wide: true },
    { title: "Teams", description: "Create a team, manage members and prepare for upcoming matches.", icon: featureIcons[1], tone: "green" },
    { title: "Match Organization", description: "Create friendly, training and official matches with structured match details.", icon: featureIcons[2], tone: "light" },
    { title: "Performance Tracking", description: "Record appearances, goals, assists, ratings and recent form.", icon: featureIcons[3], tone: "light" },
    { title: "Football Community", description: "Follow players, make friends and share football moments.", icon: featureIcons[4], tone: "light" },
    { title: "Pitch Discovery", description: "Find nearby football pitches and see local football activity.", icon: featureIcons[5], tone: "dark", wide: true }
  ],
  map: { eyebrow: "Local football, mapped", title: "Find a pitch near you", body: "Discover local football fields, upcoming matches and active teams around your city.", distance: "1.2 km away", outdoor: "Outdoor", surface: "Artificial grass", format: "5v5 / 7v7", next: "Next match at 20:30", view: "View pitch", directions: "Get directions", filters: ["All", "Pitches", "Matches", "Teams"], legend: ["Available pitch", "Match happening now", "Upcoming match", "Indoor arena"] },
  steps: { eyebrow: "How it works", title: "From profile to kickoff", items: [{ title: "Create your profile", body: "Add your positions, football preferences and availability." }, { title: "Find your community", body: "Discover nearby players, teams, matches and football pitches." }, { title: "Start playing", body: "Join a team or match and record your football story." }] },
  matches: { eyebrow: "Playing near you", title: "Your next match is closer than you think", body: "Browse local games, see who is playing and fill the position your team needs.", today: "Today, 20:30", friendly: "7v7 Friendly", away: "1.2 km away", joined: "11 of 14 players joined", needed: "Needed positions", positions: ["Goalkeeper", "Defender"], view: "View match", browse: "Browse all matches" },
  player: { eyebrow: "Your football identity", title: "Every match builds your story", body: "Keep your positions, results and progress together in a player profile that grows with every game.", position: "Midfielder", secondary: "Secondary", foot: "Preferred foot", footValue: "Right", rating: "Overall rating", matches: "Matches", goals: "Goals", assists: "Assists", winRate: "Win rate", form: "Recent form", pitch: "Position map" },
  community: { eyebrow: "More than matchday", title: "Share the moments that matter", body: "Celebrate results, find training partners and keep your football circle close.", result: "Full time. A proper team performance under the lights.", invite: "Two spots open for Tuesday training. All levels welcome.", highlight: "The move that changed the match.", now: "12 min", hour: "1 hr", yesterday: "Yesterday", likes: "likes", comments: "comments", repost: "Repost" },
  cta: { title: "Ready for your next match?", body: "Create your profile, meet local players and become part of the football community around you.", primary: "Create your profile", secondary: "Explore PeerFootball" },
  footer: { tagline: "Where local football connects.", explore: "Explore", platform: "Platform", legal: "Legal", about: "About", rules: "Community Rules", help: "Help Center", contact: "Contact", privacy: "Privacy Policy", terms: "Terms of Service", cookies: "Cookie Policy", reserved: "All rights reserved." }
};

const localized: Record<Exclude<Locale, "en">, Partial<LandingCopy>> = {
  az: {
    nav: { features: "İmkanlar", players: "Oyunçular", teams: "Komandalar", matches: "Oyunlar", pitches: "Meydançalar", login: "Daxil ol", join: "Qoşul", menu: "Naviqasiyanı aç" },
    hero: { eyebrow: "Yerli futbol icmaları üçün yaradılıb", line1: "SƏNİN OYUNUN.", line2: "SƏNİN KOMANDAN.", line3: "SƏNİN İCMAN.", body: "Oyunçular tap, komandanı qur, oyunlar təşkil et və yaxınlıqdakı futbol meydançalarını kəşf et.", primary: "PeerFootball-a qoşul", secondary: "Oyunları kəşf et", matches: "Bu gün 24 oyun", players: "Yaxınlıqda 128 oyunçu", teams: "12 aktiv komanda" },
    stats: [{ value: "12K+", label: "Aktiv oyunçu" }, { value: "850+", label: "Yaradılmış komanda" }, { value: "4.9K+", label: "Oynanılmış oyun" }, { value: "340+", label: "Futbol meydançası" }],
    features: { eyebrow: "Bir platforma. Hər oyun.", title: "Futbol həyatın üçün lazım olan hər şey", body: "PeerFootball oyunçuları, komandaları, oyunları və yerli futbol fəaliyyətini bir platformada birləşdirir." },
    featureItems: [
      { title: "Oyunçu profilləri", description: "Futbol kimliyini qur, mövqelərini, oyun tarixçəni və performansını göstər.", icon: featureIcons[0], tone: "dark", wide: true },
      { title: "Komandalar", description: "Komanda yarat, üzvləri idarə et və qarşıdakı oyunlara hazırlaş.", icon: featureIcons[1], tone: "green" },
      { title: "Oyun təşkili", description: "Yoldaşlıq, məşq və rəsmi oyunları strukturlaşdırılmış məlumatlarla yarat.", icon: featureIcons[2], tone: "light" },
      { title: "Performans izləmə", description: "Oyunları, qolları, asistləri, reytinqləri və son formanı qeyd et.", icon: featureIcons[3], tone: "light" },
      { title: "Futbol icması", description: "Oyunçuları izlə, dostlar tap və futbol anlarını paylaş.", icon: featureIcons[4], tone: "light" },
      { title: "Meydança kəşfi", description: "Yaxınlıqdakı meydançaları və yerli futbol fəaliyyətini tap.", icon: featureIcons[5], tone: "dark", wide: true }
    ],
    map: { ...en.map, eyebrow: "Yerli futbol xəritədə", title: "Yaxınlıqda meydança tap", body: "Şəhərində yerli meydançaları, qarşıdakı oyunları və aktiv komandaları kəşf et.", distance: "1.2 km məsafədə", outdoor: "Açıq hava", surface: "Süni ot", next: "Növbəti oyun 20:30-da", view: "Meydançaya bax", directions: "İstiqamət al", filters: ["Hamısı", "Meydançalar", "Oyunlar", "Komandalar"], legend: ["Mövcud meydança", "Canlı oyun", "Qarşıdakı oyun", "Qapalı arena"] },
    steps: { eyebrow: "Necə işləyir", title: "Profildən ilk fitə", items: [{ title: "Profilini yarat", body: "Mövqelərini, futbol seçimlərini və uyğun vaxtlarını əlavə et." }, { title: "İcmanı tap", body: "Yaxınlıqdakı oyunçuları, komandaları, oyunları və meydançaları kəşf et." }, { title: "Oyuna başla", body: "Komandaya və ya oyuna qoşul, futbol hekayəni qeyd et." }] },
    matches: { ...en.matches, eyebrow: "Yaxınlıqda oynanılır", title: "Növbəti oyunun düşündüyündən daha yaxındır", body: "Yerli oyunlara bax, kimin oynadığını gör və komandaya lazım olan mövqeyi doldur.", today: "Bu gün, 20:30", friendly: "7v7 Yoldaşlıq", away: "1.2 km məsafədə", joined: "14 oyunçudan 11-i qoşulub", needed: "Lazım olan mövqelər", positions: ["Qapıçı", "Müdafiəçi"], view: "Oyuna bax", browse: "Bütün oyunlara bax" },
    player: { ...en.player, eyebrow: "Sənin futbol kimliyin", title: "Hər oyun hekayəni qurur", body: "Mövqelərini, nəticələrini və inkişafını hər oyunla böyüyən profildə birləşdir.", position: "Yarımmüdafiəçi", secondary: "İkinci mövqe", foot: "Üstün ayaq", footValue: "Sağ", rating: "Ümumi reytinq", matches: "Oyunlar", goals: "Qollar", assists: "Asistlər", winRate: "Qələbə faizi", form: "Son forma", pitch: "Mövqe xəritəsi" },
    community: { ...en.community, eyebrow: "Oyun günündən daha çox", title: "Dəyərli anları paylaş", body: "Nəticələri qeyd et, məşq tərəfdaşları tap və futbol çevrənlə əlaqədə qal.", result: "Final fiti. İşıqlar altında əsl komanda oyunu.", invite: "Çərşənbə axşamı məşqinə iki yer var. Hər səviyyə qəbul edilir.", highlight: "Oyunu dəyişən epizod.", now: "12 dəq", hour: "1 saat", yesterday: "Dünən", likes: "bəyənmə", comments: "şərh", repost: "Paylaş" },
    cta: { title: "Növbəti oyununa hazırsan?", body: "Profilini yarat, yerli oyunçularla tanış ol və ətrafındakı futbol icmasına qoşul.", primary: "Profilini yarat", secondary: "PeerFootball-u kəşf et" },
    footer: { ...en.footer, tagline: "Yerli futbolun birləşdiyi yer.", explore: "Kəşf et", platform: "Platforma", legal: "Hüquqi", about: "Haqqımızda", help: "Yardım mərkəzi", contact: "Əlaqə", reserved: "Bütün hüquqlar qorunur." }
  },
  ru: {
    nav: { features: "Возможности", players: "Игроки", teams: "Команды", matches: "Матчи", pitches: "Площадки", login: "Войти", join: "Регистрация", menu: "Открыть навигацию" },
    hero: { eyebrow: "Создано для местных футбольных сообществ", line1: "ТВОЯ ИГРА.", line2: "ТВОЯ КОМАНДА.", line3: "ТВОЁ СООБЩЕСТВО.", body: "Находи игроков, собирай команду, организуй матчи и открывай футбольные площадки рядом.", primary: "Присоединиться", secondary: "Найти матчи", matches: "24 матча сегодня", players: "128 игроков рядом", teams: "12 активных команд" },
    stats: [{ value: "12K+", label: "Активных игроков" }, { value: "850+", label: "Созданных команд" }, { value: "4.9K+", label: "Сыгранных матчей" }, { value: "340+", label: "Футбольных полей" }],
    features: { eyebrow: "Одна платформа. Каждый матч.", title: "Всё, что нужно для твоей футбольной жизни", body: "PeerFootball объединяет игроков, команды, матчи и местный футбол на одной платформе." },
    featureItems: [
      { title: "Профили игроков", description: "Создай футбольный профиль и покажи позиции, историю матчей и результаты.", icon: featureIcons[0], tone: "dark", wide: true },
      { title: "Команды", description: "Создай команду, управляй составом и готовься к будущим матчам.", icon: featureIcons[1], tone: "green" },
      { title: "Организация матчей", description: "Создавай товарищеские, тренировочные и официальные матчи.", icon: featureIcons[2], tone: "light" },
      { title: "Статистика", description: "Записывай матчи, голы, передачи, оценки и текущую форму.", icon: featureIcons[3], tone: "light" },
      { title: "Футбольное сообщество", description: "Следи за игроками, находи друзей и делись футбольными моментами.", icon: featureIcons[4], tone: "light" },
      { title: "Поиск площадок", description: "Находи футбольные поля и местную активность рядом.", icon: featureIcons[5], tone: "dark", wide: true }
    ],
    map: { ...en.map, eyebrow: "Местный футбол на карте", title: "Найди площадку рядом", body: "Открывай местные поля, ближайшие матчи и активные команды в своём городе.", distance: "1,2 км", outdoor: "Открытая", surface: "Искусственный газон", next: "Следующий матч в 20:30", view: "Смотреть площадку", directions: "Маршрут", filters: ["Все", "Площадки", "Матчи", "Команды"], legend: ["Свободное поле", "Матч идёт сейчас", "Будущий матч", "Крытая арена"] },
    steps: { eyebrow: "Как это работает", title: "От профиля до стартового свистка", items: [{ title: "Создай профиль", body: "Добавь позиции, футбольные предпочтения и доступное время." }, { title: "Найди своё сообщество", body: "Открывай игроков, команды, матчи и площадки рядом." }, { title: "Выходи на поле", body: "Присоединяйся к команде или матчу и записывай свою футбольную историю." }] },
    matches: { ...en.matches, eyebrow: "Играют рядом", title: "Следующий матч ближе, чем кажется", body: "Смотри местные игры, узнавай участников и занимай нужную команде позицию.", today: "Сегодня, 20:30", friendly: "7v7 Товарищеский", away: "1,2 км", joined: "11 из 14 игроков", needed: "Нужны позиции", positions: ["Вратарь", "Защитник"], view: "Смотреть матч", browse: "Все матчи" },
    player: { ...en.player, eyebrow: "Твоя футбольная история", title: "Каждый матч создаёт твою историю", body: "Собери позиции, результаты и прогресс в профиле, который растёт с каждой игрой.", position: "Полузащитник", secondary: "Вторая позиция", foot: "Ведущая нога", footValue: "Правая", rating: "Общий рейтинг", matches: "Матчи", goals: "Голы", assists: "Передачи", winRate: "Победы", form: "Последняя форма", pitch: "Позиция на поле" },
    community: { ...en.community, eyebrow: "Больше, чем день матча", title: "Делись важными моментами", body: "Празднуй результаты, находи партнёров для тренировок и оставайся рядом со своим футбольным кругом.", result: "Финальный свисток. Настоящая командная игра под светом прожекторов.", invite: "Два места на тренировку во вторник. Любой уровень.", highlight: "Момент, который изменил игру.", now: "12 мин", hour: "1 ч", yesterday: "Вчера", likes: "отметок", comments: "комментариев", repost: "Поделиться" },
    cta: { title: "Готов к следующему матчу?", body: "Создай профиль, познакомься с местными игроками и стань частью футбольного сообщества рядом.", primary: "Создать профиль", secondary: "Открыть PeerFootball" },
    footer: { ...en.footer, tagline: "Место, где встречается местный футбол.", explore: "Разделы", platform: "Платформа", legal: "Документы", about: "О нас", help: "Помощь", contact: "Контакты", reserved: "Все права защищены." }
  }
};

function mergeCopy(locale: Exclude<Locale, "en">): LandingCopy {
  const override = localized[locale];
  return {
    ...en,
    ...override,
    nav: override.nav ?? en.nav,
    hero: override.hero ?? en.hero,
    features: override.features ?? en.features,
    map: override.map ?? en.map,
    steps: override.steps ?? en.steps,
    cta: override.cta ?? en.cta,
    footer: override.footer ?? en.footer
  };
}

export const landingCopy: Record<Locale, LandingCopy> = {
  en,
  az: mergeCopy("az"),
  ru: mergeCopy("ru")
};

// Marketing demo values. Replace these arrays with backend responses when public APIs are available.
export const nearbyMatches = [
  { teams: "Harbor XI vs City Rovers", time: "Tomorrow · 19:00", format: "5v5", spots: "2 spots" },
  { teams: "Park United vs Atlas FC", time: "Wed · 20:30", format: "7v7", spots: "4 spots" },
  { teams: "Old Town Social", time: "Fri · 21:00", format: "6v6", spots: "1 spot" }
] as const;

export const pitchMarkers = [
  { id: 1, name: "Arena Football Center", type: "pitch", left: "68%", top: "45%", active: true },
  { id: 2, name: "Riverside game", type: "live", left: "28%", top: "32%", active: false },
  { id: 3, name: "Northside Arena", type: "indoor", left: "46%", top: "70%", active: false },
  { id: 4, name: "Friday match", type: "match", left: "81%", top: "72%", active: false },
  { id: 5, name: "Central pitch", type: "pitch", left: "17%", top: "74%", active: false }
] as const;
