import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLocale, useT } from '@/i18n';

interface WakatimeDailyData {
  date: string;
  total: number;
  categories: {
    name: string;
    total: number;
  }[];
}

interface WakatimeStatsProps {
  data: WakatimeDailyData[];
}

/** Height of the title row (21px line + 24px gap) plus the chart: the Suspense fallback reserves the same box. */
export const WAKATIME_STATS_HEIGHT = 349;

// SVG attributes take CSS variables, so the chart follows the tile tokens (light, dark) with no theme switch in JS.
const TICK = { fill: 'var(--tile-muted)', fontSize: 12 };

const WakatimeStats: React.FC<WakatimeStatsProps> = ({ data }) => {
  const t = useT();
  const locale = useLocale();

  const chartData = data.map((day) => ({
    date: new Date(day.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
    Coding: day.total / 3600, // Convert seconds to hours
  }));

  return (
    <div className="w-full text-left">
      <h3 className="mb-6 text-title text-tile-ink">{t.about.activityMonth}</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 5, right: 8, left: -16, bottom: 5 }}>
            <CartesianGrid vertical={false} stroke="var(--hairline)" />
            <XAxis dataKey="date" tick={TICK} axisLine={false} tickLine={false} />
            <YAxis unit="h" tick={TICK} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'var(--tile-frame)', opacity: 0.6 }}
              contentStyle={{
                backgroundColor: 'var(--surface-white)',
                border: 'none',
                borderRadius: 12,
                color: 'var(--ink)',
              }}
              labelStyle={{ fontWeight: 600 }}
              formatter={(value) => [t.about.hours(Number(value).toFixed(2)), t.about.time]}
            />
            <Bar dataKey="Coding" fill="var(--tile-action)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WakatimeStats;
