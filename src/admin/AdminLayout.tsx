'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { fetchSession, logout } from './api';
import { cacheUser, clearCachedUser, getCachedUser, type AdminUser } from './auth';
import styles from './admin.module.css';

const navItems = [
  {
    to: '/admin',
    label: 'Panel',
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
  {
    to: '/admin/reservas',
    label: 'Reservas',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    to: '/admin/vehiculos',
    label: 'Vehículos',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11m-14 0h14m-14 0a2 2 0 0 0-2 2v4h2m14-6a2 2 0 0 1 2 2v4h-2m-14 0v2h2v-2m10 0v2h2v-2m-14 0h12" />
      </svg>
    ),
  },
  {
    to: '/admin/clientes',
    label: 'Clientes',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M21.5 20a6.5 6.5 0 0 0-4.5-6.2" />
      </svg>
    ),
  },
  {
    to: '/admin/correo',
    label: 'Correo',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    ),
  },
];

/**
 * Cascarón del panel: sidebar + guard de sesión.
 *
 * La sesión vive en localStorage (solo cliente), así que el guard se evalúa
 * tras montar: el HTML del servidor no puede saber si hay token. Hasta
 * entonces se muestra un estado de carga neutro para evitar parpadeos.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const [authState, setAuthState] = useState<'checking' | 'ok'>('checking');
  const [user, setUser] = useState<AdminUser | null>(() => getCachedUser());

  // La cookie de sesión es httpOnly: el navegador no puede leerla, así que la
  // validez la confirma el servidor.
  useEffect(() => {
    let cancelled = false;

    void fetchSession().then((session) => {
      if (cancelled) return;

      if (!session) {
        clearCachedUser();
        router.replace('/admin/login');
        return;
      }

      cacheUser(session);
      setUser(session);
      setAuthState('ok');
    });

    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (authState !== 'ok') {
    return <p className={styles.loading}>Cargando panel…</p>;
  }

  const handleLogout = async () => {
    await logout();
    clearCachedUser();
    router.replace('/admin/login');
  };

  const isActive = (item: (typeof navItems)[number]) =>
    item.exact ? pathname === item.to : pathname.startsWith(item.to);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <span className={styles.sidebarBrandName}>ALCOCARS</span>
          <span className={styles.sidebarBrandSub}>Administración</span>
        </div>

        <nav className={styles.sidebarNav} aria-label="Secciones del panel">
          {navItems.map((item) => (
            <Link
              key={item.to}
              href={item.to}
              className={`${styles.sidebarLink} ${isActive(item) ? styles.sidebarLinkActive : ''}`}
              aria-current={isActive(item) ? 'page' : undefined}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          {user && <span className={styles.sidebarUser}>{user.name} · {user.email}</span>}
          <button type="button" className={styles.sidebarLogout} onClick={() => void handleLogout()}>
            Cerrar sesión
          </button>
          <Link href="/" className={styles.sidebarPublicLink}>
            Ver web pública →
          </Link>
        </div>
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
