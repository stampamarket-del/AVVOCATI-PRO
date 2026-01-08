
import { supabase } from './supabaseClient';
import { type Client, type Practice, type Reminder, type Document, type FirmProfile, type Lawyer, type Letter, type TimeEntry, type Quote } from '../types';

// --- Helper di Mappatura Rigorosa (JS -> DB) ---
// Questi helper estraggono solo le proprietà necessarie e le rinominano in snake_case.
// Impediscono a chiavi camelCase (come createdAt) di arrivare al server.

const mapClientToDB = (c: any) => {
    const out: any = {};
    if (c.name !== undefined) out.name = c.name;
    if (c.email !== undefined) out.email = c.email;
    if (c.phone !== undefined) out.phone = c.phone;
    if (c.taxcode !== undefined) out.taxcode = c.taxcode;
    if (c.notes !== undefined) out.notes = c.notes;
    if (c.priority !== undefined) out.priority = c.priority;
    if (c.createdAt !== undefined) out.created_at = c.createdAt;
    return out;
};

const mapPracticeToDB = (p: any) => {
    const out: any = {};
    if (p.clientId !== undefined) out.client_id = p.clientId;
    if (p.lawyerId !== undefined) out.lawyer_id = p.lawyerId;
    if (p.title !== undefined) out.title = p.title;
    if (p.type !== undefined) out.type = p.type;
    if (p.status !== undefined) out.status = p.status;
    if (p.value !== undefined) out.value = p.value;
    if (p.fee !== undefined) out.fee = p.fee;
    if (p.paidAmount !== undefined) out.paid_amount = p.paidAmount;
    if (p.priority !== undefined) out.priority = p.priority;
    if (p.notes !== undefined) out.notes = p.notes;
    if (p.openedAt !== undefined) out.opened_at = p.openedAt;
    return out;
};

const mapLawyerToDB = (l: any) => {
    const out: any = {};
    if (l.firstName !== undefined) out.first_name = l.firstName;
    if (l.lastName !== undefined) out.last_name = l.lastName;
    if (l.email !== undefined) out.email = l.email;
    if (l.phone !== undefined) out.phone = l.phone;
    if (l.specialization !== undefined) out.specialization = l.specialization;
    if (l.photoUrl !== undefined) out.photo_url = l.photoUrl;
    if (l.billingType !== undefined) out.billing_type = l.billingType;
    if (l.billingRate !== undefined) out.billing_rate = l.billingRate;
    return out;
};

// --- Helper di Mappatura (DB -> JS) ---

const mapFromDB = (resource: string, data: any): any => {
    if (!data) return null;
    if (Array.isArray(data)) return data.map(item => mapFromDB(resource, item));

    const out = { ...data };
    switch (resource) {
        case 'clients':
            out.createdAt = data.created_at;
            break;
        case 'practices':
            out.clientId = data.client_id;
            out.lawyerId = data.lawyer_id;
            out.openedAt = data.opened_at;
            out.paidAmount = data.paid_amount;
            break;
        case 'lawyers':
            out.firstName = data.first_name;
            out.lastName = data.last_name;
            out.photoUrl = data.photo_url;
            out.billingType = data.billing_type;
            out.billingRate = data.billing_rate;
            break;
        case 'documents':
            out.clientId = data.client_id;
            out.practiceId = data.practice_id;
            out.dataUrl = data.data_url;
            out.createdAt = data.created_at;
            break;
        case 'firm_profile':
            out.vatNumber = data.vat_number;
            out.logoUrl = data.logo_url;
            break;
        case 'reminders':
            out.practiceId = data.practice_id;
            out.dueDate = data.due_date;
            break;
        case 'letters':
            out.clientId = data.client_id;
            out.createdAt = data.created_at;
            break;
        case 'quotes':
            out.clientId = data.client_id;
            out.practiceTitle = data.practice_title;
            out.practiceType = data.practice_type;
            out.practiceNotes = data.practice_notes;
            out.createdAt = data.created_at;
            break;
        case 'time_entries':
            out.practiceId = data.practice_id;
            out.createdAt = data.created_at;
            break;
    }
    return out;
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

  // Filtri e ordinamenti
  if (resource === 'reminders') query = query.order('due_date', { ascending: true });
  if (['letters', 'quotes'].includes(resource)) query = query.order('created_at', { ascending: false });
  
  const clientId = queryParams.get('clientId');
  const practiceId = queryParams.get('practiceId');
  if (practiceId) query = query.eq('practice_id', parseInt(practiceId));
  else if (clientId) query = query.eq('client_id', parseInt(clientId));

  const { data, error } = await query;
  if (error) throw error;
  return mapFromDB(resource, data);
};

