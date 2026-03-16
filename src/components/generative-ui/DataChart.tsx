'use client';

import React, { useState, useMemo } from 'react';
import { BarChart3, PieChart, TrendingUp, Download, Maximize2, Minimize2 } from 'lucide-react';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
  category?: string;
}

interface DataSeries {
  name: string;
  data: number[];
  color?: string;
}

interface DataChartProps {
  title?: string;
  subtitle?: string;
  chart_type: 'bar' | 'horizontal_bar' | 'line' | 'area' | 'pie' | 'donut' | 'scatter';
  data?: DataPoint[];
  series?: DataSeries[];
  labels?: string[];
  x_label?: string;
  y_label?: string;
  show_values?: boolean;
  show_legend?: boolean;
  stacked?: boolean;
}

const defaultColors = [
  '#FEC00F', '#60A5FA', '#22C55E', '#A78BFA', '#FB923C',
  '#F87171', '#5EEAD4', '#818CF8', '#FBBF24', '#34D399',
  '#F472B6', '#38BDF8', '#A3E635', '#E879F9', '#FDA4AF',
];

function getColor(idx: number, customColor?: string): string {
  return customColor || defaultColors[idx % defaultColors.length];
}

// ===== BAR CHART =====
function BarChart({ data, showValues, xLabel, yLabel }: { data: DataPoint[]; showValues?: boolean; xLabel?: string; yLabel?: string }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div style={{ padding: '16px 0' }}>
      {yLabel && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{yLabel}</div>}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '180px', padding: '0 8px' }}>
        {data.map((d, i) => {
          const height = (d.value / maxVal) * 160 + 4;
          const color = getColor(i, d.color);
          const isHovered = hovered === i;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', position: 'relative' }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              {(showValues || isHovered) && (
                <span style={{ fontSize: '11px', fontWeight: 700, color, fontFamily: 'monospace' }}>{d.value.toLocaleString()}</span>
              )}
              <div style={{
                width: '100%', maxWidth: '48px', height: `${height}px`,
                backgroundColor: color, borderRadius: '4px 4px 0 0',
                opacity: isHovered ? 1 : 0.85,
                transition: 'all 0.2s ease',
                transform: isHovered ? 'scaleY(1.02)' : 'scaleY(1)',
                transformOrigin: 'bottom',
                boxShadow: isHovered ? `0 0 12px ${color}40` : 'none',
              }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '6px', padding: '8px 8px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {d.label}
          </div>
        ))}
      </div>
      {xLabel && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px', textAlign: 'center' }}>{xLabel}</div>}
    </div>
  );
}

