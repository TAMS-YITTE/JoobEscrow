import "./globals.css";
import "./app-utilities.css";
import { ToastProvider } from "../context/ToastContext";
import { Analytics } from "@vercel/analytics/react";
import { Suspense } from "react";
import ReferralTracker from "../components/ReferralTracker";

export const metadata = {
  metadataBase: new URL('https://www.joobescrow.com'),
  title: "JoobEscrow | The Universal Web3 Escrow",
  description: "Secure every payment. Pay only when the work is approved. The universal non-custodial escrow platform for freelancers, creators, and businesses.",
  keywords: ["escrow", "web3 escrow", "crypto escrow", "freelance crypto", "smart contract", "secure payment"],
  icons: {
    icon: [{ url: '/logo.svg', type: 'image/svg+xml' }, { url: '/logo.png', type: 'image/png' }],
    apple: '/apple-icon.png',
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "JoobEscrow | The Universal Web3 Escrow",
    description: "Secure every payment. Pay only when the work is approved. The universal non-custodial escrow platform for freelancers, creators, and businesses.",
    images: [{ url: "/og-image.png", width: 1500, height: 500 }],
    type: "website",
    url: 'https://www.joobescrow.com',
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
          <Suspense fallback={null}>
            <ReferralTracker />
          </Suspense>
          <Analytics />
        </ToastProvider>
      </body>
    </html>
  );
}
