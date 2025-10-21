import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Toast from "./Toast";
import { useAuth } from "../hooks/useAuth";

const Layout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 main-content">
        <Header />
        <main className="container-fluid p-4">
          <Outlet />
        </main>
      </div>
      <Toast />
    </div>
  );
};

export default Layout;