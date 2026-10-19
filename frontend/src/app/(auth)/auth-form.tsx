'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import styles from './auth.module.css';

export default function AuthForm({ register = false }: { register?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [googleUrl, setGoogleUrl] = useState<string | null>(null);
  const sending = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/auth/google/status', { signal: controller.signal, cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => setGoogleUrl(result?.enabled === true ? result.startUrl : null)).catch(() => {});
    const status = new URLSearchParams(window.location.search).get('google');
    if (status) setError(status === 'existing' ? 'Este e-mail já tem uma conta. Entre com sua senha.' : status === 'unavailable' ? 'O login com Google ainda não está disponível.' : 'Não foi possível concluir o login com Google. Tente novamente.');
    return () => controller.abort();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const data = new FormData(event.currentTarget);
    if (register && data.get('password') !== data.get('confirmation')) { setError('As senhas precisam ser iguais.'); return; }
    sending.current = true; setBusy(true); setError('');
    try {
      const response = await fetch(`/api/auth/${register ? 'register' : 'login'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-MaiaShoes-Request': '1' },
        body: JSON.stringify({ password: data.get('password'), ...(register ? { name: data.get('name'), email: data.get('email') } : { username: data.get('username') }) }),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 429) throw new Error('Muitas tentativas. Aguarde um minuto e tente novamente.');
        const message = result?.message;
        throw new Error(response.status < 500 && message ? (Array.isArray(message) ? message.join(' ') : message) : 'Não foi possível entrar. Tente novamente em instantes.');
      }
      window.location.assign(result.role === 'ADMIN' ? '/admin' : '/conta');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Não foi possível conectar. Tente novamente.');
      sending.current = false; setBusy(false);
    }
  }
  return <>
    <form className={styles.form} onSubmit={submit}>
      <fieldset disabled={busy}>
        {register && <><label htmlFor="auth-name">Seu nome</label><input id="auth-name" name="name" required maxLength={100} autoComplete="name" /></>}
        <label htmlFor="auth-identity">{register ? 'E-mail' : 'E-mail ou usuário'}</label>
        <input id="auth-identity" name={register ? 'email' : 'username'} type={register ? 'email' : 'text'} required maxLength={254} autoComplete={register ? 'email' : 'username'} autoCapitalize="none" spellCheck={false} />
        <label htmlFor="auth-password">Senha</label>
        <input id="auth-password" name="password" type="password" required minLength={register ? 12 : 1} maxLength={128} pattern={register ? '(?=.*[A-Z])(?=.*[0-9])(?=.*[^\\p{L}\\p{N}\\s]).{12,128}' : undefined} title={register ? '12 a 128 caracteres, uma letra maiúscula, um número e um símbolo.' : undefined} autoComplete={register ? 'new-password' : 'current-password'} aria-describedby={register ? 'password-rules' : undefined} />
        {register && <><small id="password-rules">Use de 12 a 128 caracteres, com pelo menos uma letra maiúscula, um número e um símbolo (ex.: !, @, #).</small><label htmlFor="auth-confirmation">Repita a senha</label><input id="auth-confirmation" name="confirmation" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></>}
      </fieldset>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button type="submit" disabled={busy}>{busy ? 'Aguarde…' : register ? 'Criar minha conta' : 'Entrar'}</button>
    </form>
    <div className={styles.google}>
      {googleUrl ? <a href={googleUrl}>Entrar com Google</a> : <><button type="button" disabled>Entrar com Google</button><small>Entrar com Google ainda não está disponível.</small></>}
    </div>
    <p className={styles.switch}>{register ? 'Já tem uma conta? ' : 'Ainda não tem conta? '}<Link href={register ? '/login' : '/cadastro'}>{register ? 'Entrar' : 'Criar conta de cliente'}</Link></p>
  </>;
}
