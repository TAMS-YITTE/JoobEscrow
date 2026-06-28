import "./globals.css";
import { ToastProvider } from "../context/ToastContext";

export const metadata = {
  metadataBase: new URL('https://joobescrow.com'),
  title: "JoobEscrow | The Universal Web3 Escrow",
  description: "Secure every payment. Pay only when the work is approved. The universal non-custodial escrow platform for freelancers, creators, and businesses.",
  keywords: ["escrow", "web3 escrow", "crypto escrow", "freelance crypto", "smart contract", "secure payment"],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "JoobEscrow | The Universal Web3 Escrow",
    description: "Secure every payment. Pay only when the work is approved. The universal non-custodial escrow platform for freelancers, creators, and businesses.",
    images: [{ url: "/og-image.png", width: 1500, height: 500 }],
    type: "website",
    url: 'https://joobescrow.com',
  },
  twitter: {
    card: "summary_large_image",
    title: "JoobEscrow | The Universal Web3 Escrow",
    description: "Secure every payment. Pay only when the work is approved. The universal non-custodial escrow platform for freelancers, creators, and businesses.",
    images: ["/og-image.png"],
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
