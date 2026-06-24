import Link from 'next/link';

// Static generation for the blog posts
export function generateStaticParams() {
  return [
    { slug: 'how-to-hire-crypto-influencers' },
    { slug: 'understanding-decentralized-arbitration' }
  ];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const titles = {
    'how-to-hire-crypto-influencers': 'How to Hire Crypto Influencers Without Getting Scammed',
    'understanding-decentralized-arbitration': 'Decentralized Arbitration: The Future of Dispute Resolution'
  };
  
  const title = titles[slug] || 'Blog Post';
  
  return {
    title: `${title} | JoobEscrow Blog`,
    description: `Read about ${title.toLowerCase()} on the JoobEscrow Web3 security blog.`,
  };
}

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const content = {
    'how-to-hire-crypto-influencers': (
      <article className="prose prose-invert lg:prose-xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-6">How to Hire Crypto Influencers Without Getting Scammed</h1>
        <p className="text-gray-400 mb-4">In the Wild West of Web3, marketing budgets are often drained by KOLs (Key Opinion Leaders) who promise massive engagement but fail to deliver. The traditional approach of paying 50% upfront involves massive counter-party risk.</p>
        <h2 className="text-2xl font-bold text-white mt-8 mb-4">The Solution: Trustless Escrow</h2>
        <p className="text-gray-400 mb-4">By using JoobEscrow, you lock the agreed-upon funds into an immutable smart contract. The influencer sees that the money is guaranteed, so they do the work. You don&apos;t release the funds until the tweet, video, or thread is live and meets your criteria.</p>
        <ul className="list-disc pl-5 text-gray-400 space-y-2 mb-8">
          <li><strong>Zero Risk for Clients:</strong> If they don&apos;t post, you get 100% of your money back.</li>
          <li><strong>Guarantee for KOLs:</strong> They know you can&apos;t run away with the payment after they post.</li>
          <li><strong>Fair Arbitration:</strong> If the post is late or poorly made, open a dispute for a partial refund.</li>
        </ul>
      </article>
    ),
    'understanding-decentralized-arbitration': (
      <article className="prose prose-invert lg:prose-xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-6">Decentralized Arbitration: The Future of Dispute Resolution</h1>
        <p className="text-gray-400 mb-4">When a freelance contract goes wrong, traditional legal systems are too slow and expensive. Web3 needs a better way.</p>
        <p className="text-gray-400 mb-4">JoobEscrow introduces an arbitration system where evidence is stored immutably on IPFS, and a neutral third party evaluates the deliverables against the original requirements, distributing funds proportionally to the work completed.</p>
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
