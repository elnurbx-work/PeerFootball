export type Guide = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  sections: Array<{ heading: string; paragraphs: string[]; steps?: string[] }>;
  checklist: string[];
  faq: Array<{ question: string; answer: string }>;
};

export const guides: Guide[] = [
  {
    slug: "heveskar-futbol-komandasi-nece-qurulur",
    title: "Həvəskar futbol komandası necə qurulur?",
    description: "Məqsəddən ilk oyuna qədər heyət, rollar, büdcə və davamlı ünsiyyət üzrə praktik komanda qurma planı.",
    publishedAt: "2026-07-20", updatedAt: "2026-07-31", readingMinutes: 8,
    sections: [
      { heading: "Komandanın məqsədini əvvəlcədən müəyyənləşdirin", paragraphs: ["Həftəlik dostluq oyunu oynayan qrupla liqaya qatılmaq istəyən klubun ehtiyacları eyni deyil. Oyun tezliyini, əsas formatı, rəqabət səviyyəsini və şəhər daxilində hərəkət imkanını ilk görüşdə razılaşdırın.", "Məqsəd aydın olmadıqda oyunçu seçimi, büdcə və məşq gözləntiləri tez-tez mübahisə yaradır. Qısa yazılı komanda prinsipi sonradan qərar verməyi asanlaşdırır."] },
      { heading: "Kiçik, etibarlı nüvə yaradın", paragraphs: ["Əvvəlcə təşkilati məsuliyyət götürən 3–5 nəfərlik nüvə seçin. Təkcə yaxşı oynayan deyil, vaxtında cavab verən və öhdəliyinə əməl edən şəxslər daha dəyərlidir."], steps: ["Kapitan və əvəzləyicini seçin", "Maliyyə və meydança rezervasiyasına cavabdeh müəyyən edin", "Əsas və ehtiyat heyət üçün davamiyyət qaydası yazın", "İlk sınaq oyunundan sonra rolları yenidən qiymətləndirin"] },
      { heading: "Davamlı sistem qurun", paragraphs: ["Ödəniş, gecikmə, ləğv və oyunçu çatışmazlığı qaydalarını oyun başlamazdan əvvəl razılaşdırın. Hər həftə sıfırdan qərar vermək əvəzinə eyni sadə qeydiyyat və təsdiq axınından istifadə edin.", "Yeni oyunçunu birbaşa vacib oyuna salmaq əvəzinə sınaq məşqi təşkil edin. Davranış, ünsiyyət və mövqe uyğunluğu texniki bacarıq qədər vacibdir."] }
    ],
    checklist: ["Komanda məqsədi yazılıb", "Kapitan və məsul şəxslər seçilib", "Əsas format müəyyənləşdirilib", "Aylıq büdcə razılaşdırılıb", "Davamiyyət və ləğv qaydası var"],
    faq: [{ question: "Neçə oyunçu ilə başlamaq yaxşıdır?", answer: "5v5 üçün 7–8, 7v7 üçün 10–12, 11v11 üçün isə ən az 16–18 etibarlı oyunçu daha dayanıqlı başlanğıcdır." }, { question: "İlk gündən forma almaq lazımdır?", answer: "Xeyr. Əvvəlcə qrupun davamlılığını 3–4 oyun yoxlayın, sonra ölçü və büdcəni dəqiqləşdirin." }]
  },
  {
    slug: "5v5-7v7-11v11-format-ferqleri",
    title: "5v5, 7v7 və 11v11 formatları arasındakı fərqlər",
    description: "Meydan ölçüsü, fiziki yük, taktika, heyət sayı və oyunçu inkişafı baxımından üç məşhur formatın müqayisəsi.",
    publishedAt: "2026-07-20", updatedAt: "2026-07-31", readingMinutes: 7,
    sections: [
      { heading: "5v5: sürətli qərar və çoxlu top təması", paragraphs: ["Kiçik sahədə boşluq az olduğu üçün oyunçu topu qəbul etməzdən əvvəl qərar verməlidir. Qapıçı oyunun qurulmasında aktiv iştirak edir və mövqelər tez dəyişir.", "Yeni komanda üçün təşkil etmək asandır, amma əvəzləmə zəif planlaşdırılarsa intensivlik tez yorğunluq yaradır."] },
      { heading: "7v7: balanslı keçid formatı", paragraphs: ["7v7 cinah, mərkəz və müdafiə xətti anlayışlarını saxlamaqla hər oyunçuya kifayət qədər top təması verir. 2-3-1 və 3-2-1 kimi düzülüşlər rol öyrətmək üçün münasibdir.", "Orta ölçülü meydança düzgün en istifadəsini və müdafiədən hücuma keçidi məşq etməyə imkan verir."] },
      { heading: "11v11: struktur və səbr", paragraphs: ["Böyük sahədə xətlərarası məsafə, ofsayd, pressinq vaxtı və fiziki dözümlülük daha böyük rol oynayır. Heyətin gecikmə və zədə riskinə görə geniş olması vacibdir."], steps: ["Yeni və kiçik qrup üçün 5v5 seçin", "Taktiki rol və balans üçün 7v7-yə keçin", "Davamlı 16+ oyunçu və uyğun meydança olduqda 11v11 planlayın"] }
    ],
    checklist: ["Meydan ölçüsü formata uyğundur", "Ehtiyat oyunçu sayı hesablanıb", "Oyun müddəti fiziki səviyyəyə uyğundur", "Qapı və top ölçüsü yoxlanıb"],
    faq: [{ question: "Yeni başlayanlar üçün hansı format rahatdır?", answer: "Qısa oyun müddəti və düzgün əvəzləmə ilə 5v5 daha çox top təması verdiyi üçün əlverişlidir." }, { question: "7v7-də ofsayd olmalıdır?", answer: "Turnir qaydasından asılıdır. Oyundan əvvəl kapitanlar bunu dəqiq razılaşdırmalıdır." }]
  },
  {
    slug: "futbol-oyunu-teskil-etmek-beledcisi",
    title: "Futbol oyununu düzgün təşkil etmək üçün addım-addım bələdçi",
    description: "Tarix, meydança, iştirakçı təsdiqi, balanslı tərəflər və nəticə qeydi daxil olmaqla oyun günü planı.",
    publishedAt: "2026-07-21", updatedAt: "2026-07-31", readingMinutes: 9,
    sections: [
      { heading: "Oyundan əvvəl", paragraphs: ["Tarix və saatı alternativlərlə paylaşın, yalnız kifayət qədər təsdiq aldıqdan sonra meydançanı rezerv edin. Ünvan, səth, ayaqqabı tələbi, ödəniş və oyun müddəti bir mesajda aydın yazılmalıdır."], steps: ["Format və maksimum oyunçu sayını seçin", "İştirak üçün son təsdiq vaxtı qoyun", "Meydança rezervasiyasını yazılı təsdiqləyin", "Top, fərqləndirici forma və ilk yardım dəstini bölüşdürün"] },
      { heading: "Balanslı tərəflər", paragraphs: ["Tərəfləri təkcə hücum gücünə görə deyil, qapıçı, müdafiə, temp və oyunçu uyğunluğuna görə bölün. Dostluq oyununda məqsəd uzunmüddətli birtərəfli hesab deyil, rəqabətli və təhlükəsiz oyundur.", "Son anda gəlməyən oyunçu üçün ehtiyat siyahı saxlayın. Təsdiqsiz şəxsi əsas heyətə daxil etməyin."] },
      { heading: "Oyundan sonra", paragraphs: ["Hesabı və əsas hadisələri hər iki tərəflə yoxlayın. Mübahisə varsa nəticəni yekun kimi paylaşmadan əvvəl kapitanların razılığını gözləyin.", "Meydançanı təmiz buraxın, zədə və təşkilati problemi növbəti oyun planında nəzərə alın."] }
    ],
    checklist: ["Rezervasiya təsdiqlənib", "İştirakçılar son dəfə yoxlanıb", "Ödəniş qaydası aydındır", "Top və fərqləndirici formalar var", "Nəticə iki tərəflə yoxlanacaq"],
    faq: [{ question: "Nə qədər əvvəl oyun elan edilməlidir?", answer: "Həftəlik qrupda 3–5 gün, daha böyük və klublararası oyunda isə ən az bir həftə əvvəl elan faydalıdır." }, { question: "Son anda oyunçu çatmırsa nə etməli?", answer: "Əvvəlcədən ehtiyat siyahı saxlayın; formatı və oyun müddətini bütün iştirakçılarla razılaşdırmadan dəyişməyin." }]
  },
  {
    slug: "oyunculari-movqelere-bolmek",
    title: "Komanda üçün oyunçuları mövqelərə necə bölmək olar?",
    description: "Oyunçunun bacarıq, qərarvermə və fiziki xüsusiyyətlərinə uyğun mövqe sınağı və balanslı heyət prinsipləri.",
    publishedAt: "2026-07-22", updatedAt: "2026-07-31", readingMinutes: 8,
    sections: [
      { heading: "Etiketdən əvvəl müşahidə", paragraphs: ["Oyunçunun özünü hansı mövqedə gördüyünü soruşun, amma qərarı yalnız buna əsaslandırmayın. Top qəbul etmə, bədən mövqeyi, geriyə qaçış, ünsiyyət və təzyiq altında qərarı bir neçə oyunda müşahidə edin."] },
      { heading: "Rolun əsas tələbləri", paragraphs: ["Qapıçı üçün cəsarət və ötürmə qərarı, müdafiəçi üçün mövqe intizamı, mərkəz üçün ətrafı yoxlama, cinah üçün təkrar sprint, hücumçu üçün boşluğa çıxış vacibdir. Bir bacarıq bütün rolu müəyyən etmir."], steps: ["İki uyğun mövqe seçin", "Hər mövqedə ən az 20–30 dəqiqə sınaq verin", "Oyunçudan öz rahatlığını soruşun", "Komanda balansına görə əsas və alternativ rol yazın"] },
      { heading: "Kiçik formatlarda çeviklik", paragraphs: ["5v5 və 7v7-də sərt mövqe bölgüsü top itkisindən sonra boşluq yarada bilər. Oyunçular əsas rolunu bilməli, eyni zamanda yaxın zonanı bağlamağı və rotasiyanı öyrənməlidir."] }
    ],
    checklist: ["Hər oyunçunun əsas və alternativ mövqeyi var", "Qapıçı üçün əvəzləyici müəyyən edilib", "Hər tərəfdə müdafiə və hücum balansı var", "Mövqe qərarı bir oyuna əsaslanmır"],
    faq: [{ question: "Sol ayaqlı oyunçu mütləq solda oynamalıdır?", answer: "Xeyr. Komanda planına görə cinahı geniş saxlaya və ya içəri qat edən əks cinah rolunda oynaya bilər." }, { question: "Mövqeni nə vaxt dəyişmək lazımdır?", answer: "Oyunçu davamlı çətinlik çəkirsə, komandanın balansı pozulursa və ya başqa rolda güclü tərəfləri daha yaxşı görünürsə sınaq dəyişimi edin." }]
  },
  {
    slug: "tehlukesiz-isinme-ve-zede-riskinin-azaldilmasi",
    title: "Həvəskar futbolda təhlükəsiz isinmə və zədə riskinin azaldılması",
    description: "Oyun öncəsi mərhələli isinmə, yükün idarəsi, səth və avadanlıq yoxlaması üzrə ümumi təhlükəsizlik tövsiyələri.",
    publishedAt: "2026-07-23", updatedAt: "2026-07-31", readingMinutes: 8,
    sections: [
      { heading: "İsinməni mərhələli qurun", paragraphs: ["Soyuq əzələlərlə birbaşa sprint və güclü zərbə risklidir. Əvvəl yüngül qaçış, sonra dinamik hərəkət, istiqamət dəyişmə və sonda top ilə oyun tempinə yaxın tapşırıqlar edin.", "İsinmə yorucu məşq olmamalıdır. Məqsəd bədən temperaturunu qaldırmaq və oyunda istifadə olunacaq hərəkətlərə hazırlaşmaqdır."], steps: ["3–5 dəqiqə yüngül hərəkət", "Ayaq biləyi, omba və diz üçün dinamik mobilizasiya", "Nəzarətli sürətlənmə və yavaşlama", "Qısa ötürmə və istiqamət dəyişmə"] },
      { heading: "Yükü və bərpanı nəzərə alın", paragraphs: ["Uzun fasilədən sonra əvvəlki intensivliyə birdən qayıtmayın. Yuxusuzluq, susuzluq və əvvəlki zədə performansla yanaşı qərarverməni də zəiflədə bilər."] },
      { heading: "Nə vaxt dayanmaq lazımdır?", paragraphs: ["Kəskin ağrı, başgicəllənmə, nəfəs darlığı və ya baş zərbəsindən sonra çaşqınlıq olduqda oyunu dayandırın və uyğun tibbi yardım alın. Bu bələdçi tibbi məsləhət və diaqnoz deyil."] }
    ],
    checklist: ["Səth və qapılar yoxlanıb", "Uyğun ayaqqabı geyinilib", "Su mövcuddur", "Mərhələli isinmə edilib", "İlk yardım əlaqəsi məlumdur"],
    faq: [{ question: "Statik dartınma isinmənin əvvəlində edilməlidir?", answer: "Uzun statik dartınma əvəzinə əvvəl dinamik hərəkət daha uyğundur; fərdi tibbi ehtiyac üçün mütəxəssis məsləhəti alın." }, { question: "Baş zərbəsindən sonra oyuna qayıtmaq olar?", answer: "Çaşqınlıq, baş ağrısı və ya görmə problemi varsa oyuna qayıtmayın və tibbi qiymətləndirmə alın." }]
  },
  {
    slug: "komanda-kapitaninin-vezifeleri",
    title: "Komanda kapitanının əsas vəzifələri",
    description: "Kapitanın oyun öncəsi təşkilat, meydandakı ünsiyyət, mübahisə idarəsi və komanda mədəniyyətində rolu.",
    publishedAt: "2026-07-24", updatedAt: "2026-07-31", readingMinutes: 6,
    sections: [
      { heading: "Kapitan yalnız ən yaxşı oyunçu deyil", paragraphs: ["Kapitan etibarlı ünsiyyət quran, qərarı izah edən və gərgin anda komandanı sakit saxlayan şəxsdir. Texniki bacarıq faydalıdır, amma məsuliyyət və ədalət daha vacibdir."] },
      { heading: "Oyundan əvvəl və oyun zamanı", paragraphs: ["İştirakçı siyahısını, forma rəngini və başlanğıc düzülüşünü dəqiqləşdirin. Meydanda hakim və rəqib kapitanla əsas əlaqəni kapitan saxlamalıdır."], steps: ["Gecikmə və çatışmazlığı təşkilatçıya bildirin", "Rolları qısa və aydın izah edin", "Etirazı hörmətli tonda tək kanal ilə aparın", "Əvəzləmədə oyun müddətini ədalətli bölün"] },
      { heading: "Oyundan sonra", paragraphs: ["Nəticəni yoxlayın, mübahisəni ictimai təhqirə çevirmədən həll edin və komandanın yaxşılaşdırmalı olduğu bir neçə konkret məqamı qeyd edin."] }
    ],
    checklist: ["Əlaqə siyahısı hazırdır", "Düzülüş oyunçulara bildirilib", "Qaydalar rəqiblə razılaşdırılıb", "Əvəzləmə planı var", "Nəticə yoxlanıb"],
    faq: [{ question: "Kapitan hər qərarı tək verməlidir?", answer: "Xeyr. Təcili meydan qərarını verə bilər, amma büdcə və uzunmüddətli qaydalar komanda ilə şəffaf razılaşdırılmalıdır." }, { question: "İki kapitan ola bilər?", answer: "Əsas və köməkçi kapitan davamiyyət problemi olan qruplarda işi daha dayanıqlı edir." }]
  },
  {
    slug: "futbol-meydancasi-secmek",
    title: "Futbol meydançası seçərkən nələrə diqqət etmək lazımdır?",
    description: "Səth, ölçü, işıqlandırma, qapı təhlükəsizliyi, giriş və rezervasiya şərtləri üçün meydança yoxlama siyahısı.",
    publishedAt: "2026-07-25", updatedAt: "2026-07-31", readingMinutes: 7,
    sections: [
      { heading: "Format və ölçü uyğunluğu", paragraphs: ["5v5 oyunu üçün həddən artıq böyük, 7v7 üçün isə çox dar sahə oyun keyfiyyətini və fiziki yükü dəyişir. Qapı ölçüsünü, xətləri və təhlükəsizlik məsafəsini əvvəlcədən soruşun."] },
      { heading: "Səth və təhlükəsizlik", paragraphs: ["Süni örtükdə açıq tikiş, sürüşkən zona və sərt dolğu; təbii otda çuxur və su yığılması yoxlanmalıdır. Qapılar sabitlənməli, kənarda iti və sərt maneə olmamalıdır."], steps: ["Gündüz foto ilə kifayətlənməyin, axşam oyunu üçün işığı yoxlayın", "Ayaqqabı növünü iştirakçılara bildirin", "Soyunma otağı və su imkanını dəqiqləşdirin", "Ləğv və gecikmə qaydasını yazılı alın"] },
      { heading: "Məkan və giriş", paragraphs: ["Ümumi region bütün oyunçular üçün əlçatan olmalıdır. İctimai elanda dəqiq şəxsi ünvan yox, meydançanın rəsmi giriş məlumatı paylaşılmalıdır."] }
    ],
    checklist: ["Ölçü formata uyğundur", "Qapılar sabitdir", "Səthdə təhlükəli zədə yoxdur", "İşıqlandırma yoxlanıb", "Rezervasiya və ləğv qaydası məlumdur"],
    faq: [{ question: "Ucuz meydança həmişə daha sərfəlidir?", answer: "Yol məsafəsi, zəif işıq, qısa rezervasiya və zədə riski ümumi xərci artıra bilər." }, { question: "Yağışda süni örtükdə oynamaq olar?", answer: "Səthin drenajı və meydança qaydası əsasdır. Su yığılması və sürüşmə riski varsa oyunu dayandırın." }]
  },
  {
    slug: "matc-neticesi-ve-qol-deqiqeleri",
    title: "Matç nəticələrinin və qol dəqiqələrinin düzgün qeyd edilməsi",
    description: "Hesabın iki tərəflə təsdiqi, əlavə dəqiqə, avtoqol və mübahisəli hadisələrin dürüst qeydi.",
    publishedAt: "2026-07-26", updatedAt: "2026-07-31", readingMinutes: 6,
    sections: [
      { heading: "Vahid vaxt mənbəyi seçin", paragraphs: ["Qol dəqiqəsini hər kəs fərqli saatdan qeyd etdikdə uyğunsuzluq yaranır. Oyunun başlanğıcını kapitan və ya hakim qeyd etsin, hadisələr həmin vaxt xəttinə əsaslansın."] },
      { heading: "Hesabı oyundan dərhal sonra yoxlayın", paragraphs: ["Hər iki kapitan hesabı, qalib tərəfi və əsas hadisələri meydançadan ayrılmadan təsdiqləsin. Şübhəli qol müəllifi üçün təxmin yazmaq əvəzinə ad sahəsini boş saxlamaq daha dürüstdür."], steps: ["Ev və qonaq tərəfini qarışdırmayın", "Əlavə dəqiqəni 45+2 kimi ayrıca qeyd edin", "Avtoqolu qaydaya uyğun etiketləyin", "Düzəliş tarixçəsini və səbəbini saxlayın"] },
      { heading: "Mübahisəli nəticə", paragraphs: ["Razılıq yoxdursa nəticəni yekunlaşdırmayın. Foto, video və iki tərəfin qeydlərini toplayın; şəxsi hücum olmadan klub idarəçilərinin nəzərdən keçirməsinə verin."] }
    ],
    checklist: ["Vaxtı qeyd edən şəxs müəyyən edilib", "Tərəflərin sırası yoxlanıb", "Qol dəqiqələri formatlıdır", "İki kapitan hesabı təsdiqləyib"],
    faq: [{ question: "Dəqiq dəqiqə bilinmirsə nə yazılmalıdır?", answer: "Təxmin uydurmayın; sistem imkan verirsə hadisəni dəqiqəsiz saxlayın və ya qeyddə qeyri-dəqiq olduğunu göstərin." }, { question: "Nəticəni kim dəyişə bilər?", answer: "Yalnız səlahiyyətli klub rolları və tətbiqin təsdiq axını; dəyişiklik qarşı tərəfin hüququnu pozmamalıdır." }]
  },
  {
    slug: "yeni-komandaya-qosulmaq-davranis",
    title: "Yeni komandaya qoşularkən davranış qaydaları",
    description: "İlk əlaqə, sınaq oyunu, davamiyyət, ödəniş və komanda mədəniyyətinə uyğunlaşma üçün praktik tövsiyələr.",
    publishedAt: "2026-07-27", updatedAt: "2026-07-31", readingMinutes: 6,
    sections: [
      { heading: "İlk mesajı konkret yazın", paragraphs: ["Mövqenizi, təcrübə səviyyənizi, ümumi regionu və hansı günlər uyğun olduğunuzu qısa yazın. Özünüzü olduğundan yüksək göstərmək sınaq oyununda etimadı zəiflədir."] },
      { heading: "Sınaq oyununda", paragraphs: ["Vaxtından əvvəl gəlin, komandanın qaydasını dinləyin və ilk dəqiqədən hamını yönləndirməyə çalışmayın. Sadə ötürmə, mövqeyə qayıtmaq və hörmətli ünsiyyət yaxşı ilk təəssürat yaradır."], steps: ["Forma rəngini və meydança qaydasını soruşun", "Ödənişi əvvəlcədən dəqiqləşdirin", "Zədə və fiziki məhdudiyyəti gizlətməyin", "Oyundan sonra dürüst rəy istəyin"] },
      { heading: "Davamlı üzvlük", paragraphs: ["Gələ bilmədiyiniz oyunu erkən bildirin. Komanda büdcəsi və rezervasiya iştirakçı təsdiqinə bağlı olduğu üçün təkrarlanan son dəqiqə ləğvi bütün qrupa zərər verir."] }
    ],
    checklist: ["Profil məlumatı düzgündür", "Uyğun günlər bildirilib", "Ödəniş qaydası soruşulub", "Sınaq oyunu təsdiqlənib", "Ləğv qaydası başa düşülüb"],
    faq: [{ question: "Bir neçə komandada sınaq etmək düzgündür?", answer: "Bəli, amma mövcud öhdəliyinizi gizlətməyin və eyni vaxt üçün iki komandaya söz verməyin." }, { question: "Sınaqdan sonra cavab gəlmirsə?", answer: "Bir dəfə nəzakətli şəkildə rəy istəyin; davamlı mesajla təzyiq göstərməyin." }]
  },
  {
    slug: "heveskar-klub-mesq-plani",
    title: "Həvəskar futbol klubu üçün məşq planının qurulması",
    description: "Məqsəd, vaxt bölgüsü, texniki-taktiki tapşırıq və yük nəzarəti ilə sadə həftəlik məşq planı.",
    publishedAt: "2026-07-28", updatedAt: "2026-07-31", readingMinutes: 9,
    sections: [
      { heading: "Bir məşqə bir əsas məqsəd", paragraphs: ["Eyni sessiyada pressinq, standart vəziyyət, fiziki dözümlülük və bitiriciliyi tam həll etməyə çalışmaq diqqəti dağıdır. Son oyundan bir əsas problem seçin və tapşırıqları həmin məqsədə bağlayın."] },
      { heading: "75 dəqiqəlik nümunə", paragraphs: ["Vaxt az olduqda izahı qısa, top ilə fəaliyyəti yüksək saxlayın. Növbədə uzun gözləmə yaradan tapşırıqları kiçik qruplara bölün."], steps: ["10 dəqiqə dinamik isinmə", "15 dəqiqə texniki hazırlıq", "20 dəqiqə məqsədə uyğun məhdud oyun", "25 dəqiqə sərbəst və ya ssenarili oyun", "5 dəqiqə sakitləşmə və qısa rəy"] },
      { heading: "Yük və davamiyyət", paragraphs: ["Həvəskar oyunçuların iş və gündəlik fiziki yükü fərqlidir. Ağır sessiyanı oyundan dərhal əvvəl qoymayın və uzun fasilədən qayıdan oyunçuya eyni həcmdə yük verməyin.", "Məşqdən sonra nə işlədiyini iki sualla qiymətləndirin: məqsəd oyun içində göründümü və tapşırıq bütün oyunçuları aktiv saxladımı?"] }
    ],
    checklist: ["Sessiyanın bir əsas məqsədi var", "Avadanlıq əvvəlcədən hazırlanıb", "Tapşırıq oyunçu sayına uyğundur", "Su fasiləsi planlanıb", "Oyunadək bərpa vaxtı nəzərə alınıb"],
    faq: [{ question: "Həftədə bir məşq kifayətdirmi?", answer: "Məqsəd və oyun tezliyindən asılıdır. Davamlı, fokuslu bir məşq nizamsız iki məşqdən daha faydalı ola bilər." }, { question: "Fiziki qaçış ayrıca olmalıdır?", answer: "Fərdi ehtiyacdan asılıdır; komanda sessiyasında top ilə yüksək intensivlik çox vaxt daha uyğun olur, amma yük ölçülməlidir." }]
  }
];

export function getGuide(slug: string) {
  return guides.find((guide) => guide.slug === slug);
}
