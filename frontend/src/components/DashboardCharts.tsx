import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from 'recharts';

interface DashboardChartsProps {
  weightChartData: any[];
  deltaData: any[];
  goalWeight: number;
}

export default function DashboardCharts({
  weightChartData,
  deltaData,
  goalWeight,
}: DashboardChartsProps) {
  return (
    <div className="charts-grid">
      {/* Weight Evolution Chart */}
      <div className="chart-card full-width">
        <div className="chart-title"> Evolución de Peso</div>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weightChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748b', fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                width={40}
                tick={{ fill: '#64748b', fontSize: 11 }}
                domain={[
                  (dataMin: number) => Math.floor(dataMin),
                  (dataMax: number) => Math.ceil(dataMax),
                ]}
                tickFormatter={(v: any) => `${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(10, 12, 15, 0.95)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                }}
                labelStyle={{ color: '#F4F5F7' }}
                itemStyle={{ color: '#9BA3AF' }}
                formatter={(v: any) => [`${Number(v).toFixed(2)} kg`, 'Peso']}
              />
              <ReferenceLine
                y={goalWeight}
                stroke="rgba(52, 211, 153, 0.5)"
                strokeDasharray="8 4"
                label={{
                  value: 'Obj.',
                  fill: 'var(--color-success)',
                  fontSize: 12,
                  position: 'insideTopLeft',
                }}
              />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="var(--accent-primary)"
                strokeWidth={2.5}
                fill="url(#weightGrad)"
                dot={{ r: 3, fill: 'var(--accent-primary)' }}
                activeDot={{ r: 6, fill: 'var(--accent-primary-light)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Delta Chart */}
      <div className="chart-card">
        <div className="chart-title"> VariaciÃ³n Semanal (Î”)</div>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deltaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis
                width={40}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(v: any) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`}
              />
              <Tooltip
                labelStyle={{ color: '#F4F5F7' }}
                itemStyle={{ color: '#9BA3AF' }}
                contentStyle={{
                  background: 'rgba(17, 24, 39, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                }}
                formatter={(v: any) => [
                  `${v > 0 ? '+' : ''}${Number(v).toFixed(2)} kg`,
                  'Variación',
                ]}
              />
              <Bar dataKey="delta" radius={[6, 6, 0, 0]}>
                {deltaData.map((entry: any, i: number) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}





