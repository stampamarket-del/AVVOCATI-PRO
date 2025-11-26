
import Dexie, { type Table } from 'dexie';
import { type Client, type Practice, type Reminder, type Document, type FirmProfile, type Lawyer, type Letter, type TimeEntry, type Quote, type User } from '../types';
import { clients, practices, reminders, lawyers } from './mockData';

export const db = new Dexie('legalCrmDatabase') as Dexie & {
  clients: Table<Client>;
  practices: Table<Practice>;
  reminders: Table<Reminder>;
  documents: Table<Document>;
  firmProfile: Table<FirmProfile>;
  lawyers: Table<Lawyer>;
  letters: Table<Letter>;
  timeEntries: Table<TimeEntry>;
  quotes: Table<Quote>;
  users: Table<User>;
};

db.version(1).stores({
  clients: '++id, name, taxcode',
  practices: '++id, clientId, status, type',
  reminders: '++id, dueDate',
});

db.version(2).stores({
  clients: '++id, name, taxcode, priority',
  practices: '++id, clientId, status, type, priority',
  reminders: '++id, dueDate, priority',
  documents: '++id, clientId',
}).upgrade(tx => {
    return tx.table('practices').toCollection().modify(practice => {
        if (practice.priority === undefined) {
            practice.priority = 'Media';
        }
    });
});

db.version(3).stores({
    practices: '++id, clientId, status, type, priority, fee, paidAmount'
}).upgrade(tx => {
    return tx.table('practices').toCollection().modify(practice => {
        practice.fee = practice.fee || practice.value || 0;
        practice.paidAmount = practice.paidAmount || 0;
    });
});

db.version(4).stores({
  firmProfile: 'id'
});

db.version(5).stores({
  lawyers: '++id, lastName',
  practices: '++id, clientId, status, type, priority, fee, paidAmount, lawyerId',
});

db.version(6).stores({
  letters: '++id, clientId, createdAt'
});

db.version(7).stores({
    reminders: '++id, dueDate, priority, practiceId',
    documents: '++id, clientId, practiceId', // Aggiunge indice per practiceId
});

db.version(8).stores({
  lawyers: '++id, lastName, billingType, billingRate',
  timeEntries: '++id, practiceId, date',
}).upgrade(tx => {
    return tx.table('lawyers').toCollection().modify(lawyer => {
        lawyer.billingType = lawyer.billingType || 'Oraria';
        lawyer.billingRate = lawyer.billingRate || 150;
    });
});

db.version(9).stores({
  quotes: '++id, clientId, createdAt'
});

db.version(10).stores({
    users: '++id, username'
});


db.on('populate', async () => {
    await db.firmProfile.add({
      id: 1,
      name: "Il Tuo Studio Legale",
      address: "Via Roma, 1, 00100 Roma (RM)",
      vatNumber: "IT12345678901",
      email: "info@tuostudiolegale.it",
      phone: "06 1234567",
      logoUrl: "", 
    });

    await db.lawyers.bulkAdd(lawyers as Lawyer[]);
    await db.clients.bulkAdd(clients as Client[]);
    await db.practices.bulkAdd(practices as Practice[]);
    await db.reminders.bulkAdd(reminders as Reminder[]);

    // Esempio di time entry
    await db.timeEntries.add({
        practiceId: 101,
        date: new Date().toISOString().split('T')[0],
        hours: 2.5,
        description: "Ricerca giurisprudenziale e preparazione bozza atto."
    });
    
    // Utente Admin di default
    await db.users.add({
        username: 'admin',
        password: 'admin', // In un'app reale, usare hash!
        name: 'Amministratore',
        role: 'admin'
    });

    console.log("DB inizializzato con dati di esempio.");
});
