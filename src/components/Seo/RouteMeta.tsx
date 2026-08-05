import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PageMeta {
  title: string;
  description: string;
}

const HOME_META: PageMeta = {
  title: 'Alcocars · Alquiler y renting de vehículos en Zaragoza, Tudela y Soria',
  description:
    'Alquiler de coches, furgonetas, 4x4 y autocaravanas en Zaragoza, Tudela y Ágreda (Soria) desde 61 €/día. Seguro a todo riesgo y asistencia 24 h incluidos.',
};

const BLOG_POST_META: PageMeta = {
  title: 'Artículo del blog · Alcocars',
  description:
    'Artículo del blog de Alcocars: consejos prácticos, guías de alquiler y rutas para moverte por Zaragoza, la Ribera Navarra, Soria y La Rioja.',
};

const FALLBACK_META: PageMeta = {
  title: 'Página no encontrada · Alcocars',
  description:
    'La página que buscas no existe o ha cambiado de dirección. Vuelve al inicio para consultar la flota, las tarifas y las oficinas de Alcocars.',
};

const ROUTE_META: Record<string, PageMeta> = {
  '/': HOME_META,
  '/flota': {
    title: 'Flota de vehículos · Alcocars',
    description:
      'Flota multimarca de Alcocars: coches, furgonetas de carga y de pasajeros, todoterrenos, pick-ups y autocaravanas. Vehículos revisados y listos para entregar.',
  },
  '/tarifas': {
    title: 'Tarifas de alquiler · Alcocars',
    description:
      'Tarifas de alquiler con IVA incluido: coches desde 61 €/día con 200 km diarios, seguro a todo riesgo y asistencia 24 h. Consulta el precio por gama y por días.',
  },
  '/servicios': {
    title: 'Servicios · Alcocars',
    description:
      'Renting flexible, alquiler por horas, recogida en el aeropuerto de Zaragoza, vehículos adaptados para silla de ruedas y venta multimarca, para empresas y particulares.',
  },
  '/sedes': {
    title: 'Sedes y oficinas · Alcocars',
    description:
      'Oficinas de Alcocars en Zaragoza (Ctra. de Logroño, km 6,4), Tudela (Av. de Zaragoza, 46) y Ágreda (Ctra. N-122, km 105). Horarios, teléfonos y cómo llegar.',
  },
  '/empresa': {
    title: 'La empresa · Alcocars',
    description:
      'Alcocars, empresa del grupo Alcotrans, S.L.: alquiler y renting de vehículos multimarca con cobertura en Zaragoza, Ágreda (Soria), la Ribera Navarra y La Rioja.',
  },
  '/faqs': {
    title: 'Preguntas frecuentes · Alcocars',
    description:
      'Resolvemos tus dudas sobre el alquiler: requisitos del conductor, fianza, franquicia del seguro, kilometraje incluido, combustible y política de devolución.',
  },
  '/blog': {
    title: 'Blog · Alcocars',
    description:
      'Consejos de conducción, guías de alquiler y novedades de la flota de Alcocars. Ideas y rutas para moverte por Zaragoza, Navarra, Soria y La Rioja.',
  },
  '/contacto': {
    title: 'Contacto · Alcocars',
    description:
      'Contacta con Alcocars: teléfono 976 106 100, WhatsApp +34 608 808 240 o info@alcocars.es. De lunes a viernes de 9:00 a 13:00 y de 16:00 a 19:00; sábados de 9:00 a 12:30.',
  },
  '/reserva': {
    title: 'Solicitud de reserva · Alcocars',
    description:
      'Solicita tu reserva sin pago por adelantado: elige vehículo, fechas y oficina de recogida. Nuestro equipo te responde en un plazo de 24 a 48 horas laborables.',
  },
  '/legal/aviso-legal': {
    title: 'Aviso legal · Alcocars',
    description:
      'Aviso legal del sitio web de Alcocars: datos identificativos de la empresa, condiciones de uso, propiedad intelectual y limitación de responsabilidad.',
  },
  '/legal/politica-privacidad': {
    title: 'Política de privacidad · Alcocars',
    description:
      'Política de privacidad de Alcocars: cómo tratamos y protegemos tus datos personales, con qué finalidad los usamos y cómo puedes ejercer tus derechos.',
  },
  '/legal/condiciones-alquiler': {
    title: 'Condiciones de alquiler · Alcocars',
    description:
      'Condiciones generales de alquiler de Alcocars: requisitos del conductor, fianza, seguro con franquicia, kilometraje incluido, combustible y devolución.',
  },
  '/legal/politica-cookies': {
    title: 'Política de cookies · Alcocars',
    description:
      'Política de cookies de Alcocars: qué cookies utiliza este sitio web, con qué finalidad y cómo puedes configurarlas o desactivarlas en tu navegador.',
  },
};

const ADMIN_META: PageMeta = {
  title: 'Panel de administración · Alcocars',
  description: 'Área privada de gestión de Alcocars.',
};

function resolveMeta(pathname: string): PageMeta {
  const normalized =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  const exact = ROUTE_META[normalized];
  if (exact) {
    return exact;
  }
  if (normalized.startsWith('/blog/')) {
    return BLOG_POST_META;
  }
  if (normalized.startsWith('/admin')) {
    return ADMIN_META;
  }
  return FALLBACK_META;
}

export default function RouteMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = resolveMeta(pathname);

    document.title = meta.title;

    let descriptionTag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!descriptionTag) {
      descriptionTag = document.createElement('meta');
      descriptionTag.setAttribute('name', 'description');
      document.head.appendChild(descriptionTag);
    }
    descriptionTag.setAttribute('content', meta.description);

    // El panel de administración y el checkout no deben indexarse.
    const noindex = pathname.startsWith('/admin') || pathname.startsWith('/reserva');
    let robotsTag = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (noindex) {
      if (!robotsTag) {
        robotsTag = document.createElement('meta');
        robotsTag.setAttribute('name', 'robots');
        document.head.appendChild(robotsTag);
      }
      robotsTag.setAttribute('content', 'noindex, nofollow');
    } else if (robotsTag) {
      robotsTag.remove();
    }
  }, [pathname]);

  return null;
}
