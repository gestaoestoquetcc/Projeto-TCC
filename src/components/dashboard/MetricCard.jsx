import React from 'react';

export default function MetricCard({ title, value, unit, delta, deltaType = 'positive', icon: Icon }) {
  const getBadgeStyle = () => {
    switch (deltaType) {
      case 'positive':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'negative':
      case 'warning':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'critical':
        return 'bg-red-50 text-red-600 border border-red-200';
      case 'neutral':
      default:
        return 'bg-gray-100 text-gray-500 border border-gray-200';
    }
  };

  return (
    <div className="bg-white/90 border border-[#e5dfd4] rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-mono tracking-widest text-[#a89e90] uppercase font-bold">
          {title}
        </span>
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-[#f7f5f0] text-gray-500 flex items-center justify-center group-hover:text-amber-700 transition-colors">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-black tracking-tight text-gray-900">
            {value}
          </span>
          {unit && (
            <span className="text-xs text-gray-400 font-medium">
              {unit}
            </span>
          )}
        </div>

        {delta && (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${getBadgeStyle()}`}>
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}
