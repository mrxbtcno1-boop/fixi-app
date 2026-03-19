import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const SUPABASE_URL = 'https://dzrtpbbztgixdawjfhbz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6cnRwYmJ6dGdpeGRhd2pmaGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzQ2MTIsImV4cCI6MjA4Nzk1MDYxMn0.7YLTpaTItoU68Wz_iBbGpKd7txfNDaIZr6l3dYPUNoc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export { SUPABASE_ANON_KEY };

let anonymousId: string | null = null;

async function getAnonymousId(): Promise<string> {
  if (anonymousId) return anonymousId;
  let stored = await AsyncStorage.getItem('fixi_anonymous_id');
  if (!stored) {
    stored = uuidv4();
    await AsyncStorage.setItem('fixi_anonymous_id', stored);
  }
  anonymousId = stored;
  return stored;
}

export async function trackEvent(
  eventName: string,
  properties?: Record<string, any>
) {
  try {
    const userId = await getAnonymousId();
    await supabase.from('analytics_events').insert({
      user_id: userId,
      event_name: eventName,
      properties: properties || {},
      created_at: new Date().toISOString(),
    });
  } catch {
    // Analytics darf niemals die App crashen
  }
}
