
import { supabase } from './supabaseClient';
import { type Client, type Practice, type Reminder, type Document, type FirmProfile, type Lawyer, type Letter, type TimeEntry, type Quote } from '../types';

// --- Helper per la mappatura dei campi (JS -> DB) ---

const mapClientToDB = (c: Partial<Client>) => ({
    name: c.name,
    email: c.email,
    phone: c.phone,
    taxcode: c.taxcode,
    notes: c.notes,
    priority: c.priority,
    created_at: c.createdAt
});

const mapPracticeToDB = (p: Partial<Practice>) => ({
    client_id: p.clientId,
    lawyer_id: p.lawyerId,
    title: p.title,
    type: p.type,
    status: p.status,
    value: p.value,
    fee: p.fee,
    paid_amount: p.paidAmount,
    priority: p.priority,
    notes: p.notes,
    opened_at: p.openedAt
});

const mapLawyerToDB = (l: Partial<Lawyer>) => ({
    first_name: l.firstName,
    last_name: l.lastName,
    email: l.email,
    phone: l.phone,
    specialization: l.specialization,
    photo_url: l.photoUrl,
    billing_type: l.billingType,
    billing_rate: l.billingRate
});

const mapDocumentToDB = (d: Partial<Document>) => ({
    client_id: d.clientId,
    practice_id: d.practiceId,
    name: d.name,
    type: d.type,
    data_url: d.dataUrl,
    created_at: d.createdAt
});

const mapReminderToDB = (r: Partial<Reminder>) => ({
    practice_id: r.practiceId,
    title: r.title,
    due_date: r.dueDate,
    priority: r.priority
});

// --- Helper per la mappatura dei campi (DB -> JS) ---

const mapFromDB = (resource: string, data: any) => {
    if (!data) return null;
    if (Array.isArray(data)) return data.map(item => mapFromDB(resource, item));

    switch (resource) {
        case 'clients':
            return { ...data, createdAt: data.created_at };
        case 'practices':
            return { 
                ...data, 
                clientId: data.client_id, 
                lawyerId: data.lawyer_id, 
                openedAt: data.opened_at,
                paidAmount: data.paid_amount
            };
        case 'lawyers':
            return { 
                ...data, 
                firstName: data.first_name, 
                lastName: data.last_name, 
                photoUrl: data.photo_url,
                billingType: data.billing_type,
                billingRate: data.billing_rate
            };
        case 'documents':
            return { ...data, clientId: data.client_id, practiceId: data.practice_id, dataUrl: data.data_url, createdAt: data.created_at };
        case 'firm_profile':
            return { ...data, vatNumber: data.vat_number, logoUrl: data.logo_url };
        case 'reminders':
            return { ...data, practiceId: data.practice_id, dueDate: data.due_date };
        case 'letters':
            return { ...data, clientId: data.client_id, createdAt: data.created_at };
        case 'quotes':
            return { 
                ...data, 
                clientId: data.client_id, 
                practiceTitle: data.practice_title,
                practiceType: data.practice_type,
                practiceNotes: data.practice_notes,
                createdAt: data.created_at 
            };
        case 'time_entries':
            return { ...data, practiceId: data.practice_id, createdAt: data.created_at };
        default:
            return data;
    }
};

/**
 * Funzione fetcher per SWR ottimizzata per Supabase.
 */
export const fetcher = async (key: string) => {
  const [path, params] = key.split('?');
  const queryParams = new URLSearchParams(params);
  const apiPath = path.startsWith('/api/') ? path.substring(5) : null;

  if (!apiPath) throw new Error(`Invalid API key: ${key}`);
  
  const parts = apiPath.split('/');
  const resource = parts[0];
  const id = parts[1] || null;

  let query = supabase.from(resource).select('*');

  if (id) {
    const { data, error } = await query.eq('id', id).single();
    if (error) throw error;
    return mapFromDB(resource, data);
  }

  // Filtri specifici basati sui query params
  switch (resource) {
    case 'documents':
      const clientId = queryParams.get('clientId');
      const practiceIdDoc = queryParams.get('practiceId');
      if (practiceIdDoc) query = query.eq('practice_id', parseInt(practiceIdDoc));
      else if (clientId) query = query.eq('client_id', parseInt(clientId));
      break;
    case 'time_entries':
      const practiceIdTime = queryParams.get('practiceId');
      if (practiceIdTime) query = query.eq('practice_id', parseInt(practiceIdTime));
      break;
    case 'reminders':
      query = query.order('due_date', { ascending: true });
      break;
    case 'letters':
    case 'quotes':
      query = query.order('created_at', { ascending: false });
      break;
    case 'firm_profile':
      const { data: profile, error: profileError } = await supabase.from('firm_profile').select('*').eq('id', 1).single();
      if (profileError) throw profileError;
      return mapFromDB('firm_profile', profile);
  }

  const { data, error } = await query;
  if (error) throw error;
  return mapFromDB(resource, data);
};

