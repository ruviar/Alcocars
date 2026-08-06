'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import serviceAeroImage from '../../assets/images/service-aero.webp';
import serviceHorasImage from '../../assets/images/service-horas.webp';
import serviceRentingImage from '../../assets/images/service-renting.webp';
import styles from './ServicesSection.module.css';

gsap.registerPlugin(ScrollTrigger);

const services = [
  {
    title: 'Renting flexible',
    text: 'Corto, medio y largo plazo, para empresas y particulares. Una propuesta a medida para tus necesidades puntuales de flota.',
    image: serviceRentingImage.src,
  },
  {
    title: 'Alquiler por horas',
    text: 'Recoge, conduce y devuelve el mismo día. Solicita tu reserva desde el móvil, sin papeleo innecesario.',
    image: serviceHorasImage.src,
  },
  {
    title: 'Entregas en aeropuerto',
    text: 'Recogida y entrega en el aeropuerto de Zaragoza previa solicitud, para que empieces tu viaje sin esperas.',
    image: serviceAeroImage.src,
  },
];

export default function ServicesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) {
      return;
    }

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(`.${styles.service}`);

      cards.forEach((card, index) => {
        const media = card.querySelector<HTMLElement>(`.${styles.media}`);
        const content = card.querySelector<HTMLElement>(`.${styles.content}`);
        const startsLeft = index % 2 === 0;

        if (media) {
          gsap.fromTo(
            media,
            { autoAlpha: 0, x: startsLeft ? -80 : 80 },
            {
              autoAlpha: 1,
              x: 0,
              duration: 0.9,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 82%',
              },
            },
          );
        }

        if (content) {
          gsap.fromTo(
            content,
            { autoAlpha: 0, x: startsLeft ? 80 : -80 },
            {
              autoAlpha: 1,
              x: 0,
              duration: 0.9,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 82%',
              },
            },
          );
        }
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="servicios" className={styles.section}>
      <div className={`container ${styles.wrapper}`}>
        <div className={styles.heading}>
          <p className={styles.kicker}>Ecosistema de servicios</p>
          <h2>Experiencia premium en cada trayecto</h2>
        </div>

        <div className={styles.grid}>
          {services.map((service, index) => (
            <article
              key={service.title}
              className={`${styles.service} ${index === 0 ? styles.featured : ''}`}
            >
              <div className={styles.media}>
                <img src={service.image} alt={service.title} loading="lazy" />
              </div>
              <div className={styles.content}>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
