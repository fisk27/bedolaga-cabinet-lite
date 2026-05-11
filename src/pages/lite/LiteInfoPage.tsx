import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { LiteLayout } from '@/components/lite/LiteLayout';
import { PrimaryButton } from '@/components/lite/PrimaryButton';
import { ArrowIcon } from '@/components/lite/icons';
import { infoPagesApi } from '@/api/infoPages';
import type { FaqItem } from '@/api/infoPages';
import { sanitizeHtml } from '@/utils/sanitizeHtml';

function resolveLocalized(map: Record<string, string>, locale: string, fallback = ''): string {
  return map[locale] || map.ru || map.en || Object.values(map)[0] || fallback;
}

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-subo-hairline bg-subo-surface"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full cursor-pointer items-center justify-between gap-3 border-none bg-transparent px-4 py-3.5 text-left"
            >
              <span className="font-subo text-[14px] font-medium text-subo-text">{item.q}</span>
              <ArrowIcon
                className={cn(
                  'shrink-0 text-subo-textSoft transition-transform',
                  isOpen ? 'rotate-90' : 'rotate-0',
                )}
              />
            </button>
            {isOpen && (
              <div
                className="prose-lite border-t border-subo-hairline px-4 py-3 text-[14px]"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.a) }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function LiteInfoPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const locale = i18n.language.split('-')[0];

  const {
    data: page,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['info-page', slug],
    queryFn: () => {
      if (!slug) throw new Error('Missing slug');
      return infoPagesApi.getPageBySlug(slug);
    },
    enabled: !!slug,
    staleTime: 60_000,
    retry: false,
  });

  const title = page ? resolveLocalized(page.title, locale, page.slug) : 'Информация';
  const isFaq = page?.page_type === 'faq';

  const faqItems = useMemo((): FaqItem[] => {
    if (!page || !isFaq) return [];
    const raw = resolveLocalized(page.content, locale, '[]');
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [page, isFaq, locale]);

  const sanitizedContent = useMemo(() => {
    if (!page || isFaq) return '';
    return sanitizeHtml(resolveLocalized(page.content, locale, ''));
  }, [page, isFaq, locale]);

  const renderBody = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col gap-3">
          <div className="h-32 animate-pulse rounded-2xl bg-subo-surface" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-subo-hairline" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-subo-hairline" />
        </div>
      );
    }
    if (isError || !page) {
      return (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <p className="font-subo text-[14px] text-subo-textSoft">Страница не найдена</p>
          <PrimaryButton onClick={() => navigate('/lite/info', { replace: true })}>
            К списку
          </PrimaryButton>
        </div>
      );
    }
    if (isFaq) {
      if (faqItems.length === 0) {
        return (
          <p className="py-6 text-center font-subo text-[14px] text-subo-textSoft">
            Вопросов пока нет
          </p>
        );
      }
      return <FaqAccordion items={faqItems} />;
    }
    return <div className="prose-lite" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
  };

  return (
    <LiteLayout variant={{ title }} backFallback="/lite/info">
      <div className="flex flex-col gap-4 pb-6 pt-3">{renderBody()}</div>
    </LiteLayout>
  );
}
