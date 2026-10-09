import Link from 'next/link';

// Static generation for the blog posts; any other slug returns a 404.
export const dynamicParams = false;
export function generateStaticParams() {
  return [
    { slug: 'understanding-decentralized-arbitration' }
  ];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const titles = {
    'understanding-decentralized-arbitration': 'How Dispute Resolution Works on JoobEscrow'
  };
  
  const title = titles[slug] || 'Blog Post';
  
  return {
    title: `${title} | JoobEscrow`,
    description: `Read about ${title.toLowerCase()} on the JoobEscrow Web3 security blog.`,
    alternates: { canonical: `/blog/${slug}` },
  };
}

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const content = {
    'understanding-decentralized-arbitration': (
      <article className="prose prose-invert lg:prose-xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-6">How Dispute Resolution Works on JoobEscrow</h1>
        <p className="text-gray-400 mb-4">When a freelance contract goes wrong, traditional legal systems are too slow and expensive. Web3 needs a better way.</p>
        <p className="text-gray-400 mb-4">On JoobEscrow, either party can open a dispute while the funds are locked. Both sides share their evidence (deliverables, messages, original requirements), and the JoobEscrow arbitration team compares the work delivered with what was agreed. The decision is executed by the smart contract, which can split the funds in any proportion, from 0 to 100%.</p>
        <p className="text-gray-400 mb-4">The contract can record a fingerprint (hash) of each piece of evidence on-chain; in-app evidence upload is coming. If a dispute is left unresolved for 30 days, either party can trigger a 50/50 split on-chain with resolveStaleDispute.</p>
      </article>
    )
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-16 px-4">
      <div className="mb-8">
        <Link href="/blog" className="text-gray-500 hover:text-white transition">
          ← Back to Blog
        </Link>
      </div>
      
      <div className="glass-panel p-8 md:p-12">
        {content[slug] || <p>Article not found.</p>}
      </div>

      <div className="mt-12 text-center">
        <Link href="/app" className="btn btn-primary px-8 py-3">
          Secure Your Next Deal
        </Link>
      </div>
    </div>
  );
}
