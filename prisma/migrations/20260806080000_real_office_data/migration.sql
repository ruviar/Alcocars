-- Datos reales de las oficinas para bases YA sembradas con el seed antiguo.
--
-- El seed inicial creaba la oficina de Soria con slug 'soria' y direcciones,
-- teléfonos y horarios inventados en las tres sedes. El código nuevo usa el
-- slug 'agreda' y los datos reales; el pipeline de despliegue ejecuta las
-- migraciones pero no el seed, así que sin esto un checkout con recogida en
-- Ágreda fallaría con OFFICE_NOT_FOUND en producción.
--
-- Solo UPDATE: en una base recién creada no hay filas y esto es un no-op
-- (el seed moderno ya inserta los datos correctos).

UPDATE "offices" SET
  "slug"        = 'agreda',
  "city"        = 'Ágreda',
  "address"     = 'Ctra. N-122, km 105, 42100 Ágreda (Soria)',
  "phone"       = '976 646 868',
  "email"       = 'agreda@alcocars.es',
  "hours"       = 'Lun–Vie 9:00–13:00 y 16:00–19:00 · Sáb 9:00–12:30',
  "lat"         = 41.8464,
  "lng"         = -1.9686,
  "description" = 'En el kilómetro 105 de la N-122, junto a las instalaciones de Alcotrans. El punto natural para moverse entre Soria, el Moncayo y la Ribera.',
  "updatedAt"   = CURRENT_TIMESTAMP
WHERE "slug" = 'soria'
  AND NOT EXISTS (SELECT 1 FROM "offices" WHERE "slug" = 'agreda');

UPDATE "offices" SET
  "address"     = 'Ctra. de Logroño, km 6,4 — local 1, Polígono El Portazgo (frente a Pikolin), 50011 Zaragoza',
  "phone"       = '976 106 100',
  "email"       = 'zaragoza@alcocars.es',
  "hours"       = 'Lun–Vie 9:00–13:00 y 16:00–19:00 · Sáb 9:00–12:30',
  "lat"         = 41.6835,
  "lng"         = -0.9339,
  "description" = 'Nuestra oficina principal, a pie de la N-232 y con salida directa a la A-68 y la Z-40. Es la base desde la que damos servicio al aeropuerto de Zaragoza.',
  "updatedAt"   = CURRENT_TIMESTAMP
WHERE "slug" = 'zaragoza' AND "email" LIKE '%@alocars.es';

UPDATE "offices" SET
  "address"     = 'Av. de Zaragoza, 46, 31500 Tudela (Navarra)',
  "phone"       = '976 106 100',
  "email"       = 'tudela@alcocars.es',
  "hours"       = 'Lun–Vie 9:00–13:00 y 16:00–19:00 · Sáb 9:00–12:30',
  "lat"         = 42.0602,
  "lng"         = -1.604,
  "description" = 'Nuestra puerta de entrada a la Ribera Navarra y La Rioja, en plena Avenida de Zaragoza y a cinco minutos de la AP-15.',
  "updatedAt"   = CURRENT_TIMESTAMP
WHERE "slug" = 'tudela' AND "email" LIKE '%@alocars.es';
