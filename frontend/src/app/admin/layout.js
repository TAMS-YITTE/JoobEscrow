import { notFound } from 'next/navigation';

// Outil interne : 404 en production, accessible seulement via `npm run dev`.
export const metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }) {
  if (process.env.NODE_ENV === 'production') notFound();
  return children;
}
