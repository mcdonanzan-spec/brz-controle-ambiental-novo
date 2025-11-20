
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Em um ambiente Vercel real, use variáveis de ambiente.
// Para desenvolvimento local sem travar, validamos se a string é uma URL real.
const SUPABASE_URL = 'SUA_URL_DO_SUPABASE_AQUI';
const SUPABASE_KEY = 'SUA_ANON_KEY_DO_SUPABASE_AQUI';

let client: SupabaseClient | null = null;

// Verificação simples para evitar erro de "Invalid URL" se as credenciais não estiverem configuradas
const isConfigured = SUPABASE_URL && SUPABASE_URL.startsWith('https://');

if (isConfigured) {
    try {
        client = createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (error) {
        console.warn('Falha ao inicializar cliente Supabase. A aplicação funcionará em modo offline/demo.', error);
    }
} else {
    console.log('Supabase não configurado. A aplicação funcionará em modo offline/demo usando LocalStorage.');
}

export const supabase = client;
