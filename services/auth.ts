
import { supabase } from './supabaseClient';
import { UserProfile } from '../types';

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
        // Fallback se o perfil não tiver sido criado pelo trigger ainda
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
