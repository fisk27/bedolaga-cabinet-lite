import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { LiteLayout } from '@/components/lite/LiteLayout';
import { ArrowIcon } from '@/components/lite/icons';
import { infoPagesApi } from '@/api/infoPages';

function resolveTitle(title: Record<string, string>, locale: string, slug: string): string {
  return title[locale] || title.ru || Object.values(title)[0] || slug;
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
              className="h-[58px] animate-pulse rounded-2xl border border-subo-hairline bg-subo-surface"
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
              onClick={() => navigate(`/lite/info/${page.slug}`)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-subo-hairline bg-subo-surface p-4 text-left transition-colors hover:bg-subo-text/[0.02]"
            >
              <span className="font-subo text-[15px] font-medium text-subo-text">
                {resolveTitle(page.title, locale, page.slug)}
              </span>
              <ArrowIcon className="shrink-0 text-subo-textSoft" />
            </button>
          ))
        )}
      </div>
    </LiteLayout>
  );
}
