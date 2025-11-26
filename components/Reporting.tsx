
import React from 'react';
import useSWR from 'swr';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { type Practice, type Client } from '../types';
import { LoadingIcon, EuroIcon, ReportingIcon } from './icons';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center">
            <div className="p-3 rounded-full bg-light mr-4">
                {icon}
            </div>
            <div>
                <h3 className="font-semibold text-md text-primary">{title}</h3>
                <p className="text-2xl font-bold text-secondary">{value}</p>
            </div>
        </div>
    </div>
);

const Reporting: React.FC = () => {
    const { data: practices, error: practicesError } = useSWR<Practice[]>('/api/practices');
    const { data: clients, error: clientsError } = useSWR<Client[]>('/api/clients');

    if (practicesError || clientsError) {
        return <div className="text-red-500 p-4">Errore nel caricamento dei dati per il report.</div>;
    }

    if (!practices || !clients) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingIcon className="w-8 h-8 text-primary" />
                <p className="text-secondary text-lg ml-3">Caricamento report...</p>
            </div>
        );
    }

    const totalFees = practices.reduce((sum, p) => sum + (p.fee || 0), 0);
    const totalPaid = practices.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const totalDue = totalFees - totalPaid;

    const monthlyRevenue = practices.reduce((acc: Record<string, number>, p) => {
        const month = new Date(p.openedAt).toLocaleString('it-IT', { year: '2-digit', month: 'short' });
        acc[month] = (acc[month] || 0) + p.paidAmount;
        return acc;
    }, {} as Record<string, number>);

    const monthMap: { [key: string]: number } = {
        'gen': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mag': 4, 'giu': 5,
        'lug': 6, 'ago': 7, 'set': 8, 'ott': 9, 'nov': 10, 'dic': 11
    };
    
    // FIX: The original parsing logic was not robust enough for different locale string formats.
    const sortedMonths = Object.keys(monthlyRevenue).sort((a, b) => {
        const parseKey = (key: string): number | null => {
            const parts = key.replace(/['.]/g, "").split(/\s+/);
            if (parts.length < 2) return null;

            const monthIndex = monthMap[parts[0]];
            const year = parseInt(parts[1], 10);

            if (monthIndex === undefined || isNaN(year)) return null;

            const date = new Date(2000 + year, monthIndex);
            return isNaN(date.getTime()) ? null : date.getTime();
        };

        const timeA = parseKey(a);
        const timeB = parseKey(b);

        if (timeA === null || timeB === null) {
            return a.localeCompare(b); // Fallback to string comparison
        }

        return timeA - timeB;
    });

    const lineChartData = {
        labels: sortedMonths,
        datasets: [{
            label: 'Incassi Mensili',
            data: sortedMonths.map(month => monthlyRevenue[month]),
            fill: false,
            borderColor: '#1e3a8a',
            tension: 0.1,
        }],
    };
    
    const practiceStatusCounts = practices.reduce<Record<string, number>>((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
    }, {});
    
    const doughnutChartData = {
        labels: Object.keys(practiceStatusCounts),
        datasets: [{
            label: 'Stato Pratiche',
            data: Object.values(practiceStatusCounts),
            backgroundColor: ['#3b82f6', '#f59e0b', '#6b7280'],
        }]
    };

    const clientFees = practices.reduce((acc: Record<string, number>, p) => {
        const clientIdStr = String(p.clientId);
        acc[clientIdStr] = (acc[clientIdStr] || 0) + (p.fee || 0);
        return acc;
    }, {} as Record<string, number>);

    // FIX: Explicitly cast values from Object.entries to number for sorting and mapping, as TypeScript may infer them as `unknown`.
    const topClients: { name: string; fee: number }[] = Object.entries(clientFees)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 5)
        .map(([clientId, totalFee]) => ({
            name: clients.find(c => c.id === parseInt(clientId))?.name || 'Sconosciuto',
            fee: totalFee as number,
        }));

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <ReportingIcon className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-secondary">Report e Analisi</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Onorario Totale" value={new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(totalFees)} icon={<EuroIcon className="w-7 h-7 text-green-600"/>} />
                <StatCard title="Totale Incassato" value={new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(totalPaid)} icon={<EuroIcon className="w-7 h-7 text-green-700"/>} />
                <StatCard title="Da Incassare" value={new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(totalDue)} icon={<EuroIcon className="w-7 h-7 text-yellow-600"/>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                     <h2 className="text-xl font-bold text-secondary mb-4">Andamento Incassi</h2>
                     <Line data={lineChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }}/>
                </div>
                 <div className="bg-white p-6 rounded-lg shadow-md">
                     <h2 className="text-xl font-bold text-secondary mb-4">Stato Pratiche</h2>
                     <Doughnut data={doughnutChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }}/>
                </div>
            </div>
            
             <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-secondary mb-4">Top 5 Clienti per Onorario</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Onorario Totale</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {topClients.map((client, index) => (
                                <tr key={client.name}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{client.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-semibold text-right">{new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(client.fee)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reporting;
