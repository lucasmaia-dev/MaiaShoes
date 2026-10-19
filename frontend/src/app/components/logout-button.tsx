'use client';
import { useState } from 'react';

export default function LogoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function logout() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', headers: { 'X-MaiaShoes-Request': '1' }, signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error();
      window.location.assign('/login');
    } catch { setError('Não foi possível sair. Tente novamente.'); setBusy(false); }
  }
  return <span><button type="button" className="session-logout" disabled={busy} onClick={() => void logout()}>{busy ? 'Saindo…' : 'Sair'}</button>{error && <span role="alert">{error}</span>}</span>;
}
