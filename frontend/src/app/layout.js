import "./globals.css";
import Sidebar from "../components/Sidebar";
import { Web3Provider } from "../context/Web3Context";
import { NicheProvider } from "../context/NicheContext";

export const metadata = {
  title: "Joob Escrow - Premium Web3 Escrow",
  description: "Joob Escrow - The Universal Decentralized Trust Layer",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Web3Provider>
          <NicheProvider>
            <div className="app-container">
              <Sidebar />
              <main className="main-content">
                {children}
              </main>
            </div>
          </NicheProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
