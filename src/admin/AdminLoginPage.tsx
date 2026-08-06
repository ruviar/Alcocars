'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchSession, login } from './api';
import { cacheUser } from './auth';
import { errorLabel } from './format';
import styles from './admin.module.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Con sesión activa no tiene sentido ver el login: al panel.
  useEffect(() => {
    let cancelled = false;

    void fetchSession().then((session) => {
      if (!cancelled && session) {
        cacheUser(session);
        router.replace('/admin');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const user = await login(email.trim(), password);
      cacheUser(user);
      router.replace('/admin');
    } catch (err) {
      setError(errorLabel(err));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className={styles.loginPage}>
      <form className={styles.loginCard} onSubmit={handleSubmit}>
        <div className={styles.loginBrand}>
          <img src="/images/logo.png" alt="Alcocars" />
          <span className={styles.loginKicker}>Panel de administración</span>
        </div>

        <h1 className={styles.loginTitle}>Inicia sesión</h1>

        <label className={styles.loginField}>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError(null);
            }}
            autoComplete="username"
            placeholder="admin@alcocars.es"
            required
          />
        </label>

        <label className={styles.loginField}>
          <span>Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError(null);
            }}
            autoComplete="current-password"
            required
          />
        </label>

        {error && (
          <p className={styles.loginError} role="alert">
            {error}
          </p>
        )}

        <button type="submit" className={styles.loginButton} disabled={isSending}>
          {isSending ? 'Entrando…' : 'Entrar'}
        </button>

        <p className={styles.loginBack}>
          <Link href="/">← Volver a la web pública</Link>
        </p>
      </form>
    </main>
  );
}
