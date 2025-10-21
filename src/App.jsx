import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, createContext, useContext } from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerForm from "./pages/CustomerForm";
import CustomerDetail from "./pages/CustomerDetail";
import Segments from "./pages/Segments";
import Interactions from "./pages/Interactions";
import Support from "./pages/Support";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AdminPanel from "./components/AdminPanel";
import { AuthProvider } from "./hooks/useAuth.jsx";
import { ToastProvider } from "./components/Toast";
import { DataProvider } from "./api/DataProvider.js";
import Deals from "./pages/Deals.jsx";
// Global App Context
const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

const App = () => {
  const [mockMode, setMockMode] = useState(() => {
    return localStorage.getItem('crm_mock_mode') !== 'false';
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('crm_settings');
    return saved ? JSON.parse(saved) : {
      pageSize: 10,
      apiEndpoint: 'https://api.nutmegcrm.com',
      theme: 'light'
    };
  });

  const updateSettings = (newSettings) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('crm_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleMockMode = () => {
    setMockMode(prev => {
      const newMode = !prev;
      localStorage.setItem('crm_mock_mode', newMode.toString());
      return newMode;
    });
  };

  return (
    <AuthProvider>
      <ToastProvider>
        <AppContext.Provider value={{
          mockMode,
          toggleMockMode,
          settings,
          updateSettings,
          dataProvider: DataProvider
        }}>
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="customers" element={<Customers />} />
                <Route path="customers/new" element={<CustomerForm />} />
                <Route path="customers/:id/edit" element={<CustomerForm />} />
                <Route path="Deals" element={<Deals />} />
                {/* <Route path="Deals/:id/stage" element={<Deals />} /> */}
                <Route path="customers/:id" element={<CustomerDetail />} />
                <Route path="segments" element={<Segments />} />
                <Route path="interactions" element={<Interactions />} />
                <Route path="support" element={<Support />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="admin" element={<AdminPanel dataProvider={DataProvider} />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AppContext.Provider>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;