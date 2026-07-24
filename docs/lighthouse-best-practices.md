# Lighthouse Best Practices auditi

Bu audit əsasən `/feed` səhifəsi üçündür.

## Third-party cookie mənbələri

| Mənbə | Nə vaxt yüklənir | Məqsəd | Bizim nəzarətimiz |
| --- | --- | --- | --- |
| `pagead2.googlesyndication.com` və digər `*.googlesyndication.com` origin-ləri | Yalnız istifadəçi reklam consent-i verdikdən sonra `/feed` səhifəsində | AdSense script və reklam göstərilməsi | Script-in yüklənmə vaxtı idarə olunur; provider-in daxili cookie davranışı idarə olunmur |
| `*.doubleclick.net` | AdSense reklam sorğusu və reklam iframe-i işə düşdükdən sonra | Reklam ölçümü, tezlik məhdudiyyəti və cookie matching | Google tərəfindən idarə olunur |
| `www.google.com` reklam iframe/endpoint-ləri | AdSense reklam creative-i yükləndikdən sonra | Reklam təhlükəsizliyi və göstərilməsi | Google tərəfindən idarə olunur |
| `www.youtube-nocookie.com` | Yalnız matç video səhifəsində YouTube iframe-i göstərildikdə | Privacy-enhanced video player | Embed privacy-enhanced domenə keçirilib |
| `drive.google.com` | Yalnız seçilmiş matç videosu Google Drive mənbəlidirsə | Funksional video player | Provider tərəfindən idarə olunur |
| Google OAuth | İstifadəçi Google ilə giriş düyməsini basdıqdan sonra | Autentifikasiya | `/feed` açılışında işləmir |

Vercel Analytics və Speed Insights Next.js inteqrasiyası vasitəsilə same-origin
endpoint-lərdən istifadə edir. Sentry yalnız konfiqurasiya edilmiş DSN-ə xəta
telemetriyası göndərir və `sendDefaultPii` söndürülüb. Layihədə Google Analytics
və Google Tag Manager yoxdur.

Chrome extension-ları və istifadəçinin mövcud browser profilindəki cookie-lər
layihənin third-party cookie nəticəsi kimi qəbul edilməməlidir.

Cookie adlarının tam siyahısı yalnız audit aparılan Chrome profilinin Lighthouse
JSON hesabatı və DevTools Application/Issues məlumatı ilə müəyyən edilə bilər.
Kod əsasında həmin adları təxmin edib sənədləşdirmək düzgün deyil.

## Tətbiq edilən qoruma

- AdSense script, slot və `adsbygoogle.push` consent olmadan işləmir.
- `/feed` üçün request başına nonce və `strict-dynamic` istifadə edən CSP tətbiq olunur.
- Digər document route-ları baseline CSP alır.
- `X-Frame-Options: DENY` və `frame-ancestors 'none'` clickjacking-i bloklayır.
- `Cross-Origin-Opener-Policy: same-origin-allow-popups` OAuth uyğunluğunu qoruyur.
- `nosniff`, məhdud Permissions Policy və sərt Referrer Policy aktivdir.
- YouTube embed-ləri privacy-enhanced `youtube-nocookie.com` domenindən istifadə edir.

## Qəsdən tətbiq edilməyən siyasətlər

`require-trusted-types-for 'script'` hazırda enforce edilmir. React/Next.js və
third-party AdSense kodunun bütün DOM sink-ləri üçün uyğun Trusted Types
policy-ləri olmadan bu direktivi aktivləşdirmək hydration və reklam
initialization xətaları yarada bilər.

Tam cross-origin isolation üçün `COOP: same-origin` və COEP tətbiq edilmir,
çünki OAuth popup/redirect inteqrasiyaları və xarici reklam/video resursları ilə
uyğunluq əvvəlcə ayrıca test edilməlidir. OAuth-a uyğun
`same-origin-allow-popups` real qoruma verir, lakin `crossOriginIsolated` rejimini
aktivləşdirmir.

## Lighthouse yoxlama qaydası

İki ayrı audit aparılmalıdır:

1. Təmiz browser profilində reklam consent-i vermədən — saytın ilkin privacy davranışı.
2. Consent verdikdən sonra — AdSense aktiv vəziyyəti.

İkinci auditdə Google reklam origin-lərinin third-party cookie xəbərdarlığı
göstərməsi mümkündür və reklamı saxlayaraq bunu layihə kodundan tam aradan
qaldırmaq mümkün deyil.
