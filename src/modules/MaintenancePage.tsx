import { useState } from 'react';
import { Locale, t } from '../i18n/catalog';
import { DataPanel, ModuleHero, ModuleTabs } from '../ui/ModuleChrome';
import { DataTable } from '../ui/table';

type Props = {
  locale: Locale;
  inspections: Record<string, unknown>[];
  discrepancies: Record<string, unknown>[];
  orders: Record<string, unknown>[];
  logReviews: Record<string, unknown>[];
};

export function MaintenancePage({ locale, inspections, discrepancies, orders, logReviews }: Props) {
  const copy = t(locale);
  const [tab, setTab] = useState<'overview' | 'inspections' | 'discrepancies' | 'orders' | 'components' | 'history'>(
    'overview',
  );

  return (
    <div className="module-page">
      <ModuleHero
        title={copy.modules.maintenance}
        subtitle={copy.moduleSubs.maintenance}
        image="/heroes/hero-maintenance.png"
      />
      <ModuleTabs
        tabs={[
          { id: 'overview', label: copy.tabs.mxOverview },
          { id: 'inspections', label: copy.tabs.mxInspections },
          { id: 'discrepancies', label: copy.tabs.mxDiscrepancies },
          { id: 'orders', label: copy.tabs.mxOrders },
          { id: 'components', label: copy.tabs.mxComponents },
          { id: 'history', label: copy.tabs.mxHistory },
        ]}
        active={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />

      {tab === 'overview' ? (
        <div className="home-grid">
          <DataPanel title={copy.sections.inspections}>
            <DataTable
              rows={inspections}
              columns={['registration', 'title', 'due_date', 'due_hours', 'status']}
              locale={locale}
            />
          </DataPanel>
          <DataPanel title={copy.sections.orders}>
            <DataTable rows={orders} columns={['registration', 'title', 'assigned_to', 'status']} locale={locale} />
          </DataPanel>
        </div>
      ) : null}

      {tab === 'inspections' ? (
        <DataPanel title={copy.sections.inspections}>
          <DataTable
            rows={inspections}
            columns={['registration', 'title', 'due_date', 'due_hours', 'status']}
            locale={locale}
          />
        </DataPanel>
      ) : null}

      {tab === 'discrepancies' ? (
        <DataPanel title={copy.sections.discrepancies}>
          <DataTable
            rows={discrepancies}
            columns={['registration', 'title', 'status', 'reported_by']}
            locale={locale}
          />
        </DataPanel>
      ) : null}

      {tab === 'orders' ? (
        <DataPanel title={copy.sections.orders}>
          <DataTable rows={orders} columns={['registration', 'title', 'assigned_to', 'status']} locale={locale} />
        </DataPanel>
      ) : null}

      {tab === 'components' ? (
        <DataPanel title={copy.tabs.mxComponents}>
          <p className="status">{copy.moduleSubs.comingSoon}</p>
        </DataPanel>
      ) : null}

      {tab === 'history' ? (
        <DataPanel title={copy.sections.logReview}>
          <DataTable
            rows={logReviews}
            columns={['code', 'registration', 'pilot_name', 'flight_minutes', 'cycles', 'review_status']}
            locale={locale}
          />
        </DataPanel>
      ) : null}
    </div>
  );
}
