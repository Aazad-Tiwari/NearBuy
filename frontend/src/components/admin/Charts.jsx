import React from 'react';

/**
 * Charts — reusable SVG/CSS data visualization components
 *
 * Exports:
 *   LineChart   — SVG path with gradient fill
 *   BarChart    — CSS flex bars with labels
 *   DonutChart  — SVG stroke-based donut
 *   MiniSparkline — tiny inline trend line
 */

// =============================================================================
// LineChart
// =============================================================================
export function LineChart({ data = [], labels = [], color = '#7c3aed', height = 120, id = 'line' }) {
  if (data.length < 2) return null;
  const W = 400;
  const H = height;
  const PAD = { top: 8, bottom: 24, left: 4, right: 4 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => ({
    x: PAD.left + (i / (data.length - 1)) * innerW,
    y: PAD.top + ((max - v) / range) * innerH,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(PAD.top + innerH).toFixed(1)} L ${PAD.left} ${(PAD.top + innerH).toFixed(1)} Z`;
  const gradId = `lg-${id}`;

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
        ))}
        {/* X-axis labels */}
        {labels.map((l, i) => {
          if (i % Math.ceil(data.length / 7) !== 0 && i !== data.length - 1) return null;
          return (
            <text key={i} x={pts[i]?.x} y={H - 4} textAnchor="middle" className="fill-slate-500 text-[9px]" fontSize="9">
              {l}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// =============================================================================
// BarChart
// =============================================================================
export function BarChart({ data = [], height = 128, showLabels = true }) {
  const max = Math.max(...data.map((d) => (typeof d === 'object' ? d.value : d)), 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((item, idx) => {
        const val = typeof item === 'object' ? item.value : item;
        const label = typeof item === 'object' ? item.label : '';
        const color = typeof item === 'object' && item.color ? item.color : '#7c3aed';
        const pct = (val / max) * 100;
        return (
          <div key={idx} className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
            <div
              className="w-full rounded-t-lg transition-all duration-700"
              style={{ height: `${pct}%`, backgroundColor: color, opacity: 0.75 }}
              title={`${label}: ${val}`}
            />
            {showLabels && label && (
              <span className="text-[9px] text-slate-500 truncate w-full text-center leading-tight">{label}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// DonutChart
// =============================================================================
export function DonutChart({ segments = [], size = 140, children }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const R = 40;
  const circum = 2 * Math.PI * R;
  let offsetAcc = 0;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {/* Background track */}
        <circle cx="50" cy="50" r={R} fill="none" stroke="#1e293b" strokeWidth="13" />
        {segments.map((seg, idx) => {
          const dash = (seg.value / total) * circum;
          const el = (
            <circle
              key={idx}
              cx="50" cy="50" r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth="13"
              strokeDasharray={`${dash.toFixed(2)} ${(circum - dash).toFixed(2)}`}
              strokeDashoffset={(-offsetAcc).toFixed(2)}
              strokeLinecap="butt"
            />
          );
          offsetAcc += dash;
          return el;
        })}
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// =============================================================================
// MiniSparkline — tiny 40×20 trend line
// =============================================================================
export function MiniSparkline({ data = [], color = '#7c3aed' }) {
  if (data.length < 2) return null;
  const W = 60;
  const H = 24;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * W).toFixed(1)},${(H - ((v - min) / range) * H).toFixed(1)}`);
  const isUp = data[data.length - 1] >= data[0];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-12 h-6" style={{ overflow: 'visible' }}>
      <polyline points={pts.join(' ')} fill="none" stroke={isUp ? '#34d399' : '#f87171'} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
