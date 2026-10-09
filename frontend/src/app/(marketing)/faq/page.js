import Link from 'next/link';
import { FAQ } from '../../../config/faq';

export const metadata = {
  title: 'FAQ | JoobEscrow',
  description: 'How JoobEscrow holds funds in an audited non-custodial contract, who can release them, how disputes are split by a 3-of-5 Safe, what fees apply and how chat is encrypted.',
  alternates: { canonical: '/faq' },
};

export default function FAQPage() {
  return (
    <div className="w-full max-w-4xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked <span className="text-gradient">Questions</span></h1>
        <p className="text-gray-400 text-lg">Everything you need to know about how JoobEscrow secures your transactions.</p>
      </div>

      <div className="space-y-6">
        {FAQ.map((f) => (
          <div key={f.id} id={f.id} className="glass-panel p-6" style={{ scrollMarginTop: '90px' }}>
            <h2 className="font-bold text-xl text-white mb-3">{f.q}</h2>
            <p className="text-gray-400">{f.summary}</p>
            {f.details?.map((d) => (
              <p key={d} className="text-gray-400" style={{ marginTop: '10px' }}>{d}</p>
            ))}
            {f.link && (
              <p style={{ marginTop: '10px' }}>
                <Link href={f.link.href} className="text-emerald-400 underline hover:text-emerald-300">{f.link.label} →</Link>
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link href="/app" className="btn btn-primary px-8 py-3">
          Launch App
        </Link>
      </div>
    </div>
  );
}
