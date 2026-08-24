import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'emerald', subtext }) => {
  const colorMap = {
    emerald: {
      border: 'border-emerald-400/30 hover:border-emerald-400/60',
      iconBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
      glow: 'shadow-emerald-500/15'
    },
    cyan: {
      border: 'border-teal-400/30 hover:border-teal-400/60',
      iconBg: 'bg-teal-500/20 text-teal-300 border-teal-400/40',
      glow: 'shadow-teal-500/15'
    },
    amber: {
      border: 'border-amber-400/30 hover:border-amber-400/60',
      iconBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
      glow: 'shadow-amber-500/15'
    },
    purple: {
      border: 'border-purple-400/30 hover:border-purple-400/60',
      iconBg: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
      glow: 'shadow-purple-500/15'
    },
    rose: {
      border: 'border-rose-400/30 hover:border-rose-400/60',
      iconBg: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
      glow: 'shadow-rose-500/15'
    },
    indigo: {
      border: 'border-indigo-400/30 hover:border-indigo-400/60',
      iconBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
      glow: 'shadow-indigo-500/15'
    }
  };

  const scheme = colorMap[color] || colorMap.emerald;

  return (
    <div className={`p-4 rounded-2xl glass-card-interactive border ${scheme.border} ${scheme.glow} shadow-xl flex flex-col justify-between`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${scheme.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-1">
        <div className="text-2xl font-black text-white tracking-tight font-mono">
          {value !== undefined && value !== null ? value : 0}
        </div>
        {subtext && (
          <p className="text-[10px] text-slate-300 mt-1 font-medium truncate">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
