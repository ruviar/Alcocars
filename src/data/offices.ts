export interface Office {
  id: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  coords: [number, number]; // [lat, lng]
  description: string;
}

export const offices: Office[] = [
  {
    id: 'zaragoza',
    city: 'Zaragoza',
    address: 'Av. de Goya, 12, 50006 Zaragoza',
    phone: '+34 976 123 456',
    email: 'zaragoza@alcocars.es',
    hours: 'Lun–Vie 08:00–20:00 · Sáb 09:00–14:00',
    coords: [41.6488, -0.8891],
    description: 'Nuestra sede central. Acceso rápido al aeropuerto de Zaragoza y conexión directa con la autovía A-2.',
  },
  {
    id: 'tudela',
    city: 'Tudela',
    address: 'Calle Gayarre, 4, 31500 Tudela (Navarra)',
    phone: '+34 948 234 567',
    email: 'tudela@alcocars.es',
    hours: 'Lun–Vie 08:30–19:00 · Sáb 09:00–13:00',
    coords: [42.0606, -1.6054],
    description: 'Puerta de entrada a la Ribera Navarra. Perfecta para explorar la región a tu ritmo.',
  },
  {
    id: 'soria',
    city: 'Soria',
    address: 'Alcotrans | Transporte de áridos, N-122, 105, 42100 Ágreda, Soria',
    phone: '+34 975 345 678',
    email: 'soria@alcocars.es',
    hours: 'Lun–Vie 09:00–18:30',
    coords: [41.7672, -2.4799],
    description: 'En el corazón de Castilla. La base ideal para recorrer la Sierra de Urbión y las tierras de Machado.',
  },
];
