import Link from 'next/link';
import WhatsNextWidget from '../../../../components/WhatsNext';

export async function generateMetadata({ params }) {
  const { niche } = await params;
  return {
    title: "What's next | JoobEscrow",
    description: 'The next JoobEscrow milestones from our public roadmap: alerts, JOOB staking, lower fees, milestone payments and more.',
    alternates: { canonical: `/${niche}/whats-next` },
  };
}

export default function WhatsNextPage() {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="text-gradient">What&apos;s next 🚀</h1>
          <p className="subtitle">
            Our public roadmap: each milestone ships when it is ready, and audited where needed.
          </p>
        </div>
      </header>

      <WhatsNextWidget title="Coming to JoobEscrow" />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/roadmap" className="btn btn-outline">Full roadmap →</Link>
        <Link href="/presale" className="btn btn-primary">Join the JOOB presale →</Link>
      </div>
    </div>
  );
}
