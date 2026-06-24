import KolProfileClient from './KolProfileClient';

export function generateStaticParams() {
  return [{ handle: 'CryptoInfluence' }];
}

export default function KolProfile({ params }) {
  // Pass the handle parameter to the client component
  return <KolProfileClient handle={params.handle} />;
}
