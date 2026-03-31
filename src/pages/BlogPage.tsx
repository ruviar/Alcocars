import heroCompanyImage from '../assets/images/hero-company.webp';
import missionImage from '../assets/images/mission-bg.webp';
import rentingImage from '../assets/images/service-renting.webp';
import adaptedImage from '../assets/images/service-adaptado.webp';
import airportImage from '../assets/images/service-aero.webp';
import styles from './BlogPage.module.css';

type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readingTime: string;
  date: string;
  image: string;
};

const posts: BlogPost[] = [
  {
    id: 'guia-furgoneta',
    title: 'Guia para alquilar tu furgoneta sin sorpresas',
    excerpt:
      'Checklist rapido de documentacion, kilometraje, franquicias y tiempos de devolucion para alquilar con tranquilidad.',
    category: 'Consejos',
    readingTime: '6 min',
    date: '31 Mar 2026',
    image: missionImage,
  },
  {
    id: 'renting-negocio',
    title: 'Renting flexible para pymes: como reducir costes de movilidad',
    excerpt:
      'Modelos de contratacion recomendados para empresas que necesitan escalar su flota sin inmovilizar capital.',
    category: 'Empresa',
    readingTime: '8 min',
    date: '28 Mar 2026',
    image: rentingImage,
  },
  {
    id: 'recogida-aeropuerto',
    title: 'Recogida express en aeropuerto: pasos para salir en menos de 10 minutos',
    excerpt:
      'Buenas practicas para agilizar la entrega del vehiculo en periodos de alta demanda y vuelos con retraso.',
    category: 'Aeropuerto',
    readingTime: '5 min',
    date: '22 Mar 2026',
    image: airportImage,
  },
  {
    id: 'vehiculo-adaptado',
    title: 'Como elegir un vehiculo adaptado para viajes familiares',
    excerpt:
      'Capacidad, seguridad, puntos de anclaje y confort: factores clave al reservar una unidad adaptada.',
    category: 'Accesibilidad',
    readingTime: '7 min',
    date: '18 Mar 2026',
    image: adaptedImage,
  },
  {
    id: 'roadtrip-norte',
    title: 'Roadtrip por el norte: rutas perfectas para un fin de semana largo',
    excerpt:
      'Itinerarios recomendados, consumo estimado y paradas para aprovechar al maximo tu alquiler de escapada.',
    category: 'Viajes',
    readingTime: '9 min',
    date: '12 Mar 2026',
    image: heroCompanyImage,
  },
];

export default function BlogPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.kicker}>De interes</p>
          <h1 className={styles.title}>BLOG</h1>
          <p className={styles.subtitle}>
            Guias rapidas, novedades de movilidad y recomendaciones para sacar el maximo partido a cada reserva.
          </p>
        </header>

        <section className={styles.grid} aria-label="Articulos destacados del blog">
          {posts.map((post) => (
            <article key={post.id} className={styles.card}>
              <div className={styles.media}>
                <img src={post.image} alt={post.title} loading="lazy" />
                <span className={styles.category}>{post.category}</span>
              </div>

              <div className={styles.content}>
                <p className={styles.meta}>
                  <span>{post.date}</span>
                  <span>{post.readingTime}</span>
                </p>
                <h2 className={styles.cardTitle}>{post.title}</h2>
                <p className={styles.excerpt}>{post.excerpt}</p>

                <button type="button" className={styles.readMoreButton}>
                  Leer articulo
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
