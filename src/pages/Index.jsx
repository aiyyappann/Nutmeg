import { Link } from "react-router-dom";
import { Users } from "lucide-react";

const Index = () => {
  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
      <div className="text-center">
        <div className="mb-4" style={{ fontSize: "4rem" }}>🥜</div>
        <h1 className="display-4 fw-bold text-primary mb-3">Welcome to NutMeg CRM</h1>
        <p className="lead text-muted mb-4">
          Your comprehensive customer relationship management solution
        </p>
        <div className="d-flex gap-3 justify-content-center">
          <Link to="/dashboard" className="btn btn-primary btn-lg">
            Go to Dashboard
          </Link>
          <Link to="/customers" className="btn btn-outline-primary btn-lg">
            <Users size={18} className="me-2" />
            View Customers
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;