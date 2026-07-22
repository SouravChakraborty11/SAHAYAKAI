import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, SortAsc, SortDesc, RefreshCw, Download,
  Eye, ChevronLeft, ChevronRight, X, CheckCircle,
  Clock, AlertCircle, FileText, ExternalLink, Loader2
} from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { GlassCard } from '../../components/GlassCard';
import { AccessibilityMenu } from '../../components/AccessibilityMenu';
import { useTranslation } from 'react-i18next';
import { apiGetApplications } from '../../core/api';
import type { Application, ApplicationsData } from '../../core/api';

const API = 'http://127.0.0.1:8000/api/v1';



const STATUS_STYLES: Record<string, { label: string; color: string; bg: string; border: string; icon: React.FC<{ className?: string }> }> = {
  'Under Verification': { label: 'Under Verification', color: 'text-yellow-700', bg: 'bg-yellow-50',  border: 'border-yellow-300', icon: Clock },
  'Submitted':          { label: 'Submitted',          color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-300',   icon: FileText },
  'Approved':           { label: 'Approved',           color: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-300',  icon: CheckCircle },
  'Rejected':           { label: 'Rejected',           color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-300',    icon: AlertCircle },
  'Completed':          { label: 'Completed',          color: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-300',  icon: CheckCircle },
};

const getStatusStyle = (status: string) =>
  STATUS_STYLES[status] ?? { label: status, color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-300 dark:border-gray-600', icon: Clock };

const STATUSES = ['All', 'Submitted', 'Under Verification', 'Approved', 'Rejected', 'Completed'];


// ── Detail Modal ─────────────────────────────────────────────────────────────
const DetailModal: React.FC<{ app: Application; onClose: () => void }> = ({ app, onClose }) => {
  const { t } = useTranslation();
  const st = getStatusStyle(app.status);
  const StatusIcon = st.icon;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b-2 border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{app.scheme_name}</h2>
            <p className="text-base text-gray-500 dark:text-gray-400 mt-1 font-medium">Ref: {app.reference_number}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:bg-gray-800 rounded-xl transition-colors">
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          {/* Status */}
          <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-2xl border-2 font-bold text-lg ${st.color} ${st.bg} ${st.border}`}>
            <StatusIcon className="w-5 h-5" />
            {st.label}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { label: t('applications.details.applicant'), value: app.applicant_name },
              { label: t('applications.details.phone'),   value: app.phone_number },
              { label: t('applications.details.submittedOn'), value: new Date(app.created_at).toLocaleString() },
              { label: t('applications.details.updatedOn'),   value: new Date(app.updated_at).toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 border-2 border-gray-100 dark:border-gray-800">
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{value}</p>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          {(() => {
            const steps = ['Submitted', 'Under Verification', 'Approved'];
            const idx = steps.indexOf(app.status);
            const pct = app.status === 'Rejected' ? 100 : idx >= 0 ? ((idx + 1) / steps.length) * 100 : 33;
            const rejected = app.status === 'Rejected';
            return (
              <div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3">{t('applications.details.progress')}</p>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${rejected ? 'bg-red-400' : 'bg-[#2E7D32]'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  {steps.map(s => (
                    <span key={s} className="text-xs text-gray-500 dark:text-gray-400 font-medium">{s}</span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            {app.receipt_file && (
              <a
                href={`${API}/automation/files/receipts/${app.receipt_file}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#2E7D32] text-white rounded-xl font-bold hover:bg-[#1B5E20] transition-colors"
              >
                <Download className="w-4 h-4" /> {t('applications.details.downloadReceipt')}
              </a>
            )}
            {app.screenshot_file && (
              <a
                href={`${API}/automation/files/screenshots/${app.screenshot_file}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> {t('applications.details.viewScreenshot')}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const ApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ApplicationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  // Filters & pagination
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Detail modal
  const [selected, setSelected] = useState<Application | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await apiGetApplications({
        page,
        page_size: 8,
        sort_by: sortBy,
        sort_order: sortOrder,
        search,
        status: statusFilter
      });
      setData(json);
    } catch (e: any) {
      setError(e.message || t('applications.errorTitle'));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sortBy, sortOrder, t]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleStatusFilter = (s: string) => {
    setStatusFilter(s);
    setPage(1);
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-24 bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 sm:px-10 shrink-0 shadow-sm">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{t('applications.title')}</h1>
          <button
            onClick={fetchApplications}
            className="flex items-center gap-2 px-5 py-3 bg-[#E8F5E9] text-[#2E7D32] border-2 border-[#A5D6A7] rounded-xl font-bold hover:bg-[#C8E6C9] transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="hidden sm:block">{t('applications.refresh')}</span>
          </button>
        </header>

        <div className="flex-1 overflow-auto p-6 sm:p-8">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* Search & Sort bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex flex-1 gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    placeholder={t('applications.searchPlaceholder')}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-base font-medium focus:outline-none focus:border-[#2E7D32] bg-white dark:bg-gray-800"
                  />
                  {searchInput && (
                    <button type="button" onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-700 dark:text-gray-300" />
                    </button>
                  )}
                </div>
                <button type="submit" className="px-6 py-3 bg-[#2E7D32] text-white rounded-xl font-bold hover:bg-[#1B5E20] transition-colors shrink-0">
                  {t('applications.search')}
                </button>
              </form>

              {/* Sort */}
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={sortBy}
                  onChange={e => { setSortBy(e.target.value); setPage(1); }}
                  className="border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:outline-none focus:border-[#2E7D32] bg-white dark:bg-gray-800"
                >
                  <option value="created_at">{t('applications.sortBy.date')}</option>
                  <option value="scheme_name">{t('applications.sortBy.scheme')}</option>
                  <option value="applicant_name">{t('applications.sortBy.applicant')}</option>
                  <option value="status">{t('applications.sortBy.status')}</option>
                </select>
                <button
                  onClick={() => { setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); setPage(1); }}
                  className="p-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:bg-gray-800 transition-colors bg-white dark:bg-gray-800"
                  title="Toggle sort order"
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : <SortDesc className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
                </button>
              </div>
            </div>

            {/* Status filter tabs */}
            <div className="flex gap-2 flex-wrap">
              <Filter className="w-5 h-5 text-gray-400 self-center shrink-0" />
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusFilter(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-colors ${
                    statusFilter === s
                      ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-[#2E7D32] hover:text-[#2E7D32]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Results summary */}
            {data && !loading && (
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t(data.total !== 1 ? 'applications.summary' : 'applications.summarySingle', { count: data.results.length, total: data.total })}
              </p>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-12 h-12 text-[#2E7D32] animate-spin" />
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400">{t('applications.loading')}</p>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <GlassCard className="border-2 border-red-200 bg-red-50 !p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-xl font-bold text-red-700 mb-2">{t('applications.errorTitle')}</p>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                <button onClick={fetchApplications} className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors">
                  {t('applications.retry')}
                </button>
              </GlassCard>
            )}

            {/* Empty */}
            {!loading && !error && data?.total === 0 && (
              <GlassCard className="border-2 border-gray-200 dark:border-gray-700 !p-16 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-2xl font-extrabold text-gray-500 dark:text-gray-400 mb-2">{t('applications.noApplications')}</p>
                <p className="text-gray-400 mb-6">
                  {search || statusFilter !== 'All'
                    ? t('applications.emptySearch')
                    : t('applications.noApplicationsDesc')}
                </p>
                <button onClick={() => navigate('/automation')} className="px-8 py-4 bg-[#2E7D32] text-white rounded-xl font-bold hover:bg-[#1B5E20] transition-colors">
                  {t('applications.applyScheme')}
                </button>
              </GlassCard>
            )}

            {/* Results */}
            {!loading && !error && data && data.total > 0 && (
              <>
                <div className="space-y-4">
                  {data.results.map((app) => {
                    const st = getStatusStyle(app.status);
                    const StatusIcon = st.icon;
                    const progressSteps = ['Submitted', 'Under Verification', 'Approved'];
                    const idx = progressSteps.indexOf(app.status);
                    const pct = app.status === 'Rejected' ? 100 : idx >= 0 ? ((idx + 1) / progressSteps.length) * 100 : 33;
                    const rejected = app.status === 'Rejected';
                    return (
                      <div
                        key={app.id}
                        className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-[#2E7D32] hover:shadow-md transition-all cursor-pointer rounded-3xl p-6"
                        onClick={() => setSelected(app)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-[#E8F5E9] flex items-center justify-center text-[#2E7D32] shrink-0">
                              <FileText className="w-7 h-7" />
                            </div>
                            <div>
                              <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight">{app.scheme_name}</p>
                              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-0.5">{app.applicant_name}</p>
                              <p className="text-xs text-gray-400 font-medium mt-0.5 font-mono">{app.reference_number}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-bold text-sm ${st.color} ${st.bg} ${st.border}`}>
                              <StatusIcon className="w-4 h-4" />
                              {st.label}
                            </span>
                            <p className="text-xs text-gray-400 font-medium">Submitted: {new Date(app.created_at).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-400 font-medium">Updated: {new Date(app.updated_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="mb-5">
                          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${rejected ? 'bg-red-400' : 'bg-[#2E7D32]'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setSelected(app)}
                            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 hover:border-gray-400 transition-colors"
                          >
                            <Eye className="w-4 h-4" /> {t('applications.details.viewDetails')}
                          </button>
                          {app.receipt_file && (
                            <a
                              href={`${API}/automation/files/receipts/${app.receipt_file}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2E7D32] text-white rounded-xl text-sm font-bold hover:bg-[#1B5E20] transition-colors"
                            >
                              <Download className="w-4 h-4" /> {t('applications.details.downloadReceipt').split(' ')[0]}
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {data.total_pages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-4">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white dark:bg-gray-800"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    {Array.from({ length: data.total_pages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-11 h-11 rounded-xl border-2 font-bold text-sm transition-colors ${
                          p === page ? 'bg-[#2E7D32] text-white border-[#2E7D32]' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-[#2E7D32] hover:text-[#2E7D32]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
                      disabled={page === data.total_pages}
                      className="p-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white dark:bg-gray-800"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </main>

      {selected && <DetailModal app={selected} onClose={() => setSelected(null)} />}
      <AccessibilityMenu />
    </div>
  );
};

export default ApplicationsPage;
