
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cafibluznburmtokkanp.supabase.co';
const supabaseAnonKey = 'sb_publishable_lluCHhwwe1GETEOxnNY-3w_1jykcc5R';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
