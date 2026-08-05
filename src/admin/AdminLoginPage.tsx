import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { login } from './api';
import { isLoggedIn } from './auth';
import { errorLabel } from './format';
import styles from './admin.module.css';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  if (isLoggedIn()) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSending) return;

    setIsSending(true);
    setError(null);

    try {
      await login(email.trim(), password);
      navigate('/admin', { replace: true });
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
          <Link to="/">← Volver a la web pública</Link>
        </p>
      </form>
    </main>
  );
}
