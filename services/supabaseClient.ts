import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO ---
// A Vercel injetará estes valores automaticamente se configurados nas Environment Variables.
// Se você estiver rodando localmente ou se a Vercel falhar em injetar, 
// você pode colar suas chaves DIRETAMENTE aqui entre as aspas (apenas para teste, não recomendado para produção pública).

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || ''; 
const SUPABASE_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

// --------------------

let client: SupabaseClient | null = null;

const isValidUrl = (url: string) => {
    try {
        return url && url.startsWith('https://');
    } catch {
        return false;
    }
}

if (isValidUrl(SUPABASE_URL) && SUPABASE_KEY) {
    try {
        client = createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('Supabase conectado com sucesso!');
    } catch (error) {
        console.warn('Erro ao conectar Supabase:', error);
    }
} else {
    console.log('Supabase não configurado ou chaves inválidas. Usando modo Offline (LocalStorage).');
    console.log('Para conectar: Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente da Vercel.');
}

export const supabase = client;