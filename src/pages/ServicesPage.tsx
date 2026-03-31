import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import serviceAdaptadoImage from '../assets/images/service-adaptado.webp';
import serviceAeroImage from '../assets/images/service-aero.webp';
import serviceHorasImage from '../assets/images/service-horas.webp';
import serviceRentingImage from '../assets/images/service-renting.webp';
import styles from './ServicesPage.module.css';

gsap.registerPlugin(ScrollTrigger);

type Service = {
  id: string;
  number: string;
  title: string;
  description: string;
  image: string;
  icon: ReactNode;
  cta: string;
};

const services: Service[] = [
  {
    id: 'renting-flexible',
    number: '01',
    title: 'Renting Flexible',
    description:
      'Porque la actividad de tu empresa no es lineal. Propuestas a medida para necesidades puntuales en tu flota sin ataduras a largo plazo.',
    image: serviceRentingImage,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </svg>
    ),
    cta: 'Solicitar propuesta',
  },
  {
    id: 'alquiler-por-horas',
    number: '02',
    title: 'Alquiler por Horas',
    description:
      'La movilidad que necesitas, solo el tiempo que la necesitas. Utiliza nuestros vehículos de manera esporádica sin los costes de tener uno en propiedad.',
    image: serviceHorasImage,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </svg>
    ),
    cta: 'Ver disponibilidad',
  },
  {
    id: 'recogida-aeropuerto',
    number: '03',
    title: 'Recogida en Aeropuerto',
    description:
      'Aterriza y arranca. Ofrecemos la entrega directa de tu vehículo alquilado en la terminal del aeropuerto para que no pierdas ni un minuto.',
    image: serviceAeroImage,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 16.5H2M5 12.5 9.5 4l2 1-1.5 5.5 6 2.5" />
        <circle cx="9" cy="19" r="1" />
        <circle cx="15" cy="19" r="1" />
      </svg>
    ),
    cta: 'Reservar transfer',
  },
  {
    id: 'vehiculos-adaptados',
    number: '04',
    title: 'Vehículos Adaptados',
    description:
      'Movilidad sin barreras. Facilitamos viajes cómodos y seguros con nuestra flota de vehículos adaptados para sillas de ruedas.',
    image: serviceAdaptadoImage,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="5" r="1.5" />
        <path d="M9 7v4.5l3 2h4.5M9 11.5l-2.5 3.5" />
        <circle cx="7" cy="18.5" r="2" />
        <circle cx="15" cy="18.5" r="2" />
        <path d="M13 16.5h2.5" />
      </svg>
    ),
    cta: 'Consultar flota',
  },
];

export default function ServicesPage() {
  const pageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    const ctx = gsap.context(() => {
      // Hero animation
      const heroKicker = page.querySelector<HTMLElement>(`.${styles.kicker}`);
      const heroTitle = page.querySelector<HTMLElement>(`.${styles.heroTitle}`);
      const heroSubtitle = page.querySelector<HTMLElement>(`.${styles.heroSubtitle}`);

      if (heroKicker && heroTitle && heroSubtitle) {
        gsap.fromTo(
          [heroKicker, heroTitle, heroSubtitle],
          { y: 28, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', stagger: 0.12 },
        );
      }

      // Service blocks animation
      const blocks = gsap.utils.toArray<HTMLElement>(`.${styles.serviceBlock}`);

      blocks.forEach((block, index) => {
        const isReverse = index % 2 === 1;
        const media = block.querySelector<HTMLElement>(`.${styles.mediaWrap}`);
        const number = block.querySelector<HTMLElement>(`.${styles.serviceNumber}`);
        const heading = block.querySelector<HTMLElement>(`.${styles.textPanel} h2`);
        const body = block.querySelector<HTMLElement>(`.${styles.textPanel} p`);
        const cta = block.querySelector<HTMLElement>(`.${styles.serviceCtaBtn}`);

        if (media) {
          gsap.fromTo(
            media,
            { x: isReverse ? 50 : -50, autoAlpha: 0 },
            {
              x: 0,
              autoAlpha: 1,
              duration: 1,
              ease: 'power3.out',
              scrollTrigger: { trigger: block, start: 'top 80%' },
            },
          );
        }

        const textEls = [number, heading, body, cta].filter(Boolean) as HTMLElement[];

        if (textEls.length) {
          gsap.fromTo(
            textEls,
            { y: 28, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 0.75,
              ease: 'power3.out',
              stagger: 0.1,
              scrollTrigger: { trigger: block, start: 'top 80%' },
            },
          );
        }
      });

      // Bottom CTA
      const ctaSection = page.querySelector<HTMLElement>(`.${styles.bottomCta}`);
      if (ctaSection) {
        gsap.fromTo(
          ctaSection.children,
          { y: 30, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.12,
            scrollTrigger: { trigger: ctaSection, start: 'top 82%' },
          },
        );
      }
    }, page);

    return () => ctx.revert();
  }, []);

  return (
    <main ref={pageRef} className={styles.page}>
      <div className={styles.container}>

        {/* ── Hero ── */}
        <header className={styles.hero}>
          <p className={styles.kicker}>Servicios</p>
          <h1 className={styles.heroTitle}>MÁS QUE ALQUILAR,<br />DAMOS SOLUCIONES</h1>
          <p className={styles.heroSubtitle}>
            Cuatro servicios diseñados para adaptarse a ti: tu agenda, tu destino y tus necesidades de movilidad.
          </p>
        </header>

        {/* ── Zig-Zag Services ── */}
        <section className={styles.servicesList}>
          {services.map((service, index) => (
            <article
              key={service.id}
              className={`${styles.serviceBlock} ${index % 2 === 1 ? styles.serviceBlockReverse : ''}`}
            >
              <div className={styles.mediaWrap}>
                <img src={service.image} alt={service.title} loading="lazy" />
              </div>

              <div className={styles.textPanel}>
                <img
                  className={styles.textPanelBgImage}
                  src={service.image}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                />

                <span className={styles.serviceNumber}>{service.number}</span>

                <div className={styles.serviceIconWrap} aria-hidden="true">
                  {service.icon}
                </div>

                <h2>{service.title}</h2>
                <p>{service.description}</p>

                <Link to="/contacto" className={styles.serviceCtaBtn}>
                  {service.cta}
                  <svg viewBox="0 0 16 16" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </section>

        {/* ── Bottom CTA ── */}
        <section className={styles.bottomCta}>
          <p className={styles.bottomCtaKicker}>¿Hablamos?</p>
          <h2 className={styles.bottomCtaTitle}>Diseñamos la solución<br />para tu movilidad</h2>
          <p className={styles.bottomCtaText}>
            Cuéntanos tu caso. Nuestro equipo te prepara una propuesta personalizada sin compromiso.
          </p>
          <div className={styles.bottomCtaActions}>
            <Link to="/contacto" className={styles.btnPrimary}>Contactar ahora</Link>
            <Link to="/flota" className={styles.btnGhost}>Ver flota</Link>
          </div>
        </section>

      </div>
    </main>
  );
}