// --- Funzioni di Mutazione Clienti ---
export const createClient = async (client: Omit<Client, 'id'>) => {
    const dbData = mapClientToDB(client);
    const { data, error } = await supabase.from('clients').insert([dbData]).select();
    if (error) throw error;
    return data[0].id;
};
export const updateClient = async (updatedClient: Partial<Client> & { id: number }) => {
  const dbData = mapClientToDB(updatedClient);
  // Rimuovi campi undefined per evitare sovrascritture accidentali
  Object.keys(dbData).forEach(key => (dbData as any)[key] === undefined && delete (dbData as any)[key]);
  const { error } = await supabase.from('clients').update(dbData).eq('id', updatedClient.id);
  if (error) throw error;
};

// --- Funzioni di Mutazione Pratiche ---
export const createPractice = async (practice: Omit<Practice, 'id'>) => {
    const dbData = mapPracticeToDB(practice);
    const { data, error } = await supabase.from('practices').insert([dbData]).select();
    if (error) throw error;
    return data[0].id;
};
export const updatePractice = async (updatedPractice: Partial<Practice> & { id: number }) => {
  const dbData = mapPracticeToDB(updatedPractice);
  Object.keys(dbData).forEach(key => (dbData as any)[key] === undefined && delete (dbData as any)[key]);
  const { error } = await supabase.from('practices').update(dbData).eq('id', updatedPractice.id);
  if (error) throw error;
};

// --- Funzioni di Mutazione Promemoria ---
export const createReminder = async (reminder: Omit<Reminder, 'id'>) => {
    const dbData = mapReminderToDB(reminder);
    const { data, error } = await supabase.from('reminders').insert([dbData]).select();
    if (error) throw error;
    return data[0].id;
};
export const deleteReminder = async (id: number) => {
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error) throw error;
};

// --- Funzioni di Mutazione Documenti ---
export const addDocument = async (doc: Omit<Document, 'id'>) => {
    const dbData = mapDocumentToDB(doc);
    const { data, error } = await supabase.from('documents').insert([dbData]).select();
    if (error) throw error;
    return data[0].id;
};
export const deleteDocument = async (id: number) => {
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) throw error;
};

// --- Funzioni di Mutazione Profilo Studio ---
export const updateFirmProfile = async (profile: FirmProfile) => {
  const dbData = {
      name: profile.name,
      address: profile.address,
      vat_number: profile.vatNumber,
      email: profile.email,
      phone: profile.phone,
      logo_url: profile.logoUrl
  };
  const { error } = await supabase.from('firm_profile').upsert(dbData);
  if (error) throw error;
};

// --- Funzioni di Mutazione Avvocati ---
export const createLawyer = async (lawyer: Omit<Lawyer, 'id'>) => {
    const dbData = mapLawyerToDB(lawyer);
    const { data, error } = await supabase.from('lawyers').insert([dbData]).select();
    if (error) throw error;
    return data[0].id;
};
export const updateLawyer = async (updatedLawyer: Partial<Lawyer> & { id: number }) => {
  const dbData = mapLawyerToDB(updatedLawyer);
  Object.keys(dbData).forEach(key => (dbData as any)[key] === undefined && delete (dbData as any)[key]);
  const { error } = await supabase.from('lawyers').update(dbData).eq('id', updatedLawyer.id);
  if (error) throw error;
};
export const deleteLawyer = async (id: number) => {
    const { error } = await supabase.from('lawyers').delete().eq('id', id);
    if (error) throw error;
};

// --- Funzioni di Mutazione Lettere ---
export const createLetter = async (letter: Omit<Letter, 'id'>) => {
    const dbData = {
        client_id: letter.clientId,
        subject: letter.subject,
        body: letter.body,
        created_at: letter.createdAt
    };
    const { data, error } = await supabase.from('letters').insert([dbData]).select();
    if (error) throw error;
    return data[0].id;
};
export const deleteLetter = async (id: number) => {
    const { error } = await supabase.from('letters').delete().eq('id', id);
    if (error) throw error;
};

// --- Funzioni di Mutazione Preventivi ---
export const createQuote = async (quote: Omit<Quote, 'id'>) => {
    const dbData = {
        client_id: quote.clientId,
        practice_title: quote.practiceTitle,
        practice_type: quote.practiceType,
        practice_notes: quote.practiceNotes,
        fee: quote.fee,
        cpa: quote.cpa,
        vat: quote.vat,
        total: quote.total,
        created_at: quote.createdAt
    };
    const { data, error } = await supabase.from('quotes').insert([dbData]).select();
    if (error) throw error;
    return data[0].id;
};
export const deleteQuote = async (id: number) => {
    const { error } = await supabase.from('quotes').delete().eq('id', id);
    if (error) throw error;
};

// --- Funzioni di Mutazione Time Entries ---
export const createTimeEntry = async (entry: Omit<TimeEntry, 'id'>) => {
    const dbData = {
        practice_id: entry.practiceId,
        date: entry.date,
        hours: entry.hours,
        description: entry.description
    };
    const { data, error } = await supabase.from('time_entries').insert([dbData]).select();
    if (error) throw error;
    return data[0].id;
};
export const deleteTimeEntry = async (id: number) => {
    const { error } = await supabase.from('time_entries').delete().eq('id', id);
    if (error) throw error;
};

// --- Funzioni di Mutazione Profili Utente ---
export const deleteProfile = async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
};
