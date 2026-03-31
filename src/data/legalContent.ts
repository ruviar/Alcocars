export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export type LegalDocument = {
  slug: string;
  title: string;
  intro: string;
  updatedAt: string;
  sections: LegalSection[];
};

export const legalDocuments: Record<string, LegalDocument> = {
  'aviso-legal': {
    slug: 'aviso-legal',
    title: 'Aviso Legal',
    intro:
      'Esta informacion regula el uso del sitio web de Alcocars y establece las condiciones de acceso para usuarios y clientes.',
    updatedAt: '31 de marzo de 2026',
    sections: [
      {
        heading: 'Titular del sitio',
        paragraphs: [
          'Alcocars S.L. es la entidad titular del presente sitio web y de su contenido comercial, corporativo e informativo.',
          'Para cualquier consulta legal puedes contactar mediante el formulario de contacto o el telefono corporativo visible en la web.',
        ],
      },
      {
        heading: 'Condiciones de uso',
        paragraphs: [
          'El acceso a este sitio implica la aceptacion de las condiciones aqui descritas. El usuario se compromete a usar el portal de forma licita y respetuosa.',
          'No esta permitido usar la web para actividades fraudulentas, para dañar sistemas de terceros o para distribuir contenido ilegal.',
        ],
      },
      {
        heading: 'Propiedad intelectual',
        paragraphs: [
          'Todos los elementos de la web, incluyendo logotipos, marcas, disenos, textos y recursos graficos, estan protegidos por derechos de propiedad intelectual.',
          'Queda prohibida su reproduccion total o parcial sin autorizacion expresa del titular, salvo en los supuestos permitidos por la normativa vigente.',
        ],
      },
    ],
  },
  'politica-privacidad': {
    slug: 'politica-privacidad',
    title: 'Politica de Privacidad',
    intro:
      'En Alcocars tratamos los datos personales con transparencia y aplicando medidas tecnicas y organizativas para proteger su confidencialidad.',
    updatedAt: '31 de marzo de 2026',
    sections: [
      {
        heading: 'Datos que recopilamos',
        paragraphs: [
          'Podemos recopilar datos identificativos y de contacto como nombre, apellidos, telefono y correo electronico cuando el usuario envia solicitudes.',
          'Tambien podemos registrar datos tecnicos basicos de navegacion para mejorar el rendimiento, la seguridad y la experiencia de uso.',
        ],
      },
      {
        heading: 'Finalidad del tratamiento',
        paragraphs: [
          'Usamos los datos para gestionar reservas, responder consultas, enviar informacion comercial relacionada con nuestros servicios y cumplir obligaciones legales.',
          'No se realizaran decisiones automatizadas con efectos juridicos sobre las personas usuarias sin base legal valida.',
        ],
      },
      {
        heading: 'Derechos del usuario',
        paragraphs: [
          'Puedes ejercer los derechos de acceso, rectificacion, supresion, oposicion, limitacion y portabilidad mediante solicitud por los canales de contacto oficiales.',
          'Si consideras que tus derechos no han sido atendidos, puedes presentar reclamacion ante la autoridad de control competente.',
        ],
      },
    ],
  },
  'condiciones-alquiler': {
    slug: 'condiciones-alquiler',
    title: 'Condiciones de Alquiler',
    intro:
      'Estas condiciones regulan la contratacion de vehiculos, los requisitos del conductor y el uso adecuado de la flota de Alcocars.',
    updatedAt: '31 de marzo de 2026',
    sections: [
      {
        heading: 'Requisitos de contratacion',
        paragraphs: [
          'El conductor principal debe cumplir la edad minima indicada para cada categoria de vehiculo y disponer de permiso de conducir valido.',
          'Al recoger el vehiculo sera necesario presentar documentacion personal y metodo de pago admitido para formalizar la reserva.',
        ],
      },
      {
        heading: 'Uso y devolucion del vehiculo',
        paragraphs: [
          'El vehiculo debe utilizarse conforme a la normativa de trafico y a las condiciones del contrato, evitando usos no autorizados o de riesgo.',
          'La devolucion debe realizarse en fecha, hora y lugar acordados. Retrasos o incidencias pueden generar cargos adicionales.',
        ],
      },
      {
        heading: 'Coberturas y responsabilidades',
        paragraphs: [
          'Las coberturas incluidas dependeran del plan contratado y podran ampliarse con extras durante el proceso de reserva.',
          'El arrendatario respondera de multas, sanciones o danos derivados de un uso negligente del vehiculo durante el periodo de alquiler.',
        ],
      },
    ],
  },
  'politica-cookies': {
    slug: 'politica-cookies',
    title: 'Politica de Cookies',
    intro:
      'Este sitio utiliza cookies tecnicas y analiticas para garantizar el funcionamiento correcto y para mejorar la experiencia de navegacion.',
    updatedAt: '31 de marzo de 2026',
    sections: [
      {
        heading: 'Que son las cookies',
        paragraphs: [
          'Las cookies son pequenos archivos que se almacenan en tu dispositivo al visitar una web y permiten recordar preferencias o analizar uso.',
        ],
      },
      {
        heading: 'Tipos de cookies utilizadas',
        paragraphs: [
          'Empleamos cookies tecnicas necesarias para la navegacion y, de forma opcional, cookies de analitica para entender patrones de uso agregados.',
          'No utilizamos cookies para recopilar categorias especiales de datos ni para perfilar individualmente sin consentimiento.',
        ],
      },
      {
        heading: 'Como gestionar cookies',
        paragraphs: [
          'Puedes aceptar o rechazar cookies mediante el banner mostrado en la web y tambien configurar tu navegador para bloquear o eliminar cookies.',
          'La desactivacion de determinadas cookies puede afectar al correcto funcionamiento de algunas funcionalidades.',
        ],
      },
    ],
  },
};
