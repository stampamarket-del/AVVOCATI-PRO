
import React, { useState } from 'react';
import useSWR from 'swr';
import { type Reminder } from '../types';
import { LoadingIcon, CalendarIcon } from './icons';

const getPriorityClass = (priority: 'Alta' | 'Media' | 'Bassa') => {
  switch (priority) {
    case 'Alta': return 'bg-red-500 border-red-700';
    case 'Media': return 'bg-yellow-500 border-yellow-700';
    case 'Bassa': return 'bg-green-500 border-green-700';
  }
};

const CalendarView: React.FC = () => {
    const { data: reminders, error } = useSWR<Reminder[]>('/api/reminders');
    const [currentDate, setCurrentDate] = useState(new Date());

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const endDate = new Date(endOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days = [];
    let day = new Date(startDate);
    while (day <= endDate) {
        days.push(new Date(day));
        day.setDate(day.getDate() + 1);
    }
    
    const remindersByDate = reminders?.reduce((acc, reminder) => {
        const date = reminder.dueDate.split('T')[0];
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(reminder);
        return acc;
    }, {} as Record<string, Reminder[]>) || {};

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    if (error) return <div className="text-red-500 p-4">Errore nel caricamento dei promemoria.</div>;

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <CalendarIcon className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-secondary">Calendario Scadenze</h1>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => changeMonth(-1)} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-800 transition-colors">&lt; Precedente</button>
                    <h2 className="text-2xl font-bold text-secondary">
                        {currentDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={() => changeMonth(1)} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-800 transition-colors">Successivo &gt;</button>
                </div>
                
                {!reminders ? (
                     <div className="flex items-center justify-center h-96">
                        <LoadingIcon className="w-8 h-8 text-primary" />
                        <span className="ml-3 text-secondary">Caricamento calendario...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200">
                        {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(dayName => (
                            <div key={dayName} className="text-center font-semibold py-2 bg-gray-50 text-secondary text-sm">
                                {dayName}
                            </div>
                        ))}
                        {days.map(d => {
                            const dateKey = d.toISOString().split('T')[0];
                            const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                            const isToday = d.toDateString() === new Date().toDateString();
                            return (
                                <div key={dateKey} className={`relative min-h-[120px] p-2 ${isCurrentMonth ? 'bg-white' : 'bg-gray-100'}`}>
                                    <div className={`text-sm ${isCurrentMonth ? 'text-gray-700' : 'text-gray-400'} ${isToday ? 'font-bold text-white bg-primary rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
                                        {d.getDate()}
                                    </div>
                                    <div className="mt-1 space-y-1">
                                        {remindersByDate[dateKey]?.map(reminder => (
                                             <div key={reminder.id} title={reminder.title} className={`text-xs p-1 rounded-md text-white flex items-center gap-1.5 ${getPriorityClass(reminder.priority)} border-l-4`}>
                                                <p className="truncate font-semibold">{reminder.title}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarView;