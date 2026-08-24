import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Settings as SettingsIcon, ShieldCheck, Server, Save, CheckCircle2, AlertCircle, RefreshCw, Key, Send } from 'lucide-react';

const Settings = () => {
  const [formData, setFormData] = useState({
    senderName: 'Girase Bhatu (EmailPro)',
    senderEmail: 'girasebhatu70@gmail.com',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'girasebhatu70@gmail.com',
    smtpPassword: ''
  });

  const [isPasswordSet, setIsPasswordSet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sendingTestMail, setSendingTestMail] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.success) {
        const s = res.data.settings;
        setFormData({
          senderName: s.senderName || 'Girase Bhatu (EmailPro)',
          senderEmail: s.senderEmail || 'girasebhatu70@gmail.com',
          smtpHost: s.smtpHost || 'smtp.gmail.com',
          smtpPort: s.smtpPort || 587,
          smtpUser: s.smtpUser || 'girasebhatu70@gmail.com',
          smtpPassword: ''
        });
        setIsPasswordSet(s.isPasswordSet);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);

    try {
      const res = await api.put('/settings', formData);
      if (res.data.success) {
        setNotification({
          type: 'success',
          message: 'Sender profile and SMTP credentials saved successfully!'
        });
        setIsPasswordSet(true);
        setFormData((prev) => ({ ...prev, smtpPassword: '' }));
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update settings.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setNotification(null);

    try {
      const res = await api.post('/settings/test-smtp', {
        smtpHost: formData.smtpHost,
        smtpPort: formData.smtpPort,
        smtpUser: formData.smtpUser,
        smtpPassword: formData.smtpPassword
      });

      if (res.data.success) {
        setNotification({
          type: 'success',
          message: res.data.message
        });
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'SMTP Connection test failed. Make sure you use a 16-character Google App Password.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSendTestMail = async () => {
    setSendingTestMail(true);
    setNotification(null);

    try {
      const res = await api.post('/emails/test-send', {
        targetEmail: formData.senderEmail
      });

      if (res.data.success) {
        setNotification({
          type: 'success',
          message: `Test email dispatched successfully to ${formData.senderEmail}`
        });
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Test email dispatch failed.'
      });
    } finally {
      setSendingTestMail(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-white/10">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 text-indigo-400" /> System Settings & Outbound Gateway
        </h1>
        <p className="text-xs text-slate-400 mt-1">Configure real email sending via Gmail SMTP or custom enterprise mail servers</p>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold backdrop-blur-md ${
            notification.type === 'success' ? 'glass-badge-emerald' : 'glass-badge-rose'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* Gmail App Password Instructions Banner */}
      <div className="p-5 rounded-3xl glass-panel border border-indigo-500/30 text-xs text-indigo-200 space-y-2.5">
        <div className="flex items-center gap-2 font-extrabold text-white text-sm">
          <Key className="w-4 h-4 text-indigo-400" /> Gmail SMTP App Password Guide (`girasebhatu70@gmail.com`)
        </div>
        <p className="text-slate-300 leading-relaxed">
          To send real emails through your Gmail account, Google requires a 16-character <strong>App Password</strong>:
        </p>
        <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] font-medium">
          <li>Visit <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-indigo-300 underline font-bold">myaccount.google.com/apppasswords</a></li>
          <li>Set App: <strong>Mail</strong>, Device: <strong>Other (EmailPro)</strong> and click <strong>Generate</strong>.</li>
          <li>Paste the 16-character secret code into the <strong>SMTP Password</strong> input below and click <strong>Save Settings</strong>.</li>
        </ol>
      </div>

      {/* Settings Form Glass Panel */}
      <div className="p-8 rounded-3xl glass-panel shadow-2xl space-y-6">
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Sender Identity */}
          <div>
            <h3 className="text-sm font-extrabold text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" /> Sender Profile Identity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Default Sender Name *</label>
                <input
                  type="text"
                  required
                  value={formData.senderName}
                  onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                  placeholder="e.g. Girase Bhatu (EmailPro)"
                  className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Default Sender Email *</label>
                <input
                  type="email"
                  required
                  value={formData.senderEmail}
                  onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                  placeholder="girasebhatu70@gmail.com"
                  className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-white/10" />

          {/* SMTP Configuration */}
          <div>
            <h3 className="text-sm font-extrabold text-white mb-4 flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" /> Outbound SMTP Server Credentials
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">SMTP Host Server</label>
                <input
                  type="text"
                  value={formData.smtpHost}
                  onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                  placeholder="smtp.gmail.com"
                  className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">SMTP Port (587 / 465)</label>
                <input
                  type="number"
                  value={formData.smtpPort}
                  onChange={(e) => setFormData({ ...formData, smtpPort: e.target.value })}
                  className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">SMTP Username / Email</label>
                <input
                  type="text"
                  value={formData.smtpUser}
                  onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                  placeholder="girasebhatu70@gmail.com"
                  className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  SMTP Password / App Secret {isPasswordSet && <span className="text-emerald-400 text-[10px] font-mono">(Configured)</span>}
                </label>
                <input
                  type="password"
                  value={formData.smtpPassword}
                  onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                  placeholder={isPasswordSet ? '••••••••••••••••' : 'Enter 16-char App Password'}
                  className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !formData.smtpHost}
                className="px-4 py-2 rounded-xl glass-button-secondary text-cyan-300 text-xs font-semibold flex items-center gap-2 transition disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                {testing ? 'Verifying SMTP...' : 'Test SMTP Connection'}
              </button>

              <button
                type="button"
                onClick={handleSendTestMail}
                disabled={sendingTestMail}
                className="px-4 py-2 rounded-xl glass-button-secondary text-emerald-300 text-xs font-semibold flex items-center gap-2 transition disabled:opacity-40"
              >
                <Send className={`w-3.5 h-3.5 ${sendingTestMail ? 'animate-spin' : ''}`} />
                {sendingTestMail ? 'Sending...' : 'Send Test Mail'}
              </button>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl glass-button-primary text-white text-xs font-bold shadow-lg flex items-center gap-2 transition disabled:opacity-50"
            >
              <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'Saving Settings...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
