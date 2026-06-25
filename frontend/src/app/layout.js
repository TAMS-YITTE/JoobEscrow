import "./globals.css";

export const metadata = {
  metadataBase: new URL('https://joobescrow.com'),
  title: "JoobEscrow | The Universal Web3 Escrow",
  description: "Secure every payment. Pay only when the work is approved. The universal decentralized escrow platform for freelancers, creators, and businesses.",
  openGraph: {
    title: "JoobEscrow | The Universal Web3 Escrow",
    description: "Secure every payment. Pay only when the work is approved. The universal decentralized escrow platform for freelancers, creators, and businesses.",
    images: [{ url: "/og-image.png", width: 1500, height: 500 }],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "JoobEscrow | The Universal Web3 Escrow",
    description: "Secure every payment. Pay only when the work is approved. The universal decentralized escrow platform for freelancers, creators, and businesses.",
    images: ["/og-image.png"],
  }
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
