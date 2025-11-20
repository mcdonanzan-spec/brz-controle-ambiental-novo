
import { supabase } from './supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { UserProfile, UserRole } from '../types';

// Recuperando as chaves para criar um cliente temporário para criação de usuários
const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || ''; 
const SUPABASE_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

export const signIn = async (email: string, pass: string) => {
    if (!supabase) throw new Error("Supabase não configurado");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    return data;
};

export const signUp = async (email: string, pass: string, fullName: string) => {
    if (!supabase) throw new Error("Supabase não configurado");
    const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
            data: { full_name: fullName }
        }
    });
    if (error) throw error;
    return data;
};

/**
 * Função especial para o ADMIN criar usuários sem perder a própria sessão.
 * Cria um cliente Supabase temporário em memória que não persiste o token no LocalStorage.
 */
export const createUserByAdmin = async (
    email: string, 
    pass: string, 
    fullName: string, 
    role: UserRole, 
    projectIds: string[]
) => {
    if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Credenciais Supabase ausentes.");

    // 1. Cliente temporário para não deslogar o admin
    const tempClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            persistSession: false, // TRUQUE: Não salva a sessão, então não sobrescreve o admin
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });

    // 2. Criar o usuário na autenticação
    const { data, error } = await tempClient.auth.signUp({
        email,
        password: pass,
        options: {
            data: { full_name: fullName }
        }
    });

    if (error) throw error;
    if (!data.user) throw new Error("Erro ao criar usuário (sem dados retornados).");

    // 3. Atualizar o perfil com o Cargo e Obras (Usando o cliente principal do Admin)
    // O trigger do banco cria o perfil automaticamente, então fazemos um update.
    // Damos um pequeno delay para garantir que o trigger rodou.
    await new Promise(r => setTimeout(r, 1000));

    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            role: role,
            assigned_project_ids: projectIds
        })
        .eq('id', data.user.id);

    if (updateError) {
        console.error("Usuário criado, mas erro ao definir perfil:", updateError);
        // Não lançamos erro fatal aqui, pois o usuário já foi criado.
    }

    return data.user;
};

export const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
};

export const getCurrentProfile = async (): Promise<UserProfile | null> => {
    if (!supabase) return null;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error || !data) {
        return {
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata.full_name || 'Usuário',
            role: 'assistant',
            assigned_project_ids: []
        };
    }

    return data as UserProfile;
};

export const fetchAllProfiles = async (): Promise<UserProfile[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return data as UserProfile[];
}

export const updateUserProfile = async (id: string, updates: Partial<UserProfile>) => {
    if (!supabase) return;
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (error) throw error;
}