// ===== HORIZONTAL BAR =====
function HorizontalBarChart({ data, showValues }: { data: DataPoint[]; showValues?: boolean }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {data.map((d, i) => {
        const width = (d.value / maxVal) * 100;
        const color = getColor(i, d.color);
        const isHovered = hovered === i;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <span style={{ width: '80px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {d.label}
            </span>
            <div style={{ flex: 1, height: '24px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                width: `${width}%`, height: '100%', backgroundColor: color,
                borderRadius: '4px', transition: 'all 0.3s ease',
                opacity: isHovered ? 1 : 0.85,
                boxShadow: isHovered ? `0 0 8px ${color}40` : 'none',
              }} />
              {showValues && (
                <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', fontWeight: 600, color: '#fff', fontFamily: 'monospace' }}>
                  {d.value.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===== LINE / AREA CHART =====
function LineChart({ series, labels, isArea, xLabel, yLabel }: { series: DataSeries[]; labels: string[]; isArea?: boolean; xLabel?: string; yLabel?: string }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const allValues = series.flatMap(s => s.data);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;
  const chartW = labels.length * 50;
  const chartH = 160;

  const getX = (i: number) => (i / (labels.length - 1)) * (chartW - 20) + 10;
  const getY = (v: number) => chartH - ((v - minVal) / range) * (chartH - 20) - 10;

  return (
    <div style={{ padding: '12px 0', overflow: 'auto' }}>
      {yLabel && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{yLabel}</div>}
      <svg width="100%" height={chartH + 30} viewBox={`0 0 ${chartW} ${chartH + 30}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        {/* Grid */}
        {[0.25, 0.5, 0.75].map(pct => (
          <line key={pct} x1="10" x2={chartW - 10} y1={getY(minVal + range * pct)} y2={getY(minVal + range * pct)} stroke="rgba(255,255,255,0.05)" />
        ))}

        {series.map((s, si) => {
          const color = getColor(si, s.color);
          const points = s.data.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');

          return (
            <g key={si}>
              {isArea && (
                <>
                  <defs>
                    <linearGradient id={`area-${si}`} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={`M ${s.data.map((v, i) => `${getX(i)},${getY(v)}`).join(' L ')} L ${getX(s.data.length - 1)},${chartH} L ${getX(0)},${chartH} Z`} fill={`url(#area-${si})`} />
                </>
              )}
              <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              {s.data.map((v, i) => (
                <circle key={i} cx={getX(i)} cy={getY(v)} r={hovered === i ? 5 : 3} fill={color} stroke="#0D1117" strokeWidth="2"
                  onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }} />
              ))}
            </g>
          );
        })}

        {/* Labels */}
        {labels.map((l, i) => (
          <text key={i} x={getX(i)} y={chartH + 20} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.4)">{l}</text>
        ))}
      </svg>
      {xLabel && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>{xLabel}</div>}
    </div>
  );
}

// ===== PIE / DONUT CHART =====
function PieDonutChart({ data, isDonut, showValues }: { data: DataPoint[]; isDonut?: boolean; showValues?: boolean }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const cx = 100, cy = 100, r = 80;

  let startAngle = -90;
  const slices = data.map((d, i) => {
    const pct = d.value / total;
    const angle = pct * 360;
    const endAngle = startAngle + angle;
    const largeArc = angle > 180 ? 1 : 0;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const midRad = ((startAngle + angle / 2) * Math.PI) / 180;
    const labelX = cx + (r * 0.65) * Math.cos(midRad);
    const labelY = cy + (r * 0.65) * Math.sin(midRad);
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    startAngle = endAngle;
    return { ...d, path, pct, labelX, labelY, color: getColor(i, d.color), index: i };
  });

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', padding: '16px 0', flexWrap: 'wrap' }}>
      <svg width="200" height="200" viewBox="0 0 200 200" style={{ flexShrink: 0 }}>
        {slices.map((s) => (
          <path key={s.index} d={s.path} fill={s.color}
            opacity={hovered === null || hovered === s.index ? 1 : 0.4}
            stroke="#0D1117" strokeWidth="2"
            onMouseEnter={() => setHovered(s.index)} onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
          />
        ))}
        {isDonut && <circle cx={cx} cy={cy} r={45} fill="#0D1117" />}
        {isDonut && hovered !== null && (
          <>
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff">{(slices[hovered].pct * 100).toFixed(1)}%</text>
            <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.6)">{slices[hovered].label}</text>
          </>
        )}
      </svg>
      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '120px' }}>
        {slices.map((s) => (
          <div key={s.index} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', borderRadius: '6px',
            backgroundColor: hovered === s.index ? 'rgba(255,255,255,0.05)' : 'transparent',
            cursor: 'pointer', transition: 'background-color 0.2s',
          }} onMouseEnter={() => setHovered(s.index)} onMouseLeave={() => setHovered(null)}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#fff', flex: 1 }}>{s.label}</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>
              {showValues ? s.value.toLocaleString() : `${(s.pct * 100).toFixed(1)}%`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== SCATTER CHART =====
function ScatterChart({ data, xLabel, yLabel }: { data: DataPoint[]; xLabel?: string; yLabel?: string }) {
  // For scatter, use label as x (parse number) and value as y
  const [hovered, setHovered] = useState<number | null>(null);
  const xVals = data.map((d, i) => parseFloat(d.label) || i);
  const yVals = data.map(d => d.value);
  const minX = Math.min(...xVals), maxX = Math.max(...xVals);
  const minY = Math.min(...yVals), maxY = Math.max(...yVals);
  const rangeX = maxX - minX || 1, rangeY = maxY - minY || 1;
  const w = 400, h = 200;

  return (
    <div style={{ padding: '12px 0', overflow: 'auto' }}>
      <svg width="100%" height={h + 30} viewBox={`0 0 ${w} ${h + 30}`} preserveAspectRatio="xMidYMid meet">
        {[0.25, 0.5, 0.75].map(p => (
          <line key={p} x1="30" x2={w - 10} y1={h - (p * (h - 20)) - 10} y2={h - (p * (h - 20)) - 10} stroke="rgba(255,255,255,0.05)" />
        ))}
        {data.map((d, i) => {
          const cx = ((xVals[i] - minX) / rangeX) * (w - 60) + 40;
          const cy = h - ((d.value - minY) / rangeY) * (h - 30) - 10;
          const color = getColor(i, d.color);
          return (
            <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
              <circle cx={cx} cy={cy} r={hovered === i ? 7 : 5} fill={color} opacity={hovered === i ? 1 : 0.7} stroke="#0D1117" strokeWidth="2" />
              {hovered === i && (
                <text x={cx} y={cy - 10} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="600">{d.label}: {d.value}</text>
              )}
            </g>
          );
        })}
        {xLabel && <text x={w / 2} y={h + 25} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.4)">{xLabel}</text>}
      </svg>
    </div>
  );
}

// ===== MAIN COMPONENT =====
export function DataChart({
  title,
  subtitle,
  chart_type,
  data = [],
  series = [],
  labels = [],
  x_label,
  y_label,
  show_values = true,
  show_legend = true,
  stacked,
}: DataChartProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const chartTypeIcons: Record<string, React.ReactNode> = {
    bar: <BarChart3 size={16} color="#FEC00F" />,
    horizontal_bar: <BarChart3 size={16} color="#FEC00F" style={{ transform: 'rotate(90deg)' }} />,
    line: <TrendingUp size={16} color="#FEC00F" />,
    area: <TrendingUp size={16} color="#FEC00F" />,
    pie: <PieChart size={16} color="#FEC00F" />,
    donut: <PieChart size={16} color="#FEC00F" />,
    scatter: <BarChart3 size={16} color="#FEC00F" />,
  };

  // If series provided but no labels, generate them
  const chartLabels = labels.length > 0 ? labels : (series.length > 0 ? series[0].data.map((_, i) => `${i + 1}`) : data.map(d => d.label));

  // Convert single series to data points if needed
  const chartData = data.length > 0 ? data : (series.length === 1 ? series[0].data.map((v, i) => ({ label: chartLabels[i] || `${i}`, value: v })) : []);

  const handleDownload = () => {
    const csvRows = ['Label,Value'];
    if (chartData.length > 0) {
      chartData.forEach(d => csvRows.push(`${d.label},${d.value}`));
    } else if (series.length > 0) {
      const header = ['Label', ...series.map(s => s.name)].join(',');
      csvRows[0] = header;
      chartLabels.forEach((l, i) => {
        csvRows.push([l, ...series.map(s => s.data[i] ?? '')].join(','));
      });
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${title || 'chart'}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      borderRadius: '16px',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
      color: '#fff',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      maxWidth: isFullscreen ? '100%' : '600px',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {chartTypeIcons[chart_type]}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{title || 'Data Chart'}</h3>
            {subtitle && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{subtitle}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={handleDownload} style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Download size={12} color="rgba(255,255,255,0.5)" />
          </button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {isFullscreen ? <Minimize2 size={12} color="rgba(255,255,255,0.5)" /> : <Maximize2 size={12} color="rgba(255,255,255,0.5)" />}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div style={{ padding: '8px 16px' }}>
        {chart_type === 'bar' && <BarChart data={chartData} showValues={show_values} xLabel={x_label} yLabel={y_label} />}
        {chart_type === 'horizontal_bar' && <HorizontalBarChart data={chartData} showValues={show_values} />}
        {(chart_type === 'line' || chart_type === 'area') && series.length > 0 && (
          <LineChart series={series} labels={chartLabels} isArea={chart_type === 'area'} xLabel={x_label} yLabel={y_label} />
        )}
        {(chart_type === 'line' || chart_type === 'area') && series.length === 0 && chartData.length > 0 && (
          <LineChart series={[{ name: title || 'Data', data: chartData.map(d => d.value) }]} labels={chartData.map(d => d.label)} isArea={chart_type === 'area'} xLabel={x_label} yLabel={y_label} />
        )}
        {chart_type === 'pie' && <PieDonutChart data={chartData} showValues={show_values} />}
        {chart_type === 'donut' && <PieDonutChart data={chartData} isDonut showValues={show_values} />}
        {chart_type === 'scatter' && <ScatterChart data={chartData} xLabel={x_label} yLabel={y_label} />}
      </div>

      {/* Legend for multi-series */}
      {show_legend && series.length > 1 && (
        <div style={{ padding: '8px 20px 16px', display: 'flex', gap: '12px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {series.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '3px', borderRadius: '2px', backgroundColor: getColor(i, s.color) }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DataChart;
