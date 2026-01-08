
import { supabase } from './supabaseClient';
import { type Client, type Practice, type Reminder, type Document, type FirmProfile, type Lawyer, type Letter, type TimeEntry, type Quote, type User } from '../types';

/**
 * Funzione fetcher per SWR ottimizzata per Supabase.
 */
export const fetcher = async (key: string) => {
  const [path, params] = key.split('?');
  const queryParams = new URLSearchParams(params);
  const apiPath = path.startsWith('/api/') ? path.substring(5) : null;

  if (apiPath === null || apiPath === '') {
      throw new Error(`Formato della chiave API non valido: ${key}`);
  }
  
  const parts = apiPath.split('/');
  const resource = parts[0];
  
  // Gestione ID per stringhe (UUID di Supabase) o numeri
  const id = parts[1] || null;

  let query = supabase.from(resource).select('*');

  if (id) {
    const { data, error } = await query.eq('id', id).single();
    if (error) throw error;
    return data;
  }

  // Filtri specifici basati sui query params
  switch (resource) {
    case 'documents':
      const clientId = queryParams.get('clientId');
      const practiceIdDoc = queryParams.get('practiceId');
      if (practiceIdDoc) query = query.eq('practiceId', parseInt(practiceIdDoc));
      else if (clientId) query = query.eq('clientId', parseInt(clientId));
      break;
    case 'time-entries':
      const practiceIdTime = queryParams.get('practiceId');
      if (practiceIdTime) query = query.eq('practiceId', parseInt(practiceIdTime));
      break;
    case 'reminders':
      query = query.order('dueDate', { ascending: true });
      break;
    case 'letters':
    case 'quotes':
      query = query.order('createdAt', { ascending: false });
      break;
    case 'firm-profile':
      const { data: profile, error: profileError } = await supabase.from('firm_profile').select('*').eq('id', 1).single();
      if (profileError) throw profileError;
      return profile;
    case 'profiles':
      query = query.order('name', { ascending: true });
      break;
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// --- Funzioni di Mutazione Clienti ---
export const createClient = async (client: Omit<Client, 'id'>) => {
    const { data, error } = await supabase.from('clients').insert([client]).select();
    if (error) throw error;
    return data[0].id;
};
export const updateClient = async (updatedClient: Partial<Client> & { id: number }) => {
  const { error } = await supabase.from('clients').update(updatedClient).eq('id', updatedClient.id);
  if (error) throw error;
};

// --- Funzioni di Mutazione Pratiche ---
export const createPractice = async (practice: Omit<Practice, 'id'>) => {
    const { data, error } = await supabase.from('practices').insert([practice]).select();
    if (error) throw error;
    return data[0].id;
};
export const updatePractice = async (updatedPractice: Partial<Practice> & { id: number }) => {
  const { error } = await supabase.from('practices').update(updatedPractice).eq('id', updatedPractice.id);
  if (error) throw error;
};

// --- Funzioni di Mutazione Promemoria ---
export const createReminder = async (reminder: Omit<Reminder, 'id'>) => {
    const { data, error } = await supabase.from('reminders').insert([reminder]).select();
    if (error) throw error;
    return data[0].id;
};
export const deleteReminder = async (id: number) => {
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error) throw error;
};

// --- Funzioni di Mutazione Documenti ---
export const addDocument = async (doc: Omit<Document, 'id'>) => {
    const { data, error } = await supabase.from('documents').insert([doc]).select();
    if (error) throw error;
    return data[0].id;
};
export const deleteDocument = async (id: number) => {
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) throw error;
};

// --- Funzioni di Mutazione Profilo Studio ---
export const updateFirmProfile = async (profile: FirmProfile) => {
  const { error } = await supabase.from('firm_profile').upsert(profile);
  if (error) throw error;
};

// --- Funzioni di Mutazione Avvocati ---
export const createLawyer = async (lawyer: Omit<Lawyer, 'id'>) => {
    const { data, error } = await supabase.from('lawyers').insert([lawyer]).select();
    if (error) throw error;
    return data[0].id;
};
export const updateLawyer = async (updatedLawyer: Partial<Lawyer> & { id: number }) => {
  const { error } = await supabase.from('lawyers').update(updatedLawyer).eq('id', updatedLawyer.id);
  if (error) throw error;
};
export const deleteLawyer = async (id: number) => {
    const { error } = await supabase.from('lawyers').delete().eq('id', id);
    if (error) throw error;
};

// --- Funzioni di Mutazione Lettere ---
export const createLetter = async (letter: Omit<Letter, 'id'>) => {
    const { data, error } = await supabase.from('letters').insert([letter]).select();
    if (error) throw error;
    return data[0].id;
};
export const deleteLetter = async (id: number) => {
    const { error } = await supabase.from('letters').delete().eq('id', id);
    if (error) throw error;
};

// --- Funzioni di Mutazione Preventivi ---
export const createQuote = async (quote: Omit<Quote, 'id'>) => {
    const { data, error } = await supabase.from('quotes').insert([quote]).select();
    if (error) throw error;
    return data[0].id;
};
export const deleteQuote = async (id: number) => {
    const { error } = await supabase.from('quotes').delete().eq('id', id);
    if (error) throw error;
};

// --- Funzioni di Mutazione Time Entries ---
export const createTimeEntry = async (entry: Omit<TimeEntry, 'id'>) => {
    const { data, error } = await supabase.from('time_entries').insert([entry]).select();
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
