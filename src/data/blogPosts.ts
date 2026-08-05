import heroCompanyImage from '../assets/images/hero-company.webp';
import missionImage from '../assets/images/mission-bg.webp';
import valuesImage from '../assets/images/values-bg.webp';
import horasImage from '../assets/images/service-horas.webp';
import rentingImage from '../assets/images/service-renting.webp';

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingTime: string;
  date: string;
  image: string;
  sections: Array<{
    heading?: string;
    paragraphs: string[];
  }>;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'como-elegir-todoterreno-alquiler-zaragoza',
    title: 'Cómo elegir el mejor todoterreno de alquiler en Zaragoza',
    excerpt:
      'Corto, largo o pick-up: qué gama te conviene según el uso —rural, nieve u obra—, los kilómetros previstos y el presupuesto. Con precios reales.',
    category: 'Todoterrenos',
    readingTime: '6 min',
    date: '17 Jul 2026',
    image: valuesImage,
    sections: [
      {
        paragraphs: [
          'Un todoterreno no es un capricho: en cuanto sales del asfalto de Zaragoza y te adentras en el Moncayo, el Pirineo o las pistas de la Ribera Navarra, se convierte en la diferencia entre llegar o quedarte a medias. En Alcocars alquilamos todoterrenos cortos, largos y pick-up desde nuestras oficinas de Zaragoza, Tudela y Ágreda, y estas son las claves que damos en mostrador para acertar con el tuyo.',
        ],
      },
      {
        heading: '¿Para qué lo vas a usar?',
        paragraphs: [
          'Antes de mirar precios, define el uso. Para escapadas rurales y caminos de tierra en buen estado, un todoterreno corto sobra: es ágil, aparca sin dramas en cualquier pueblo y consume menos. Si viajas con nieve —el Moncayo y el Pirineo la garantizan varios meses al año— prioriza la altura libre y añade el porta esquís con cadenas (34,80 €, IVA incluido, por alquiler).',
          'Y si el destino es una obra, una finca o un trabajo forestal, valora el pick-up: la caja abierta admite herramienta, material y carga sucia que no querrás meter jamás en un maletero cerrado.',
        ],
      },
      {
        heading: 'Corto, largo o pick-up: precios reales',
        paragraphs: [
          'El todoterreno corto parte de 171 € al día y es la opción más equilibrada para dos o tres ocupantes con equipaje. El largo, desde 205 € al día, gana batalla y espacio interior: es el indicado para familias o equipos de trabajo con material voluminoso. El pick-up, también desde 205 € al día, cambia el maletero cerrado por una caja de carga abierta.',
          'Los tres incluyen 200 km diarios, seguro a todo riesgo con franquicia, responsabilidad civil obligatoria y complementaria, y asistencia en carretera 24 horas. Todos los importes llevan el IVA incluido.',
        ],
      },
      {
        heading: 'Haz números con los kilómetros',
        paragraphs: [
          'Todos nuestros alquileres incluyen 200 km por día; en la gama de todoterrenos, cada kilómetro adicional se factura a 0,27 €. Suma la ida, la vuelta y los desplazamientos que harás en destino: si el total supera con claridad los kilómetros incluidos, quizá te compense repartir el viaje en más días de alquiler.',
          'Recuerda que el alquiler mínimo es de 24 horas y que dispones de un margen de cortesía de una hora en la devolución; superado ese margen, se cobra un día adicional.',
        ],
      },
      {
        heading: 'Fianza, franquicia y requisitos',
        paragraphs: [
          'Los todoterrenos pertenecen a nuestras gamas superiores, así que la fianza es de 600 € —con tarjeta de crédito o transferencia— y la franquicia del seguro a todo riesgo también es de 600 €. Para conducirlos necesitas 25 años cumplidos, carnet válido en España con al menos dos años de antigüedad y DNI o pasaporte en vigor.',
          'Haz tu solicitud en la web y te confirmamos disponibilidad en 24–48 horas laborables, sin ningún pago por adelantado.',
        ],
      },
    ],
  },
  {
    slug: 'consejos-seguro-alquiler-furgoneta',
    title: 'Consejos sobre el seguro al alquilar una furgoneta',
    excerpt:
      'Todo riesgo con franquicia, responsabilidad civil, fianza… Qué cubre cada cosa, en qué se diferencian y cómo reducir sustos en una mudanza o un reparto.',
    category: 'Consejos',
    readingTime: '7 min',
    date: '12 Jun 2026',
    image: missionImage,
    sections: [
      {
        paragraphs: [
          'Alquilar una furgoneta para una mudanza, un reparto o un viaje en grupo plantea siempre la misma duda: ¿y si pasa algo? En Alcocars todas las furgonetas salen con seguro a todo riesgo con franquicia y con responsabilidad civil obligatoria y complementaria, incluidos en la tarifa. Aun así, conviene entender qué significa cada concepto para conducir con la cabeza tranquila.',
        ],
      },
      {
        heading: 'Todo riesgo con franquicia: qué significa',
        paragraphs: [
          'El seguro a todo riesgo cubre los daños del vehículo, pero con una franquicia: la cantidad máxima que asumes tú en un siniestro con culpa. En la mayoría de nuestras furgonetas la franquicia es de 300 €; en la de 9 plazas y en la de caja abierta, de 600 €. Si la reparación cuesta menos que la franquicia, pagas solo la reparación; si cuesta más, tu responsabilidad se detiene en ese límite.',
          'La responsabilidad civil —obligatoria y complementaria— cubre los daños a terceros y va incluida en el precio, sin coste adicional.',
        ],
      },
      {
        heading: 'La fianza no es el seguro',
        paragraphs: [
          'Se confunden a menudo, pero son cosas distintas. La fianza —300 € en la mayoría de furgonetas y 600 € en la de 9 plazas y la de caja abierta— es un depósito que se retiene con tarjeta de crédito o por transferencia y se devuelve al finalizar el alquiler si el vehículo vuelve en las mismas condiciones en que salió. No es un pago ni un seguro adicional: es una garantía temporal.',
        ],
      },
      {
        heading: 'Cuatro gestos que evitan sustos',
        paragraphs: [
          'Primero, revisa la furgoneta con nosotros antes de salir y fotografía cualquier marca existente: es la mejor prueba de su estado inicial. Segundo, declara a todos los conductores; añadir un conductor adicional cuesta solo 8 € y conducir sin estar declarado puede dejar la cobertura sin efecto.',
          'Tercero, vigila las alturas: la mayoría de los golpes en furgonetas de alquiler se producen en parkings, gasolineras y accesos con gálibo. Antes de entrar en un aparcamiento cubierto, comprueba la altura del vehículo en la ficha o pregúntanos en la entrega. Y cuarto, reparte y sujeta bien la carga: una carga suelta es un riesgo para ti y para el vehículo.',
        ],
      },
      {
        heading: 'Y si algo pasa en ruta',
        paragraphs: [
          'Nuestra asistencia en carretera 24 horas «Viajamos Contigo» se apoya en una red de talleres propios y concertados, con vehículo de sustitución en caso de avería, para que un contratiempo no arruine la mudanza ni pare el reparto. Guarda el teléfono de contacto que te facilitamos en la entrega y, ante cualquier incidente, llámanos antes de actuar por tu cuenta.',
        ],
      },
    ],
  },
  {
    slug: 'primer-viaje-en-autocaravana',
    title: 'Todo lo que necesitas saber para tu primer viaje en autocaravana',
    excerpt:
      'Etapas realistas, dónde pernoctar, cómo gestionar agua y combustible, y cómo se alquila una autocaravana en Alcocars. La guía para estrenarte sin agobios.',
    category: 'Viajes',
    readingTime: '8 min',
    date: '15 May 2026',
    image: horasImage,
    sections: [
      {
        paragraphs: [
          'Viajar en autocaravana engancha: te levantas frente al mar o a los pies del Moncayo, cambias de plan sin deshacer maletas y el trayecto se convierte en parte del viaje. Pero el primer viaje impone un poco: el tamaño, los depósitos, dónde dormir… Con estos consejos —los mismos que damos en mostrador a quien se estrena— saldrás con todo controlado.',
        ],
      },
      {
        heading: 'Planifica menos kilómetros de los que crees',
        paragraphs: [
          'El error clásico del principiante es plantear etapas de coche. Una autocaravana viaja cómoda entre 90 y 110 km/h y todo lleva algo más de tiempo: repostar, aparcar, maniobrar. Como referencia, planifica etapas de 200–300 km al día como máximo y deja huecos libres en el itinerario.',
          'La gracia de la autocaravana es poder improvisar: un plan demasiado cerrado desaprovecha justo lo que la hace especial.',
        ],
      },
      {
        heading: 'Pernoctar no es acampar',
        paragraphs: [
          'En España puedes pernoctar —dormir dentro del vehículo correctamente estacionado— donde la normativa municipal no lo prohíba, pero acampar (sacar toldo, mesas, calzos niveladores…) solo está permitido en campings y zonas habilitadas.',
          'Para el primer viaje, las áreas de autocaravanas son la mejor opción: por poco dinero suelen ofrecer vaciado de aguas grises, llenado del depósito de agua limpia y electricidad. Localízalas antes de salir y lleva siempre una alternativa por si la primera está completa.',
        ],
      },
      {
        heading: 'Agua, residuos y combustible: la intendencia',
        paragraphs: [
          'Acostúmbrate a pensar en depósitos: el agua limpia, las aguas grises y el WC químico se llenan y se vacían cada dos o tres días de uso, siempre en puntos habilitados. Es menos engorroso de lo que suena: en dos días le habrás cogido el ritmo.',
          'En cuanto al combustible, cuenta con un consumo sensiblemente mayor que el de un coche y conduce suave. Y recuerda la regla general de nuestros alquileres: el vehículo se entrega con el depósito lleno y se devuelve lleno; de lo contrario, se cobra la diferencia más 20 € + IVA por el servicio de repostaje.',
        ],
      },
      {
        heading: 'Cómo se alquila en Alcocars',
        paragraphs: [
          'La autocaravana es una gama con precio bajo consulta: cuéntanos fechas y destino a través de la web, por WhatsApp (+34 608 808 240) o en nuestras oficinas de Zaragoza, Tudela y Ágreda, y te preparamos una propuesta a medida.',
          'Como en el resto de la flota, necesitarás 25 años cumplidos, carnet con dos años de antigüedad válido en España y DNI o pasaporte en vigor. La solicitud no supone ningún pago por adelantado: te respondemos en 24–48 horas laborables.',
        ],
      },
    ],
  },
  {
    slug: 'alquilar-coche-zaragoza-soria-sin-sorpresas',
    title: 'Alquilar un coche en Zaragoza y Soria sin sorpresas: guía rápida',
    excerpt:
      'Documentación, 200 km al día incluidos, combustible lleno→lleno y margen de cortesía de una hora: la letra pequeña de tu alquiler, explicada en claro.',
    category: 'Consejos',
    readingTime: '5 min',
    date: '10 Abr 2026',
    image: heroCompanyImage,
    sections: [
      {
        paragraphs: [
          'Alquilar un coche debería ser tan sencillo como recogerlo y conducir. Para que no haya sorpresas —ni en el mostrador ni en la factura—, esta es la letra pequeña de Alcocars explicada en claro, válida en nuestras oficinas de Zaragoza, Tudela (Navarra) y Ágreda (Soria).',
        ],
      },
      {
        heading: 'La documentación que te pediremos',
        paragraphs: [
          'Solo tres cosas: haber cumplido 25 años, un carnet de conducir válido en España con al menos dos años de antigüedad y tu DNI o pasaporte en vigor. Si va a conducir alguien más, decláralo como conductor adicional (8 €, IVA incluido): cuesta poco y evita problemas con el seguro.',
          'Para la fianza —300 € en la mayoría de gamas y 600 € en las superiores— necesitarás tarjeta de crédito, aunque también aceptamos transferencia. Se devuelve al finalizar el alquiler si el vehículo vuelve como salió.',
        ],
      },
      {
        heading: '200 km al día incluidos',
        paragraphs: [
          'Todas nuestras tarifas incluyen 200 km por cada día de alquiler. Si te pasas, el kilómetro extra se factura según la gama, entre 0,15 y 0,27 €. Un ejemplo: una escapada de fin de semana con unos 520 km totales, alquilando dos días, tendría 400 km incluidos y unos 120 km extra por facturar.',
          'A veces sale más a cuenta añadir un día de alquiler que pagar los kilómetros sueltos: haz números o pregúntanos directamente, te lo calculamos sin compromiso.',
        ],
      },
      {
        heading: 'Combustible: lleno → lleno',
        paragraphs: [
          'Te entregamos el vehículo con el depósito lleno y lo devuelves lleno. Es el sistema más transparente: pagas exactamente el combustible que consumes, al precio de la gasolinera que tú elijas. Si el vehículo vuelve sin llenar, se cobra la diferencia de combustible más 20 € + IVA en concepto de servicio de repostaje.',
          'El truco es simple: reposta cerca de la oficina justo antes de devolverlo y guarda el tique.',
        ],
      },
      {
        heading: 'Horarios, devolución y margen de cortesía',
        paragraphs: [
          'El alquiler mínimo es de 24 horas y cuentas con un margen de cortesía de una hora en la devolución; superado ese margen, se cobra un día adicional. Nuestro horario es de lunes a viernes de 9:00 a 13:00 y de 16:00 a 19:00, y sábados de 9:00 a 12:30; fuera de él, las entregas requieren confirmación previa.',
          'Un último apunte importante: la reserva web es una solicitud, no una confirmación. Te respondemos en 24–48 horas laborables y no pagas nada por adelantado.',
        ],
      },
    ],
  },
  {
    slug: 'renting-flexible-pymes-cuando-compensa',
    title: 'Renting flexible para pymes: cuándo compensa frente a comprar',
    excerpt:
      'Picos de actividad, capital sin inmovilizar y mantenimiento incluido: cuándo el renting flexible gana a la compra… y cuándo no. Análisis honesto para pymes.',
    category: 'Empresas',
    readingTime: '7 min',
    date: '20 Mar 2026',
    image: rentingImage,
    sections: [
      {
        paragraphs: [
          'Para una pyme, cada vehículo en propiedad son miles de euros que dejan de estar disponibles para el negocio, más una lista de obligaciones que nadie echa de menos: ITV, seguros, talleres, reventa. El renting flexible da la vuelta al planteamiento: pagas por el uso, mes a mes, y la flota se adapta a la actividad real de la empresa. En Alcocars lo ofrecemos a corto, medio y largo plazo, tanto para empresas como para autónomos y particulares.',
        ],
      },
      {
        heading: 'Cuando la actividad va por picos',
        paragraphs: [
          'Pocas pymes tienen la misma carga de trabajo en enero que en julio. Con renting flexible puedes ampliar la flota durante una campaña, una obra o una punta de pedidos, y devolver los vehículos cuando termina, sin quedarte con furgonetas paradas en el aparcamiento.',
          'Es la diferencia entre dimensionar la flota para el pico —y pagarla los doce meses del año— o dimensionarla para cada momento.',
        ],
      },
      {
        heading: 'Capital libre para lo que importa',
        paragraphs: [
          'Comprar una furgoneta inmoviliza capital o consume línea de crédito, y el vehículo empieza a depreciarse el primer día. Con el renting, esa inversión se transforma en una cuota operativa previsible que entra directamente en el presupuesto mensual.',
          'Sin entrada, sin financiación que negociar y sin tener que preocuparte por el valor de reventa dentro de cinco años. El capital se queda donde produce: en tu actividad.',
        ],
      },
      {
        heading: 'El mantenimiento deja de ser tu problema',
        paragraphs: [
          'Cada vehículo en propiedad arrastra revisiones, neumáticos, ITV y algún imprevisto de taller que siempre llega en el peor momento. En el renting de Alcocars, el mantenimiento se apoya en nuestra red de talleres propios y concertados, con asistencia en carretera 24 horas «Viajamos Contigo» y vehículo de sustitución en caso de avería.',
          'Traducido al día a día: tu reparto no se para porque una furgoneta esté en el taller.',
        ],
      },
      {
        heading: '¿Y cuándo compensa comprar?',
        paragraphs: [
          'Siendo honestos: si tu flota es estable, el uso es intensivo y constante durante muchos años y dispones de capital sin mejor destino, la compra puede resultar más barata a muy largo plazo. Para todo lo demás —crecimiento, estacionalidad, proyectos con fecha de fin o simple prudencia financiera— el renting flexible suele ganar.',
          'Cuéntanos tu caso en cualquiera de nuestras oficinas de Zaragoza, Tudela o Ágreda, por WhatsApp (+34 608 808 240) o en info@alcocars.es, y te preparamos una propuesta sin compromiso.',
        ],
      },
    ],
  },
];
