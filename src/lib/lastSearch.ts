/**
 * Última búsqueda del motor de reservas, guardada en sessionStorage para que
 * los CTA «Reservar» de las tarjetas (portada, flota, tarifas) no descarten la
 * ciudad y las fechas que el usuario ya eligió en el hero.
 */

const KEY = 'alcocars.last-search.v1';

export interface LastSearch {
  /** ciudad tal y como la maneja la navegación («Zaragoza», «Tudela», «Ágreda») */
  location: string;
  /** ISO strings, serializables */
  from: string;
  to: string;
}

export function saveLastSearch(search: LastSearch): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(search));
  } catch {
    // sessionStorage lleno o bloqueado: se pierde la comodidad, no la función
  }
}

export function readLastSearch(): LastSearch | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<LastSearch>;
    if (!parsed.location || !parsed.from || !parsed.to) return null;

    // Fechas pasadas ya no sirven de prellenado
    const from = new Date(parsed.from);
    if (Number.isNaN(from.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (from < today) return null;

    return parsed as LastSearch;
  } catch {
    return null;
  }
}
