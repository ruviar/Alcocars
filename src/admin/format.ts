import type { EmailKind, EmailStatus, ReservationStatus } from './types';

export function euro(value: number | string | null): string {
  if (value === null) return 'A consultar';
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return '—';
  return num.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

export function dateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid',
  }).format(date);
}

export function dateOnly(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/Madrid',
  }).format(date);
}

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  ACTIVE: 'En curso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

/** Transiciones que ofrece la interfaz; el servidor las revalida. */
export const STATUS_ACTIONS: Record<ReservationStatus, ReservationStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ACTIVE', 'PENDING', 'CANCELLED'],
  ACTIVE: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: ['PENDING'],
};

export const STATUS_ACTION_LABELS: Record<ReservationStatus, string> = {
  PENDING: 'Devolver a pendiente',
  CONFIRMED: 'Confirmar reserva',
  ACTIVE: 'Marcar en curso (entregado)',
  COMPLETED: 'Marcar completada (devuelto)',
  CANCELLED: 'Cancelar reserva',
};

export const EMAIL_STATUS_LABELS: Record<EmailStatus, string> = {
  SENT: 'Enviado',
  FAILED: 'Fallido',
  SKIPPED: 'Omitido',
};

export const EMAIL_KIND_LABELS: Record<EmailKind, string> = {
  BOOKING_ADMIN: 'Reserva · aviso interno',
  BOOKING_CUSTOMER: 'Reserva · resguardo cliente',
  CONTACT_ADMIN: 'Contacto · aviso interno',
};

export const CATEGORY_LABELS: Record<string, string> = {
  TURISMOS: 'Turismos',
  FURGONETAS: 'Furgonetas',
  SUV_4X4: '4×4 / Todoterreno',
  AUTOCARAVANAS: 'Autocaravanas',
};

export const API_ERROR_LABELS: Record<string, string> = {
  SESSION_EXPIRED: 'La sesión ha caducado. Vuelve a iniciar sesión.',
  INVALID_CREDENTIALS: 'Email o contraseña incorrectos.',
  RESERVATION_NOT_FOUND: 'La reserva no existe.',
  VEHICLE_NOT_FOUND: 'El vehículo no existe o está desactivado.',
  INVALID_STATUS_TRANSITION: 'Ese cambio de estado no está permitido desde el estado actual.',
  NO_VEHICLE_ASSIGNED: 'Asigna una unidad antes de confirmar la reserva.',
  VEHICLE_REQUIRED_FOR_STATUS:
    'Una reserva confirmada no puede quedarse sin unidad: devuélvela a pendiente o asigna directamente otra unidad.',
  VEHICLE_WRONG_OFFICE: 'Esa unidad pertenece a otra oficina.',
  VEHICLE_WRONG_CATEGORY: 'Esa unidad no es de la categoría de la gama solicitada.',
  VEHICLE_ALREADY_BOOKED: 'Esa unidad ya tiene una reserva que se solapa con estas fechas.',
};

export function errorLabel(err: unknown): string {
  const code = err instanceof Error ? err.message : '';
  return API_ERROR_LABELS[code] ?? 'Algo ha fallado. Inténtalo de nuevo.';
}
