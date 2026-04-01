import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { gsap } from 'gsap';
import { offices } from '../data/offices';
import { api } from '../lib/api';
import styles from './ContactPage.module.css';

type ContactFormData = {
  nombre: string;
  email: string;
  telefono: string;
  mensaje: string;
};

const initialFormData: ContactFormData = {
  nombre: '',
  email: '',
  telefono: '',
  mensaje: '',
};

const localOffices = offices.filter(office =>
  ['Zaragoza', 'Tudela', 'Soria'].includes(office.city),
);

const whatsappDisplayNumber = '+34 608 808 240';
const whatsappLinkNumber = '34608808240';
const whatsappPrefilledMessage =
  'Hola, me interesa recibir informacion sobre alquiler y renting.';

export default function ContactPage() {
  const pageRef = useRef<HTMLElement>(null);
  const infoColumnRef = useRef<HTMLDivElement>(null);
  const formColumnRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const page = pageRef.current;

    if (!page) {
      return;
    }

    const ctx = gsap.context(() => {
      if (infoColumnRef.current) {
        gsap.fromTo(
          infoColumnRef.current,
          { x: -50, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out' },
        );
      }

      if (formColumnRef.current) {
        gsap.fromTo(
          formColumnRef.current,
          { x: 50, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out', delay: 0.1 },
        );
      }
    }, page);

    return () => ctx.revert();
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (isSubmitted) {
      setIsSubmitted(false);
    }
  };

  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setSubmitError(null);

    try {
      await api.post('/api/contact', formData);
      setFormData(initialFormData);
      setIsSubmitted(true);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Error al enviar el mensaje');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main ref={pageRef} className={styles.page}>
      <div className={styles.layout}>
        <section ref={infoColumnRef} className={styles.infoColumn} aria-label="Información de contacto directa">
          <h1 className={styles.title}>HABLEMOS</h1>
          <p className={styles.subtitle}>Estamos aquí para darte la mejor solución de movilidad.</p>

          <div className={styles.officeList}>
            {localOffices.map((office) => (
              <article key={office.id} className={styles.officeCard}>
                <h2>{office.city}</h2>
                <a href={`tel:${office.phone.replace(/\s+/g, '')}`}>{office.phone}</a>
              </article>
            ))}
          </div>

          <a
            className={styles.whatsappButton}
            href={`https://wa.me/${whatsappLinkNumber}?text=${encodeURIComponent(whatsappPrefilledMessage)}`}
            target="_blank"
            rel="noreferrer"
            aria-label={`Abrir chat de WhatsApp al ${whatsappDisplayNumber}`}
          >
            <span className={styles.whatsappLead}>Chat por WhatsApp</span>
            <strong className={styles.whatsappNumber}>{whatsappDisplayNumber}</strong>
          </a>

          <p className={styles.chatHint}>Atencion directa para reservas y dudas comerciales.</p>
        </section>

        <section ref={formColumnRef} className={styles.formColumn} aria-label="Formulario de contacto">
          <form className={styles.formCard} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>Nombre</span>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Tu nombre"
                required
              />
            </label>

            <label className={styles.field}>
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                required
              />
            </label>

            <label className={styles.field}>
              <span>Teléfono</span>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="+34 600 000 000"
                required
              />
            </label>

            <label className={styles.field}>
              <span>Mensaje</span>
              <textarea
                name="mensaje"
                value={formData.mensaje}
                onChange={handleChange}
                placeholder="Cuéntanos qué necesitas"
                rows={4}
                required
              />
            </label>

            <button className={styles.submitButton} type="submit" disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Enviar solicitud'}
            </button>

            {submitError && (
              <p className={styles.error} role="alert" aria-live="assertive">
                {submitError}
              </p>
            )}

            {isSubmitted && (
              <p className={styles.success} role="status" aria-live="polite">
                ¡Mensaje enviado! Te responderemos muy pronto.
              </p>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}
