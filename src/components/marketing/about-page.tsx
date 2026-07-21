import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { marketingCopy } from "@/content/marketing";
import type { Locale } from "@/i18n/config";
import { siteConfig } from "@/config/site";
import { LanguageLinks } from "@/components/marketing/language-links";
import { seoTopicSlugs } from "@/content/seo-topics";

export function AboutPage({ locale }: { locale: Locale }) {
  const copy = marketingCopy[locale];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteConfig.url}/#organization`,
        name: siteConfig.name,
        url: siteConfig.url
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        name: siteConfig.name,
        url: siteConfig.url,
        inLanguage: ["az", "en", "ru"],
        publisher: { "@id": `${siteConfig.url}/#organization` }
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteConfig.url}/#app`,
        name: siteConfig.name,
        url: siteConfig.url,
        applicationCategory: "SocialNetworkingApplication",
        operatingSystem: "Web",
        description: copy.answer,
        inLanguage: locale,
        provider: { "@id": `${siteConfig.url}/#organization` }
      },
      {
        "@type": "FAQPage",
        "@id": `${siteConfig.url}/${locale}/about#faq`,
        mainEntity: copy.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer }
        }))
      }
    ]
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }} />
      <div className="mb-8 flex items-center justify-between gap-4">
        <Button asChild variant="ghost" className="px-0 hover:bg-transparent">
          <Link href={`/${locale}`}><ArrowLeft className="h-4 w-4" />{copy.back}</Link>
        </Button>
        <LanguageLinks currentLocale={locale} path="/about" />
      </div>
      <header className="max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{copy.eyebrow}</p>
        <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-6xl">{copy.aboutTitle}</h1>
        <p className="mt-6 text-xl leading-8 text-muted-foreground">{copy.answer}</p>
      </header>
      <section className="mt-12 grid gap-5 sm:grid-cols-2">
        {copy.sections.map((section, index) => (
          <Card key={section.title}><CardContent className="p-6"><h2 className="text-xl font-semibold"><Link className="hover:text-primary hover:underline" href={`/${locale}/${seoTopicSlugs[index]}`}>{section.title}</Link></h2><p className="mt-3 leading-7 text-muted-foreground">{section.body}</p></CardContent></Card>
        ))}
      </section>
      <section className="mt-14" aria-labelledby="who-title">
        <h2 id="who-title" className="text-3xl font-bold">{copy.whoTitle}</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {copy.who.map((item) => <li key={item} className="flex gap-3 rounded-md border bg-background p-4"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><span>{item}</span></li>)}
        </ul>
      </section>
      <section className="mt-14" aria-labelledby="faq-title">
        <h2 id="faq-title" className="text-3xl font-bold">{copy.faqTitle}</h2>
        <div className="mt-6 grid gap-5">
          {copy.faqs.map((faq) => <div key={faq.question}><h3 className="text-lg font-semibold">{faq.question}</h3><p className="mt-2 leading-7 text-muted-foreground">{faq.answer}</p></div>)}
        </div>
      </section>
      <div className="mt-14"><Button asChild size="lg"><Link href="/auth/register">{copy.join}</Link></Button></div>
    </main>
  );
}
