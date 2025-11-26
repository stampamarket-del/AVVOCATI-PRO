
export interface Client {
  id?: number;
  name: string;
  email: string;
  phone: string;
  taxcode: string;
  notes?: string;
  createdAt: string;
  priority: 'Alta' | 'Media' | 'Bassa';
}

export interface Practice {
  id?: number;
  clientId: number;
  lawyerId?: number;
  title: string;
  type: string;
  status: 'Aperta' | 'In corso' | 'Chiusa';
  value: number; // Valore della causa/disputa
  openedAt: string;
  notes?: string;
  priority: 'Alta' | 'Media' | 'Bassa';
  fee: number; // Onorario pattuito
  paidAmount: number; // Importo saldato
}

export interface Reminder {
  id?: number;
  practiceId?: number;
  title: string;
  dueDate: string;
  priority: 'Alta' | 'Media' | 'Bassa';
}

export interface Document {
    id?: number;
    clientId: number;
    practiceId?: number;
    name: string;
    type: string; // e.g., 'application/pdf', 'image/jpeg'
    dataUrl: string; // Base64 encoded content
    createdAt: string;
}

export interface FirmProfile {
  id: number;
  name: string;
  address: string;
  vatNumber: string; // Partita IVA
  email: string;
  phone: string;
  logoUrl?: string; // Base64 encoded image
}

export interface Lawyer {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  photoUrl?: string; // Base64 encoded image
  billingType: 'Oraria' | 'Fissa';
  billingRate: number;
}

export interface Letter {
  id?: number;
  clientId: number;
  subject: string;
  body: string;
  createdAt: string;
}

export interface TimeEntry {
    id?: number;
    practiceId: number;
    date: string;
    hours: number;
    description: string;
}

export interface Quote {
  id?: number;
  clientId: number;
  practiceTitle: string;
  practiceType: string;
  practiceNotes: string;
  fee: number;
  cpa: number;
  vat: number;
  total: number;
  createdAt: string;
}

export interface User {
    id?: number;
    username: string;
    password: string;
    name: string;
    role: 'admin' | 'user';
}


export type View = 'dashboard' | 'clients' | 'practices' | 'client-detail' | 'calendar' | 'ai-assistant' | 'reminders' | 'ai-search' | 'reporting' | 'firm-profile' | 'lawyers' | 'letters' | 'practice-detail' | 'quotes' | 'quotelist' | 'admin';
