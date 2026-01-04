import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../lib/ThemeContext';

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

const WakatimeStats: React.FC<WakatimeStatsProps> = ({ data }) => {
    const { theme } = useTheme();

    const chartData = data.map(day => ({
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Coding: day.total / 3600, // Convert seconds to hours
    }));
    
    const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b';
    const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';

    return (
        <div className="bg-white dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-white/5">
            <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Coding Activity (Last 30 Days)</h3>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="date" tick={{ fill: tickColor, fontSize: 12 }} />
                        <YAxis unit="h" tick={{ fill: tickColor, fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                                borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                                color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                            }}
                            labelStyle={{ fontWeight: 'bold' }}
                            formatter={(value: number) => [`${value.toFixed(2)} hrs`, 'Time']}
                        />
                        <Bar dataKey="Coding" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default WakatimeStats;
