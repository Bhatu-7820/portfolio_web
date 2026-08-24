import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import {
  BarChart3,
  Send,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Megaphone,
  Eye,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';

const Reports = ({ globalSearch = '' }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'logs'
  const [reportData, setReportData] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Email Logs Tab State
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchLog, setSearchLog] = useState('');

  // Modal Campaign Detail State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCampaignDetail, setSelectedCampaignDetail] = useState(null);

  const effectiveSearch = searchLog || globalSearch;

  const fetchOverviewReports = async () => {
    setLoading(true);
    try {
      const [repRes, cmpRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/campaigns')
      ]);

      if (repRes.data.success) setReportData(repRes.data);
      if (cmpRes.data.success) setCampaigns(cmpRes.data.campaigns || []);
    } catch (err) {
      console.error('Error loading report analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/emails/logs', {
        params: {
          page,
          limit: 15,
          status: statusFilter,
          search: effectiveSearch
        }
      });

      if (res.data.success) {
        setLogs(res.data.logs || []);
        setTotalLogs(res.data.total || 0);
        setTotalPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching email logs:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverviewReports();
    } else {
      fetchLogs();
    }
  }, [activeTab, page, statusFilter, effectiveSearch]);

  const handleViewCampaignLogs = async (campaignId) => {
    try {
      const res = await api.get(`/reports/campaign/${campaignId}`);
      if (res.data.success) {
        setSelectedCampaignDetail(res.data);
        setDetailModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to load campaign report detail:', err);
    }
  };

  const metrics = reportData?.metrics || {};

  const filteredCampaigns = globalSearch
    ? campaigns.filter((c) => c.name?.toLowerCase().includes(globalSearch.toLowerCase()))
    : campaigns;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-indigo-400" /> Campaign Analytics & Delivery Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1">Audit delivery statistics, success ratios, and per-recipient execution logs</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 p-1.5 glass-panel rounded-2xl text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl font-bold transition ${
              activeTab === 'overview' ? 'glass-button-primary text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Campaign Analytics
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl font-bold transition ${
              activeTab === 'logs' ? 'glass-button-primary text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Per-Recipient Email Logs
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard title="Total Campaigns" value={metrics.totalCampaigns} icon={Megaphone} color="indigo" />
            <StatCard title="Processed Emails" value={metrics.totalEmailsProcessed} icon={Send} color="cyan" />
            <StatCard title="Emails Sent" value={metrics.emailsSent} icon={CheckCircle2} color="emerald" />
            <StatCard title="Emails Failed" value={metrics.emailsFailed} icon={AlertTriangle} color="rose" />
            <StatCard title="Emails Pending" value={metrics.emailsPending} icon={Clock} color="amber" />
            <StatCard title="Success Rate" value={`${metrics.successRate || 100}%`} icon={BarChart3} color="purple" />
          </div>

          <div className="p-6 rounded-3xl glass-panel shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-indigo-400" /> Campaign Summary Records
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 font-bold border-b border-white/10">
                  <tr>
                    <th className="p-3.5">Campaign Name</th>
                    <th className="p-3.5 text-center">Recipients</th>
                    <th className="p-3.5 text-center text-emerald-400">Sent</th>
                    <th className="p-3.5 text-center text-rose-400">Failed</th>
                    <th className="p-3.5 text-center text-amber-400">Pending</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Created</th>
                    <th className="p-3.5 text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">
                        No campaigns found. Launch a campaign to monitor performance.
                      </td>
                    </tr>
                  ) : (
                    filteredCampaigns.map((cmp) => (
                      <tr key={cmp._id} className="hover:bg-white/[0.04] transition">
                        <td className="p-3.5 font-bold text-white">{cmp.name}</td>
                        <td className="p-3.5 text-center font-mono">{cmp.recipientCount || 0}</td>
                        <td className="p-3.5 text-center text-emerald-400 font-mono font-bold">{cmp.sentCount || 0}</td>
                        <td className="p-3.5 text-center text-rose-400 font-mono font-bold">{cmp.failedCount || 0}</td>
                        <td className="p-3.5 text-center text-amber-400 font-mono">
                          {Math.max(0, (cmp.recipientCount || 0) - (cmp.sentCount || 0) - (cmp.failedCount || 0))}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              cmp.status === 'Completed'
                                ? 'glass-badge-emerald'
                                : cmp.status === 'Sending'
                                ? 'glass-badge-amber animate-pulse'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {cmp.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400 text-[11px] font-mono">{new Date(cmp.createdAt).toLocaleDateString()}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleViewCampaignLogs(cmp._id)}
                            className="px-3 py-1.5 rounded-xl glass-button-secondary text-indigo-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 ml-auto"
                          >
                            <Eye className="w-3.5 h-3.5" /> Recipient Logs
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PER RECIPIENT LOGS TAB */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-indigo-400" /> Status Filter:
              </span>
              {['All', 'sent', 'failed', 'pending'].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatusFilter(s);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    statusFilter === s
                      ? 'glass-button-primary text-white'
                      : 'glass-button-secondary text-slate-400 hover:text-white'
                  }`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search recipient..."
                value={searchLog}
                onChange={(e) => {
                  setSearchLog(e.target.value);
                  setPage(1);
                }}
                className="w-full glass-input rounded-xl pl-9 pr-4 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          <div className="rounded-3xl glass-panel shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 font-bold border-b border-white/10 uppercase">
                  <tr>
                    <th className="p-3.5">Recipient Email</th>
                    <th className="p-3.5">Subject</th>
                    <th className="p-3.5">Campaign</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Error Trace</th>
                    <th className="p-3.5 text-right">Sent Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                        No email delivery logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log._id} className="hover:bg-white/[0.04] transition">
                        <td className="p-3.5 font-bold text-indigo-300 font-mono text-[11px]">{log.recipientEmail}</td>
                        <td className="p-3.5 text-slate-200">{log.subject}</td>
                        <td className="p-3.5 text-slate-400">{log.campaign?.name || 'Direct Single Email'}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              log.status === 'sent'
                                ? 'glass-badge-emerald'
                                : log.status === 'failed'
                                ? 'glass-badge-rose'
                                : 'glass-badge-amber'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-rose-400 text-[11px] max-w-xs truncate font-mono">{log.errorMessage || '-'}</td>
                        <td className="p-3.5 text-right text-slate-400 font-mono text-[11px]">
                          {log.sentAt ? new Date(log.sentAt).toLocaleString() : new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
              totalItems={totalLogs}
              limit={15}
            />
          </div>
        </div>
      )}

      {/* Recipient Level Logs Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Campaign Logs: ${selectedCampaignDetail?.campaign?.name || ''}`}
        maxWidth="max-w-4xl"
      >
        {selectedCampaignDetail && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-2xl glass-card">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                <span className="block text-lg font-bold text-white font-mono">{selectedCampaignDetail.summary.totalRecipients}</span>
              </div>
              <div className="p-3 rounded-2xl glass-badge-emerald text-center">
                <span className="text-[10px] uppercase font-bold block">Sent</span>
                <span className="block text-lg font-bold font-mono">{selectedCampaignDetail.summary.sent}</span>
              </div>
              <div className="p-3 rounded-2xl glass-badge-rose text-center">
                <span className="text-[10px] uppercase font-bold block">Failed</span>
                <span className="block text-lg font-bold font-mono">{selectedCampaignDetail.summary.failed}</span>
              </div>
              <div className="p-3 rounded-2xl glass-badge-indigo text-center">
                <span className="text-[10px] uppercase font-bold block">Success Rate</span>
                <span className="block text-lg font-bold font-mono">{selectedCampaignDetail.summary.successRate}%</span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-left">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-white/10 font-bold">
                  <tr>
                    <th className="p-2">Recipient</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Error / Log</th>
                    <th className="p-2 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {selectedCampaignDetail.logs.map((log) => (
                    <tr key={log._id}>
                      <td className="p-2 font-mono text-indigo-300">{log.recipientEmail}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === 'sent' ? 'text-emerald-400' : log.status === 'failed' ? 'text-rose-400' : 'text-amber-400'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="p-2 text-rose-400 font-mono text-[11px]">{log.errorMessage || '-'}</td>
                      <td className="p-2 text-right text-slate-400 font-mono">{new Date(log.createdAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Reports;
