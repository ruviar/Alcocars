import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './CompanyPage.module.css';
import heroBg from '../assets/images/hero-company.webp';
import missionBg from '../assets/images/mission-bg.webp';
import valuesBg from '../assets/images/values-bg.webp';

gsap.registerPlugin(ScrollTrigger);

type ValueItem = {
  title: string;
  detail: string;
  icon: ReactNode;
};

const values: ValueItem[] = [
  {
    title: 'Alquiler por horas',
    detail: 'Permite utilizar vehículos de manera esporádica sin tener uno en propiedad.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    title: 'Recogida en Aeropuerto',
    detail: 'Ofrecemos la posibilidad de contratar nuestro servicio de recogida en el aeropuerto de Zaragoza previa solicitud.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2 16h20M4 13l5-2 3-6 2 1-1 5 6 2" />
      </svg>
    ),
  },
  {
    title: 'Vehículos adaptados',
    detail: 'Facilitamos que los viajes sean cómodos para personas con necesidades especiales de movilidad.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="5" r="2" />
        <path d="M9 7v5l3 3h4m-6 0a3 3 0 1 0 3 3" />
      </svg>
    ),
  },
];

export default function CompanyPage() {
  const pageRef = useRef<HTMLElement>(null);
  const valuesGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const page = pageRef.current;

    if (!page) {
      return;
    }

    const ctx = gsap.context(() => {
      const lineNodes = gsap.utils.toArray<HTMLElement>(`.${styles.revealLine}`);

      lineNodes.forEach((line) => {
        const triggerTarget = line.closest(`.${styles.lineMask}`) as HTMLElement | null;

        gsap.fromTo(
          line,
          { y: '100%', autoAlpha: 0 },
          {
            y: '0%',
            autoAlpha: 1,
            duration: 0.95,
            ease: 'power4.out',
            scrollTrigger: {
              trigger: triggerTarget ?? line,
              start: 'top 88%',
            },
          },
        );
      });

      const splitBlocks = gsap.utils.toArray<HTMLElement>(`.${styles.splitBlock}`);

      splitBlocks.forEach((block) => {
        const paragraph = block.querySelector<HTMLElement>(`.${styles.revealText}`);

        if (!paragraph) {
          return;
        }

        gsap.fromTo(
          paragraph,
          { y: 50, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: block,
              start: 'top 82%',
            },
          },
        );
      });

      const cards = gsap.utils.toArray<HTMLElement>(`.${styles.valueCard}`);

      if (!cards.length) {
        return;
      }

      gsap.fromTo(
        cards,
        { y: 36, autoAlpha: 0, scale: 0.97 },
        {
          y: 0,
          autoAlpha: 1,
          scale: 1,
          duration: 0.74,
          ease: 'power3.out',
          stagger: 0.14,
          scrollTrigger: {
            trigger: valuesGridRef.current,
            start: 'top 82%',
          },
        },
      );

      const bgImages = gsap.utils.toArray<HTMLElement>(`.${styles.bgImage}`);

      bgImages.forEach((img) => {
        gsap.fromTo(
          img,
          { y: '-10%' },
          {
            y: '10%',
            ease: 'none',
            scrollTrigger: {
              trigger: img.parentElement,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          }
        );
      });
    }, page);

    return () => ctx.revert();
  }, []);

  return (
    <main ref={pageRef} className={styles.page}>
      <section className={`${styles.heroSection} ${styles.sectionWrapper}`}>
        <img src={heroBg} alt="Hero Background" className={styles.bgImage} />
        <div className={styles.bgOverlay} />
        <div className={styles.content}>
          <div className={styles.heroSplit}>
            <div>
              <p className={styles.kicker}>Quienes Somos</p>
              <h1 className={styles.heroTitle}>
                <span className={styles.lineMask}>
                  <span className={`${styles.heroLine} ${styles.revealLine}`}>TE DAMOS MOVILIDAD</span>
                </span>
                <span className={styles.lineMask}>
                  <span className={`${styles.heroLine} ${styles.revealLine}`}>A TI Y A TU NEGOCIO.</span>
                </span>
              </h1>
            </div>

            <p className={`${styles.heroSubtitle} ${styles.revealText}`}>
              Alquiler de vehículos en Zaragoza, Tudela y Soria de forma económica, rápida y segura.
            </p>
          </div>
        </div>
      </section>

      <section className={`${styles.storySection} ${styles.sectionWrapper}`}>
        <img src={missionBg} alt="Mission Background" className={styles.bgImage} />
        <div className={styles.bgOverlay} />
        <div className={styles.content}>
          <article className={styles.splitBlock}>
            <div className={styles.splitHeadline}>
              <span className={styles.lineMask}>
                <span className={`${styles.splitTitle} ${styles.revealLine}`}>Quiénes Somos</span>
              </span>
            </div>

            <p className={`${styles.splitText} ${styles.revealText}`}>
              Somos especialistas en alquiler de coches. En Alcocars podrás encontrar tu lugar ideal de alquiler de
              furgonetas y caravanas. Entendemos los problemas de nuestros clientes y tratamos de solucionarlos
              facilitando que los viajes sean lo más agradables y cómodos posibles.
            </p>
          </article>

          <article className={styles.splitBlock}>
            <div className={styles.splitHeadline}>
              <span className={styles.lineMask}>
                <span className={`${styles.splitTitle} ${styles.revealLine}`}>Renting Flexible</span>
              </span>
            </div>

            <p className={`${styles.splitText} ${styles.revealText}`}>
              Porque la actividad de las empresas no es lineal, además del renting tradicional, Alcocars propone las
              mejores ofertas para necesidades puntuales en tu flota.
            </p>
          </article>
        </div>
      </section>

      <section className={`${styles.valuesSection} ${styles.sectionWrapper}`}>
        <img src={valuesBg} alt="Values Background" className={styles.bgImage} />
        <div className={styles.bgOverlay} />
        <div className={styles.content}>
          <div className={styles.valuesHeader}>
            <span className={styles.lineMask}>
              <h2 className={`${styles.valuesTitle} ${styles.revealLine}`}>Valores Destacados</h2>
            </span>
          </div>

          <div ref={valuesGridRef} className={styles.valuesGrid}>
            {values.map((value) => (
              <article key={value.title} className={styles.valueCard}>
                <span className={styles.valueIcon}>{value.icon}</span>
                <h3>{value.title}</h3>
                <p>{value.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
