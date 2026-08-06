import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { blogPosts } from '../../../../data/blogPosts';
import BlogPostPage from '../../../../views/BlogPostPage';

// Los artículos se generan estáticamente en build: HTML completo e indexable.
export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((entry) => entry.slug === slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, type: 'article' },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts.find((entry) => entry.slug === slug);
  if (!post) notFound();

  return <BlogPostPage post={post} />;
}
