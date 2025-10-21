import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Users } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
      <div className="text-center">
        <div className="mb-4" style={{ fontSize: "6rem" }}>🤔</div>
        <h1 className="display-1 fw-bold text-primary">404</h1>
        <h2 className="h4 mb-3">Page Not Found</h2>
        <p className="text-muted mb-4">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>
        <div className="d-flex gap-2 justify-content-center">
          <Link to="/dashboard" className="btn btn-primary">
            <Home size={16} className="me-1" />
            Go to Dashboard
          </Link>
          <Link to="/customers" className="btn btn-outline-primary">
            <Users size={16} className="me-1" />
            View Customers
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;