import { useState } from 'react';
import { Locale, t } from '../i18n/catalog';
import { DataPanel, ModuleHero, ModuleTabs } from '../ui/ModuleChrome';
import { DataTable } from '../ui/table';

type Props = {
  locale: Locale;
  rows: Record<string, unknown>[];
};

export function CommunicationPage({ locale, rows }: Props) {
  const copy = t(locale);
  const [tab, setTab] = useState<'calls' | 'meetings'>('meetings');

  return (
    <div className="module-page">
      <ModuleHero
        title={copy.modules.communication}
        subtitle={copy.moduleSubs.communication}
        image="/heroes/hero-communication.png"
      />
      <ModuleTabs
        tabs={[
          { id: 'calls', label: copy.tabs.commCalls },
          { id: 'meetings', label: copy.tabs.commMeetings },
        ]}
        active={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />

      {tab === 'calls' ? (
        <DataPanel title={copy.tabs.commCalls}>
          <p className="status">{copy.moduleSubs.comingSoon}</p>
        </DataPanel>
      ) : (
        <DataPanel title={copy.tabs.commMeetings}>
          <DataTable rows={rows} columns={['title', 'agenda', 'status']} locale={locale} />
        </DataPanel>
      )}
    </div>
  );
}
