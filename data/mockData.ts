
import { type Client, type Practice, type Reminder, type Lawyer } from '../types';

export const clients: Client[] = [
  {
    id: 1,
    name: 'Mario Rossi',
    email: 'mario.rossi@example.com',
    phone: '333-1234567',
    taxcode: 'RSSMRA80A01H501U',
    createdAt: '2023-01-15',
    notes: 'Cliente di lunga data. Si occupa di diritto immobiliare. Ha una questione pendente riguardo un confine di proprietà. Preferisce comunicazioni via email.',
    priority: 'Media',
  },
  {
    id: 2,
    name: 'Giulia Bianchi',
    email: 'giulia.bianchi@example.com',
    phone: '347-7654321',
    taxcode: 'BNCGLI85B41E158F',
    createdAt: '2023-03-22',
    notes: 'Nuova cliente, riferita da Rossi. Necessita di consulenza per la costituzione di una nuova società. Molto attenta ai dettagli finanziari.',
    priority: 'Media',
  },
  {
    id: 3,
    name: 'Luca Verdi',
    email: 'luca.verdi@example.com',
    phone: '328-9876543',
    taxcode: 'VRDLCA82C01F839T',
    createdAt: '2022-11-05',
    notes: 'Caso di diritto del lavoro. La documentazione iniziale è stata raccolta. In attesa di una risposta dalla controparte. Scadenza importante tra due settimane.',
    priority: 'Alta',
  }
];

export const practices: Practice[] = [
  {
    id: 101,
    clientId: 1,
    lawyerId: 1,
    title: 'Disputa Confine Proprietà',
    notes: 'Controversia con il vicino riguardo il confine esatto della proprietà situata in campagna.',
    status: 'In corso',
    openedAt: '2023-02-10',
    type: 'Civile Immobiliare',
    value: 15000,
    priority: 'Media',
    fee: 3500,
    paidAmount: 1000,
  },
  {
    id: 102,
    clientId: 2,
    lawyerId: 2,
    title: 'Costituzione SRL',
    notes: 'Assistenza legale per la costituzione di una nuova società a responsabilità limitata nel settore tecnologico.',
    status: 'In corso',
    openedAt: '2023-03-25',
    type: 'Societario',
    value: 7500,
    priority: 'Media',
    fee: 2500,
    paidAmount: 2500,
  },
  {
    id: 103,
    clientId: 3,
    lawyerId: 1,
    title: 'Causa Lavoro vs Ex Datore',
    notes: 'Impugnazione di licenziamento per giusta causa.',
    status: 'Aperta',
    openedAt: '2023-05-01',
    type: 'Diritto del Lavoro',
    value: 12000,
    priority: 'Alta',
    fee: 4000,
    paidAmount: 500,
  },
  {
    id: 104,
    clientId: 1,
    title: 'Contratto Locazione Commerciale',
    notes: 'Redazione e revisione del contratto di locazione per un nuovo immobile commerciale.',
    status: 'Chiusa',
    openedAt: '2022-09-01',
    type: 'Commerciale',
    value: 3000,
    priority: 'Bassa',
    fee: 1200,
    paidAmount: 1200,
  }
];

export const reminders: Reminder[] = [
  {
    id: 1,
    practiceId: 103,
    title: 'Scadenza deposito atti - Causa Verdi',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
    priority: 'Alta'
  },
  {
    id: 2,
    practiceId: 102,
    title: 'Chiamare cliente Giulia Bianchi per aggiornamenti SRL',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0],
    priority: 'Media'
  },
  {
    id: 3,
    title: 'Revisione documenti confine proprietà Rossi',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0],
    priority: 'Bassa'
  }
];

export const lawyers: Lawyer[] = [
    {
        id: 1,
        firstName: 'Laura',
        lastName: 'Ricci',
        email: 'laura.ricci@studio.it',
        phone: '335-1122334',
        specialization: 'Diritto Civile',
        billingType: 'Oraria',
        billingRate: 250,
    },
    {
        id: 2,
        firstName: 'Roberto',
        lastName: 'Galli',
        email: 'roberto.galli@studio.it',
        phone: '338-5566778',
        specialization: 'Diritto Societario',
        billingType: 'Fissa',
        billingRate: 2500,
    }
];
