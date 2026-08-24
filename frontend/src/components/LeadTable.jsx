import React from 'react';
import { Mail, Edit, Trash2, Eye, CheckCircle2, XCircle, Building2, User, Sparkles } from 'lucide-react';

const LeadTable = ({
  leads = [],
  selectedLeadIds = [],
  onSelectLead,
  onSelectAll,
  onView,
  onEdit,
  onDelete,
  onSendEmail,
  onClassify,
  showActions = true,
  selectable = true
}) => {
  const isAllSelected = leads.length > 0 && leads.every((l) => selectedLeadIds.includes(l._id));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-slate-300">
        <thead className="bg-slate-900/90 backdrop-blur-md text-slate-400 font-bold border-b border-white/10 uppercase tracking-wider sticky top-0 z-10">
          <tr>
            {selectable && (
              <th className="p-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
                />
              </th>
            )}
            <th className="p-3.5">Owner / Contact</th>
            <th className="p-3.5">Email</th>
            <th className="p-3.5">Company</th>
            <th className="p-3.5">Country</th>
            <th className="p-3.5">Type</th>
            <th className="p-3.5">Source</th>
            <th className="p-3.5">Lead Score</th>
            <th className="p-3.5 text-center">Contacted</th>
            {showActions && <th className="p-3.5 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">
          {leads.length === 0 ? (
            <tr>
              <td colSpan={selectable ? (showActions ? 10 : 9) : (showActions ? 9 : 8)} className="p-10 text-center text-slate-400 font-medium">
                No leads match your criteria. Search keywords or import CSV to populate records.
              </td>
            </tr>
          ) : (
            leads.map((lead) => {
              const isSelected = selectedLeadIds.includes(lead._id);
              return (
                <tr
                  key={lead._id || lead.email}
                  className={`hover:bg-white/[0.04] transition duration-150 ${isSelected ? 'bg-indigo-500/10' : ''}`}
                >
                  {selectable && (
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectLead && onSelectLead(lead._id)}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="p-3.5 font-bold text-white">
                    <div className="flex items-center gap-2">
                      <span>{lead.owner}</span>
                      {lead.unsubscribed && (
                        <span className="text-[9px] glass-badge-rose px-1.5 py-0.5 rounded font-mono font-bold">
                          Unsubscribed
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5 text-indigo-300 font-mono text-[11px] font-medium">{lead.email}</td>
                  <td className="p-3.5 text-slate-200">{lead.company || '-'}</td>
                  <td className="p-3.5 text-slate-400">{lead.country || '-'}</td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        lead.type === 'Business'
                          ? 'glass-badge-indigo'
                          : lead.type === 'Individual'
                          ? 'glass-badge-cyan'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700'
                      }`}
                    >
                      {lead.type === 'Business' ? (
                        <Building2 className="w-3 h-3" />
                      ) : (
                        <User className="w-3 h-3" />
                      )}
                      {lead.type || 'Unclassified'}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-400 text-[11px] font-mono">{lead.source || 'Manual'}</td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-14 bg-slate-800/80 rounded-full h-1.5 overflow-hidden p-0.5 border border-white/5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            (lead.score || 50) >= 85
                              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                              : (lead.score || 50) >= 65
                              ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                              : 'bg-indigo-400'
                          }`}
                          style={{ width: `${lead.score || 50}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-300">{lead.score || 50}</span>
                    </div>
                  </td>
                  <td className="p-3.5 text-center">
                    {lead.contacted ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-500 text-[11px]">
                        <XCircle className="w-3.5 h-3.5" /> No
                      </span>
                    )}
                  </td>
                  {showActions && (
                    <td className="p-3.5 text-right space-x-1">
                      {onView && (
                        <button
                          onClick={() => onView(lead)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                          title="View Lead Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onSendEmail && (
                        <button
                          onClick={() => onSendEmail(lead)}
                          disabled={lead.unsubscribed}
                          className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
                          title="Send Direct Email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(lead)}
                          className="p-1.5 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 transition"
                          title="Edit Lead"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(lead._id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LeadTable;
