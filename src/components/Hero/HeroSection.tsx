import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import BookingEngine from './BookingEngine';
import styles from './HeroSection.module.css';

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

      // Stagger reveal lines
      const lines = headlineRef.current?.querySelectorAll('.hero-line') ?? [];
      tl.fromTo(lines,
        { y: '110%', opacity: 0 },
        { y: '0%', opacity: 1, stagger: 0.15, duration: 1.1 }
      )
        .fromTo(tagRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7 }, '-=0.6')
        .fromTo(subRef.current,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
        .fromTo(engineRef.current,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.9 }, '-=0.4');

      // Parallax on scroll
      gsap.to(bgRef.current, {
        yPercent: 25,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="hero" className={styles.hero}>
      {/* Background */}
      <div ref={bgRef} className={styles.bg}>
        <img
          src="/images/fondo1.png"
          alt="Moncayo nevado — flota Alocars"
          className={styles.bgImg}
        />
        <div className={styles.bgOverlay} />
      </div>

      {/* Decorative grid lines */}
      <div className={styles.gridLines} aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.gridLine} />
        ))}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Tag */}
        <div ref={tagRef} className={styles.tag}>
          <span className={styles.tagDot} />
          Renting Profesional · Aragón & Navarra
        </div>

        {/* Headline - single line GSAP reveal */}
        <div ref={headlineRef} className={styles.headlineWrap}>
          <div className={styles.lineClip}>
            <h1 className={`${styles.line} ${styles.lineRed} hero-line`}>Renting a medida</h1>
          </div>
        </div>

        <p ref={subRef} className={styles.sub}>
          Renting flexible, alquiler por horas y entrega en aeropuerto.<br />
          Tres sedes. Una sola experiencia de élite.
        </p>

        {/* Stats row */}
        <div className={styles.stats}>
          {[['+500', 'Vehículos'], ['3', 'Ciudades'], ['24h', 'Soporte'], ['98%', 'Satisfacción']].map(([val, lbl]) => (
            <div key={lbl} className={styles.stat}>
              <span className={styles.statVal}>{val}</span>
              <span className={styles.statLbl}>{lbl}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Engine */}
      <div ref={engineRef} className={styles.engineWrap}>
        <BookingEngine />
      </div>
    </section>
  );
}
