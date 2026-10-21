import { FormEvent, useMemo, useState } from 'react';
import { Branding } from '../api';
import { Locale, t } from '../i18n/catalog';
import { DataPanel, ModuleTabs } from '../ui/ModuleChrome';
import { Modal } from '../ui/Modal';
import { TableSearchBar } from '../ui/TableSearchBar';
import { filterRowsBySearch } from '../ui/table-filter';
import { DataTable } from '../ui/table';

type CompanyForm = {
  displayName: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
};

type Props = {
  locale: Locale;
  users: Record<string, unknown>[];
  profiles: Record<string, unknown>[];
  branding: Branding | null;
  company: Record<string, unknown> | null;
  tenantName: string;
  onSaveCompany: (body: CompanyForm) => Promise<boolean>;
  onSaveUserProfile: (email: string, profile: string) => Promise<boolean>;
};

export function SettingsPage({
  locale,
  users,
  profiles,
  branding,
  company,
  tenantName,
  onSaveCompany,
  onSaveUserProfile,
}: Props) {
  const copy = t(locale);
  const [tab, setTab] = useState<'general' | 'units' | 'alerts' | 'roles' | 'templates' | 'integrations'>(
    'general',
  );
  const [companyOpen, setCompanyOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [roleEmail, setRoleEmail] = useState('');
  const [roleProfile, setRoleProfile] = useState('piloto');
  const [companyForm, setCompanyForm] = useState<CompanyForm>({
    displayName: '',
    tagline: '',
    primaryColor: '#0f172a',
    accentColor: '#2563eb',
  });
  const [roleUserSearch, setRoleUserSearch] = useState('');
  const roleUsersVisible = useMemo(
    () => filterRowsBySearch(users, roleUserSearch),
    [users, roleUserSearch],
  );

  function openCompanyModal() {
    setCompanyForm({
      displayName: String(company?.display_name ?? branding?.displayName ?? tenantName),
      tagline: String(company?.tagline ?? branding?.tagline ?? ''),
      primaryColor: String(company?.primary_color ?? branding?.primaryColor ?? '#0f172a'),
      accentColor: String(company?.accent_color ?? branding?.accentColor ?? '#2563eb'),
    });
    setCompanyOpen(true);
  }

  function openRoleModal(row: Record<string, unknown>) {
    setRoleEmail(String(row.email ?? ''));
    setRoleProfile(String(row.profile ?? 'piloto'));
    setRoleOpen(true);
  }

  async function submitCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await onSaveCompany(companyForm);
    if (ok) setCompanyOpen(false);
  }

  async function submitRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await onSaveUserProfile(roleEmail, roleProfile);
    if (ok) setRoleOpen(false);
  }

  return (
    <div className="module-page">
      <header className="module-head">
        <h1 className="page-title">{copy.modules.settings}</h1>
        <ModuleTabs
          tabs={[
            { id: 'general', label: copy.tabs.settingsGeneral },
            { id: 'units', label: copy.tabs.settingsUnits },
            { id: 'alerts', label: copy.tabs.settingsAlerts },
            { id: 'roles', label: copy.tabs.settingsRoles },
            { id: 'templates', label: copy.tabs.settingsTemplates },
            { id: 'integrations', label: copy.tabs.settingsIntegrations },
          ]}
          active={tab}
          onChange={(id) => setTab(id as typeof tab)}
        />
      </header>

      <Modal
        open={companyOpen}
        title={copy.settingsForm.editCompany}
        closeLabel={copy.cancel}
        onClose={() => setCompanyOpen(false)}
      >
        <form className="stack" onSubmit={submitCompany}>
          <label htmlFor="company-name">{copy.columns.name}</label>
          <input
            id="company-name"
            value={companyForm.displayName}
            onChange={(e) => setCompanyForm({ ...companyForm, displayName: e.target.value })}
            required
          />
          <label htmlFor="company-tagline">{copy.settingsForm.tagline}</label>
          <input
            id="company-tagline"
            value={companyForm.tagline}
            onChange={(e) => setCompanyForm({ ...companyForm, tagline: e.target.value })}
          />
          <label htmlFor="company-primary">{copy.settingsForm.primaryColor}</label>
          <input
            id="company-primary"
            value={companyForm.primaryColor}
            onChange={(e) => setCompanyForm({ ...companyForm, primaryColor: e.target.value })}
            pattern="#[0-9A-Fa-f]{6}"
            required
          />
          <label htmlFor="company-accent">{copy.settingsForm.accentColor}</label>
          <input
            id="company-accent"
            value={companyForm.accentColor}
            onChange={(e) => setCompanyForm({ ...companyForm, accentColor: e.target.value })}
            pattern="#[0-9A-Fa-f]{6}"
            required
          />
          <div className="actions">
            <button type="submit">{copy.save}</button>
            <button type="button" className="ghost" onClick={() => setCompanyOpen(false)}>
              {copy.cancel}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={roleOpen}
        title={copy.settingsForm.editUserRole}
        closeLabel={copy.cancel}
        onClose={() => setRoleOpen(false)}
      >
        <form className="stack" onSubmit={submitRole}>
          <p className="muted-label">{roleEmail}</p>
          <label htmlFor="user-profile">{copy.settingsForm.profile}</label>
          <select
            id="user-profile"
            value={roleProfile}
            onChange={(e) => setRoleProfile(e.target.value)}
            required
          >
            {profiles.map((p) => (
              <option key={String(p.code)} value={String(p.code)}>
                {String(p.name)} ({String(p.code)})
              </option>
            ))}
          </select>
          <div className="actions">
            <button type="submit">{copy.save}</button>
            <button type="button" className="ghost" onClick={() => setRoleOpen(false)}>
              {copy.cancel}
            </button>
          </div>
        </form>
      </Modal>

      {tab === 'general' ? (
        <div className="settings-grid">
          <DataPanel
            title={copy.tabs.settingsCompany}
            action={
              <button type="button" className="ghost btn-compact" onClick={openCompanyModal}>
                {copy.settingsForm.editCompany}
              </button>
            }
          >
            <dl className="settings-dl">
              <div>
                <dt>{copy.columns.name}</dt>
                <dd>{String(company?.display_name ?? branding?.displayName ?? tenantName)}</dd>
              </div>
              <div>
                <dt>{copy.settingsForm.tagline}</dt>
                <dd>{String(company?.tagline ?? branding?.tagline ?? copy.taglineDefault)}</dd>
              </div>
              {company?.primary_color ? (
                <div>
                  <dt>{copy.tabs.settingsGeneral}</dt>
                  <dd>
                    {String(company.primary_color)} / {String(company.accent_color ?? '—')}
                  </dd>
                </div>
              ) : null}
            </dl>
            <div className="brand-preview">
              <img src="/logo-havectrl.png" alt="HAVECTRL" width={96} height={96} />
              <p>{copy.moduleSubs.settingsLogoNote}</p>
            </div>
          </DataPanel>
          <DataPanel title={copy.tabs.settingsUsers}>
            <DataTable
              rows={users}
              columns={['name', 'email', 'profile_name', 'preferred_language', 'active']}
              locale={locale}
            />
          </DataPanel>
        </div>
      ) : null}

      {tab === 'roles' ? (
        <div className="settings-grid">
          <DataPanel title={copy.tabs.settingsRoles}>
            <p className="status">{copy.settingsForm.profilesHint}</p>
            <DataTable rows={profiles} columns={['code', 'name']} locale={locale} />
          </DataPanel>
          <DataPanel title={copy.tabs.settingsUsers}>
            <div className="table-stack">
              {users.length > 0 ? (
                <TableSearchBar locale={locale} value={roleUserSearch} onChange={setRoleUserSearch} />
              ) : null}
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{copy.columns.name}</th>
                    <th>{copy.email}</th>
                    <th>{copy.settingsForm.profile}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <p className="status">{copy.empty}</p>
                      </td>
                    </tr>
                  ) : roleUsersVisible.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <p className="status">{copy.empty}</p>
                      </td>
                    </tr>
                  ) : (
                  roleUsersVisible.map((row) => (
                    <tr key={String(row.email)}>
                      <td>{String(row.name ?? '')}</td>
                      <td>{String(row.email ?? '')}</td>
                      <td>{String(row.profile_name ?? row.profile ?? '')}</td>
                      <td>
                        <button type="button" className="ghost btn-compact" onClick={() => openRoleModal(row)}>
                          {copy.settingsForm.editUserRole}
                        </button>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
            </div>
          </DataPanel>
        </div>
      ) : null}

      {tab !== 'general' && tab !== 'roles' ? (
        <DataPanel title={copy.modules.settings}>
          <p className="status">{copy.moduleSubs.comingSoon}</p>
        </DataPanel>
      ) : null}
    </div>
  );
}
