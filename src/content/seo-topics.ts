import type { Locale } from "@/i18n/config";

export const seoTopicSlugs = [
  "football-social-network",
  "local-football-match-organizer",
  "find-football-players",
  "football-club-management"
] as const;

export type SeoTopicSlug = (typeof seoTopicSlugs)[number];

type SeoTopicCopy = {
  title: string;
  description: string;
  eyebrow: string;
  answer: string;
  benefitsTitle: string;
  benefits: Array<{ title: string; body: string }>;
  stepsTitle: string;
  steps: string[];
  faq: Array<{ question: string; answer: string }>;
};

export const seoTopics: Record<Locale, Record<SeoTopicSlug, SeoTopicCopy>> = {
  az: {
    "football-social-network": {
      title: "Futbolçular və azarkeşlər üçün futbol sosial şəbəkəsi",
      description: "FanPitch-də futbol profili yaradın, paylaşımlar edin, dostlar tapın və yerli futbol icmanızla əlaqədə qalın.",
      eyebrow: "Futbol sosial şəbəkəsi",
      answer: "FanPitch futbolçular, azarkeşlər və yerli klublar üçün yaradılmış futbol sosial şəbəkəsidir. Ümumi sosial platformalardan fərqli olaraq profil, lent, dostluq, klub və oyun funksiyaları eyni futbol kimliyi ətrafında birləşir.",
      benefitsTitle: "Futbol icmanızı bir yerdə saxlayın",
      benefits: [
        { title: "Futbol profili", body: "Mövqenizi, sevdiyiniz komandaları və futbol məlumatlarınızı göstərən oyunçu profili yaradın." },
        { title: "Futbol lenti", body: "Mətn, foto və video paylaşın; şərhlər, bəyənmələr və təkrar paylaşımlarla müzakirəyə qoşulun." },
        { title: "Birbaşa əlaqə", body: "Dostluqlar, bildirişlər və mesajlar vasitəsilə oyunçular və azarkeşlərlə əlaqədə qalın." }
      ],
      stepsTitle: "FanPitch-də necə başlamaq olar?",
      steps: ["Hesab yaradın və futbol profilinizi tamamlayın.", "Oyunçuları, dostları və klubları tapın.", "Paylaşım edin və ya yerli oyuna hazırlaşın."],
      faq: [
        { question: "Futbol sosial şəbəkəsi nədir?", answer: "Futbol sosial şəbəkəsi oyunçu profillərini, futbol paylaşımlarını, klubları, oyunları və icma ünsiyyətini bir platformada birləşdirir." },
        { question: "FanPitch-də foto və video paylaşmaq olar?", answer: "Bəli. Lent mətn, foto və video paylaşımlarını, həmçinin şərh, bəyənmə və təkrar paylaşmanı dəstəkləyir." }
      ]
    },
    "local-football-match-organizer": {
      title: "Yerli futbol oyunlarını onlayn təşkil edin",
      description: "FanPitch ilə yerli futbol oyununu planlaşdırın, məkan və vaxtı təyin edin, tərəfləri qurun və nəticəni saxlayın.",
      eyebrow: "Yerli oyun təşkilatçısı",
      answer: "FanPitch yerli futbol oyununu planlaşdırmaq və klub üzvləri ilə idarə etmək üçün vahid iş axını verir. Oyun vaxtını və məkanını qeyd edin, tərəfləri formalaşdırın, nəticəni təsdiqləyin, qolları və videoları oyun tarixçəsində saxlayın.",
      benefitsTitle: "Planlamadan nəticəyə qədər",
      benefits: [
        { title: "İki oyun formatı", body: "Klubdaxili oyun və ya iki klub arasında görüş yaradın." },
        { title: "Heyət və tərəflər", body: "Klub üzvlərini seçin və oyunçuları uyğun tərəflərə yerləşdirin." },
        { title: "Oyun tarixçəsi", body: "Hesabı, qolları, nəticə qeydini və oyun videolarını bir yerdə saxlayın." }
      ],
      stepsTitle: "Yerli oyunu necə yaratmaq olar?",
      steps: ["Klub yaradın və oyunçuları üzv kimi əlavə edin.", "Oyun növünü, vaxtı və məkanı seçin.", "Tərəfləri qurun və oyundan sonra nəticəni təsdiqləyin."],
      faq: [
        { question: "FanPitch hansı futbol oyunlarını dəstəkləyir?", answer: "FanPitch klubdaxili və klublararası oyunların yaradılmasını və idarəsini dəstəkləyir." },
        { question: "Oyunun hesabını və qollarını saxlamaq olar?", answer: "Bəli. Səlahiyyətli klub üzvləri yekun hesabı, qolları və nəticə qeydini idarə edə bilərlər." }
      ]
    },
    "find-football-players": {
      title: "Yerli futbolçuları tapın və əlaqə qurun",
      description: "FanPitch-də oyunçu profillərini axtarın, dostluq qurun və növbəti yerli oyun üçün futbolçularla danışın.",
      eyebrow: "Futbolçu axtarışı",
      answer: "FanPitch yerli futbol icmasında oyunçuları tapmağı və onlarla əlaqə qurmağı asanlaşdırır. Oyunçu profillərinə baxın, axtarışdan istifadə edin, dostluq göndərin və uyğun komanda yoldaşları ilə birbaşa danışın.",
      benefitsTitle: "Uyğun oyunçunu daha tez tapın",
      benefits: [
        { title: "Axtarılan profillər", body: "Ad və futbol profili məlumatları ilə oyunçuları kəşf edin." },
        { title: "Futbol kimliyi", body: "Mövqe və komanda maraqları kimi məlumatlarla uyğunluğu anlayın." },
        { title: "Dostluq və mesaj", body: "Dostluq qurduqdan sonra növbəti oyun barədə birbaşa danışın." }
      ],
      stepsTitle: "Futbolçularla necə əlaqə qurmaq olar?",
      steps: ["Oyunçu profilinizi tamamlayın.", "Axtarışda uyğun futbolçuları tapın və profillərinə baxın.", "Dostluq göndərin və qəbuldan sonra mesajlaşın."],
      faq: [
        { question: "FanPitch futbolçu tapmağa kömək edirmi?", answer: "Bəli. Axtarış, oyunçu profilləri, dostluqlar və mesajlar futbolçuları kəşf etməyə və əlaqə qurmağa kömək edir." },
        { question: "Oyunçu ilə birbaşa danışmaq olar?", answer: "Qəbul edilmiş dostluqdan sonra FanPitch-in birbaşa mesajlaşma funksiyasından istifadə etmək olar." }
      ]
    },
    "football-club-management": {
      title: "Yerli futbol klubu və heyət idarəetməsi",
      description: "FanPitch-də futbol klubu yaradın, üzvləri və rolları idarə edin, oyunlar planlaşdırın və klub göstəricilərini izləyin.",
      eyebrow: "Futbol klubu idarəetməsi",
      answer: "FanPitch yerli futbol klublarına üzvləri, rolları, qonaqları və oyunları bir mərkəzdən idarə etməyə kömək edir. Klub sahibləri dəvətlər göndərə, idarəçi səlahiyyətləri verə və klub fəaliyyətini izləyə bilərlər.",
      benefitsTitle: "Klub əməliyyatları bir mərkəzdə",
      benefits: [
        { title: "Üzvlər və rollar", body: "Üzvləri, gözləyən qoşulmaları və klub idarəçisi səlahiyyətlərini idarə edin." },
        { title: "Qonaq oyunçular", body: "Daimi heyətdə olmayan oyunçuları klub qonaqları kimi qeyd edin." },
        { title: "Oyunlar və göstəricilər", body: "Klub oyunlarını yaradın və komandanız üçün vacib göstəriciləri saxlayın." }
      ],
      stepsTitle: "Klubu necə qurmaq olar?",
      steps: ["Klub adı və məlumatları ilə yeni klub yaradın.", "Oyunçuları dəvət edin və lazım olan rolları verin.", "Oyunları, üzvləri, qonaqları və göstəriciləri klub səhifəsindən idarə edin."],
      faq: [
        { question: "FanPitch-də futbol klubu yaratmaq olar?", answer: "Bəli. İstifadəçilər klub yarada, oyunçuları dəvət edə və üzvlük prosesini idarə edə bilərlər." },
        { question: "Klubda birdən çox idarəçi ola bilər?", answer: "Klub sahibi aktiv üzvlərə idarəetmə rolu verə və klub səlahiyyətlərini bölüşə bilər." }
      ]
    }
  },
  en: {
    "football-social-network": {
      title: "Football social network for players and fans",
      description: "Build a football profile, share posts, find friends, and stay connected with your local football community on FanPitch.",
      eyebrow: "Football social network",
      answer: "FanPitch is a football social network built for players, fans, and local clubs. Instead of separating social posts from real football activity, it connects profiles, the community feed, friendships, clubs, and local matches around one football identity.",
      benefitsTitle: "Keep your football community together",
      benefits: [
        { title: "Football profile", body: "Create a player profile showing your position, favorite teams, and football information." },
        { title: "Football feed", body: "Share text, photos, and videos, then join in through comments, likes, and reposts." },
        { title: "Direct connections", body: "Use friendships, notifications, and messages to stay connected with players and fans." }
      ],
      stepsTitle: "How do you get started on FanPitch?",
      steps: ["Create an account and complete your football profile.", "Discover players, friends, and local clubs.", "Share a post or start preparing for a local match."],
      faq: [
        { question: "What is a football social network?", answer: "A football social network brings player profiles, football posts, clubs, matches, and community conversations into one platform." },
        { question: "Can I share football photos and videos?", answer: "Yes. The FanPitch feed supports text, photo, and video posts alongside comments, likes, and reposts." }
      ]
    },
    "local-football-match-organizer": {
      title: "Organize local football matches online",
      description: "Plan a local football match, set the venue and time, build the sides, and record the result with FanPitch.",
      eyebrow: "Local match organizer",
      answer: "FanPitch provides one workflow for organizing a local football match with club members. Set the time and venue, form the sides, confirm the result, and keep goals and match videos attached to the match history.",
      benefitsTitle: "From planning to the final result",
      benefits: [
        { title: "Two match formats", body: "Create an internal club game or a fixture between two clubs." },
        { title: "Squads and sides", body: "Choose club members and place participating players on the appropriate sides." },
        { title: "Match history", body: "Keep the score, goals, result note, and match videos together after the game." }
      ],
      stepsTitle: "How do you create a local match?",
      steps: ["Create a club and add your players as members.", "Choose the match format, time, and venue.", "Build the sides and confirm the result after the match."],
      faq: [
        { question: "What football match formats does FanPitch support?", answer: "FanPitch supports the creation and management of internal club games and club-versus-club fixtures." },
        { question: "Can I record the score and goals?", answer: "Yes. Authorized club members can manage the final score, goals, and a result note." }
      ]
    },
    "find-football-players": {
      title: "Find local football players and connect",
      description: "Search player profiles, make football friends, and message players for your next local game on FanPitch.",
      eyebrow: "Find football players",
      answer: "FanPitch makes it easier to find and contact players in a football-focused community. Browse player profiles, use search, send a friendship request, and speak directly with suitable teammates before the next local game.",
      benefitsTitle: "Find suitable players faster",
      benefits: [
        { title: "Searchable profiles", body: "Discover players using names and the information in their football profiles." },
        { title: "Football identity", body: "Use details such as playing position and team interests to understand each player." },
        { title: "Friends and messages", body: "Connect as friends, then discuss availability and the next match directly." }
      ],
      stepsTitle: "How do you connect with football players?",
      steps: ["Complete your own player profile.", "Search for suitable footballers and review their profiles.", "Send a friendship request and message after it is accepted."],
      faq: [
        { question: "Does FanPitch help me find football players?", answer: "Yes. Search, player profiles, friendships, and messages help people discover and connect with footballers." },
        { question: "Can I message a player directly?", answer: "After a friendship request is accepted, the players can use FanPitch direct messaging." }
      ]
    },
    "football-club-management": {
      title: "Local football club and squad management",
      description: "Create a football club, manage members and roles, schedule matches, and track club metrics with FanPitch.",
      eyebrow: "Football club management",
      answer: "FanPitch helps local football clubs manage members, roles, guests, and matches from one shared place. Club owners can invite players, assign management permissions, and keep club activity organized without separating the squad from its match history.",
      benefitsTitle: "Club operations in one place",
      benefits: [
        { title: "Members and roles", body: "Manage active members, pending joins, and club management permissions." },
        { title: "Guest players", body: "Record players who take part without joining the permanent club squad." },
        { title: "Matches and metrics", body: "Create club matches and maintain the measurements that matter to your team." }
      ],
      stepsTitle: "How do you set up a club?",
      steps: ["Create a club with its name and core details.", "Invite players and assign the roles your club needs.", "Manage matches, members, guests, and metrics from the club area."],
      faq: [
        { question: "Can I create a football club on FanPitch?", answer: "Yes. Users can create a club, invite players, and manage membership." },
        { question: "Can a club have more than one manager?", answer: "The club owner can give active members management roles and share club responsibilities." }
      ]
    }
  },
  ru: {
    "football-social-network": {
      title: "Футбольная социальная сеть для игроков и болельщиков",
      description: "Создайте футбольный профиль, публикуйте контент, находите друзей и общайтесь с местным футбольным сообществом в FanPitch.",
      eyebrow: "Футбольная социальная сеть",
      answer: "FanPitch — футбольная социальная сеть для игроков, болельщиков и местных клубов. Она объединяет профили, публикации, друзей, клубы и местные матчи вокруг единой футбольной личности пользователя.",
      benefitsTitle: "Всё футбольное сообщество в одном месте",
      benefits: [
        { title: "Футбольный профиль", body: "Укажите позицию, любимые команды и другую футбольную информацию." },
        { title: "Футбольная лента", body: "Публикуйте текст, фотографии и видео, комментируйте и делитесь публикациями." },
        { title: "Прямое общение", body: "Друзья, уведомления и сообщения помогают поддерживать связь с игроками и болельщиками." }
      ],
      stepsTitle: "Как начать пользоваться FanPitch?",
      steps: ["Создайте аккаунт и заполните футбольный профиль.", "Найдите игроков, друзей и местные клубы.", "Опубликуйте запись или начните готовиться к матчу."],
      faq: [
        { question: "Что такое футбольная социальная сеть?", answer: "Это платформа, объединяющая профили игроков, футбольные публикации, клубы, матчи и общение сообщества." },
        { question: "Можно ли публиковать футбольные фото и видео?", answer: "Да. Лента FanPitch поддерживает текст, фотографии и видео, а также комментарии, отметки и репосты." }
      ]
    },
    "local-football-match-organizer": {
      title: "Организуйте местные футбольные матчи онлайн",
      description: "Планируйте местный матч, указывайте место и время, формируйте составы и сохраняйте результат в FanPitch.",
      eyebrow: "Организатор местных матчей",
      answer: "FanPitch предоставляет единый процесс организации местного футбольного матча с участниками клуба. Укажите время и место, сформируйте составы, подтвердите результат и сохраните голы и видео в истории матча.",
      benefitsTitle: "От планирования до результата",
      benefits: [
        { title: "Два формата", body: "Создайте внутреннюю игру клуба или матч между двумя клубами." },
        { title: "Составы и стороны", body: "Выберите участников клуба и распределите игроков по сторонам." },
        { title: "История матча", body: "Сохраните счёт, голы, примечание к результату и видео матча." }
      ],
      stepsTitle: "Как создать местный матч?",
      steps: ["Создайте клуб и добавьте игроков.", "Выберите формат, время и место матча.", "Сформируйте стороны и подтвердите результат после игры."],
      faq: [
        { question: "Какие форматы матчей поддерживает FanPitch?", answer: "FanPitch поддерживает внутренние игры клуба и межклубные матчи." },
        { question: "Можно ли сохранить счёт и голы?", answer: "Да. Уполномоченные участники клуба могут управлять итоговым счётом, голами и примечанием к результату." }
      ]
    },
    "find-football-players": {
      title: "Найдите местных футболистов и свяжитесь с ними",
      description: "Ищите профили игроков, добавляйте футбольных друзей и общайтесь перед следующим местным матчем в FanPitch.",
      eyebrow: "Поиск футболистов",
      answer: "FanPitch упрощает поиск игроков и общение с ними в футбольном сообществе. Просматривайте профили, используйте поиск, отправляйте запросы в друзья и напрямую обсуждайте следующий местный матч.",
      benefitsTitle: "Быстрее находите подходящих игроков",
      benefits: [
        { title: "Профили в поиске", body: "Находите игроков по имени и информации в футбольном профиле." },
        { title: "Футбольная информация", body: "Позиция и интересы к командам помогают лучше понять игрока." },
        { title: "Друзья и сообщения", body: "Добавляйте игроков в друзья и обсуждайте доступность и следующий матч." }
      ],
      stepsTitle: "Как связаться с футболистами?",
      steps: ["Заполните собственный профиль игрока.", "Найдите подходящих футболистов и изучите профили.", "Отправьте запрос в друзья и напишите после принятия."],
      faq: [
        { question: "Помогает ли FanPitch найти футболистов?", answer: "Да. Поиск, профили игроков, друзья и сообщения помогают находить футболистов и связываться с ними." },
        { question: "Можно ли написать игроку напрямую?", answer: "После принятия запроса в друзья игроки могут использовать личные сообщения FanPitch." }
      ]
    },
    "football-club-management": {
      title: "Управление местным футбольным клубом и составом",
      description: "Создайте футбольный клуб, управляйте участниками и ролями, планируйте матчи и отслеживайте показатели в FanPitch.",
      eyebrow: "Управление футбольным клубом",
      answer: "FanPitch помогает местным футбольным клубам управлять участниками, ролями, гостями и матчами в одном месте. Владельцы клубов могут приглашать игроков, назначать управляющих и систематизировать активность клуба.",
      benefitsTitle: "Работа клуба в одном месте",
      benefits: [
        { title: "Участники и роли", body: "Управляйте активными участниками, заявками и правами руководителей клуба." },
        { title: "Гостевые игроки", body: "Учитывайте игроков, которые участвуют без вступления в постоянный состав." },
        { title: "Матчи и показатели", body: "Создавайте клубные матчи и храните важные для команды показатели." }
      ],
      stepsTitle: "Как создать клуб?",
      steps: ["Создайте клуб и добавьте основные сведения.", "Пригласите игроков и назначьте необходимые роли.", "Управляйте матчами, участниками, гостями и показателями клуба."],
      faq: [
        { question: "Можно ли создать футбольный клуб в FanPitch?", answer: "Да. Пользователи могут создать клуб, приглашать игроков и управлять членством." },
        { question: "Может ли у клуба быть несколько руководителей?", answer: "Владелец клуба может назначить активным участникам управляющие роли и разделить обязанности." }
      ]
    }
  }
};

export function isSeoTopic(value: string): value is SeoTopicSlug {
  return seoTopicSlugs.includes(value as SeoTopicSlug);
}
