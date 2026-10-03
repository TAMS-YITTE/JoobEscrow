import KolProfileClient from './KolProfileClient';
import kolsConfig from '../../../../../config/kols.json';

// Un profil par entree de kols.json (hors 'admin', gabarit interne) ; tout autre handle = vraie 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(kolsConfig)
    .filter((handle) => handle !== 'admin')
    .map((handle) => ({ handle }));
}

export async function generateMetadata({ params }) {
  const { handle } = await params;
  return {
    title: `${handle} - JoobEscrow KOL Profile`,
    description: `Hire ${handle} through JoobEscrow: your payment stays locked on-chain until the work is delivered.`,
    openGraph: {
      title: `${handle} - JoobEscrow Verified KOL`,
      description: `Hire ${handle} with on-chain escrow: pay only when the work is delivered.`,
    }
  };
}

export default async function KolProfile({ params }) {
  const { handle } = await params;
  // Pass the handle parameter to the client component
  return <KolProfileClient handle={handle} />;
}
