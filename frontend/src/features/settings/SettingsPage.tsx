import React, { useState, useEffect } from 'react';
import {
  User, Bell, Globe, Sun, Moon, Monitor, Shield, Database,
  Save, X, CheckCircle, AlertCircle, Loader2, Eye, EyeOff, ChevronRight
} from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { GlassCard } from '../../components/GlassCard';
import { AccessibilityMenu } from '../../components/AccessibilityMenu';
import { useAuth } from '../../core/contexts/AuthContext';
import { apiPatchProfile, apiPatchSettings, apiGetMe } from '../../core/api';
import { ProfilePhotoUpload } from './ProfilePhotoUpload';
import { useTranslation } from 'react-i18next';
import { applyTheme } from '../../core/theme';

// ── Toast system ──────────────────────────────────────────────────────────────
interface Toast { id: number; type: 'success' | 'error'; message: string }
let toastId = 0;

const ToastContainer: React.FC<{ toasts: Toast[]; remove: (id: number) => void }> = ({ toasts, remove }) => (
  <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
    {toasts.map(t => (
      <div
        key={t.id}
        className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border-2 font-bold text-base
          ${t.type === 'success' ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}
      >
        {t.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
        {t.message}
        <button onClick={() => remove(t.id)} className="ml-2 opacity-60 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; iconBg: string }> = ({ icon, title, iconBg }) => (
  <div className="flex items-center gap-4 mb-6">
    <div className={`p-3 rounded-xl ${iconBg}`}>{icon}</div>
    <h2 className="text-2xl font-extrabold text-gray-800 dark:text-gray-200">{title}</h2>
  </div>
);

const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({ value, onChange, disabled }) => (
  <button
    disabled={disabled}
    onClick={() => onChange(!value)}
    className={`relative inline-flex h-8 w-14 items-center rounded-full border-2 transition-colors focus:outline-none focus:ring-4 focus:ring-[#2E7D32]
      ${value ? 'bg-[#2E7D32] border-[#1B5E20]' : 'bg-gray-200 border-gray-300 dark:border-gray-600'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    aria-pressed={value}
  >
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-800 shadow-md transition-transform ${value ? 'translate-x-7' : 'translate-x-1'}`} />
  </button>
);

// The language options will be mapped dynamically inside the component so they can be translated

// ══════════════════════════════════════════════════════════════════════════════
const SettingsPage: React.FC = () => {
  const { user, updateUser, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileDirty, setProfileDirty] = useState(false);

  const [theme, setTheme] = useState('system');
  const [language, setLanguage] = useState('en');
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [settingsDirty, setSettingsDirty] = useState(false);

  // Password
  const [showPwdSection, setShowPwdSection] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const { t, i18n } = useTranslation();

  const LANGUAGES = [
    { label: 'English', code: 'en' },
    { label: 'हिन्दी (Hindi)', code: 'hi' },
    { label: 'বাংলা (Bengali)', code: 'bn' }
  ];

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  };

  // Sync form from user object
  const syncFromUser = (u: typeof user) => {
    if (!u) return;
    setFullName(u.full_name ?? '');
    setPhone(u.phone ?? '');
    setTheme(u.theme ?? 'system');
    // Ensure we sync the exact code if the db had older English string
    const dbLang = u.language ?? 'en';
    const normalizedLang = dbLang === 'English' ? 'en' : dbLang;
    setLanguage(normalizedLang);
    setNotifEmail(u.notif_email ?? true);
    setNotifPush(u.notif_push ?? true);
    setNotifSms(u.notif_sms ?? false);
    setProfileDirty(false);
    setSettingsDirty(false);
    
    // Also apply theme and language globally immediately from backend
    if (u.theme) applyTheme(u.theme);
    if (normalizedLang) i18n.changeLanguage(normalizedLang);
  };

  // On mount: load fresh profile from backend to ensure latest values
  useEffect(() => {
    setLoading(true);
    apiGetMe()
      .then(fresh => {
        updateUser(fresh);
        syncFromUser(fresh);
      })
      .catch(() => {
        // If unauthenticated, fall back to cached values
        if (user) syncFromUser(user);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = async () => {
    if (!fullName.trim()) { addToast('error', t('settings.profile.errNameEmpty')); return; }
    if (phone && !/^\+?[\d\s\-().]{7,15}$/.test(phone)) { addToast('error', t('settings.profile.errPhoneInvalid')); return; }
    setSaving(true);
    try {
      const updated = await apiPatchProfile({ full_name: fullName.trim(), phone: phone.trim() || null });
      updateUser(updated);
      setProfileDirty(false);
      addToast('success', t('settings.profile.success'));
    } catch (e: any) {
      addToast('error', e.message || t('settings.profile.errSave'));
    } finally { setSaving(false); }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const updated = await apiPatchSettings({ theme, language, notif_email: notifEmail, notif_push: notifPush, notif_sms: notifSms });
      updateUser(updated);
      setSettingsDirty(false);
      i18n.changeLanguage(language);
      localStorage.setItem('app_language', language);
      addToast('success', t('settings.saveSettings.success'));
    } catch (e: any) {
      addToast('error', e.message || t('settings.saveSettings.errSave'));
    } finally { setSaving(false); }
  };

  const cancelProfile = () => { if (user) syncFromUser(user); setProfileDirty(false); };
  const cancelSettings = () => { 
    if (user) {
      syncFromUser(user);
    } else {
      applyTheme('system');
      i18n.changeLanguage('en');
    }
    setSettingsDirty(false); 
  };

  const handlePasswordChange = () => {
    setPwdError(null);
    if (!currentPwd) { setPwdError(t('settings.security.errCurrentReq')); return; }
    if (newPwd.length < 8) { setPwdError(t('settings.security.errNewMin')); return; }
    if (newPwd !== confirmPwd) { setPwdError(t('settings.security.errMismatch')); return; }
    addToast('success', t('settings.security.pwdSuccess'));
    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    setShowPwdSection(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-14 h-14 text-[#2E7D32] animate-spin" />
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">{t('settings.loading')}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-24 bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 flex items-center px-6 sm:px-10 shrink-0 shadow-sm">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{t('settings.title')}</h1>
          {user && (
            <span className="ml-4 text-sm font-medium text-gray-400 hidden sm:block">
              {user.email}
            </span>
          )}
        </header>

        <div className="flex-1 overflow-auto p-6 sm:p-10">
          <div className="max-w-3xl mx-auto space-y-8">

            {/* ── Profile ─────────────────────────────────────────────── */}
            <GlassCard className="border-2 border-gray-200 dark:border-gray-700 shadow-sm">
              <SectionHeader icon={<User className="w-6 h-6 text-[#2E7D32]" />} iconBg="bg-[#E8F5E9]" title={t('settings.profile.title')} />
              
              <ProfilePhotoUpload 
                onSuccess={(msg) => addToast('success', msg)}
                onError={(msg) => addToast('error', msg)}
              />
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">{t('settings.profile.fullName')}</label>
                  <input
                    type="text" value={fullName} placeholder={t('settings.profile.fullNamePlaceholder')}
                    onChange={e => { setFullName(e.target.value); setProfileDirty(true); }}
                    className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-lg font-medium focus:outline-none focus:border-[#2E7D32] bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">{t('settings.profile.phone')}</label>
                  <input
                    type="tel" value={phone} placeholder={t('settings.profile.phonePlaceholder')}
                    onChange={e => { setPhone(e.target.value); setProfileDirty(true); }}
                    className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-lg font-medium focus:outline-none focus:border-[#2E7D32] bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">{t('settings.profile.email')}</label>
                  <input
                    type="email" value={user?.email ?? ''} disabled
                    className="w-full border-2 border-gray-100 dark:border-gray-800 rounded-xl px-4 py-3 text-lg font-medium bg-gray-50 dark:bg-gray-900 text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1 font-medium">{t('settings.profile.emailInfo')}</p>
                </div>
                {profileDirty && (
                  <div className="flex gap-3 pt-2">
                    <button onClick={saveProfile} disabled={saving}
                      className="flex items-center gap-2 px-6 py-3 bg-[#2E7D32] text-white rounded-xl font-bold hover:bg-[#1B5E20] transition-colors disabled:opacity-60">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {t('settings.profile.save')}
                    </button>
                    <button onClick={cancelProfile}
                      className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl font-bold hover:bg-gray-50 dark:bg-gray-900 transition-colors">
                      <X className="w-4 h-4" /> {t('settings.profile.cancel')}
                    </button>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* ── Notifications ────────────────────────────────────────── */}
            <GlassCard className="border-2 border-gray-200 dark:border-gray-700 shadow-sm">
              <SectionHeader icon={<Bell className="w-6 h-6 text-[#1565C0]" />} iconBg="bg-[#E3F2FD]" title={t('settings.notifications.title')} />
              <div className="space-y-4">
                {[
                  { label: t('settings.notifications.emailLabel'), desc: t('settings.notifications.emailDesc'), value: notifEmail, onChange: (v: boolean) => { setNotifEmail(v); setSettingsDirty(true); } },
                  { label: t('settings.notifications.pushLabel'),  desc: t('settings.notifications.pushDesc'),  value: notifPush,  onChange: (v: boolean) => { setNotifPush(v);  setSettingsDirty(true); } },
                  { label: t('settings.notifications.smsLabel'),   desc: t('settings.notifications.smsDesc'),   value: notifSms,   onChange: (v: boolean) => { setNotifSms(v);   setSettingsDirty(true); } },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <div>
                      <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{item.label}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{item.desc}</p>
                    </div>
                    <Toggle value={item.value} onChange={item.onChange} />
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* ── Language ─────────────────────────────────────────────── */}
            <GlassCard className="border-2 border-gray-200 dark:border-gray-700 shadow-sm">
              <SectionHeader icon={<Globe className="w-6 h-6 text-[#E65100]" />} iconBg="bg-[#FFF3E0]" title={t('settings.language.title')} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {LANGUAGES.map(lang => (
                  <button key={lang.code} onClick={() => { 
                      setLanguage(lang.code); 
                      i18n.changeLanguage(lang.code);
                      setSettingsDirty(true); 
                    }}
                    className={`px-4 py-4 rounded-xl border-2 font-bold text-lg transition-colors ${
                      language === lang.code ? 'bg-[#2E7D32] text-white border-[#2E7D32]' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#2E7D32] hover:text-[#2E7D32]'
                    }`}>
                    {lang.label}
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* ── Appearance ───────────────────────────────────────────── */}
            <GlassCard className="border-2 border-gray-200 dark:border-gray-700 shadow-sm">
              <SectionHeader icon={<Sun className="w-6 h-6 text-[#F57F17]" />} iconBg="bg-[#FFFDE7]" title={t('settings.appearance.title')} />
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'light', label: t('settings.appearance.light'), icon: Sun },
                  { value: 'dark',  label: t('settings.appearance.dark'),  icon: Moon },
                  { value: 'system',label: t('settings.appearance.system'),icon: Monitor },
                ].map(({ value, label, icon: Icon }) => (
                  <button key={value} onClick={() => { 
                      setTheme(value); 
                      applyTheme(value);
                      setSettingsDirty(true); 
                    }}
                    className={`flex flex-col items-center gap-3 py-6 rounded-2xl border-2 font-bold transition-colors ${
                      theme === value ? 'bg-[#E8F5E9] border-[#2E7D32] text-[#2E7D32]' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-[#2E7D32]'
                    }`}>
                    <Icon className="w-7 h-7" />
                    {label}
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* ── Save Settings ────────────────────────────────────────── */}
            {settingsDirty && (
              <div className="flex gap-3">
                <button onClick={saveSettings} disabled={saving}
                  className="flex items-center gap-2 px-8 py-4 bg-[#2E7D32] text-white rounded-2xl font-extrabold text-lg hover:bg-[#1B5E20] shadow-lg transition-colors disabled:opacity-60">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {t('settings.saveSettings.save')}
                </button>
                <button onClick={cancelSettings}
                  className="flex items-center gap-2 px-8 py-4 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-2xl font-extrabold text-lg hover:bg-gray-100 dark:bg-gray-800 transition-colors">
                  <X className="w-5 h-5" /> {t('settings.saveSettings.cancel')}
                </button>
              </div>
            )}

            {/* ── Security ─────────────────────────────────────────────── */}
            <GlassCard className="border-2 border-gray-200 dark:border-gray-700 shadow-sm">
              <SectionHeader icon={<Shield className="w-6 h-6 text-[#C62828]" />} iconBg="bg-[#FCE4EC]" title={t('settings.security.title')} />
              <div className="space-y-3">
                <button onClick={() => setShowPwdSection(v => !v)}
                  className="flex items-center justify-between w-full px-5 py-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-bold text-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 hover:border-[#2E7D32] transition-colors">
                  <span>{t('settings.security.changePwd')}</span>
                  <ChevronRight className={`w-5 h-5 transition-transform ${showPwdSection ? 'rotate-90' : ''}`} />
                </button>

                {showPwdSection && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-800 space-y-4">
                    {[
                      { label: t('settings.security.currentPwd'), value: currentPwd, onChange: setCurrentPwd },
                      { label: t('settings.security.newPwd'),      value: newPwd,     onChange: setNewPwd },
                      { label: t('settings.security.confirmPwd'),  value: confirmPwd, onChange: setConfirmPwd },
                    ].map(field => (
                      <div key={field.label}>
                        <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">{field.label}</label>
                        <div className="relative">
                          <input type={showPwd ? 'text' : 'password'} value={field.value}
                            onChange={e => field.onChange(e.target.value)}
                            className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 pr-12 text-base font-medium focus:outline-none focus:border-[#2E7D32] bg-white dark:bg-gray-800" />
                          <button type="button" onClick={() => setShowPwd(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:text-gray-300">
                            {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    ))}
                    {pwdError && (
                      <p className="text-sm font-bold text-red-600 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {pwdError}
                      </p>
                    )}
                    <button onClick={handlePasswordChange}
                      className="px-6 py-3 bg-[#2E7D32] text-white rounded-xl font-bold hover:bg-[#1B5E20] transition-colors">
                      {t('settings.security.updatePwd')}
                    </button>
                  </div>
                )}

                <button onClick={() => addToast('success', t('settings.security.logoutSuccess'))}
                  className="flex items-center justify-between w-full px-5 py-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-bold text-lg text-gray-700 dark:text-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors">
                  <span>{t('settings.security.logoutAll')}</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </GlassCard>

            {/* ── Privacy & Data ───────────────────────────────────────── */}
            <GlassCard className="border-2 border-gray-200 dark:border-gray-700 shadow-sm">
              <SectionHeader icon={<Database className="w-6 h-6 text-[#6A1B9A]" />} iconBg="bg-[#F3E5F5]" title={t('settings.privacy.title')} />
              <div className="space-y-3">
                <button onClick={() => addToast('success', t('settings.privacy.downloadSuccess'))}
                  className="flex items-center justify-between w-full px-5 py-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-bold text-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 hover:border-[#6A1B9A] transition-colors">
                  <span>{t('settings.privacy.download')}</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button onClick={() => addToast('error', t('settings.privacy.deleteError'))}
                  className="flex items-center justify-between w-full px-5 py-4 border-2 border-red-200 rounded-xl font-bold text-lg text-red-600 hover:bg-red-50 transition-colors">
                  <span>{t('settings.privacy.delete')}</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </GlassCard>

          </div>
        </div>
      </main>

      <ToastContainer toasts={toasts} remove={id => setToasts(prev => prev.filter(t => t.id !== id))} />
      <AccessibilityMenu />
    </div>
  );
};

export default SettingsPage;
