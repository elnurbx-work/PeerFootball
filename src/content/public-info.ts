export type PublicInfoKey = "about" | "how-it-works" | "contact" | "help" | "community-guidelines" | "safety" | "privacy" | "terms" | "cookie-policy";

export const publicInfoContent: Record<PublicInfoKey, {
  title: string;
  description: string;
  updated: string;
  sections: Array<{ title: string; paragraphs: string[]; bullets?: string[] }>;
}> = {
  about: {
    title: "PeerFootball haqqında",
    description: "PeerFootball həvəskar futbolçuların, yerli klubların və oyun təşkilatçılarının real futbol fəaliyyətini bir mərkəzdə idarə etməsinə kömək edir.",
    updated: "2026-07-31",
    sections: [
      { title: "Məqsədimiz", paragraphs: ["Platformanın məqsədi komanda yoldaşı tapmaq, klub qurmaq, oyun planlaşdırmaq və təsdiqlənmiş nəticələri saxlamaq üçün aydın iş axını yaratmaqdır. PeerFootball real icma fəaliyyətini saxta statistika və uydurma kataloq məlumatları ilə əvəz etmir."] },
      { title: "Kimlər üçündür?", paragraphs: ["Həvəskar futbol oynayan şəxslər, heyətini idarə edən kapitanlar, yerli klublar və təhlükəsiz oyun təşkil etmək istəyən qruplar üçün nəzərdə tutulub."], bullets: ["İctimai futbol profili yaratmaq", "Klub üzvlüyü və rolları idarə etmək", "Klubdaxili və klublararası oyunlar təşkil etmək", "Heyət və taktika planları hazırlamaq"] },
      { title: "Platformanın statusu", paragraphs: ["PeerFootball inkişaf edən məhsuldur. Bəzi kataloqlarda məlumat az ola bilər; belə hallarda uydurma obyektlər göstərmək əvəzinə dürüst empty state və faydalı izah təqdim olunur."] }
    ]
  },
  "how-it-works": {
    title: "PeerFootball necə işləyir?",
    description: "Profildən oyunun nəticəsinə qədər PeerFootball iş axınının praktik izahı.",
    updated: "2026-07-31",
    sections: [
      { title: "1. Profilinizi hazırlayın", paragraphs: ["İctimai görünməsini istədiyiniz ad, mövqe, ümumi region və futbol bio-sunu əlavə edin. E-poçt və hesab məlumatları public kataloqda göstərilmir."] },
      { title: "2. Oyunçu və klub tapın", paragraphs: ["Public kataloqlarda yalnız ictimai profillər və açıq, aktiv klublar görünür. Qoşulma əməliyyatları üçün hesabla daxil olmaq tələb edilir."] },
      { title: "3. Oyunu təşkil edin", paragraphs: ["Klubun icazəli üzvləri vaxtı, ümumi məkanı, formatı və tərəfləri seçir. Klublararası oyun qarşı tərəf qəbul etmədən aktiv oyun kimi yaranmır."] },
      { title: "4. Nəticəni qeyd edin", paragraphs: ["Oyun başa çatdıqda nəticə və qol hadisələri qeyd olunur. Klublararası nəticələr qarşı tərəfin təsdiq prosesindən keçə bilər."] }
    ]
  },
  contact: {
    title: "Əlaqə",
    description: "Texniki problem, təhlükəsizlik narahatlığı və ya əməkdaşlıq mövzusu üçün PeerFootball komandası ilə əlaqə yolları.",
    updated: "2026-07-31",
    sections: [
      { title: "Dəstək sorğusu", paragraphs: ["Hesab daxilindən “Əks əlaqə” bölməsi texniki problem və məhsul təklifləri üçün əsas kanaldır. Sorğuda parol, giriş kodu və şəxsi sənəd paylaşmayın."] },
      { title: "E-poçt", paragraphs: ["Dəstək e-poçtu yalnız NEXT_PUBLIC_SUPPORT_EMAIL mühit dəyişəni production-da təyin edildikdə saytda göstərilir. Ünvan təyin edilməyibsə uydurma əlaqə ünvanı təqdim edilmir."] },
      { title: "Təcili təhlükəsizlik məsələsi", paragraphs: ["Hesabınıza icazəsiz girişdən şübhələnirsinizsə parolu dəyişin, aktiv sessiyaları nəzərdən keçirin və məsələni “Təhlükəsizlik” mövzusu ilə bildirin."] }
    ]
  },
  help: {
    title: "Kömək mərkəzi",
    description: "Hesab, profil, klub, oyun, nəticə, məxfilik və təhlükəsizlik üzrə qısa kömək bələdçisi.",
    updated: "2026-07-31",
    sections: [
      { title: "Hesab və profil", paragraphs: ["Qeydiyyatdan sonra e-poçt təsdiqini tamamlayın. Profil görünməsini Public, Friends only və ya Private seçə bilərsiniz. Public olmayan profil oyunçu kataloqunda göstərilmir."] },
      { title: "Klub və üzvlük", paragraphs: ["Açıq kluba qoşulma qaydası klub ayarından asılıdır. Dəvət və sorğular yalnız icazəli klub rolları tərəfindən idarə edilir."] },
      { title: "Oyun və nəticə", paragraphs: ["Oyun səhifəsi format, tarix, ümumi məkan və statusu göstərir. Klublararası təklif qəbul edilmədən planlaşdırılmış oyun sayılmır. Nəticə mübahisəsi klub idarəçiləri tərəfindən nəzərdən keçirilir."] },
      { title: "Mesajlaşma", paragraphs: ["Şəxsi mesajlar və klub söhbətləri eyni mesaj mərkəzində ayrı tablarda işləyir. Klubdan çıxarılan istifadəçi klub söhbətinə girişini itirir."] }
    ]
  },
  "community-guidelines": {
    title: "İcma qaydaları",
    description: "PeerFootball-da hörmətli, təhlükəsiz və futbola fokuslanan ünsiyyət üçün davranış qaydaları.",
    updated: "2026-07-31",
    sections: [
      { title: "Hörmətli davranın", paragraphs: ["Təhqir, təhdid, ayrı-seçkilik, davamlı təqib və razılıqsız şəxsi məlumat paylaşımı yolverilməzdir."], bullets: ["Rəqibə və hakimə hörmət edin", "Mübahisəni şəxsi hücuma çevirməyin", "Başqasının foto və videosunu paylaşmazdan əvvəl icazə alın"] },
      { title: "Dürüst futbol məlumatı", paragraphs: ["Saxta nəticə, başqa şəxsin adına profil, uydurma klub və aldadıcı oyun elanı yaratmayın. Nəticə qeydlərində qol və hesab məlumatını dürüst daxil edin."] },
      { title: "Moderasiya", paragraphs: ["Qaydaları pozan məzmun silinə, hesab funksiyaları məhdudlaşdırıla və ciddi hallarda hesab bloklana bilər. Şikayətlər kontekst və təkrar davranış nəzərə alınaraq araşdırılır."] }
    ]
  },
  safety: {
    title: "Təhlükəsizlik",
    description: "Onlayn hesabı və real futbol görüşlərini daha təhlükəsiz saxlamaq üçün praktik tövsiyələr.",
    updated: "2026-07-31",
    sections: [
      { title: "Hesab təhlükəsizliyi", paragraphs: ["Unikal parol istifadə edin, giriş kodunu heç kimlə paylaşmayın və şübhəli linklərdən daxil olmayın. PeerFootball əməkdaşı sizdən parol istəməz."] },
      { title: "Real görüşlər", paragraphs: ["İlk dəfə tanış olduğunuz qrupla ictimai və tanınan meydançada görüşün. Oyun vaxtını yaxınınıza bildirin, dəqiq ev ünvanı paylaşmayın və riskli hava şəraitində oyunu təxirə salın."] },
      { title: "Zədə riskinin azaldılması", paragraphs: ["Uyğun isinmə edin, səthə uyğun ayaqqabı geyinin, su götürün və zədə əlaməti olduqda oyunu dayandırın. Platformadakı məzmun tibbi diaqnoz əvəzi deyil."] }
    ]
  },
  privacy: {
    title: "Məxfilik siyasəti",
    description: "PeerFootball-da hansı məlumatların niyə işləndiyi və ictimai görünmənin necə idarə edildiyi.",
    updated: "2026-07-31",
    sections: [
      { title: "Toplanan məlumatlar", paragraphs: ["Hesab yaratmaq üçün identifikasiya və giriş məlumatları, profil üçün seçdiyiniz futbol məlumatları, təhlükəsizlik və xidmət fəaliyyəti üçün texniki qeydlər işlənə bilər."] },
      { title: "İctimai məlumat", paragraphs: ["Yalnız Public seçilmiş profillər təhlükəsiz sahələrlə oyunçu kataloqunda göstərilir. E-poçt, telefon, auth provider məlumatı və dəqiq GPS koordinatı public DTO-lara daxil edilmir."] },
      { title: "İstifadə məqsədi və paylaşma", paragraphs: ["Məlumat xidmətin təqdim edilməsi, təhlükəsizlik, moderasiya və performans üçün işlənir. Reklam və analitika cookie-ləri seçim razılığına tabedir. Məlumat qanuni tələb və ya xidmət təminatçısı zərurəti olmadıqca satılmır."] },
      { title: "Seçimləriniz", paragraphs: ["Profil görünməsini dəyişə, hesab məlumatını yeniləyə və dəstək vasitəsilə silinmə sorğusu göndərə bilərsiniz. Zəruri olmayan cookie seçimləri footer-dən dəyişdirilə bilər."] }
    ]
  },
  terms: {
    title: "İstifadə şərtləri",
    description: "PeerFootball xidmətindən istifadə üçün əsas qaydalar və məsuliyyət sərhədləri.",
    updated: "2026-07-31",
    sections: [
      { title: "Uyğun istifadə", paragraphs: ["İstifadəçi təqdim etdiyi məlumatın düzgünlüyünə, hesabının qorunmasına və icma qaydalarına əməl etməyə cavabdehdir. Xidmətdən qanunsuz, zərərli və ya aldadıcı məqsədlə istifadə edilə bilməz."] },
      { title: "İstifadəçi məzmunu", paragraphs: ["Paylaşdığınız məzmunun hüquqlarına sahib olmalı və digər şəxslərin məxfiliyini pozmamalısınız. Qaydaları pozan məzmun moderasiya edilə bilər."] },
      { title: "Real oyunlar", paragraphs: ["PeerFootball oyunçular arasında texniki əlaqə və təşkilati alətlər təqdim edir, meydançanın fiziki təhlükəsizliyinə və iştirakçıların tibbi uyğunluğuna zəmanət vermir. İştirakçı öz riskini qiymətləndirməlidir."] },
      { title: "Xidmət dəyişiklikləri", paragraphs: ["Funksiyalar təhlükəsizlik, qanuni tələb və məhsul inkişafına görə dəyişə bilər. Əhəmiyyətli şərt dəyişiklikləri bu səhifədə yenilənmə tarixi ilə dərc edilir."] }
    ]
  },
  "cookie-policy": {
    title: "Cookie siyasəti",
    description: "PeerFootball-un zəruri, seçim, analitika və reklam cookie-lərindən istifadə qaydası.",
    updated: "2026-07-31",
    sections: [
      { title: "Zəruri cookie-lər", paragraphs: ["Giriş sessiyası, təhlükəsizlik və əsas sayt davranışı üçün tələb olunur. Bunlar olmadan hesab funksiyaları düzgün işləməyə bilər."] },
      { title: "Seçim cookie-ləri", paragraphs: ["Dil, tema və istifadəçi interfeysi seçimlərini yadda saxlaya bilər."] },
      { title: "Analitika cookie-ləri", paragraphs: ["Yalnız razılıq verdikdə saytın ümumi istifadəsini və performans problemlərini anlamaq üçün aktivləşir."] },
      { title: "Reklam cookie-ləri", paragraphs: ["AdSense aktiv və təsdiqli olduqda, yalnız reklam razılığı verilmiş uyğun public səhifələrdə reklam sorğusu yaradıla bilər. Auth, direct, settings və boş səhifələrdə reklam göstərilmir."] },
      { title: "Seçimi dəyişmək", paragraphs: ["Footer-də “Cookie ayarları” düyməsi ilə opsional kateqoriyaları istənilən vaxt qəbul və ya rədd edə bilərsiniz."] }
    ]
  }
};
