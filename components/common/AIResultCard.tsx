import React from 'react';
import { PaperPlaneIcon } from '../icons';

interface AIResultCardProps {
    title: string;
    subject?: string;
    content: string;
    onSendEmail?: () => void;
    isMilestoneList?: boolean;
    onAddReminder?: (title: string) => void;
}

export const AIResultCard: React.FC<AIResultCardProps> = ({ title, subject, content, onSendEmail, isMilestoneList, onAddReminder }) => {
    if (isMilestoneList && onAddReminder) {
        const milestones = content.split('\n').map(line => line.trim().replace(/^[-*]\s*/, '')).filter(Boolean);
        return (
            <div className="mt-4 bg-light p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-primary mb-2">{title}</h4>
                <ul className="space-y-2">
                    {milestones.map((milestone, index) => (
                        <li key={index} className="flex justify-between items-center text-sm p-2 bg-white rounded-md shadow-sm">
                            <span className="text-secondary flex-1 pr-2">{milestone}</span>
                            <button 
                                onClick={() => onAddReminder(milestone)} 
                                className="text-xs px-2 py-1 bg-primary text-white rounded-md hover:bg-blue-800 transition-colors flex-shrink-0"
                                title="Aggiungi come promemoria nello Scadenziario"
                            >
                                Crea Promemoria
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    return (
        <div className="mt-4 bg-light p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center">
                 <h4 className="font-semibold text-primary mb-2">{title}</h4>
                 {onSendEmail && (
                    <button onClick={onSendEmail} className="flex items-center gap-2 px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700">
                        <PaperPlaneIcon className="w-3 h-3"/> Invia Email
                    </button>
                 )}
            </div>
            {subject && <p className="text-sm font-bold text-secondary mb-2">Oggetto: {subject}</p>}
            <pre className="text-sm text-secondary whitespace-pre-wrap font-sans">{content}</pre>
        </div>
    );
};