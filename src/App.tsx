import { useState } from "react";
import { Outlet, Route, Routes } from "react-router-dom";
import { Sidebar } from "./components/layout/Sidebar";
import { RequireAuth } from "./components/auth/RequireAuth";
import { CreateCampaignModal } from "./components/campaigns/CreateCampaignModal";
import { AuthPage } from "./pages/AuthPage";
import { ApprovalsPage } from "./pages/ApprovalsPage";
import { AssetsPage } from "./pages/AssetsPage";
import { BrandsPage } from "./pages/BrandsPage";
import { CampaignDetailPage } from "./pages/CampaignDetailPage";
import { CampaignsPage } from "./pages/CampaignsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { ProductIntakePage } from "./pages/ProductIntakePage";
import { ProductsPage } from "./pages/ProductsPage";
import { SettingsPage } from "./pages/SettingsPage";

/**
 * App-level state for the Create Campaign modal.
 * Lifted here so it can be triggered from any page (Dashboard quick actions,
 * Products "Create Campaign" button, Campaigns "New Campaign" button, etc.).
 */
interface CampaignModalState {
  open: boolean;
  preselectedProductId?: string;
}

export const createCampaignModal = {
  _setState: null as ((s: CampaignModalState) => void) | null,
  open(preselectedProductId?: string) {
    this._setState?.({ open: true, preselectedProductId });
  },
};

/** Layout for the internal product: sidebar + routed page content. */
function AppShell() {
  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}

function App() {
  const [modal, setModal] = useState<CampaignModalState>({ open: false });
  const [toast, setToast] = useState<string | null>(null);

  // Register the global opener so any page can call createCampaignModal.open()
  createCampaignModal._setState = setModal;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  return (
    <>
      <Routes>
        {/* Public — no app sidebar, no auth required */}
        <Route path="/home" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage />} />

        {/* Internal product — requires a session, then sidebar + routed pages */}
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<ProductIntakePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/brands" element={<BrandsPage />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>

      {/* Global Create Campaign modal */}
      <CreateCampaignModal
        open={modal.open}
        preselectedProductId={modal.preselectedProductId}
        onClose={() => setModal({ open: false })}
        onCreated={(name) => showToast(`"${name}" created! You're now in the Campaign Workspace.`)}
      />

      {/* Global toast (used for modal feedback) */}
      {toast && (
        <output className="surface fixed right-6 bottom-6 z-[60] block px-4 py-3 text-sm font-medium shadow-lift">
          {toast}
        </output>
      )}
    </>
  );
}

export default App;
