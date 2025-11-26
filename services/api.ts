
import { db } from '../data/db';
import { type Client, type Practice, type Reminder, type Document, type FirmProfile, type Lawyer, type Letter, type TimeEntry, type Quote } from '../types';

/**
 * Funzione fetcher per SWR.
 * Simula una chiamata API REST recuperando i dati direttamente dal database Dexie.
 * Supporta percorsi come '/api/clients' e '/api/clients/1'.
 * Supporta query params simulati per i documenti, es. '/api/documents?clientId=1'
 * @param key La chiave dell'API da recuperare.
 */
export const fetcher = async (key: string) => {
  const [path, params] = key.split('?');
  const queryParams = new URLSearchParams(params);
  
  // Rimuove il prefisso /api/ per semplificare la logica, es. "clients/1" o "firm-profile"
  const apiPath = path.startsWith('/api/') ? path.substring(5) : null;

  if (apiPath === null || apiPath === '') {
      throw new Error(`Formato della chiave API non valido: ${key}`);
  }
  
  const parts = apiPath.split('/'); // es. ['clients', '1'] o ['firm-profile']
  const resource = parts[0];
  const id = parts[1] ? parseInt(parts[1], 10) : null;
  
  console.log(`Fetcher called with key: ${key}`, { resource, id, queryParams: Object.fromEntries(queryParams) });


  switch (resource) {
    case 'clients':
      return id ? db.clients.get(id) : db.clients.toArray();
    case 'practices':
      return id ? db.practices.get(id) : db.practices.toArray();
    case 'reminders':
      return db.reminders.orderBy('dueDate').toArray();
    case 'documents':
      const clientId = queryParams.get('clientId');
      const practiceId_doc = queryParams.get('practiceId');
      if (practiceId_doc) {
        return db.documents.where('practiceId').equals(parseInt(practiceId_doc, 10)).toArray();
      }
      if (clientId) {
        return db.documents.where('clientId').equals(parseInt(clientId, 10)).toArray();
      }
      return db.documents.toArray();
    case 'lawyers':
      return id ? db.lawyers.get(id) : db.lawyers.toArray();
    case 'letters':
        return db.letters.orderBy('createdAt').reverse().toArray();
    case 'quotes':
        return db.quotes.orderBy('createdAt').reverse().toArray();
    case 'firm-profile':
      return db.firmProfile.get(1);
    case 'time-entries':
      const practiceId_time = queryParams.get('practiceId');
      if (practiceId_time) {
        return db.timeEntries.where('practiceId').equals(parseInt(practiceId_time, 10)).toArray();
      }
      return db.timeEntries.toArray();
    default:
      throw new Error(`Endpoint API sconosciuto: ${key}`);
  }
};

// --- Funzioni di Mutazione Clienti ---
export const createClient = async (client: Omit<Client, 'id'>): Promise<number> => {
    return await db.clients.add(client as Client);
};
export const updateClient = async (updatedClient: Partial<Client> & { id: number }): Promise<void> => {
  await db.clients.update(updatedClient.id, updatedClient);
};

// --- Funzioni di Mutazione Pratiche ---
export const createPractice = async (practice: Omit<Practice, 'id'>): Promise<number> => {
    return await db.practices.add(practice as Practice);
};
export const updatePractice = async (updatedPractice: Partial<Practice> & { id: number }): Promise<void> => {
  await db.practices.update(updatedPractice.id, updatedPractice);
};


// --- Funzioni di Mutazione Promemoria ---
export const createReminder = async (reminder: Omit<Reminder, 'id'>): Promise<number> => {
    return await db.reminders.add(reminder as Reminder);
};
export const deleteReminder = async (id: number): Promise<void> => {
    await db.reminders.delete(id);
};

// --- Funzioni di Mutazione Documenti ---
export const addDocument = async (doc: Omit<Document, 'id'>): Promise<number> => {
    return await db.documents.add(doc as Document);
};
export const deleteDocument = async (id: number): Promise<void> => {
    await db.documents.delete(id);
};

// --- Funzioni di Mutazione Profilo Studio ---
export const updateFirmProfile = async (profile: FirmProfile): Promise<void> => {
  await db.firmProfile.put(profile);
};

// --- Funzioni di Mutazione Avvocati ---
export const createLawyer = async (lawyer: Omit<Lawyer, 'id'>): Promise<number> => {
    return await db.lawyers.add(lawyer as Lawyer);
};
export const updateLawyer = async (updatedLawyer: Partial<Lawyer> & { id: number }): Promise<void> => {
  await db.lawyers.update(updatedLawyer.id, updatedLawyer);
};
export const deleteLawyer = async (id: number): Promise<void> => {
    await db.lawyers.delete(id);
};

// --- Funzioni di Mutazione Lettere ---
export const createLetter = async (letter: Omit<Letter, 'id'>): Promise<number> => {
    return await db.letters.add(letter as Letter);
};
export const deleteLetter = async (id: number): Promise<void> => {
    await db.letters.delete(id);
};

// --- Funzioni di Mutazione Preventivi ---
export const createQuote = async (quote: Omit<Quote, 'id'>): Promise<number> => {
    return await db.quotes.add(quote as Quote);
};

export const deleteQuote = async (id: number): Promise<void> => {
    await db.quotes.delete(id);
};

// --- Funzioni di Mutazione Time Entries ---
export const createTimeEntry = async (entry: Omit<TimeEntry, 'id'>): Promise<number> => {
    return await db.timeEntries.add(entry as TimeEntry);
};
export const deleteTimeEntry = async (id: number): Promise<void> => {
    await db.timeEntries.delete(id);
};