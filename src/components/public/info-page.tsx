import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Breadcrumbs, PublicHero, PublicShell } from "@/components/public/public-shell";
import { publicInfoContent, type PublicInfoKey } from "@/content/public-info";
import { siteConfig } from "@/config/site";

export function infoMetadata(key: PublicInfoKey): Metadata {
  const content = publicInfoContent[key];
  return {
    title: `${content.title} — PeerFootball`,
    description: content.description,
    alternates: { canonical: `/${key}` },
    openGraph: { title: content.title, description: content.description, url: `/${key}` }
  };
}

export function InfoPage({ contentKey, children }: { contentKey: PublicInfoKey; children?: ReactNode }) {
  const content = publicInfoContent[contentKey];
  const organizationJson = contentKey === "about" ? {
    "@context": "https://schema.org", "@type": "Organization", name: "PeerFootball", url: siteConfig.url
  } : null;
  return (
    <PublicShell>
      <PublicHero eyebrow="PeerFootball məlumat mərkəzi" title={content.title} description={content.description} />
      <article className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs items={[{ label: "Ana səhifə", href: "/" }, { label: content.title }]} />
        <p className="mb-8 text-sm text-muted-foreground">Son yenilənmə: <time dateTime={content.updated}>{content.updated}</time></p>
        <div className="grid gap-9">
          {content.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-2xl font-bold">{section.title}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-4 leading-8 text-muted-foreground">{paragraph}</p>)}
              {section.bullets ? <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-muted-foreground">{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul> : null}
            </section>
          ))}
        </div>
        {children}
      </article>
      {organizationJson ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJson).replaceAll("<", "\\u003c") }} /> : null}
    </PublicShell>
  );
}
