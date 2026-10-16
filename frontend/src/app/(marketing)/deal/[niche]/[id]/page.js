import DealClient from './DealClient';

export const metadata = {
  title: 'Escrow deal | JoobEscrow',
  description: 'Read-only view of a JoobEscrow deal: amount locked, parties, status and deadline, read directly from the smart contract.',
  robots: { index: false, follow: false },
};

export default async function DealPage({ params }) {
  const { niche, id } = await params;
  return <DealClient niche={niche} id={id} />;
}
