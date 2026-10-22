import { useMemo } from 'react';
import { Locale, t } from '../../i18n/catalog';
import { DataPanel } from '../../ui/ModuleChrome';
import { DataTable, cellText } from '../../ui/table';

type Props = {
  locale: Locale;
  detail: Record<string, unknown> | null;
};

export function CrewExperiencePanel({ locale, detail }: Props) {
  const copy = t(locale);
  const rows = (detail?.experience as Record<string, unknown>[]) ?? [];

  const totalHours = useMemo(() => {
    return rows.reduce((sum, row) => sum + Number(row.hours ?? 0), 0);
  }, [rows]);

  if (!detail) {
    return <p className="status">{copy.crew.selectWorker}</p>;
  }

  return (
    <div className="crew-experience-panel">
      <p className="status crew-experience-demo-note" role="note">
        {copy.crew.experienceDemoNote}
      </p>
      <header className="crew-experience-summary panel-light">
        <div>
          <p className="muted-label">{copy.crew.experienceTotal}</p>
          <p className="crew-exp-total">{totalHours.toFixed(1)} h</p>
        </div>
        <div>
          <p className="muted-label">{copy.crew.position}</p>
          <p>{cellText(detail.position)}</p>
        </div>
        <div>
          <p className="muted-label">{copy.crew.experienceNote}</p>
          <p className="status">{copy.crew.experienceSimulatorSplit}</p>
        </div>
      </header>

      <DataPanel title={`${copy.tabs.crewExperience} · ${cellText(detail.full_name)}`}>
        {rows.length === 0 ? (
          <p className="status">{copy.empty}</p>
        ) : (
          <DataTable rows={rows} columns={['category', 'hours', 'as_of']} locale={locale} searchable />
        )}
      </DataPanel>
    </div>
  );
}
