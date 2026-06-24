import "./globals.css";

export const metadata = {
  metadataBase: new URL('https://joobescrow.com'),
  title: "Joob Escrow - Premium Web3 Escrow",
  description: "Joob Escrow - The Universal Decentralized Trust Layer",
  openGraph: {
    title: "Joob Escrow - Premium Web3 Escrow",
    description: "The Universal Decentralized Trust Layer",
    images: [{ url: "/og-image.png", width: 1024, height: 1024 }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
