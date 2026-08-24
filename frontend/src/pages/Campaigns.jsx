import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import { Megaphone, Plus, Send, Trash2, Eye, CheckCircle2, AlertCircle, Users, Paperclip, FileCode, Play } from 'lucide-react';

const Campaigns = ({ globalSearch = '' }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [sendingCampaignId, setSendingCampaignId] = useState(null);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    name: 'Wholesale Outreach Campaign',
    subject: '',
    templateId: '',
    targetAudience: 'Business',
    attachmentId: ''
  });

  const [recipientCount, setRecipientCount] = useState(0);

  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cmpRes, tplRes, catRes] = await Promise.all([
        api.get('/campaigns'),
        api.get('/templates'),
        api.get('/uploads')
      ]);

      if (cmpRes.data.success) setCampaigns(cmpRes.data.campaigns || []);
      if (tplRes.data.success) setTemplates(tplRes.data.templates || []);
      if (catRes.data.success) setCatalogs(catRes.data.files || []);
    } catch (err) {
      console.error('Error fetching campaign dependencies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Estimate target audience count
  useEffect(() => {
    const calculateRecipientEstimate = async () => {
      try {
        const res = await api.get('/leads', {
          params: {
            limit: 1,
            type: formData.targetAudience === 'All' ? 'All' : formData.targetAudience
          }
        });
        if (res.data.success) {
          setRecipientCount(res.data.total || 0);
        }
      } catch (err) {
        console.error('Error estimating recipients:', err);
      }
    };

    calculateRecipientEstimate();
  }, [formData.targetAudience]);

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!formData.templateId) {
      return setNotification({ type: 'error', message: 'Please select an Email Template for this campaign.' });
    }

    try {
      const selectedTpl = templates.find((t) => t._id === formData.templateId);
      const res = await api.post('/campaigns', {
        ...formData,
        subject: formData.subject || selectedTpl?.subject
      });

      if (res.data.success) {
        setNotification({ type: 'success', message: 'Campaign instance created successfully!' });
        setModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to create campaign'
      });
    }
  };

  const handleLaunchCampaign = async (campaign) => {
    if (!window.confirm(`Are you ready to send "${campaign.name}" to ${campaign.recipientCount} recipients?`)) {
      return;
    }

    setSendingCampaignId(campaign._id);
    try {
      const res = await api.post('/emails/send-bulk', {
        campaignId: campaign._id,
        attachmentId: campaign.attachment?._id || campaign.attachment
      });

      if (res.data.success) {
        setNotification({
          type: 'success',
          message: `Campaign dispatch complete! Delivered: ${res.data.summary.sentCount}, Failed: ${res.data.summary.failedCount}`
        });
        fetchData();
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to launch campaign dispatch.'
      });
    } finally {
      setSendingCampaignId(null);
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Delete this campaign instance?')) return;
    try {
      await api.delete(`/campaigns/${id}`);
      fetchData();
    } catch (err) {
      console.error('Failed to delete campaign:', err);
    }
  };

  const filteredCampaigns = globalSearch
    ? campaigns.filter((c) => c.name?.toLowerCase().includes(globalSearch.toLowerCase()))
    : campaigns;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Megaphone className="w-6 h-6 text-indigo-400" /> Email Campaign Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1">Target specific recipient segments, link dynamic HTML templates & product catalogs</p>
        </div>

        <button
          onClick={() => {
            if (!templates.length) {
              return setNotification({ type: 'error', message: 'Please create at least one Email Template first.' });
            }
            setModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl glass-button-primary text-white text-xs font-bold flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold backdrop-blur-md ${
            notification.type === 'success' ? 'glass-badge-emerald' : 'glass-badge-rose'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* Campaign Glass Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCampaigns.length === 0 ? (
          <div className="col-span-full p-10 rounded-3xl glass-panel text-center text-slate-400 text-xs font-medium">
            No campaigns configured yet. Click "New Campaign" to launch your outreach campaign.
          </div>
        ) : (
          filteredCampaigns.map((cmp) => (
            <div key={cmp._id} className="p-6 rounded-3xl glass-panel-hover flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-extrabold text-white text-base tracking-tight">{cmp.name}</span>
                  <span
                    className={`px-3 py-0.5 rounded-full text-[10px] font-bold border ${
                      cmp.status === 'Completed'
                        ? 'glass-badge-emerald'
                        : cmp.status === 'Sending'
                        ? 'glass-badge-amber animate-pulse'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700'
                    }`}
                  >
                    {cmp.status}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-slate-300 mb-5">
                  <div className="flex items-center justify-between p-3 rounded-2xl glass-card">
                    <span className="text-slate-400 flex items-center gap-2 font-medium">
                      <FileCode className="w-4 h-4 text-indigo-400" /> Template:
                    </span>
                    <span className="font-bold text-white">{cmp.template?.name || 'Default Template'}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl glass-card">
                    <span className="text-slate-400 flex items-center gap-2 font-medium">
                      <Users className="w-4 h-4 text-cyan-400" /> Target Audience:
                    </span>
                    <span className="font-bold text-cyan-300">{cmp.targetAudience} ({cmp.recipientCount} Leads)</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl glass-card">
                    <span className="text-slate-400 flex items-center gap-2 font-medium">
                      <Paperclip className="w-4 h-4 text-purple-400" /> Catalog Attachment:
                    </span>
                    <span className="font-bold text-slate-200">{cmp.attachment?.originalName || 'None'}</span>
                  </div>
                </div>

                {/* Dispatch Progress bar */}
                <div className="mb-5">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
                    <span>Dispatch Completion</span>
                    <span className="font-mono text-white">{cmp.sentCount || 0} / {cmp.recipientCount || 0} Sent</span>
                  </div>
                  <div className="w-full bg-slate-900/80 h-2 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div
                      className="bg-indigo-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                      style={{
                        width: `${cmp.recipientCount ? ((cmp.sentCount || 0) / cmp.recipientCount) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <button
                  onClick={() => handleDeleteCampaign(cmp._id)}
                  className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 transition text-xs flex items-center gap-1.5 font-semibold"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>

                <button
                  onClick={() => handleLaunchCampaign(cmp)}
                  disabled={sendingCampaignId === cmp._id || cmp.status === 'Sending'}
                  className="px-5 py-2.5 rounded-xl glass-button-primary text-white text-xs font-bold flex items-center gap-2 shadow-lg transition disabled:opacity-50"
                >
                  <Send className={`w-4 h-4 ${sendingCampaignId === cmp._id ? 'animate-spin' : ''}`} />
                  {sendingCampaignId === cmp._id ? 'Dispatching Campaign Bulk...' : 'Send Campaign Bulk'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Campaign Wizard Glass Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Outreach Campaign">
        <form onSubmit={handleCreateCampaign} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Campaign Title *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Target Audience Segment *</label>
            <select
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white"
            >
              <option value="All">All Saved Leads</option>
              <option value="Business">Business Leads Only (B2B)</option>
              <option value="Individual">Individual Leads Only (B2C)</option>
            </select>
            <span className="block text-[11px] text-cyan-300 mt-1 font-bold">
              Recipient Estimate: ~{recipientCount} Recipients targeted
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Email Template *</label>
            <select
              required
              value={formData.templateId}
              onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
              className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white"
            >
              <option value="">-- Select Template --</option>
              {templates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.subject})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Attach Catalog PDF (Optional)</label>
            <select
              value={formData.attachmentId}
              onChange={(e) => setFormData({ ...formData, attachmentId: e.target.value })}
              className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white"
            >
              <option value="">-- No Catalog Attachment --</option>
              {catalogs.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.originalName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
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
              Create Campaign
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Campaigns;
