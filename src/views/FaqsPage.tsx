'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './FaqsPage.module.css';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface FaqGroup {
  title: string;
  items: FaqItem[];
}

const FAQ_GROUPS: FaqGroup[] = [
  {
    title: 'Requisitos y documentación',
    items: [
      {
        id: 'requisitos-conductor',
        question: '¿Qué requisitos debe cumplir el conductor?',
        answer:
          'Para alquilar cualquiera de nuestros vehículos debes tener 25 años cumplidos y un carnet de conducir válido en España con al menos 2 años de antigüedad. Estos requisitos se aplican tanto al conductor principal como a los conductores adicionales.',
      },
      {
        id: 'documentacion-recogida',
        question: '¿Qué documentación necesito para recoger el vehículo?',
        answer:
          'El día de la recogida debes presentar tu DNI o pasaporte en vigor y tu carnet de conducir válido en España. Sin esta documentación no podremos entregarte el vehículo, así que revísala antes de acercarte a la oficina.',
      },
      {
        id: 'conductor-adicional',
        question: '¿Puede conducir otra persona además del titular del contrato?',
        answer:
          'Sí. Puedes añadir un conductor adicional por 8 € (IVA incluido). Debe cumplir los mismos requisitos que el conductor principal —25 años cumplidos y carnet con 2 años de antigüedad— y presentar su documentación en la oficina.',
      },
    ],
  },
  {
    title: 'Reserva y pago',
    items: [
      {
        id: 'reserva-web',
        question: '¿La reserva web confirma automáticamente mi alquiler?',
        answer:
          'No. La reserva web es una solicitud, no una confirmación. Nuestro equipo revisa la disponibilidad y te responde en un plazo de 24–48 horas laborables. No se realiza ningún pago por adelantado al enviar la solicitud.',
      },
      {
        id: 'fianza',
        question: '¿Cuánto es la fianza y cómo se deposita?',
        answer:
          'La fianza es de 300 € en la mayoría de las gamas y de 600 € en las gamas superiores: furgoneta de 9 plazas, furgoneta de caja abierta y todoterrenos. Puedes depositarla con tarjeta de crédito o mediante transferencia.',
      },
      {
        id: 'que-incluye',
        question: '¿Qué incluye el precio del alquiler?',
        answer:
          'Todos nuestros importes incluyen el IVA. La tarifa diaria incluye 200 km al día, el seguro a todo riesgo con franquicia, la responsabilidad civil obligatoria y complementaria y la asistencia en carretera 24 horas «Viajamos Contigo». Los precios parten desde 61 € al día en la gama básica de coches.',
      },
      {
        id: 'extras',
        question: '¿Qué extras puedo añadir y cuánto cuestan?',
        answer:
          'Con IVA incluido: conductor adicional, 8 €; silla de bebé, 5,22 € al día (con un máximo de 46,40 € por alquiler); porta esquís o cadenas, 34,80 €. También puedes solicitar entregas y recogidas especiales: fuera de horario en oficina de ciudad, 25 €; fuera de oficina (hoteles, estación de Renfe u otras estaciones), 40 €; en el aeropuerto en horario laboral, 40 €; y devolución en una oficina distinta, 69,60 €.',
      },
    ],
  },
  {
    title: 'Durante el alquiler',
    items: [
      {
        id: 'duracion-minima',
        question: '¿Cuál es la duración mínima y qué pasa si me retraso al devolver?',
        answer:
          'El alquiler mínimo es de 24 horas. En la devolución dispones de un margen de cortesía de 1 hora; si lo superas, se cobra un día adicional de alquiler. Si necesitas el vehículo menos tiempo, pregúntanos por el alquiler por horas.',
      },
      {
        id: 'kilometros',
        question: '¿Cuántos kilómetros están incluidos y cuánto cuesta el kilómetro extra?',
        answer:
          'Todas las tarifas incluyen 200 km por día de alquiler. Los kilómetros adicionales se facturan según la gama del vehículo, entre 0,15 y 0,27 € por kilómetro, con IVA incluido.',
      },
      {
        id: 'combustible',
        question: '¿Cómo funciona la política de combustible?',
        answer:
          'El vehículo se entrega con el depósito lleno y debe devolverse igual. Si lo devuelves sin llenar, se cobra la diferencia de combustible más 20 € + IVA por el servicio de repostaje.',
      },
      {
        id: 'seguro-franquicia',
        question: '¿Qué cobertura tiene el seguro y qué franquicia se aplica?',
        answer:
          'Todos los vehículos incluyen en la tarifa un seguro a todo riesgo con franquicia, además de la responsabilidad civil obligatoria y complementaria. La franquicia es de 300 € o 600 € según el vehículo: 600 € en la furgoneta de 9 plazas, la de caja abierta y los todoterrenos, y 300 € en el resto de gamas.',
      },
      {
        id: 'averia',
        question: '¿Qué hago si el vehículo se avería durante el alquiler?',
        answer:
          'Cuentas con la asistencia en carretera 24 horas «Viajamos Contigo», con una red de talleres propios y concertados. En caso de avería te proporcionamos un vehículo de sustitución para que puedas continuar tu viaje.',
      },
    ],
  },
  {
    title: 'Servicios',
    items: [
      {
        id: 'horarios',
        question: '¿En qué horario puedo recoger y devolver el vehículo?',
        answer:
          'Nuestro horario de oficina es de lunes a viernes de 9:00 a 13:00 y de 16:00 a 19:00, y los sábados de 9:00 a 12:30. Las entregas y recogidas fuera de ese horario solo se realizan con confirmación previa y tienen un coste adicional: 25 € en oficina de ciudad y 40 € fuera de oficina (hoteles, estación de Renfe u otras estaciones), IVA incluido.',
      },
      {
        id: 'aeropuerto',
        question: '¿Puedo recoger el vehículo en el aeropuerto de Zaragoza?',
        answer:
          'Sí. Ofrecemos recogida y entrega en el aeropuerto de Zaragoza previa solicitud. El servicio en horario laboral tiene un coste de 40 € con IVA incluido. Indícanoslo al enviar tu solicitud de reserva para que podamos organizarlo.',
      },
      {
        id: 'otra-oficina',
        question: '¿Puedo devolver el vehículo en una oficina distinta a la de recogida?',
        answer:
          'Sí. Puedes devolverlo en cualquiera de nuestras oficinas de Zaragoza, Tudela o Ágreda por un suplemento de 69,60 € con IVA incluido. Indícalo en tu solicitud para que lo tengamos en cuenta.',
      },
      {
        id: 'otros-servicios',
        question: '¿Ofrecéis más servicios además del alquiler por días?',
        answer:
          'Sí. Disponemos de renting flexible a corto, medio y largo plazo para empresas y particulares, alquiler por horas, vehículos adaptados para silla de ruedas y venta de vehículos multimarca. Las autocaravanas están disponibles bajo consulta: contáctanos y te informamos de disponibilidad y tarifas.',
      },
    ],
  },
];

