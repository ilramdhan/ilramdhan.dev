import { useQuery } from '@tanstack/react-query';
import { contactJsonLd } from '@/components/seo/json-ld';
import { Seo } from '@/components/seo/Seo';
import { ContactForm } from '@/features/messages/ContactForm';
import { profileQueries } from '@/features/profile/queries';
import { useLocale, useT } from '@/i18n';
import { socialEntries } from '@/lib/social';

// Tile and LinkChevron classes written out, as on privacy/terms: importing the partials re-splits their shared chunk
// and grows /blog's first load. ponytail: swap back to <LinkChevron> for external hrefs once it takes them.
const tile = 'w-full scroll-mt-(--nav-h) bg-white text-ink';
const link =
  'group/link inline-flex min-h-11 items-center gap-1.5 text-body text-tile-action decoration-1 underline-offset-4 transition-[color,scale] duration-200 ease-apple hover:text-tile-action-hover hover:underline active:scale-[0.98] motion-reduce:transition-none break-all';
const chevron = (
  <svg
    viewBox="0 0 8 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="h-3 w-[7px] flex-none transition-transform duration-200 ease-apple group-hover/link:translate-x-0.5 motion-reduce:transition-none"
  >
    <path d="M1.5 1.5 6.5 7l-5 5.5" />
  </svg>
);

/**
 * /contact (F-10, D11; mutugading contact: compact hero, the form, then the direct lines as quiet text links). The
 * links are the profile's own `social_links`: an empty or unknown entry is not shown.
 */
export default function ContactPage() {
  const t = useT();
  const locale = useLocale();
  const { data: profile } = useQuery(profileQueries.detail(locale));
  const links = socialEntries(profile?.social_links);

  return (
    <>
      <Seo
        title={t.nav.contact}
        description={t.seo.contactDescription}
        jsonLd={
          import.meta.env.SSR
            ? [
                contactJsonLd(locale, {
                  name: t.nav.contact,
                  description: t.seo.contactDescription,
                }),
              ]
            : undefined
        }
      />
      <section
        aria-labelledby="contact-h"
        data-tone="white"
        data-enter=""
        className={`${tile} pb-0 pt-[clamp(3.5rem,8vw,6rem)]`}
      >
        <div className="wrap flex animate-rise flex-col items-center text-center">
          <h1 id="contact-h" className="text-hero max-w-[14ch] text-tile-ink">
            {t.home.contactTitle}
          </h1>
          <p className="mt-5 max-w-[34ch] text-lead text-pretty text-tile-ink">
            {t.home.contactLead}
          </p>
        </div>
      </section>

      <section data-tone="white" aria-label={t.contact.formTitle} className={`${tile} py-section`}>
        <div className="wrap grid gap-x-24 gap-y-stack lg:justify-center lg:grid-cols-[minmax(0,36rem)_minmax(0,16rem)]">
          <div className="w-full max-w-xl justify-self-center text-left lg:justify-self-start">
            <h2 className="text-title text-tile-ink">{t.contact.formTitle}</h2>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
          {links.length > 0 ? (
            <div className="w-full max-w-xl justify-self-center text-left lg:justify-self-start">
              <h2 className="text-title text-tile-ink">{t.contact.elsewhere}</h2>
              <ul className="mt-4 flex flex-col items-start">
                {links.map(([key, href]) => {
                  const mail = key === 'mail';
                  return (
                    <li key={key}>
                      <a
                        href={href}
                        {...(mail ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                        className={link}
                      >
                        {mail ? (
                          <>
                            <span className="sr-only">{t.footer.socialName.mail}: </span>
                            {href.slice('mailto:'.length)}
                          </>
                        ) : (
                          t.footer.socialName[key]
                        )}
                        {chevron}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
