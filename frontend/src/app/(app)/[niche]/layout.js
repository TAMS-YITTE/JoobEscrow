import { allInstances as instances } from '../../../config/instances';
import { notFound } from 'next/navigation';

// Seules les niches connues existent : toute autre URL renvoie un vrai 404.
export const dynamicParams = false;

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
      title: 'Page not found | JoobEscrow'
    };
  }

  return {
    title: `${niche.name} | JoobEscrow`,
    description: niche.isDemo
      ? 'Try JoobEscrow with $1: run a full escrow between two of your own wallets. 0% fee, 1 to 20 USDT or USDC.'
      : `Secure payments between ${niche.lexicon.client} and ${niche.lexicon.provider} with Joob Escrow. ${niche.feeTier}% platform fee.`,
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
