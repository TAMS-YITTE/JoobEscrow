import KolProfileClient from './KolProfileClient';

export function generateStaticParams() {
  return [{ handle: 'CryptoInfluence' }];
}

export async function generateMetadata({ params }) {
  const { handle } = await params;
  return {
    title: `${handle} - JoobEscrow KOL Profile`,
    description: `Hire ${handle} safely using JoobEscrow. View on-chain reputation and verified delivery history.`,
    openGraph: {
      title: `${handle} - JoobEscrow Verified KOL`,
      description: `View ${handle}'s on-chain escrow history and hire them with 0 risk.`,
    }
  };
}

export default async function KolProfile({ params }) {
  const { handle } = await params;
  // Pass the handle parameter to the client component
  return <KolProfileClient handle={handle} />;
}
