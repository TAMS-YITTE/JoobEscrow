import Link from 'next/link';

export const metadata = {
  title: 'Blog | JoobEscrow',
  description: 'News, guides, and insights on decentralized escrow, freelancing, and Web3 security.',
  alternates: { canonical: '/blog' },
};

export default function BlogIndex() {
  const articles = [
    {
      slug: 'understanding-decentralized-arbitration',
      title: 'How Dispute Resolution Works on JoobEscrow',
      date: 'June 20, 2026',
      excerpt: 'What happens when a freelancer and a client disagree? How disputes are opened, reviewed and settled on-chain, and what protects both sides.'
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
