import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LeadTable from '../components/LeadTable';
import Modal from '../components/Modal';
import { Sparkles, Search, Save, AlertCircle, CheckCircle2, Globe, ShieldCheck, Download, Zap } from 'lucide-react';

const LeadGeneration = ({ globalSearch = '' }) => {
  const [keywords, setKeywords] = useState('singing bowls wholesale');
  const [countries, setCountries] = useState('USA, UK');
  const [limit, setLimit] = useState(12);
  const [seedUrls, setSeedUrls] = useState('');

  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isMockResult, setIsMockResult] = useState(false);
  const [resultSource, setResultSource] = useState('');
  const [notification, setNotification] = useState(null);

  const [selectedLead, setSelectedLead] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!keywords.trim()) return;

    setSearching(true);
    setNotification(null);

    try {
      const res = await api.post('/leads/search', {
        keywords,
        countries,
        limit: Number(limit),
        seedUrls
      });

      if (res.data.success) {
        setSearchResults(res.data.leads || []);
        setIsMockResult(res.data.isMock);
        setResultSource(res.data.source || 'Real Lead Discovery Engine');
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to generate leads. Check API service.'
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSaveAllLeads = async () => {
    if (!searchResults.length) return;

    setSaving(true);
    try {
      const res = await api.post('/leads/bulk', { leads: searchResults });
      if (res.data.success) {
        setNotification({
          type: 'success',
          message: res.data.message
        });
        setTimeout(() => {
          navigate('/leads');
        }, 1500);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save leads into database.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLocalLead = (emailToDelete) => {
    setSearchResults(searchResults.filter((l) => l.email !== emailToDelete));
  };

  // Filter local results if global navbar search active
  const filteredResults = globalSearch
    ? searchResults.filter(
        (l) =>
          l.owner?.toLowerCase().includes(globalSearch.toLowerCase()) ||
          l.email?.toLowerCase().includes(globalSearch.toLowerCase()) ||
          l.company?.toLowerCase().includes(globalSearch.toLowerCase())
      )
    : searchResults;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-white/10">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-indigo-400" /> Real Lead Discovery Engine
        </h1>
        <p className="text-xs text-slate-400 mt-1">Discover verified B2B / B2C emails & contacts via live web search & domain extraction</p>
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

      {/* Discovery Query Form Glass Panel */}
      <div className="p-6 rounded-3xl glass-panel shadow-2xl">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Search Keywords *</label>
              <input
                type="text"
                required
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. singing bowls wholesale"
                className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Target Countries</label>
              <input
                type="text"
                value={countries}
                onChange={(e) => setCountries(e.target.value)}
                placeholder="e.g. USA, UK, Germany"
                className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Result Limit (1 to 50)</label>
              <input
                type="number"
                min="1"
                max="50"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Seed URLs (Optional)</label>
              <input
                type="text"
                value={seedUrls}
                onChange={(e) => setSeedUrls(e.target.value)}
                placeholder="https://example.com/directory"
                className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px]">Searches web domain records & verifies email availability</span>
            </div>

            <button
              type="submit"
              disabled={searching}
              className="px-6 py-2.5 rounded-xl glass-button-primary text-white text-xs font-bold flex items-center gap-2 transition disabled:opacity-50"
            >
              <Search className={`w-4 h-4 ${searching ? 'animate-spin' : ''}`} />
              {searching ? 'Discovering Leads...' : 'Search Leads'}
            </button>
          </div>
        </form>
      </div>

      {/* Discovered Results Glass Workspace */}
      {searchResults.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-2xl glass-panel flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-white">Discovered Records ({filteredResults.length})</span>
              <span className="flex items-center gap-1 text-[10px] font-bold glass-badge-indigo px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> {resultSource}
              </span>
            </div>

            <button
              onClick={handleSaveAllLeads}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'Saving to Database...' : 'Save All Discovered Leads'}
            </button>
          </div>

          {/* Table View */}
          <div className="rounded-3xl glass-panel shadow-2xl overflow-hidden">
            <LeadTable
              leads={filteredResults}
              selectable={false}
              onView={(lead) => {
                setSelectedLead(lead);
                setViewModalOpen(true);
              }}
              onDelete={(leadIdOrEmail) => {
                handleDeleteLocalLead(leadIdOrEmail);
              }}
              onSendEmail={(lead) => {
                navigate('/send-email', { state: { lead } });
              }}
            />
          </div>
        </div>
      )}

      {/* Discovered Lead Modal */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Discovered Lead Verification">
        {selectedLead && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block mb-1">Contact Name</span>
                <span className="font-bold text-white text-sm">{selectedLead.owner}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Email Address</span>
                <span className="font-mono text-indigo-300 font-bold">{selectedLead.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Company / Domain</span>
                <span className="text-slate-200">{selectedLead.company || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Region</span>
                <span className="text-slate-200">{selectedLead.country || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Confidence Score</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{selectedLead.score}/100</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Discovery Source</span>
                <span className="text-slate-300 font-semibold">{selectedLead.source}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LeadGeneration;
