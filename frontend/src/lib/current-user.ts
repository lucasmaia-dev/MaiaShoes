import 'server-only';
import { cookies } from 'next/headers';

export type CurrentUser = { id: number; name: string; username: string | null; email: string | null; role: 'ADMIN' | 'CLIENTE' };

export async function currentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get('maiashoes_session')?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  try {
    const response = await fetch('http://127.0.0.1:3001/api/auth/me', {
      headers: { Cookie: `maiashoes_session=${token}` }, cache: 'no-store', signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    return response.json();
  } catch { return null; }
}
