'use client';
import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';
import styles from './auth.module.css';

export default function AuthForm({ register = false }: { register?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sending = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const data = new FormData(event.currentTarget);
    if (register && data.get('password') !== data.get('confirmation')) { setError('As senhas precisam ser iguais.'); return; }
    sending.current = true; setBusy(true); setError('');
    try {
      const response = await fetch(`/api/auth/${register ? 'register' : 'login'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-MaiaShoes-Request': '1' },
        body: JSON.stringify({ username: data.get('username'), password: data.get('password'), ...(register ? { name: data.get('name') } : {}) }),
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
        <label htmlFor="auth-username">Usuário</label>
        <input id="auth-username" name="username" required minLength={3} maxLength={32} pattern="[a-zA-Z0-9_.-]{3,32}" autoComplete="username" autoCapitalize="none" spellCheck={false} />
        {register && <small>Use de 3 a 32 letras, números, pontos, traços ou sublinhados.</small>}
        <label htmlFor="auth-password">Senha</label>
        <input id="auth-password" name="password" type="password" required minLength={register ? 12 : 1} maxLength={128} autoComplete={register ? 'new-password' : 'current-password'} />
        {register && <><small>Use pelo menos 12 caracteres. Uma frase longa é uma boa opção.</small><label htmlFor="auth-confirmation">Repita a senha</label><input id="auth-confirmation" name="confirmation" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></>}
      </fieldset>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button type="submit" disabled={busy}>{busy ? 'Aguarde…' : register ? 'Criar minha conta' : 'Entrar'}</button>
    </form>
    <p className={styles.switch}>{register ? 'Já tem uma conta? ' : 'Ainda não tem conta? '}<Link href={register ? '/login' : '/cadastro'}>{register ? 'Entrar' : 'Criar conta de cliente'}</Link></p>
  </>;
}
