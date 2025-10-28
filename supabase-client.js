// ===== Supabase Configuration =====
// Import from CDN for now (no build step needed)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Local development configuration
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// ===== Authentication Functions =====

export async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) throw error;
    return data;
}

export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChanged(callback);
}

// ===== Database Functions =====

// Workouts
export async function saveWorkout(workout) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('workouts')
        .insert([{
            user_id: user.id,
            type: workout.type,
            date: workout.date,
            duration: workout.duration,
            intensity: workout.intensity,
            notes: workout.notes
        }])
        .select();

    if (error) throw error;
    return data[0];
}

export async function getWorkouts() {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

    if (error) throw error;
    return data;
}

export async function deleteWorkout(id) {
    const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// User Profile
export async function getProfile() {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) throw error;
    return data;
}

export async function updateProfile(updates) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select();

    if (error) throw error;
    return data[0];
}

// Real-time subscriptions
export function subscribeToWorkouts(callback) {
    return supabase
        .channel('workouts')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'workouts' },
            callback
        )
        .subscribe();
}
