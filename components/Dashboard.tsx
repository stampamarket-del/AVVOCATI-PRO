
import React from 'react';
import useSWR from 'swr';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { type View, type Practice, type Client } from '../types';
import { EuroIcon, PracticesIcon, ClientsIcon, LoadingIcon, LogoutIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardProps {
    onNavigate: (view: View) => void;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; onClick?: () => void }> = ({ title, value, icon, onClick }) => (
    <div className={`bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
        <div className="flex items-center">
            <div className="p-3 rounded-full bg-light mr-4">
                {icon}
            </div>
            <div>
                <h3 className="font-semibold text-lg text-primary">{title}</h3>
                <p className="text-3xl font-bold text-secondary">{value}</p>
            </div>
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
    const { logout } = useAuth();
    const { data: clients, error: clientsError } = useSWR<Client[]>('/api/clients');
    const { data: practices, error: practicesError } = useSWR<Practice[]>('/api/practices');

    if (clientsError || practicesError) {
        return <div className="text-red-500 p-4">Errore nel caricamento dei dati della dashboard.</div>;
    }

    if (!clients || !practices) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingIcon className="w-8 h-8 text-primary" />
                <p className="text-secondary text-lg ml-3">Caricamento dashboard...</p>
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
            return a.localeCompare(b);
        }

        return timeA - timeB;
    });

    const lineChartData = {
        labels: sortedMonths,
        datasets: [{
            label: 'Incassi Mensili',
            data: sortedMonths.map(month => monthlyRevenue[month]),
            borderColor: '#1e3a8a',
            backgroundColor: 'rgba(30, 58, 138, 0.1)',
            fill: true,
            tension: 0.3,
        }],
    };

    const practiceStatusCounts = practices.reduce<Record<string, number>>((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
    }, {});
    
    const doughnutChartData = {
        labels: Object.keys(practiceStatusCounts),
        datasets: [{
            label: '# di Pratiche',
            data: Object.values(practiceStatusCounts),
            backgroundColor: ['#3b82f6', '#f59e0b', '#6b7280'],
            borderColor: ['#f9fafb', '#f9fafb', '#f9fafb'],
            borderWidth: 2,
        }]
    };

    const clientFees = practices.reduce((acc: Record<string, number>, p) => {
        const clientIdStr = String(p.clientId);
        acc[clientIdStr] = (acc[clientIdStr] || 0) + (p.fee || 0);
        return acc;
    }, {} as Record<string, number>);

    const topClients: { name: string; fee: number; }[] = Object.entries(clientFees)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 5)
        .map(([clientId, totalFee]) => ({
            name: clients.find(c => c.id === parseInt(clientId))?.name || 'Sconosciuto',
            fee: totalFee as number,
        }));
    
    const barChartData = {
        labels: topClients.map(c => c.name),
        datasets: [{
            label: 'Onorario (€)',
            data: topClients.map(c => c.fee),
            backgroundColor: '#1e3a8a',
        }]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' as const },
            title: { display: false },
        },
    };

    const barChartOptions = {
        ...chartOptions,
        indexAxis: 'y' as const,
        elements: { bar: { borderWidth: 2 } },
        plugins: { ...chartOptions.plugins, legend: { display: false } }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-secondary mb-2">Dashboard</h1>
                    <p className="text-gray-600">Benvenuto nel tuo studio legale potenziato dall'IA.</p>
                </div>
                <div className="md:hidden">
                    <button onClick={logout} className="p-2 text-gray-600 hover:text-red-600">
                        <LogoutIcon className="w-6 h-6"/>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Clienti" value={clients.length.toString()} icon={<ClientsIcon className="w-8 h-8 text-primary"/>} onClick={() => onNavigate('clients')} />
                <StatCard title="Pratiche" value={practices.length.toString()} icon={<PracticesIcon className="w-8 h-8 text-primary"/>} onClick={() => onNavigate('practices')} />
                <StatCard title="Onorario Totale" value={totalFees.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })} icon={<EuroIcon className="w-8 h-8 text-green-600"/>} />
                <StatCard title="Da Incassare" value={totalDue.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })} icon={<EuroIcon className="w-8 h-8 text-yellow-600"/>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                     <h2 className="text-xl font-bold text-secondary mb-4">Andamento Incassi Mensili</h2>
                     <Line options={chartOptions} data={lineChartData} />
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
                     <h2 className="text-xl font-bold text-secondary mb-4">Stato Pratiche</h2>
                     <div className="w-full max-w-[300px] h-auto">
                        <Doughnut data={doughnutChartData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { position: 'bottom' } } }} />
                     </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-secondary mb-4">Top 5 Clienti per Onorario</h2>
                <div className="max-h-96">
                    <Bar options={barChartOptions} data={barChartData} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
