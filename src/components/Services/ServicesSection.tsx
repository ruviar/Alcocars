import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './ServicesSection.module.css';

gsap.registerPlugin(ScrollTrigger);

const services = [
  {
    title: 'Renting Flexible',
    text: 'Suscripcion por semanas o meses, con cambio de categoria en menos de 24h y mantenimiento incluido.',
    image:
      'https://images.unsplash.com/photo-1485463598028-44d6c47bf23f?w=1400&q=80',
  },
  {
    title: 'Alquiler por horas',
    text: 'Recoge, conduce y devuelve cuando quieras. Reserva inmediata desde tu movil sin papeleo innecesario.',
    image:
      'https://images.unsplash.com/photo-1493238792000-8113da705763?w=1400&q=80',
  },
  {
    title: 'Entregas en aeropuerto',
    text: 'Seguimiento de vuelo y entrega en terminal para que empieces tu viaje en minutos.',
    image:
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1400&q=80',
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