const FAQ_SCHEMA_JSON = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_GROUPS.flatMap((group) =>
    group.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  ),
});

function FaqAccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: (id: string) => void;
}) {
  const buttonId = `faq-${item.id}`;
  const panelId = `faq-${item.id}-panel`;

  return (
    <div className={styles.item}>
      <h3 className={styles.itemHeading}>
        <button
          type="button"
          id={buttonId}
          className={styles.itemButton}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => onToggle(item.id)}
        >
          <span className={styles.itemQuestion}>{item.question}</span>
          <span
            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
            aria-hidden="true"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 5.5L8 11.5L14 5.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}
      >
        <div className={styles.panelInner}>
          <p className={styles.answer}>{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

export default function FaqsPage() {
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(() => new Set());

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: FAQ_SCHEMA_JSON }}
      />
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.kicker}>Resolvemos tus dudas</p>
          <h1 className={styles.title}>PREGUNTAS FRECUENTES</h1>
          <p className={styles.subtitle}>
            Todo lo que necesitas saber antes de reservar: requisitos, fianza, kilómetros,
            combustible y servicios. Y si te queda alguna duda, escríbenos.
          </p>
        </header>

        <div className={styles.groups}>
          {FAQ_GROUPS.map((group) => (
            <section key={group.title} className={styles.group}>
              <h2 className={styles.groupTitle}>{group.title}</h2>
              <div className={styles.card}>
                {group.items.map((item) => (
                  <FaqAccordionItem
                    key={item.id}
                    item={item}
                    isOpen={openIds.has(item.id)}
                    onToggle={toggle}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className={styles.ctaBlock} aria-labelledby="faq-cta-title">
          <h2 id="faq-cta-title" className={styles.ctaTitle}>
            ¿NO ENCUENTRAS TU RESPUESTA?
          </h2>
          <p className={styles.ctaText}>
            Escríbenos o llámanos y te respondemos lo antes posible. Estamos en Zaragoza, Tudela y
            Ágreda, de lunes a viernes de 9:00 a 13:00 y de 16:00 a 19:00, y los sábados de 9:00 a
            12:30.
          </p>
          <div className={styles.ctaActions}>
            <Link href="/contacto" className={styles.ctaPrimary}>
              Ir a contacto →
            </Link>
            <a href="tel:+34976106100" className={styles.ctaSecondary}>
              976 106 100
            </a>
            <a
              href="https://wa.me/34608808240"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaSecondary}
            >
              WhatsApp
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
