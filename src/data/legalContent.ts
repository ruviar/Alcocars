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
      'En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa a los usuarios de los datos identificativos del titular de este sitio web y de las condiciones que regulan su uso.',
    updatedAt: '5 de agosto de 2026',
    sections: [
      {
        heading: 'Titular del sitio web',
        paragraphs: [
          'El titular de este sitio web es Alcotrans, S.L., sociedad a la que pertenece la marca comercial Alcocars, dedicada al alquiler y renting de vehículos multimarca.',
          'CIF: [dato pendiente de confirmación por el titular]. Domicilio social: [dato pendiente de confirmación por el titular]. Datos de inscripción en el Registro Mercantil: [dato pendiente de confirmación por el titular].',
          'Puede contactar con el titular a través del correo electrónico info@alcocars.es o del teléfono 976 106 100.',
        ],
      },
      {
        heading: 'Objeto del sitio web',
        paragraphs: [
          'Este sitio web tiene por objeto ofrecer información sobre los servicios de alquiler y renting de vehículos de Alcocars, sus tarifas, su flota y sus oficinas, así como permitir al usuario enviar solicitudes de reserva y consultas a través de los formularios habilitados.',
          'Las solicitudes de reserva enviadas a través de la web no constituyen una confirmación de contrato: el equipo de Alcocars responde en un plazo de 24 a 48 horas laborables para confirmar la disponibilidad y las condiciones. No se realiza ningún pago por adelantado a través de este sitio.',
        ],
      },
      {
        heading: 'Condiciones de uso',
        paragraphs: [
          'El acceso y la navegación por este sitio web atribuyen la condición de usuario e implican la aceptación de las condiciones recogidas en este Aviso Legal. El usuario se compromete a hacer un uso diligente, lícito y conforme a la buena fe del sitio y de sus contenidos.',
          'Queda prohibido utilizar el sitio web con fines fraudulentos o ilícitos, introducir o difundir virus u otros sistemas que puedan causar daños, intentar acceder a áreas restringidas, suplantar la identidad de terceros o realizar cualquier actuación que pueda dañar la imagen, los intereses o los derechos de Alcotrans, S.L. o de terceros.',
        ],
      },
      {
        heading: 'Propiedad intelectual e industrial',
        paragraphs: [
          'Todos los contenidos de este sitio web —textos, imágenes, logotipos, marcas, diseño gráfico, estructura y código fuente— son titularidad de Alcotrans, S.L. o de terceros que han autorizado su uso, y están protegidos por la normativa de propiedad intelectual e industrial.',
          'Queda prohibida la reproducción, distribución, comunicación pública o transformación, total o parcial, de dichos contenidos sin la autorización previa y por escrito del titular, salvo en los supuestos expresamente permitidos por la ley. El acceso al sitio web no supone la cesión de ningún derecho sobre sus contenidos.',
        ],
      },
      {
        heading: 'Exclusión de responsabilidad',
        paragraphs: [
          'Alcotrans, S.L. trabaja para que la información publicada en este sitio web sea veraz y esté actualizada, pero no puede garantizar la ausencia total de errores ni la actualización permanente de todos los contenidos. Las tarifas, disponibilidad y condiciones definitivas de cada alquiler son las que se confirmen al usuario al responder a su solicitud.',
          'El titular no se hace responsable de los daños derivados de un uso incorrecto del sitio web por parte del usuario, ni de las interrupciones, fallos técnicos o indisponibilidades del servicio ajenos a su control. Tampoco responde de los contenidos de sitios web de terceros a los que, en su caso, pudiera enlazarse desde esta página.',
        ],
      },
      {
        heading: 'Legislación aplicable y jurisdicción',
        paragraphs: [
          'Las presentes condiciones se rigen por la legislación española. Para la resolución de cualquier controversia derivada del acceso o uso de este sitio web, las partes se someten a los juzgados y tribunales que resulten competentes conforme a la normativa aplicable; cuando el usuario tenga la condición de consumidor, serán competentes los juzgados y tribunales de su domicilio.',
        ],
      },
    ],
  },
  'politica-privacidad': {
    slug: 'politica-privacidad',
    title: 'Política de Privacidad',
    intro:
      'Esta política describe cómo Alcotrans, S.L. trata los datos personales de los usuarios de este sitio web, conforme al Reglamento (UE) 2016/679 (RGPD) y a la Ley Orgánica 3/2018, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD).',
    updatedAt: '5 de agosto de 2026',
    sections: [
      {
        heading: 'Responsable del tratamiento',
        paragraphs: [
          'El responsable del tratamiento de los datos personales recogidos a través de este sitio web es Alcotrans, S.L., titular de la marca Alcocars. Puede contactar con el responsable para cualquier cuestión relativa a la protección de datos en la dirección de correo electrónico info@alcocars.es.',
        ],
      },
      {
        heading: 'Datos que recogemos',
        paragraphs: [
          'A través de los formularios de solicitud de reserva y de contacto recogemos únicamente datos identificativos y de contacto: nombre y apellidos, teléfono, correo electrónico y la información que el usuario incluya voluntariamente en su mensaje (fechas del alquiler, vehículo de interés, oficina de recogida u otras observaciones).',
          'No se recogen datos a través de la mera navegación por el sitio ni se elaboran perfiles de los usuarios.',
        ],
      },
      {
        heading: 'Finalidades del tratamiento',
        paragraphs: [
          'Los datos se tratan con dos finalidades: gestionar las solicitudes de reserva de alquiler o renting de vehículos —comprobar la disponibilidad, preparar el presupuesto y responder al usuario— y atender las consultas enviadas a través del formulario de contacto o de los canales indicados en la web.',
          'No utilizamos los datos para enviar comunicaciones comerciales no solicitadas ni para finalidades distintas de las indicadas.',
        ],
      },
      {
        heading: 'Base jurídica',
        paragraphs: [
          'El tratamiento de los datos facilitados en el formulario de reserva se basa en la aplicación de medidas precontractuales adoptadas a petición del interesado (artículo 6.1.b del RGPD), ya que resulta necesario para tramitar la solicitud de alquiler que el propio usuario inicia.',
          'El tratamiento de los datos facilitados en el formulario de contacto y en el resto de canales de consulta se basa en el consentimiento del interesado (artículo 6.1.a del RGPD), que el usuario otorga al enviar voluntariamente su mensaje y que puede retirar en cualquier momento sin efectos retroactivos.',
        ],
      },
      {
        heading: 'Destinatarios de los datos',
        paragraphs: [
          'Para poder prestar el servicio, los datos pueden ser tratados por dos categorías de proveedores que actúan como encargados del tratamiento: el proveedor de envío de correo electrónico transaccional, que remite las confirmaciones y respuestas a las solicitudes, y el proveedor de alojamiento del sitio web.',
          'No se ceden datos personales a terceros con fines comerciales ni publicitarios, y no se realizan transferencias de datos no amparadas por una obligación legal o por las garantías previstas en el RGPD.',
        ],
      },
      {
        heading: 'Plazos de conservación',
        paragraphs: [
          'Los datos se conservan mientras dure la relación con el usuario —la tramitación de su solicitud o, en su caso, el contrato de alquiler o renting— y, una vez finalizada, durante los plazos exigidos por la normativa fiscal, mercantil y de consumo para atender posibles responsabilidades legales. Transcurridos dichos plazos, los datos se suprimen.',
        ],
      },
      {
        heading: 'Derechos de las personas interesadas',
        paragraphs: [
          'Cualquier persona puede ejercer los derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad de sus datos enviando una solicitud al correo electrónico info@alcocars.es, indicando el derecho que desea ejercer y acompañando información que permita verificar su identidad.',
          'La solicitud será atendida en los plazos previstos por el RGPD. El ejercicio de estos derechos es gratuito.',
        ],
      },
      {
        heading: 'Reclamación ante la autoridad de control',
        paragraphs: [
          'Si el usuario considera que el tratamiento de sus datos no se ajusta a la normativa o que sus derechos no han sido debidamente atendidos, puede presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD), autoridad de control competente en España, a través de su sede electrónica en www.aepd.es.',
        ],
      },
    ],
  },
  'condiciones-alquiler': {
    slug: 'condiciones-alquiler',
    title: 'Condiciones de Alquiler',
    intro:
      'Estas condiciones regulan el alquiler de vehículos de Alcocars: requisitos del conductor, tarifas, fianza, seguro, combustible, entregas y devoluciones, extras y responsabilidades. Todos los importes indicados incluyen IVA.',
    updatedAt: '5 de agosto de 2026',
    sections: [
      {
        heading: 'Requisitos del conductor',
        paragraphs: [
          'El conductor debe tener 25 años cumplidos y estar en posesión de un permiso de conducir válido en España con una antigüedad mínima de 2 años. Estos requisitos se aplican tanto al conductor principal como a los conductores adicionales.',
        ],
      },
      {
        heading: 'Documentación y forma de pago',
        paragraphs: [
          'En el momento de la recogida del vehículo, el conductor deberá presentar su DNI o pasaporte en vigor y su permiso de conducir. Sin esta documentación no podrá formalizarse el contrato de alquiler.',
          'La fianza puede depositarse mediante tarjeta de crédito o transferencia bancaria.',
        ],
      },
      {
        heading: 'Solicitud de reserva y confirmación',
        paragraphs: [
          'La reserva realizada a través de la web es una solicitud, no una confirmación. El equipo de Alcocars responde en un plazo de 24 a 48 horas laborables para confirmar la disponibilidad del vehículo y las condiciones del alquiler. No se exige ningún pago por adelantado al enviar la solicitud.',
        ],
      },
      {
        heading: 'Tarifas y kilometraje',
        paragraphs: [
          'Las tarifas se establecen por gama de vehículo y por días de alquiler, e incluyen el IVA y los seguros descritos en estas condiciones. Puede consultar los precios vigentes de cada gama en la sección de tarifas de la web; a modo de referencia, el Coche de Gama Básica está disponible desde 61 € al día.',
          'Todas las tarifas incluyen 200 kilómetros por día de alquiler. Los kilómetros que superen esa cifra se facturan según la gama del vehículo, entre 0,15 y 0,27 € por kilómetro, conforme al detalle publicado en la tabla de tarifas.',
        ],
      },
      {
        heading: 'Fianza y franquicia',
        paragraphs: [
          'A la recogida del vehículo se deposita una fianza de 300 €, que asciende a 600 € en las gamas superiores: furgoneta de 9 plazas, furgoneta de caja abierta y todoterrenos. La fianza se devuelve al finalizar el alquiler una vez comprobado el estado del vehículo y liquidados, en su caso, los cargos pendientes.',
          'La franquicia del seguro es de 300 € o de 600 € según el vehículo contratado, coincidiendo con los importes de fianza de cada gama.',
        ],
      },
      {
        heading: 'Seguro',
        paragraphs: [
          'Todos los alquileres incluyen en la tarifa un seguro a todo riesgo con franquicia (300 € o 600 € según el vehículo), además de la responsabilidad civil obligatoria y la responsabilidad civil complementaria.',
          'El seguro no ampara los daños causados por un uso negligente o contrario al contrato, como la conducción bajo los efectos del alcohol o de sustancias estupefacientes, la participación en competiciones o la circulación fuera de vías autorizadas para el tipo de vehículo.',
        ],
      },
      {
        heading: 'Combustible',
        paragraphs: [
          'El vehículo se entrega con el depósito lleno y debe devolverse igualmente lleno. Si se devuelve con menos combustible, se cobrará la diferencia de carburante más 20 € + IVA en concepto de servicio de repostaje.',
        ],
      },
      {
        heading: 'Recogida, devolución y horarios',
        paragraphs: [
          'La duración mínima del alquiler es de 24 horas. En la devolución se aplica un margen de cortesía de 1 hora; superado ese margen, se cobra un día adicional de alquiler.',
          'El horario de nuestras oficinas es de lunes a viernes de 9:00 a 13:00 y de 16:00 a 19:00, y los sábados de 9:00 a 12:30. Las entregas y recogidas fuera de ese horario solo se realizan con confirmación previa del equipo de Alcocars y con el suplemento correspondiente.',
          'Previa solicitud, ofrecemos recogida y entrega en el aeropuerto de Zaragoza, así como en hoteles, estaciones de Renfe y otros puntos acordados, con los suplementos indicados en el apartado de extras.',
        ],
      },
      {
        heading: 'Extras y suplementos',
        paragraphs: [
          'Los extras disponibles, con IVA incluido, son los siguientes: conductor adicional, 8 €; silla de bebé, 5,22 € al día con un máximo de 46,40 € por alquiler; porta esquís o cadenas, 34,80 €.',
          'Los suplementos de entrega y recogida son: en oficina de ciudad fuera de horario, 25 €; fuera de oficina (hoteles, Renfe, estaciones), 40 €; en el aeropuerto en horario laboral, 40 €; devolución del vehículo en una oficina distinta a la de recogida, 69,60 €.',
        ],
      },
      {
        heading: 'Conductores adicionales',
        paragraphs: [
          'Pueden incluirse conductores adicionales en el contrato por 8 € (IVA incluido) por conductor. Cada conductor adicional debe cumplir los mismos requisitos que el conductor principal —25 años cumplidos y permiso de conducir válido en España con 2 años de antigüedad— y figurar en el contrato. El vehículo solo puede ser conducido por las personas incluidas en él.',
        ],
      },
      {
        heading: 'Multas y sanciones',
        paragraphs: [
          'El arrendatario es responsable de las multas, sanciones y recargos derivados de infracciones de tráfico, de estacionamiento o de cualquier otra normativa cometidas durante el periodo de alquiler, así como de los gastos de gestión que dichas infracciones ocasionen. Alcocars facilitará a las autoridades los datos del conductor cuando así lo exija la ley.',
        ],
      },
      {
        heading: 'Asistencia en carretera «Viajamos Contigo»',
        paragraphs: [
          'Todos los alquileres incluyen el servicio de asistencia en carretera 24 horas «Viajamos Contigo», respaldado por una red de talleres propios y concertados. En caso de avería, ponemos a disposición del cliente un vehículo de sustitución para que pueda continuar su viaje.',
        ],
      },
    ],
  },
  'politica-cookies': {
    slug: 'politica-cookies',
    title: 'Política de Cookies',
    intro:
      'Este sitio web no utiliza cookies de terceros ni cookies publicitarias. Únicamente emplea almacenamiento técnico en el navegador, imprescindible para recordar sus preferencias durante la navegación.',
    updatedAt: '5 de agosto de 2026',
    sections: [
      {
        heading: 'Qué es una cookie',
        paragraphs: [
          'Una cookie es un pequeño archivo de texto que un sitio web guarda en el navegador del usuario para recordar información entre visitas: preferencias, sesiones iniciadas o datos de análisis y publicidad. Junto a las cookies existen otras tecnologías de almacenamiento local, como el localStorage del navegador, que cumplen una función similar pero no se envían a los servidores en cada petición.',
        ],
      },
      {
        heading: 'Qué utiliza este sitio web',
        paragraphs: [
          'Este sitio utiliza exclusivamente almacenamiento técnico mediante localStorage, con dos únicas finalidades: recordar que el usuario ha aceptado el aviso informativo y conservar las preferencias de la sesión de navegación, como los datos introducidos en el proceso de solicitud de reserva.',
          'No utilizamos cookies de terceros, cookies analíticas ni cookies publicitarias, y no se realiza ningún seguimiento del usuario con fines comerciales. Al tratarse de almacenamiento estrictamente necesario para el funcionamiento del sitio, no se requiere consentimiento previo conforme al artículo 22.2 de la LSSI-CE.',
        ],
      },
      {
        heading: 'Cómo borrar los datos de navegación',
        paragraphs: [
          'El usuario puede eliminar en cualquier momento el almacenamiento local de este sitio desde la configuración de privacidad de su navegador, con la opción de borrar los datos de navegación o los datos de sitios web (en Chrome, Firefox, Safari y Edge se encuentra en el apartado de privacidad y seguridad de los ajustes).',
          'Borrar estos datos no impide seguir usando la web con normalidad: únicamente volverá a mostrarse el aviso informativo y se perderán las preferencias guardadas de la sesión.',
        ],
      },
    ],
  },
};
