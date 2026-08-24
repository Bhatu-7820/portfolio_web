import React, { useEffect, useState } from 'react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import {
  Users,
  Building2,
  User,
  MailCheck,
  Send,
  AlertTriangle,
  Clock,
  Megaphone,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  Plus,
  Zap,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = ({ globalSearch = '' }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/dashboard');
      if (res.data.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const metrics = reportData?.metrics || {};
  const allRecentLeads = reportData?.recentLeads || [];
  const allRecentCampaigns = reportData?.recentCampaigns || [];

  // Filter based on global search if query typed in navbar
  const recentLeads = globalSearch
    ? allRecentLeads.filter(
        (l) =>
          l.owner?.toLowerCase().includes(globalSearch.toLowerCase()) ||
          l.email?.toLowerCase().includes(globalSearch.toLowerCase()) ||
          l.company?.toLowerCase().includes(globalSearch.toLowerCase())
      )
    : allRecentLeads;

  const recentCampaigns = globalSearch
    ? allRecentCampaigns.filter((c) => c.name?.toLowerCase().includes(globalSearch.toLowerCase()))
    : allRecentCampaigns;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Executive Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Zap className="w-6 h-6 text-indigo-400" /> Executive Analytics Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">Real-time Lead Intelligence & Outbound Campaign Performance</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="px-3.5 py-2 rounded-xl glass-button-secondary text-xs font-semibold flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <Link
            to="/lead-generation"
            className="px-4 py-2 rounded-xl glass-button-primary text-white text-xs font-bold flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-4 h-4" /> Find New Leads
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Total Leads" value={metrics.totalLeads} icon={Users} color="indigo" subtext="All imported & discovered" />
        <StatCard title="Business Leads" value={metrics.businessLeads} icon={Building2} color="cyan" subtext="B2B Commercial" />
        <StatCard title="Individual Leads" value={metrics.individualLeads} icon={User} color="purple" subtext="B2C Consumer" />
        <StatCard title="Total Contacts" value={metrics.totalLeads} icon={MailCheck} color="emerald" subtext="In MongoDB Cluster" />
        <StatCard title="Available Emails" value={metrics.availableEmails} icon={Send} color="indigo" subtext="Active & subscribed" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Emails Sent" value={metrics.emailsSent} icon={Send} color="emerald" subtext="Delivered successfully" />
        <StatCard title="Emails Failed" value={metrics.emailsFailed} icon={AlertTriangle} color="rose" subtext="Delivery exceptions" />
        <StatCard title="Emails Pending" value={metrics.emailsPending} icon={Clock} color="amber" subtext="In dispatch queue" />
        <StatCard title="Contacted Leads" value={metrics.contactedLeads} icon={CheckCircle} color="cyan" subtext="Engaged via system" />
        <StatCard title="Total Campaigns" value={metrics.totalCampaigns} icon={Megaphone} color="purple" subtext="Campaign instances" />
      </div>

      {/* Performance Overview & Recent Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Delivery Performance Glass Card */}
        <div className="lg:col-span-1 p-6 rounded-3xl glass-panel flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Outbound Delivery Rate
              </h3>
              <span className="text-[10px] font-bold glass-badge-emerald px-2.5 py-0.5 rounded-full">
                {metrics.successRate || 0}% Success
              </span>
            </div>

            <div className="space-y-4 my-6">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-300">Delivered Emails</span>
                  <span className="text-emerald-400 font-mono">{metrics.emailsSent || 0}</span>
                </div>
                <div className="w-full bg-slate-900/80 h-2 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                    style={{
                      width: `${
                        metrics.totalEmailsProcessed
                          ? ((metrics.emailsSent || 0) / metrics.totalEmailsProcessed) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-300">Delivery Failures</span>
                  <span className="text-rose-400 font-mono">{metrics.emailsFailed || 0}</span>
                </div>
                <div className="w-full bg-slate-900/80 h-2 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                    style={{
                      width: `${
                        metrics.totalEmailsProcessed
                          ? ((metrics.emailsFailed || 0) / metrics.totalEmailsProcessed) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-300">Queue Pending</span>
                  <span className="text-amber-400 font-mono">{metrics.emailsPending || 0}</span>
                </div>
                <div className="w-full bg-slate-900/80 h-2 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                    style={{
                      width: `${
                        metrics.totalEmailsProcessed
                          ? ((metrics.emailsPending || 0) / metrics.totalEmailsProcessed) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-[11px] leading-relaxed">
              Rate resilience engine prevents provider throttling with per-recipient chunking.
            </span>
          </div>
        </div>

        {/* Recent Campaigns Glass Table */}
        <div className="lg:col-span-2 p-6 rounded-3xl glass-panel">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-indigo-400" /> Recent Campaign Instances
            </h3>
            <Link to="/campaigns" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              All Campaigns <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 font-bold border-b border-white/10">
                <tr>
                  <th className="p-3">Campaign Name</th>
                  <th className="p-3">Recipients</th>
                  <th className="p-3 text-center">Sent</th>
                  <th className="p-3 text-center">Failed</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {recentCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No campaigns found. Start a new campaign to populate statistics.
                    </td>
                  </tr>
                ) : (
                  recentCampaigns.map((cmp) => (
                    <tr key={cmp._id} className="hover:bg-white/[0.04] transition">
                      <td className="p-3 font-bold text-white">{cmp.name}</td>
                      <td className="p-3 text-slate-300 font-mono">{cmp.recipientCount || 0}</td>
                      <td className="p-3 text-center text-emerald-400 font-mono font-bold">{cmp.sentCount || 0}</td>
                      <td className="p-3 text-center text-rose-400 font-mono font-bold">{cmp.failedCount || 0}</td>
                      <td className="p-3">
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
                      <td className="p-3 text-right text-slate-400 font-mono text-[11px]">
                        {new Date(cmp.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Discovered Leads */}
      <div className="p-6 rounded-3xl glass-panel">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" /> Recently Discovered Leads
          </h3>
          <Link to="/leads" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            View All Leads <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 font-bold border-b border-white/10">
              <tr>
                <th className="p-3">Owner / Contact</th>
                <th className="p-3">Email</th>
                <th className="p-3">Company</th>
                <th className="p-3">Country</th>
                <th className="p-3">Segment</th>
                <th className="p-3 text-right">Added On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {recentLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No leads found. Use Lead Generation or CSV Upload to import contacts.
                  </td>
                </tr>
              ) : (
                recentLeads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-white/[0.04] transition">
                    <td className="p-3 font-bold text-white">{lead.owner}</td>
                    <td className="p-3 text-indigo-300 font-mono text-[11px]">{lead.email}</td>
                    <td className="p-3 text-slate-200">{lead.company || '-'}</td>
                    <td className="p-3 text-slate-400">{lead.country || '-'}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold glass-badge-indigo">
                        {lead.type || 'Unclassified'}
                      </span>
                    </td>
                    <td className="p-3 text-right text-slate-400 font-mono text-[11px]">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
