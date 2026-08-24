import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import { Send, Eye, Sparkles, Paperclip, FileCode, Users, CheckCircle2, AlertCircle, ExternalLink, Code, AlignLeft } from 'lucide-react';

const SendEmail = ({ globalSearch = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const initialSingleLead = location.state?.lead || null;
  const initialBulkLeads = location.state?.selectedLeads || [];

  const [leads, setLeads] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [catalogs, setCatalogs] = useState([]);

  const [sendMode, setSendMode] = useState(initialBulkLeads.length > 0 ? 'bulk' : 'individual');
  const [recipientOption, setRecipientOption] = useState(initialSingleLead ? 'select' : 'custom');
  const [selectedLeadId, setSelectedLeadId] = useState(initialSingleLead?._id || '');
  const [customEmail, setCustomEmail] = useState('girasebhatu70@gmail.com');
  const [customName, setCustomName] = useState('Girase Bhatu');
  const [selectedLeadIds, setSelectedLeadIds] = useState(initialBulkLeads.map((l) => l._id));

  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedAttachmentId, setSelectedAttachmentId] = useState('');

  const [subject, setSubject] = useState(
    'Handcrafted Products Partnership Opportunity for {{businessName}}'
  );

  const [editorMode, setEditorMode] = useState('visual');
  const [plainTextContent, setPlainTextContent] = useState(
    `Hello {{ownerName}},\n\nWe are pleased to introduce our handcrafted wholesale catalog to {{businessName}}.\n\nPlease find our product catalog attached for complete specifications.\n\nContact / WhatsApp: {{phone}}\n\nUnsubscribe link: {{unsubscribeUrl}}`
  );
  const [htmlContent, setHtmlContent] = useState(
    `<p>Hello {{ownerName}},</p>\n\n<p>We are pleased to introduce our handcrafted wholesale catalog to {{businessName}}.</p>\n\n<p>Please find our product catalog attached for complete specifications.</p>\n\n<p>Contact / WhatsApp: {{phone}}</p>\n\n<p><a href="{{unsubscribeUrl}}">Unsubscribe from future updates</a></p>`
  );

  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState(null);
  const [devPreviewUrl, setDevPreviewUrl] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  const variables = [
    { label: 'Owner Name', tag: '{{ownerName}}' },
    { label: 'Business Name', tag: '{{businessName}}' },
    { label: 'Email Address', tag: '{{email}}' },
    { label: 'Phone', tag: '{{phone}}' },
    { label: 'Country', tag: '{{country}}' },
    { label: 'Unsubscribe Link', tag: '{{unsubscribeUrl}}' }
  ];

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [lRes, tRes, cRes] = await Promise.all([
          api.get('/leads', { params: { limit: 100 } }),
          api.get('/templates'),
          api.get('/uploads')
        ]);

        if (lRes.data.success) {
          const fetchedLeads = lRes.data.leads || [];
          setLeads(fetchedLeads);
          if (fetchedLeads.length > 0 && !selectedLeadId) {
            setSelectedLeadId(fetchedLeads[0]._id);
            setRecipientOption('select');
          }
        }
        if (tRes.data.success) setTemplates(tRes.data.templates || []);
        if (cRes.data.success) setCatalogs(cRes.data.files || []);
      } catch (err) {
        console.error('Error fetching dependencies for Email Composer:', err);
      }
    };

    loadDependencies();
  }, []);

  const handlePlainTextChange = (text) => {
    setPlainTextContent(text);
    const paragraphs = text
      .split('\n\n')
      .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('\n');
    setHtmlContent(paragraphs);
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId);
    const tpl = templates.find((t) => t._id === templateId);
    if (tpl) {
      setSubject(tpl.subject);
      setHtmlContent(tpl.htmlContent);
      setPlainTextContent(tpl.htmlContent.replace(/<[^>]+>/g, ''));
    }
  };

  const handleInsertVariable = (tag) => {
    if (editorMode === 'visual') {
      handlePlainTextChange(plainTextContent + ' ' + tag);
    } else {
      setHtmlContent((prev) => prev + tag);
    }
  };

  const handlePreviewPersonalized = () => {
    let targetLead = null;
    if (recipientOption === 'select' && selectedLeadId) {
      targetLead = leads.find((l) => l._id === selectedLeadId);
    }

    if (!targetLead) {
      targetLead = {
        owner: customName || 'Girase Bhatu',
        company: 'Girase Enterprises',
        email: customEmail || 'girasebhatu70@gmail.com',
        phone: '+91-9876543210',
        country: 'India'
      };
    }

    const currentHtml = editorMode === 'visual'
      ? plainTextContent.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('\n')
      : htmlContent;

    const interpolated = currentHtml
      .replace(/\{\{ownerName\}\}/g, targetLead.owner || 'Partner')
      .replace(/\{\{businessName\}\}/g, targetLead.company || 'your business')
      .replace(/\{\{email\}\}/g, targetLead.email)
      .replace(/\{\{phone\}\}/g, targetLead.phone || 'N/A')
      .replace(/\{\{country\}\}/g, targetLead.country || 'Global')
      .replace(/\{\{unsubscribeUrl\}\}/g, '#unsubscribe-demo-token');

    setPreviewHtml(interpolated);
    setPreviewModalOpen(true);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setSending(true);
    setNotification(null);
    setDevPreviewUrl(null);

    const finalHtml = editorMode === 'visual'
      ? plainTextContent.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('\n')
      : htmlContent;

    try {
      if (sendMode === 'individual') {
        const payload = {
          subject,
          htmlContent: finalHtml,
          attachmentId: selectedAttachmentId || null
        };

        if (recipientOption === 'select' && selectedLeadId) {
          payload.leadId = selectedLeadId;
        } else {
          payload.customEmail = customEmail;
          payload.customName = customName;
        }

        const res = await api.post('/emails/send', payload);

        if (res.data.success) {
          setNotification({
            type: 'success',
            message: `Email successfully delivered!`
          });

          if (res.data.result?.previewUrl) {
            setDevPreviewUrl(res.data.result.previewUrl);
          }
        }
      } else {
        if (!selectedLeadIds.length) {
          throw new Error('Please select at least one recipient for bulk sending.');
        }

        const res = await api.post('/emails/send-bulk', {
          leadIds: selectedLeadIds,
          subject,
          htmlContent: finalHtml,
          attachmentId: selectedAttachmentId || null
        });

        if (res.data.success) {
          setNotification({
            type: 'success',
            message: `Bulk email batch finished! Delivered: ${res.data.summary.sentCount}, Failed: ${res.data.summary.failedCount}`
          });
        }
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to dispatch email'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Send className="w-6 h-6 text-indigo-400" /> Email Composer & Dispatcher
          </h1>
          <p className="text-xs text-slate-400 mt-1">Compose personalized messages with visual editor or HTML code mode</p>
        </div>

        {/* Mode Selector Toggle */}
        <div className="flex items-center gap-1 p-1.5 glass-panel rounded-2xl text-xs">
          <button
            type="button"
            onClick={() => setSendMode('individual')}
            className={`px-4 py-2 rounded-xl font-bold transition ${
              sendMode === 'individual' ? 'glass-button-primary text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Single Recipient
          </button>
          <button
            type="button"
            onClick={() => setSendMode('bulk')}
            className={`px-4 py-2 rounded-xl font-bold transition ${
              sendMode === 'bulk' ? 'glass-button-primary text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Bulk Recipients ({selectedLeadIds.length})
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between text-xs font-semibold gap-3 backdrop-blur-md ${
            notification.type === 'success' ? 'glass-badge-emerald' : 'glass-badge-rose'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{notification.message}</span>
          </div>

          <div className="flex items-center gap-3">
            {devPreviewUrl && (
              <a
                href={devPreviewUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl glass-button-primary text-white text-[11px] font-bold flex items-center gap-1.5 shadow"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View Dev Inbox Mail
              </a>
            )}
            <button onClick={() => setNotification(null)} className="underline text-[11px]">Dismiss</button>
          </div>
        </div>
      )}

      {/* Composer Glass Panel */}
      <div className="p-8 rounded-3xl glass-panel shadow-2xl max-w-4xl mx-auto">
        <form onSubmit={handleSendEmail} className="space-y-5">
          {/* Target Recipient Selection */}
          {sendMode === 'individual' ? (
            <div className="space-y-3 p-4 rounded-2xl glass-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Target Recipient</span>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setRecipientOption('select')}
                    className={`px-3 py-1 rounded-xl transition ${
                      recipientOption === 'select' ? 'glass-button-primary text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Select Saved Lead
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientOption('custom')}
                    className={`px-3 py-1 rounded-xl transition ${
                      recipientOption === 'custom' ? 'glass-button-primary text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Custom Email Address
                  </button>
                </div>
              </div>

              {recipientOption === 'select' ? (
                <div>
                  <select
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                    className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white"
                  >
                    <option value="">-- Choose Lead --</option>
                    {leads.map((l) => (
                      <option key={l._id} value={l._id} disabled={l.unsubscribed}>
                        {l.owner} &lt;{l.email}&gt; ({l.company || 'Individual'}) {l.unsubscribed ? '[UNSUBSCRIBED]' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Recipient Name</label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Girase Bhatu"
                      className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Recipient Email *</label>
                    <input
                      type="email"
                      required
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="girasebhatu70@gmail.com"
                      className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Target Bulk Recipients ({selectedLeadIds.length} Selected)</label>
              <div className="p-3.5 rounded-2xl glass-card text-xs text-slate-300 max-h-32 overflow-y-auto font-mono leading-relaxed">
                {selectedLeadIds.length === 0 ? (
                  <span className="text-slate-400">No leads selected. Go to Leads page and check boxes to select multiple recipients.</span>
                ) : (
                  leads
                    .filter((l) => selectedLeadIds.includes(l._id))
                    .map((l) => `${l.owner} <${l.email}>`)
                    .join(', ')
                )}
              </div>
            </div>
          )}

          {/* Preset Template & Catalog Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Preset Email Template</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white"
              >
                <option value="">-- Custom Message Body --</option>
                {templates.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Catalog PDF Attachment</label>
              <select
                value={selectedAttachmentId}
                onChange={(e) => setSelectedAttachmentId(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white"
              >
                <option value="">-- No Attachment --</option>
                {catalogs.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.originalName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Email Subject Line *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white"
            />
          </div>

          {/* Personalization Variable Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Insert Personalization Tag:
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {variables.map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => handleInsertVariable(v.tag)}
                  className="px-2.5 py-1 rounded-xl glass-badge-indigo hover:bg-indigo-500/30 text-[11px] font-mono transition"
                >
                  {v.tag}
                </button>
              ))}
            </div>
          </div>

          {/* Body Editor Mode Tabs (Visual vs HTML) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300">Message Content Body *</label>
              <div className="flex items-center gap-1 p-1 glass-card rounded-xl text-[11px]">
                <button
                  type="button"
                  onClick={() => setEditorMode('visual')}
                  className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                    editorMode === 'visual' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <AlignLeft className="w-3 h-3" /> Visual Text
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('html')}
                  className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                    editorMode === 'html' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Code className="w-3 h-3" /> HTML Code
                </button>
              </div>
            </div>

            {editorMode === 'visual' ? (
              <textarea
                required
                rows={8}
                value={plainTextContent}
                onChange={(e) => handlePlainTextChange(e.target.value)}
                placeholder="Type your message in plain text. Dynamic tags will be rendered into a formatted email."
                className="w-full glass-input rounded-xl p-3.5 text-xs text-white"
              />
            ) : (
              <textarea
                required
                rows={8}
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="<p>HTML code here...</p>"
                className="w-full glass-input rounded-xl p-3.5 text-xs font-mono text-slate-200"
              />
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handlePreviewPersonalized}
              className="px-4 py-2 rounded-xl glass-button-secondary text-xs font-semibold flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" /> Preview Rendered Email
            </button>

            <button
              type="submit"
              disabled={sending}
              className="px-6 py-2.5 rounded-xl glass-button-primary text-white text-xs font-bold shadow-xl flex items-center gap-2 transition disabled:opacity-50"
            >
              <Send className={`w-4 h-4 ${sending ? 'animate-spin' : ''}`} />
              {sending ? 'Dispatching Email...' : sendMode === 'individual' ? 'Send Individual Email' : 'Send Bulk Email'}
            </button>
          </div>
        </form>
      </div>

      {/* Rendered Inbox Preview Modal */}
      <Modal isOpen={previewModalOpen} onClose={() => setPreviewModalOpen(false)} title="Personalized Inbox Preview">
        <div className="space-y-3">
          <div className="p-3 rounded-2xl glass-card text-xs text-slate-300">
            <span className="font-bold text-white">Subject: </span>
            {subject}
          </div>
          <div className="p-5 rounded-2xl bg-white text-slate-900 text-sm shadow-inner min-h-48 font-sans">
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SendEmail;
