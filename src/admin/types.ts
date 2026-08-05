/** Tipos de las respuestas de la API de administración. */

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type EmailStatus = 'SENT' | 'FAILED' | 'SKIPPED';
export type EmailKind = 'BOOKING_ADMIN' | 'BOOKING_CUSTOMER' | 'CONTACT_ADMIN';
export type VehicleCategory = 'TURISMOS' | 'FURGONETAS' | 'SUV_4X4' | 'AUTOCARAVANAS';

export interface AdminStats {
  totals: Record<ReservationStatus, number>;
  needsCheck: number;
  upcomingPickups7d: number;
  requestsLast30d: number;
  emailFailures7d: number;
  confirmedRevenue30d: number;
  nextPickups: Array<{
    id: string;
    confirmationCode: string;
    pickupAt: string;
    tariffName: string;
    status: ReservationStatus;
    needsAvailabilityCheck: boolean;
    client: { firstName: string; lastName: string };
    office: { city: string };
  }>;
}

export interface ReservationRow {
  id: string;
  confirmationCode: string;
  status: ReservationStatus;
  needsAvailabilityCheck: boolean;
  pickupAt: string;
  returnAt: string;
  totalDays: number;
  tariffName: string;
  totalAmount: string | null;
  createdAt: string;
  client: { id: string; firstName: string; lastName: string; email: string; phone: string };
  vehicle: { id: string; brand: string; name: string; category: VehicleCategory } | null;
  office: { slug: string; city: string };
  returnOffice: { slug: string; city: string };
}

export interface ReservationListResponse {
  total: number;
  page: number;
  pageSize: number;
  rows: ReservationRow[];
}

export interface ReservationDetail extends ReservationRow {
  plannedKm: number;
  includedKm: number;
  extraKm: number;
  extraKmRate: string;
  extraKmSurcharge: string;
  baseTotal: string | null;
  extrasTotal: string;
  deposit: string;
  franchise: string;
  notes: string | null;
  consentAt: string | null;
  office: { slug: string; city: string; address: string; phone: string };
  returnOffice: { slug: string; city: string; address: string; phone: string };
  extras: Array<{
    id: string;
    type: string;
    label: string;
    unit: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }>;
  emails: Array<{
    id: string;
    kind: EmailKind;
    status: EmailStatus;
    to: string;
    subject: string;
    error: string | null;
    createdAt: string;
  }>;
}

export interface AssignableVehicle {
  id: string;
  brand: string;
  name: string;
  category: VehicleCategory;
  seats: number;
  transmission: string;
  fuel: string;
}

export interface AdminVehicle {
  id: string;
  slug: string;
  brand: string;
  name: string;
  category: VehicleCategory;
  seats: number;
  fuel: string;
  transmission: string;
  isActive: boolean;
  office: { slug: string; city: string };
  openReservations: number;
}

export interface AdminClientRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
  reservationCount: number;
  lastReservation: {
    confirmationCode: string;
    status: ReservationStatus;
    createdAt: string;
    totalAmount: string | null;
  } | null;
}

export interface AdminClientsResponse {
  total: number;
  page: number;
  pageSize: number;
  rows: AdminClientRow[];
}

export interface EmailLogRow {
  id: string;
  kind: EmailKind;
  status: EmailStatus;
  to: string;
  subject: string;
  providerId: string | null;
  error: string | null;
  createdAt: string;
  reservation: { id: string; confirmationCode: string } | null;
}

export interface EmailLogsResponse {
  total: number;
  page: number;
  pageSize: number;
  rows: EmailLogRow[];
}
