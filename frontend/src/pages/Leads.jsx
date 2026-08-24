import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LeadTable from '../components/LeadTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import { Users, Plus, Search, Filter, Mail, Trash2, CheckCircle2, AlertCircle, Download, Layers, RefreshCw } from 'lucide-react';

const Leads = ({ globalSearch = '' }) => {
  const [leads, setLeads] = useState([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [typeFilter, setTypeFilter] = useState('All');
  const [contactedFilter, setContactedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Lead IDs for Bulk Operations
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);

  // Modals & Notifications
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [viewLead, setViewLead] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    owner: '',
    email: '',
    phone: '',
    company: '',
    country: '',
    type: 'Business',
    score: 85
  });

  const navigate = useNavigate();

  // Combine local search and navbar search query
  const effectiveSearch = searchQuery || globalSearch;

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leads', {
        params: {
          page,
          limit: 10,
          type: typeFilter,
          contacted: contactedFilter,
          search: effectiveSearch
        }
      });
      if (res.data.success) {
        setLeads(res.data.leads || []);
        setTotalLeads(res.data.total || 0);
        setTotalPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, typeFilter, contactedFilter, effectiveSearch]);

  const handleSelectLead = (id) => {
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(selectedLeadIds.filter((item) => item !== id));
    } else {
      setSelectedLeadIds([...selectedLeadIds, id]);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedLeadIds(leads.map((l) => l._id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingLead(null);
    setFormData({
      owner: '',
      email: '',
      phone: '',
      company: '',
      country: '',
      type: 'Business',
      score: 85
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (lead) => {
    setEditingLead(lead);
    setFormData({
      owner: lead.owner || '',
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || '',
      country: lead.country || '',
      type: lead.type || 'Business',
      score: lead.score || 85
    });
    setModalOpen(true);
  };

  const handleSaveLead = async (e) => {
    e.preventDefault();
    try {
      if (editingLead) {
        await api.put(`/leads/${editingLead._id}`, formData);
        setNotification({ type: 'success', message: 'Lead record updated successfully' });
      } else {
        await api.post('/leads', formData);
        setNotification({ type: 'success', message: 'New lead record created successfully' });
      }
      setModalOpen(false);
      fetchLeads();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save lead'
      });
    }
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lead record?')) return;
    try {
      await api.delete(`/leads/${id}`);
      setNotification({ type: 'success', message: 'Lead record deleted' });
      fetchLeads();
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to delete lead' });
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedLeadIds.length) return;
    if (!window.confirm(`Delete ${selectedLeadIds.length} selected leads from database?`)) return;

    try {
      const res = await api.post('/leads/bulk-delete', { leadIds: selectedLeadIds });
      if (res.data.success) {
        setNotification({ type: 'success', message: res.data.message });
        setSelectedLeadIds([]);
        fetchLeads();
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to delete selected leads' });
    }
  };

  const handleBulkClassify = async (type) => {
    if (!selectedLeadIds.length) return;
    try {
      const res = await api.post('/leads/bulk-classify', { leadIds: selectedLeadIds, type });
      if (res.data.success) {
        setNotification({ type: 'success', message: res.data.message });
        setSelectedLeadIds([]);
        fetchLeads();
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to classify selected leads' });
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/leads/export', {
        params: { type: typeFilter, contacted: contactedFilter }
      });
      if (res.data.success && res.data.leads) {
        const headers = ['owner', 'email', 'phone', 'company', 'country', 'type', 'source', 'score', 'contacted'];
        const csvRows = [
          headers.join(','),
          ...res.data.leads.map((l) =>
            headers.map((h) => `"${(l[h] || '').toString().replace(/"/g, '""')}"`).join(',')
          )
        ];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `emailpro-leads-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
      }
    } catch (err) {
      console.error('Failed to export leads:', err);
    }
  };

  const handleSendBulkMail = () => {
    if (!selectedLeadIds.length) return;
    const selectedLeads = leads.filter((l) => selectedLeadIds.includes(l._id));
    navigate('/send-email', { state: { selectedLeads } });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" /> Central Lead Database
          </h1>
          <p className="text-xs text-slate-400 mt-1">Unified B2B & B2C contact hub with filtering, segment classification & bulk operations</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl glass-button-secondary text-xs font-semibold flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl glass-button-primary text-white text-xs font-bold flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
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

      {/* Glass Filter & Search Toolbar */}
      <div className="p-4 rounded-3xl glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5 text-indigo-400" /> Segment:
          </span>

          {['All', 'Business', 'Individual', 'Unclassified'].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTypeFilter(t);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                typeFilter === t
                  ? 'glass-button-primary text-white shadow-md'
                  : 'glass-button-secondary text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}

          <div className="h-4 w-px bg-white/10 mx-1" />

          {['All', 'true', 'false'].map((c) => (
            <button
              key={c}
              onClick={() => {
                setContactedFilter(c);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                contactedFilter === c
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/25 border border-white/20'
                  : 'glass-button-secondary text-slate-400 hover:text-white'
              }`}
            >
              {c === 'All' ? 'All Status' : c === 'true' ? 'Contacted' : 'Not Contacted'}
            </button>
          ))}
        </div>

        {/* Local Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter leads..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full glass-input rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500"
          />
        </div>
      </div>

      {/* Floating Glass Multi-Select Action Bar */}
      {selectedLeadIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 glass-panel rounded-2xl p-3 px-6 border border-white/20 shadow-2xl flex items-center gap-4 animate-fade-in">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[11px] flex items-center justify-center font-mono">
              {selectedLeadIds.length}
            </span>
            Selected
          </span>

          <div className="h-4 w-px bg-white/15" />

          <button
            onClick={handleSendBulkMail}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
          >
            <Mail className="w-3.5 h-3.5" /> Send Email
          </button>

          <button
            onClick={() => handleBulkClassify('Business')}
            className="px-3 py-1.5 rounded-xl glass-button-secondary text-indigo-300 text-xs font-semibold flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" /> Business
          </button>

          <button
            onClick={() => handleBulkClassify('Individual')}
            className="px-3 py-1.5 rounded-xl glass-button-secondary text-cyan-300 text-xs font-semibold flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" /> Individual
          </button>

          <button
            onClick={handleBulkDelete}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}

      {/* Main Glass Table Workspace */}
      <div className="rounded-3xl glass-panel shadow-2xl overflow-hidden">
        <LeadTable
          leads={leads}
          selectedLeadIds={selectedLeadIds}
          onSelectLead={handleSelectLead}
          onSelectAll={handleSelectAll}
          onView={(lead) => {
            setViewLead(lead);
            setViewModalOpen(true);
          }}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteLead}
          onSendEmail={(lead) => {
            navigate('/send-email', { state: { lead } });
          }}
        />

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
          totalItems={totalLeads}
          limit={10}
        />
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingLead ? 'Edit Lead Record' : 'Add New Lead Record'}
      >
        <form onSubmit={handleSaveLead} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Contact Name / Owner *</label>
              <input
                type="text"
                required
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Company Name</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Classification Segment</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Business">Business (B2B)</option>
                <option value="Individual">Individual (B2C)</option>
                <option value="Unclassified">Unclassified</option>
              </select>
            </div>
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
              {editingLead ? 'Update Record' : 'Save Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Lead Details Modal */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Lead Profile Summary">
        {viewLead && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block mb-1">Contact Owner</span>
                <span className="font-bold text-white text-sm">{viewLead.owner}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Email Address</span>
                <span className="font-mono text-indigo-300 font-bold">{viewLead.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Phone Number</span>
                <span className="text-slate-200">{viewLead.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Company Name</span>
                <span className="text-slate-200">{viewLead.company || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Country</span>
                <span className="text-slate-200">{viewLead.country || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Segment</span>
                <span className="text-indigo-400 font-bold">{viewLead.type}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Leads;
