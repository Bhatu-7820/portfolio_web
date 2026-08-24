import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LeadTable from '../components/LeadTable';
import Pagination from '../components/Pagination';
import { Layers, Building2, User, HelpCircle, CheckCircle2, Search } from 'lucide-react';

const Classification = ({ globalSearch = '' }) => {
  const [leads, setLeads] = useState([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Segment Breakdown Counts
  const [counts, setCounts] = useState({
    business: 0,
    individual: 0,
    unclassified: 0
  });

  const [notification, setNotification] = useState(null);

  const effectiveSearch = searchQuery || globalSearch;

  const fetchLeadsAndCounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leads', {
        params: {
          page,
          limit: 10,
          type: typeFilter,
          search: effectiveSearch
        }
      });
      if (res.data.success) {
        setLeads(res.data.leads || []);
        setTotalLeads(res.data.total || 0);
        setTotalPages(res.data.pages || 1);
      }

      const reportRes = await api.get('/reports/dashboard');
      if (reportRes.data.success) {
        const m = reportRes.data.metrics;
        setCounts({
          business: m.businessLeads || 0,
          individual: m.individualLeads || 0,
          unclassified: m.unclassifiedLeads || 0
        });
      }
    } catch (err) {
      console.error('Error fetching classification data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadsAndCounts();
  }, [page, typeFilter, effectiveSearch]);

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

  const handleBulkClassify = async (type) => {
    if (!selectedLeadIds.length) return;

    try {
      const res = await api.post('/leads/bulk-classify', {
        leadIds: selectedLeadIds,
        type
      });

      if (res.data.success) {
        setNotification({
          type: 'success',
          message: `Successfully classified ${res.data.modifiedCount} leads as ${type}`
        });
        setSelectedLeadIds([]);
        fetchLeadsAndCounts();
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to bulk classify leads' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-white/10">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Layers className="w-6 h-6 text-indigo-400" /> Lead Classification Center
        </h1>
        <p className="text-xs text-slate-400 mt-1">Categorize contacts into Business (B2B) and Individual (B2C) targeted segments</p>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl glass-badge-emerald text-xs font-semibold flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* Glass Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => {
            setTypeFilter('Business');
            setPage(1);
          }}
          className={`p-6 rounded-3xl cursor-pointer transition ${
            typeFilter === 'Business'
              ? 'glass-panel border-indigo-500/50 shadow-2xl shadow-indigo-500/20'
              : 'glass-card-interactive border-white/10'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">Business (B2B)</span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono">{counts.business}</div>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">Wholesale & Commercial Accounts</span>
        </div>

        <div
          onClick={() => {
            setTypeFilter('Individual');
            setPage(1);
          }}
          className={`p-6 rounded-3xl cursor-pointer transition ${
            typeFilter === 'Individual'
              ? 'glass-panel border-cyan-500/50 shadow-2xl shadow-cyan-500/20'
              : 'glass-card-interactive border-white/10'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider">Individual (B2C)</span>
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <User className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono">{counts.individual}</div>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">Personal & Direct Buyers</span>
        </div>

        <div
          onClick={() => {
            setTypeFilter('Unclassified');
            setPage(1);
          }}
          className={`p-6 rounded-3xl cursor-pointer transition ${
            typeFilter === 'Unclassified'
              ? 'glass-panel border-amber-500/50 shadow-2xl shadow-amber-500/20'
              : 'glass-card-interactive border-white/10'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">Unclassified</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <HelpCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono">{counts.unclassified}</div>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">Pending Segment Assignment</span>
        </div>
      </div>

      {/* Glass Control Toolbar */}
      <div className="p-4 rounded-3xl glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400">Quick Segment Action:</span>
          <button
            onClick={() => handleBulkClassify('Business')}
            disabled={!selectedLeadIds.length}
            className="px-4 py-2 rounded-xl glass-button-primary text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1.5 shadow"
          >
            <Building2 className="w-3.5 h-3.5" /> Mark as Business ({selectedLeadIds.length})
          </button>
          <button
            onClick={() => handleBulkClassify('Individual')}
            disabled={!selectedLeadIds.length}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1.5 shadow"
          >
            <User className="w-3.5 h-3.5" /> Mark as Individual ({selectedLeadIds.length})
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {['All', 'Business', 'Individual', 'Unclassified'].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTypeFilter(t);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                typeFilter === t
                  ? 'glass-button-primary text-white'
                  : 'glass-button-secondary text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Main Glass Table Workspace */}
      <div className="rounded-3xl glass-panel shadow-2xl overflow-hidden">
        <LeadTable
          leads={leads}
          selectedLeadIds={selectedLeadIds}
          onSelectLead={handleSelectLead}
          onSelectAll={handleSelectAll}
          showActions={true}
        />

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
          totalItems={totalLeads}
          limit={10}
        />
      </div>
    </div>
  );
};

export default Classification;
