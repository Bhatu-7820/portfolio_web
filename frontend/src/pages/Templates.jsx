import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { FileCode, Plus, Edit, Trash2, Eye, CheckCircle2, AlertCircle, Sparkles, AlignLeft, Code, Copy } from 'lucide-react';

const Templates = ({ globalSearch = '' }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewContent, setPreviewContent] = useState('');
  const [notification, setNotification] = useState(null);

  const [editorMode, setEditorMode] = useState('visual'); // 'visual' | 'html'
  const [plainTextContent, setPlainTextContent] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    htmlContent: ''
  });

  const variables = [
    { label: 'Owner Name', tag: '{{ownerName}}' },
    { label: 'Business Name', tag: '{{businessName}}' },
    { label: 'Email Address', tag: '{{email}}' },
    { label: 'Phone', tag: '{{phone}}' },
    { label: 'Country', tag: '{{country}}' },
    { label: 'Unsubscribe Link', tag: '{{unsubscribeUrl}}' }
  ];

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/templates');
      if (res.data.success) {
        setTemplates(res.data.templates || []);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handlePlainTextChange = (text) => {
    setPlainTextContent(text);
    const paragraphs = text
      .split('\n\n')
      .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('\n');
    setFormData((prev) => ({ ...prev, htmlContent: paragraphs }));
  };

  const handleOpenCreateModal = () => {
    setEditingTemplate(null);
    const defaultText = `Hello {{ownerName}},\n\nWe are pleased to introduce our handcrafted wholesale product catalog to {{businessName}}.\n\nPlease find our catalog PDF attached for complete specifications.\n\nWhatsApp: {{phone}}\n\nUnsubscribe link: {{unsubscribeUrl}}`;
    setPlainTextContent(defaultText);
    setFormData({
      name: 'Product Introduction Template',
      subject: 'Handcrafted Wholesale Products for {{businessName}}',
      htmlContent: `<p>Hello {{ownerName}},</p>\n\n<p>We are pleased to introduce our handcrafted wholesale product catalog to {{businessName}}.</p>\n\n<p>Please find our catalog PDF attached for complete specifications.</p>\n\n<p>WhatsApp: {{phone}}</p>\n\n<p><a href="{{unsubscribeUrl}}">Unsubscribe from future updates</a></p>`
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (tpl) => {
    setEditingTemplate(tpl);
    setPlainTextContent(tpl.htmlContent.replace(/<[^>]+>/g, ''));
    setFormData({
      name: tpl.name,
      subject: tpl.subject,
      htmlContent: tpl.htmlContent
    });
    setModalOpen(true);
  };

  const handleInsertVariable = (tag) => {
    if (editorMode === 'visual') {
      handlePlainTextChange(plainTextContent + ' ' + tag);
    } else {
      setFormData((prev) => ({
        ...prev,
        htmlContent: prev.htmlContent + tag
      }));
    }
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    const finalHtml = editorMode === 'visual'
      ? plainTextContent.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('\n')
      : formData.htmlContent;

    try {
      if (editingTemplate) {
        await api.put(`/templates/${editingTemplate._id}`, { ...formData, htmlContent: finalHtml });
        setNotification({ type: 'success', message: 'Template updated successfully' });
      } else {
        await api.post('/templates', { ...formData, htmlContent: finalHtml });
        setNotification({ type: 'success', message: 'Template created successfully' });
      }
      setModalOpen(false);
      fetchTemplates();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save template'
      });
    }
  };

  const handleDuplicateTemplate = async (id) => {
    try {
      const res = await api.post(`/templates/${id}/duplicate`);
      if (res.data.success) {
        setNotification({ type: 'success', message: 'Template duplicated!' });
        fetchTemplates();
      }
    } catch (err) {
      console.error('Failed to duplicate template:', err);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Delete this email template?')) return;
    try {
      await api.delete(`/templates/${id}`);
      setNotification({ type: 'success', message: 'Template deleted' });
      fetchTemplates();
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to delete template' });
    }
  };

  const handlePreview = (html) => {
    const targetHtml = editorMode === 'visual'
      ? plainTextContent.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('\n')
      : html;

    const interpolated = targetHtml
      .replace(/\{\{ownerName\}\}/g, 'John Doe')
      .replace(/\{\{businessName\}\}/g, 'ABC Wholesale Corp')
      .replace(/\{\{email\}\}/g, 'john@example.com')
      .replace(/\{\{phone\}\}/g, '+1-555-0192')
      .replace(/\{\{country\}\}/g, 'USA')
      .replace(/\{\{unsubscribeUrl\}\}/g, '#unsubscribe-demo');

    setPreviewContent(interpolated);
    setPreviewModalOpen(true);
  };

  const filteredTemplates = globalSearch
    ? templates.filter((t) => t.name?.toLowerCase().includes(globalSearch.toLowerCase()) || t.subject?.toLowerCase().includes(globalSearch.toLowerCase()))
    : templates;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <FileCode className="w-6 h-6 text-indigo-400" /> Email Templates
          </h1>
          <p className="text-xs text-slate-400 mt-1">Design dynamic personalized HTML templates with tag placeholders</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 rounded-xl glass-button-primary text-white text-xs font-bold flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4" /> Create Template
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl glass-badge-emerald text-xs font-semibold flex items-center justify-between backdrop-blur-md">
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* Templates Glass Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full p-10 rounded-3xl glass-panel text-center text-slate-400 text-xs font-medium">
            No templates found. Click "Create Template" to build your outreach message template.
          </div>
        ) : (
          filteredTemplates.map((tpl) => (
            <div key={tpl._id} className="p-6 rounded-3xl glass-panel-hover flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-white text-sm tracking-tight">{tpl.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{new Date(tpl.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="p-3 rounded-2xl glass-card text-xs text-slate-300 mb-3 truncate">
                  <span className="text-slate-400 font-bold mr-1">Subject:</span>
                  {tpl.subject}
                </div>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-[11px] text-slate-300 font-mono h-24 overflow-hidden text-ellipsis line-clamp-4 mb-4 leading-relaxed">
                  {tpl.htmlContent.replace(/<[^>]+>/g, ' ')}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <button
                  onClick={() => handlePreview(tpl.htmlContent)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition text-xs flex items-center gap-1 font-semibold"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicateTemplate(tpl._id)}
                    className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 transition text-xs"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(tpl)}
                    className="p-1.5 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 transition text-xs"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(tpl._id)}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition text-xs"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Template Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTemplate ? 'Edit Email Template' : 'Create New Template'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSaveTemplate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Template Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Email Subject *</label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white"
            />
          </div>

          {/* Dynamic Variable Pills */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Personalization Variable Tags:
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300">Template Content *</label>
              <div className="flex items-center gap-1 p-1 glass-card rounded-xl text-[11px]">
                <button
                  type="button"
                  onClick={() => setEditorMode('visual')}
                  className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                    editorMode === 'visual' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <AlignLeft className="w-3 h-3" /> Visual Text Mode
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('html')}
                  className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                    editorMode === 'html' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Code className="w-3 h-3" /> HTML Code Mode
                </button>
              </div>
            </div>

            {editorMode === 'visual' ? (
              <textarea
                required
                rows={8}
                value={plainTextContent}
                onChange={(e) => handlePlainTextChange(e.target.value)}
                placeholder="Type your message in plain text. Dynamic tags will be rendered into formatted HTML."
                className="w-full glass-input rounded-xl p-3.5 text-xs text-slate-200"
              />
            ) : (
              <textarea
                required
                rows={8}
                value={formData.htmlContent}
                onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                className="w-full glass-input rounded-xl p-3.5 text-xs font-mono text-slate-200"
              />
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => handlePreview(formData.htmlContent)}
              className="px-4 py-2 rounded-xl glass-button-secondary text-xs font-semibold flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" /> Test Render
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl glass-button-secondary text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl glass-button-primary text-white text-xs font-bold"
              >
                {editingTemplate ? 'Update Template' : 'Save Template'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* HTML Render Preview Modal */}
      <Modal isOpen={previewModalOpen} onClose={() => setPreviewModalOpen(false)} title="Template Render Preview">
        <div className="p-5 rounded-2xl bg-white text-slate-900 text-sm shadow-inner min-h-48 font-sans">
          <div dangerouslySetInnerHTML={{ __html: previewContent }} />
        </div>
      </Modal>
    </div>
  );
};

export default Templates;