// --- Mutazioni ---

export const createClient = async (client: Omit<Client, 'id'>) => {
    const dbData = mapClientToDB(client);
    console.debug("Sending to Supabase (Client):", dbData);
    const { data, error } = await supabase.from('clients').insert([dbData]).select();
    if (error) throw error;
    return data?.[0]?.id;
};

export const updateClient = async (updatedClient: Partial<Client> & { id: number }) => {
    const dbData = mapClientToDB(updatedClient);
    const { error } = await supabase.from('clients').update(dbData).eq('id', updatedClient.id);
    if (error) throw error;
};

export const createPractice = async (practice: Omit<Practice, 'id'>) => {
    const dbData = mapPracticeToDB(practice);
    const { data, error } = await supabase.from('practices').insert([dbData]).select();
    if (error) throw error;
    return data?.[0]?.id;
};

export const updatePractice = async (updatedPractice: Partial<Practice> & { id: number }) => {
    const dbData = mapPracticeToDB(updatedPractice);
    const { error } = await supabase.from('practices').update(dbData).eq('id', updatedPractice.id);
    if (error) throw error;
};

export const createReminder = async (reminder: Omit<Reminder, 'id'>) => {
    const dbData = {
        practice_id: reminder.practiceId,
        title: reminder.title,
        due_date: reminder.dueDate,
        priority: reminder.priority
    };
    const { data, error } = await supabase.from('reminders').insert([dbData]).select();
    if (error) throw error;
    return data?.[0]?.id;
};

export const deleteReminder = async (id: number) => {
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error) throw error;
};

export const addDocument = async (doc: Omit<Document, 'id'>) => {
    const dbData = {
        client_id: doc.clientId,
        practice_id: doc.practiceId,
        name: doc.name,
        type: doc.type,
        data_url: doc.dataUrl,
        created_at: doc.createdAt
    };
    const { data, error } = await supabase.from('documents').insert([dbData]).select();
    if (error) throw error;
    return data?.[0]?.id;
};

export const deleteDocument = async (id: number) => {
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) throw error;
};

export const updateFirmProfile = async (profile: FirmProfile) => {
    const dbData = {
        name: profile.name,
        address: profile.address,
        vat_number: profile.vatNumber,
        email: profile.email,
        phone: profile.phone,
        logo_url: profile.logoUrl
    };
    const { error } = await supabase.from('firm_profile').upsert({ id: 1, ...dbData });
    if (error) throw error;
};

export const createLawyer = async (lawyer: Omit<Lawyer, 'id'>) => {
    const dbData = mapLawyerToDB(lawyer);
    const { data, error } = await supabase.from('lawyers').insert([dbData]).select();
    if (error) throw error;
    return data?.[0]?.id;
};

export const updateLawyer = async (updatedLawyer: Partial<Lawyer> & { id: number }) => {
    const dbData = mapLawyerToDB(updatedLawyer);
    const { error } = await supabase.from('lawyers').update(dbData).eq('id', updatedLawyer.id);
    if (error) throw error;
};

export const deleteLawyer = async (id: number) => {
    const { error } = await supabase.from('lawyers').delete().eq('id', id);
    if (error) throw error;
};

export const createLetter = async (letter: Omit<Letter, 'id'>) => {
    const dbData = {
        client_id: letter.clientId,
        subject: letter.subject,
        body: letter.body,
        created_at: letter.createdAt
    };
    const { data, error } = await supabase.from('letters').insert([dbData]).select();
    if (error) throw error;
    return data?.[0]?.id;
};

export const deleteLetter = async (id: number) => {
    const { error } = await supabase.from('letters').delete().eq('id', id);
    if (error) throw error;
};

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
    return data?.[0]?.id;
};

export const deleteQuote = async (id: number) => {
    const { error } = await supabase.from('quotes').delete().eq('id', id);
    if (error) throw error;
};

export const createTimeEntry = async (entry: Omit<TimeEntry, 'id'>) => {
    const dbData = {
        practice_id: entry.practiceId,
        date: entry.date,
        hours: entry.hours,
        description: entry.description
    };
    const { data, error } = await supabase.from('time_entries').insert([dbData]).select();
    if (error) throw error;
    return data?.[0]?.id;
};

export const deleteTimeEntry = async (id: number) => {
    const { error } = await supabase.from('time_entries').delete().eq('id', id);
    if (error) throw error;
};

export const deleteProfile = async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
};
