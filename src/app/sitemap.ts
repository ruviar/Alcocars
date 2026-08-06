import type { MetadataRoute } from 'next';
import { blogPosts } from '../data/blogPosts';
import { legalDocuments } from '../data/legalContent';

const BASE = 'https://alcocars.es';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '',
    '/flota',
    '/tarifas',
    '/servicios',
    '/sedes',
    '/empresa',
    '/faqs',
    '/blog',
    '/contacto',
  ].map((route) => ({
    url: `${BASE}${route}`,
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  const legalRoutes = Object.keys(legalDocuments).map((slug) => ({
    url: `${BASE}/legal/${slug}`,
    changeFrequency: 'yearly' as const,
    priority: 0.3,
  }));

  const blogRoutes = blogPosts.map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...legalRoutes, ...blogRoutes];
}
