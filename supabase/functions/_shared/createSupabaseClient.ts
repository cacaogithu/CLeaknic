import { createClient } from 'npm:@supabase/supabase-js@2.81.1';

export function createSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    {
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-connection-pool': 'enabled',
        },
      },
    }
  );
}

export async function queryWithRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error: any) {
      if (
        (error.message?.includes('connection') ||
         error.message?.includes('pool')) &&
        attempt < maxRetries
      ) {
        console.warn(`[DB] Connection error, retry ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt * attempt));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Should not reach here');
}
