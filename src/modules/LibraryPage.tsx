import { Locale, t } from '../i18n/catalog';
import { DataPanel, ModuleHero } from '../ui/ModuleChrome';
import { DataTable } from '../ui/table';

type Props = {
  locale: Locale;
  rows: Record<string, unknown>[];
};

export function LibraryPage({ locale, rows }: Props) {
  const copy = t(locale);
  return (
    <div className="module-page">
      <ModuleHero
        title={copy.modules.library}
        subtitle={copy.moduleSubs.library}
        image="/heroes/hero-library.png"
      />
      <DataPanel title={copy.modules.library}>
        <DataTable rows={rows} columns={['code', 'title', 'category', 'edition', 'status']} locale={locale} />
      </DataPanel>
    </div>
  );
}
