import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageLinks } from "@/components/marketing/language-links";
import { marketingCopy } from "@/content/marketing";
import { seoTopics, seoTopicSlugs, type SeoTopicSlug } from "@/content/seo-topics";
import type { Locale } from "@/i18n/config";
import { siteConfig } from "@/config/site";

export function TopicPage({ locale, topic }: { locale: Locale; topic: SeoTopicSlug }) {
  const copy = seoTopics[locale][topic];
  const generalCopy = marketingCopy[locale];
  const pageUrl = `${siteConfig.url}/${locale}/${topic}`;
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
        provider: { "@id": `${siteConfig.url}/#organization` }
      },
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: copy.title,
        description: copy.description,
        inLanguage: locale,
        isPartOf: { "@id": `${siteConfig.url}/#website` },
        about: { "@id": `${siteConfig.url}/#app` }
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: generalCopy.back, item: `${siteConfig.url}/${locale}` },
          { "@type": "ListItem", position: 2, name: copy.title, item: pageUrl }
        ]
      },
      {
        "@type": "FAQPage",
        mainEntity: copy.faq.map((faq) => ({
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
          <Link href={`/${locale}/about`}><ArrowLeft className="h-4 w-4" />{generalCopy.learnMore}</Link>
        </Button>
        <LanguageLinks currentLocale={locale} path={`/${topic}`} />
      </div>

      <header className="max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{copy.eyebrow}</p>
        <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-6xl">{copy.title}</h1>
        <p className="mt-6 text-xl leading-8 text-muted-foreground">{copy.answer}</p>
      </header>

      <section className="mt-14" aria-labelledby="benefits-title">
        <h2 id="benefits-title" className="text-3xl font-bold">{copy.benefitsTitle}</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {copy.benefits.map((benefit) => (
            <Card key={benefit.title}><CardContent className="p-6"><h3 className="text-lg font-semibold">{benefit.title}</h3><p className="mt-3 leading-7 text-muted-foreground">{benefit.body}</p></CardContent></Card>
          ))}
        </div>
      </section>

      <section className="mt-14" aria-labelledby="steps-title">
        <h2 id="steps-title" className="text-3xl font-bold">{copy.stepsTitle}</h2>
        <ol className="mt-6 grid gap-4">
          {copy.steps.map((step, index) => <li key={step} className="flex gap-4 rounded-md border bg-background p-5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">{index + 1}</span><span className="pt-1 leading-7">{step}</span></li>)}
        </ol>
      </section>

      <section className="mt-14" aria-labelledby="topic-faq-title">
        <h2 id="topic-faq-title" className="text-3xl font-bold">{generalCopy.faqTitle}</h2>
        <div className="mt-6 grid gap-5">
          {copy.faq.map((faq) => <div key={faq.question}><h3 className="flex gap-2 text-lg font-semibold"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />{faq.question}</h3><p className="ml-7 mt-2 leading-7 text-muted-foreground">{faq.answer}</p></div>)}
        </div>
      </section>

      <nav aria-label="Related FanPitch features" className="mt-14 border-t pt-8">
        <h2 className="text-2xl font-bold">{generalCopy.learnMore}</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {seoTopicSlugs.filter((slug) => slug !== topic).map((slug) => (
            <Link key={slug} href={`/${locale}/${slug}`} className="flex items-center justify-between gap-3 rounded-md border bg-background p-4 font-medium hover:border-primary">
              {seoTopics[locale][slug].title}<ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          ))}
        </div>
      </nav>

      <div className="mt-12"><Button asChild size="lg"><Link href="/auth/register">{generalCopy.join}</Link></Button></div>
    </main>
  );
}
