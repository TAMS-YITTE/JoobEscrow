import { instances } from '../../config/instances';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return Object.keys(instances).map((slug) => ({
    niche: slug,
  }));
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams.niche;
  const niche = instances[slug];
  
  if (!niche) {
    return {
      title: 'Page Not Found - Joob'
    };
  }

  return {
    title: `Joob Escrow | ${niche.name}`,
    description: `Secure payments between ${niche.lexicon.client} and ${niche.lexicon.provider} with Joob Escrow. ${niche.feeTier}% platform fee.`,
    alternates: {
      canonical: `/${slug}`,
    }
  };
}

export default async function NicheLayout({ children, params }) {
  const resolvedParams = await params;
  const slug = resolvedParams.niche;
  
  // If the slug doesn't exist in our instances, trigger a 404
  if (!instances[slug]) {
    notFound();
  }

  return <>{children}</>;
}
