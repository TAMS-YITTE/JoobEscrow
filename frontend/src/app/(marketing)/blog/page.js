import Link from 'next/link';

export const metadata = {
  title: 'Blog | JoobEscrow',
  description: 'News, guides, and insights on decentralized escrow, freelancing, and Web3 security.',
};

export default function BlogIndex() {
  const articles = [
    {
      slug: 'how-to-hire-crypto-influencers',
      title: 'How to Hire Crypto Influencers Without Getting Scammed',
      date: 'June 24, 2026',
      excerpt: 'The influencer marketing space in Web3 is notorious for rug pulls and unfulfilled promises. Learn how to protect your marketing budget using smart contracts.'
    },
    {
      slug: 'understanding-decentralized-arbitration',
      title: 'Decentralized Arbitration: The Future of Dispute Resolution',
      date: 'June 20, 2026',
      excerpt: 'What happens when a freelancer and a client disagree? Discover how JoobEscrow uses impartial, transparent, and fast on-chain arbitration.'
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">JoobEscrow <span className="text-gradient">Blog</span></h1>
        <p className="text-gray-400 text-lg">Insights on Web3 security, freelancing safely, and non-custodial escrow.</p>
      </div>

      <div className="space-y-8">
        {articles.map(article => (
          <div key={article.slug} className="glass-panel p-8 hover:border-green-500/50 transition">
            <div className="text-sm text-gray-500 mb-2">{article.date}</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              <Link href={`/blog/${article.slug}`} className="hover:text-green-400 transition">
                {article.title}
              </Link>
            </h2>
            <p className="text-gray-400 mb-6">{article.excerpt}</p>
            <Link href={`/blog/${article.slug}`} className="text-gradient font-bold">
              Read more →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
