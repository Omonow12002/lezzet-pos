import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { POSProvider } from "@/context/POSContext";
import RoleSelection from "./pages/RoleSelection";
import GarsonPOS from "./pages/GarsonPOS";
import MutfakEkrani from "./pages/MutfakEkrani";
import RestoranAdmin from "./pages/RestoranAdmin";
import SuperAdmin from "./pages/SuperAdmin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <POSProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RoleSelection />} />
            <Route path="/garson" element={<GarsonPOS />} />
            <Route path="/mutfak" element={<MutfakEkrani />} />
            <Route path="/admin" element={<RestoranAdmin />} />
            <Route path="/super-admin" element={<SuperAdmin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </POSProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
