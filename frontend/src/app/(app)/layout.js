import Sidebar from "../../components/Sidebar";
import { Web3Provider } from "../../context/Web3Context";
import { NicheProvider } from "../../context/NicheContext";
import AppGuard from "../../components/AppGuard";

export default function AppLayout({ children }) {
  return (
    <Web3Provider>
      <NicheProvider>
        <div className="app-container">
          <Sidebar />
          <main className="main-content">
            <AppGuard>
              {children}
            </AppGuard>
          </main>
        </div>
      </NicheProvider>
    </Web3Provider>
  );
}
