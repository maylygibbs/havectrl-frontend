import { useState } from 'react';
import { Locale, t } from '../i18n/catalog';
import { DataPanel, ModuleHero, ModuleTabs } from '../ui/ModuleChrome';
import { DataTable } from '../ui/table';

type Props = {
  locale: Locale;
  services: Record<string, unknown>[];
  expenses: Record<string, unknown>[];
};

export function OperationsPage({ locale, services, expenses }: Props) {
  const copy = t(locale);
  const [tab, setTab] = useState<'overview' | 'fees' | 'services' | 'payments' | 'documents'>('overview');

  return (
    <div className="module-page">
      <ModuleHero
        title={copy.modules.operations}
        subtitle={copy.moduleSubs.operations}
        image="/heroes/hero-operations.png"
        meta="YV3500 � SVMI"
      />
      <ModuleTabs
        tabs={[
          { id: 'overview', label: copy.tabs.opsOverview },
          { id: 'fees', label: copy.tabs.opsFees },
          { id: 'services', label: copy.tabs.opsServices },
          { id: 'payments', label: copy.tabs.opsPayments },
          { id: 'documents', label: copy.tabs.opsDocuments },
        ]}
        active={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />

      {tab === 'overview' || tab === 'services' ? (
        <DataPanel title={copy.sections.services}>
          <DataTable
            rows={services}
            columns={['flight_code', 'kind', 'provider', 'status', 'amount', 'currency']}
            locale={locale}
          />
        </DataPanel>
      ) : null}

      {tab === 'fees' || tab === 'payments' ? (
        <DataPanel title={copy.tabs.opsFees}>
          <DataTable
            rows={services}
            columns={['flight_code', 'kind', 'provider', 'amount', 'currency', 'status']}
            locale={locale}
          />
        </DataPanel>
      ) : null}

      {tab === 'documents' ? (
        <DataPanel title={copy.sections.expenses}>
          <DataTable
            rows={expenses}
            columns={['flight_code', 'category', 'description', 'amount', 'currency', 'status']}
            locale={locale}
          />
        </DataPanel>
      ) : null}
    </div>
  );
}
