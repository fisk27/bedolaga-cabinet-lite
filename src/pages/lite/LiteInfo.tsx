import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { LiteLayout } from '@/components/lite/LiteLayout';
import { ArrowIcon, FileIcon, QuestionIcon, ShieldIcon } from '@/components/lite/icons';
import { infoPagesApi, type InfoPageType } from '@/api/infoPages';

function resolveTitle(
  title: Record<string, string> | null | undefined,
  locale: string,
  slug: string,
): string {
  const map = title ?? {};
  return map[locale] || map.ru || Object.values(map)[0] || slug;
}

function getIconForPage(slug: string, pageType: InfoPageType): ReactNode {
  if (pageType === 'faq') return <QuestionIcon />;
  const lower = slug.toLowerCase();
  if (lower.includes('privacy') || lower.includes('конфиденц')) return <ShieldIcon />;
  return <FileIcon />;
}

export default function LiteInfo() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const locale = i18n.language.split('-')[0];

  const { data: pages, isLoading } = useQuery({
    queryKey: ['info-pages'],
    queryFn: () => infoPagesApi.getPages(),
    staleTime: 60_000,
  });

  const activePages = (pages ?? [])
    .filter((p) => p.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <LiteLayout variant={{ title: 'Информация' }}>
      <div className="flex flex-col gap-2 pb-6 pt-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[64px] animate-pulse rounded-2xl border border-subo-hairline bg-subo-surface"
            />
          ))
        ) : activePages.length === 0 ? (
          <p className="py-10 text-center font-subo text-[14px] text-subo-textSoft">
            Пока нет страниц
          </p>
        ) : (
          activePages.map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => navigate(`/lite/info/${encodeURIComponent(page.slug)}`)}
              className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-subo-canary/[0.10] bg-subo-surface/60 px-3.5 py-3.5 text-left shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-[12px] transition-colors hover:bg-subo-text/[0.02]"
            >
              <div className="flex h-10 w-10 flex-none items-center justify-center text-subo-canary [&>svg]:h-6 [&>svg]:w-6">
                {getIconForPage(page.slug, page.page_type)}
              </div>
              <span className="flex-1 font-subo text-[15px] font-semibold text-subo-text">
                {resolveTitle(page.title, locale, page.slug)}
              </span>
              <div className="flex h-9 w-9 flex-none items-center justify-center text-subo-canary [&>svg]:h-5 [&>svg]:w-5">
                <ArrowIcon />
              </div>
            </button>
          ))
        )}
      </div>
    </LiteLayout>
  );
}
