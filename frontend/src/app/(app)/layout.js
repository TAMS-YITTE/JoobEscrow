import Sidebar from "../../components/Sidebar";
import { Web3Provider } from "../../context/Web3Context";
import { NicheProvider } from "../../context/NicheContext";
import { XMTPProviderWrapper } from "../../context/XMTPContext";
import AppGuard from "../../components/AppGuard";
import CrispChat from "../../components/CrispChat";
import SecurityBanner from "../../components/SecurityBanner";

export default function AppLayout({ children }) {
  return (
    <Web3Provider>
      <XMTPProviderWrapper>
        <NicheProvider>
          <div className="app-container">
            <Sidebar />
            <main className="main-content">
              <AppGuard>
                <SecurityBanner />
                {children}
              </AppGuard>
            </main>
          </div>
          <CrispChat />
        </NicheProvider>
      </XMTPProviderWrapper>
    </Web3Provider>
  );
}
