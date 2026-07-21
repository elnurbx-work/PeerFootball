import type { Locale } from "@/i18n/config";

type MarketingCopy = {
  homeTitle: string;
  homeDescription: string;
  learnMore: string;
  aboutTitle: string;
  aboutDescription: string;
  eyebrow: string;
  answer: string;
  sections: Array<{ title: string; body: string }>;
  whoTitle: string;
  who: string[];
  faqTitle: string;
  faqs: Array<{ question: string; answer: string }>;
  join: string;
  back: string;
};

export const marketingCopy: Record<Locale, MarketingCopy> = {
  az: {
    homeTitle: "FanPitch — Futbol sosial şəbəkəsi və yerli oyun təşkilatçısı",
    homeDescription:
      "FanPitch oyunçular, azarkeşlər, klublar və yerli oyun təşkilatçıları üçün futbol sosial şəbəkəsidir.",
    learnMore: "FanPitch necə işləyir?",
    aboutTitle: "Futbol sosial şəbəkəsi və yerli oyun təşkilatçısı",
    aboutDescription:
      "FanPitch ilə futbolçu tapın, klub yaradın, yerli oyunları təşkil edin və futbol icmanızla paylaşın.",
    eyebrow: "FanPitch haqqında",
    answer:
      "FanPitch futbolçuları, azarkeşləri və yerli klubları birləşdirən futbol sosial şəbəkəsi və oyun təşkilatçısıdır. Bir hesabla oyunçu profili yarada, futbolçular tapa, klub qura, oyun planlaşdıra və futbol paylaşımları edə bilərsiniz.",
    sections: [
      {
        title: "Yerli futbol oyunlarını necə təşkil etmək olar?",
        body: "Klub yaradın və ya mövcud kluba qoşulun, oyun vaxtını və məkanını təyin edin, tərəfləri qurun və nəticəni, qolları və oyun videolarını eyni yerdə saxlayın. FanPitch daxili klub oyunlarını və klublararası görüşləri dəstəkləyir."
      },
      {
        title: "Yaxınlıqdakı futbolçuları necə tapmaq olar?",
        body: "Oyunçu profilləri mövqe, komanda maraqları və futbol kimliyini bir yerdə göstərir. Axtarış və dostluq funksiyaları uyğun oyunçuları tapmağa, əlaqə qurmağa və növbəti oyun üçün ünsiyyət saxlamağa kömək edir."
      },
      {
        title: "Futbol klubunu necə idarə etmək olar?",
        body: "Klub sahibləri üzvləri və qonaqları idarə edə, dəvətlər göndərə, rolları tənzimləyə, oyunlar yarada və klub göstəricilərini izləyə bilərlər. Klub səhifəsi heyət və oyun fəaliyyətini bir mərkəzdə saxlayır."
      },
      {
        title: "Futbol sosial şəbəkəsində nə paylaşmaq olar?",
        body: "Lentdə mətn, foto və video paylaşın; şərh, bəyənmə və təkrar paylaşma ilə söhbətə qoşulun. Dostluqlar, bildirişlər və birbaşa mesajlar futbol icmasını oyundan əvvəl və sonra əlaqədə saxlayır."
      }
    ],
    whoTitle: "FanPitch kimlər üçündür?",
    who: ["Yerli oyun axtaran futbolçular", "Komanda yoldaşı tapmaq istəyən təşkilatçılar", "Heyət və oyunları idarə edən klublar", "Futbol icması ilə paylaşmaq istəyən azarkeşlər"],
    faqTitle: "Tez-tez verilən suallar",
    faqs: [
      { question: "FanPitch nədir?", answer: "FanPitch oyunçu profilləri, sosial paylaşımlar, klublar, yerli oyunlar və mesajlaşmanı birləşdirən futbol platformasıdır." },
      { question: "FanPitch-də yerli futbol oyunu yaratmaq olar?", answer: "Bəli. Aktiv klub üzvləri daxili və ya klublararası oyun yarada, vaxtı, məkanı, tərəfləri və oyun nəticələrini idarə edə bilərlər." },
      { question: "FanPitch futbolçu tapmağa kömək edirmi?", answer: "Bəli. Oyunçu axtarışı, profillər, dostluqlar və birbaşa mesajlar vasitəsilə futbolçuları tapmaq və əlaqə saxlamaq mümkündür." }
    ],
    join: "FanPitch-ə qoşul",
    back: "Ana səhifə"
  },
  en: {
    homeTitle: "FanPitch — Football Social Network & Local Match Organizer",
    homeDescription:
      "FanPitch is a football social network for players, fans, clubs, and local match organizers.",
    learnMore: "How FanPitch works",
    aboutTitle: "Football social network and local match organizer",
    aboutDescription:
      "Find football players, create a club, organize local matches, and share with your football community on FanPitch.",
    eyebrow: "About FanPitch",
    answer:
      "FanPitch is a football social network and match organizer that connects players, fans, and local clubs. With one account, you can build a player profile, find footballers, create a club, plan matches, and share football posts.",
    sections: [
      {
        title: "How can you organize local football matches?",
        body: "Create or join a club, set the match time and venue, build the sides, and keep the result, goals, and match videos together. FanPitch supports both internal club matches and club-versus-club fixtures."
      },
      {
        title: "How can you find football players nearby?",
        body: "Player profiles bring position, team interests, and football identity into one place. Search and friendship tools help you find suitable players, connect, and keep in touch before the next match."
      },
      {
        title: "How can you manage a football club?",
        body: "Club owners can manage members and guests, send invitations, assign roles, create matches, and track club metrics. A club page keeps squad and match activity in one shared place."
      },
      {
        title: "What can you share on a football social network?",
        body: "Share text, photos, and videos in the feed, then join the conversation through comments, likes, and reposts. Friendships, notifications, and direct messages keep the football community connected before and after games."
      }
    ],
    whoTitle: "Who is FanPitch for?",
    who: ["Players looking for local games", "Organizers who need teammates", "Clubs managing squads and matches", "Fans who want a football-focused community"],
    faqTitle: "Frequently asked questions",
    faqs: [
      { question: "What is FanPitch?", answer: "FanPitch is a football platform combining player profiles, social posts, clubs, local matches, and messaging." },
      { question: "Can I create a local football match on FanPitch?", answer: "Yes. Active club members can create internal or club-versus-club matches and manage the time, venue, sides, and results." },
      { question: "Does FanPitch help me find football players?", answer: "Yes. Player search, profiles, friendships, and direct messages help people discover and connect with footballers." }
    ],
    join: "Join FanPitch",
    back: "Home"
  },
  ru: {
    homeTitle: "FanPitch — футбольная социальная сеть и организатор матчей",
    homeDescription:
      "FanPitch — футбольная социальная сеть для игроков, болельщиков, клубов и организаторов местных матчей.",
    learnMore: "Как работает FanPitch",
    aboutTitle: "Футбольная социальная сеть и организатор местных матчей",
    aboutDescription:
      "Находите футболистов, создавайте клуб, организуйте местные матчи и общайтесь с футбольным сообществом в FanPitch.",
    eyebrow: "О FanPitch",
    answer:
      "FanPitch — футбольная социальная сеть и организатор матчей, который объединяет игроков, болельщиков и местные клубы. В одном аккаунте можно создать профиль игрока, найти футболистов, открыть клуб, запланировать матчи и публиковать футбольный контент.",
    sections: [
      {
        title: "Как организовать местный футбольный матч?",
        body: "Создайте клуб или вступите в него, укажите время и место матча, сформируйте составы и храните результат, голы и видео матча в одном месте. FanPitch поддерживает внутренние и межклубные встречи."
      },
      {
        title: "Как найти футболистов поблизости?",
        body: "Профили игроков объединяют позицию, интересы к командам и футбольную информацию. Поиск и добавление в друзья помогают найти подходящих игроков и договориться о следующем матче."
      },
      {
        title: "Как управлять футбольным клубом?",
        body: "Владельцы клубов могут управлять участниками и гостями, отправлять приглашения, назначать роли, создавать матчи и отслеживать показатели клуба. Страница клуба объединяет состав и игровую активность."
      },
      {
        title: "Что публиковать в футбольной социальной сети?",
        body: "Публикуйте текст, фотографии и видео, участвуйте в обсуждениях через комментарии, отметки и репосты. Друзья, уведомления и личные сообщения поддерживают связь до и после матчей."
      }
    ],
    whoTitle: "Для кого FanPitch?",
    who: ["Для игроков, которые ищут местные матчи", "Для организаторов, которым нужны участники", "Для клубов, управляющих составами и матчами", "Для болельщиков, которым нужно футбольное сообщество"],
    faqTitle: "Частые вопросы",
    faqs: [
      { question: "Что такое FanPitch?", answer: "FanPitch — футбольная платформа, объединяющая профили игроков, социальные публикации, клубы, местные матчи и сообщения." },
      { question: "Можно ли создать местный футбольный матч в FanPitch?", answer: "Да. Активные участники клуба могут создавать внутренние и межклубные матчи и управлять временем, местом, составами и результатами." },
      { question: "Помогает ли FanPitch найти футболистов?", answer: "Да. Поиск игроков, профили, друзья и личные сообщения помогают находить футболистов и связываться с ними." }
    ],
    join: "Присоединиться к FanPitch",
    back: "Главная"
  }
};
