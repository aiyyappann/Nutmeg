import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Home, Users, Target, MessageCircle, Headphones, BarChart3, Settings, Shield } from "lucide-react";
// ... other imports
import { DollarSign } from "lucide-react";





const Sidebar = () => {
  const { isAdmin } = useAuth();
  
  const menuItems = [
    { path: "/dashboard", label: "Dashboard", Icon: Home },
    { path: "/customers", label: "Customers", Icon: Users },
    { path: "/deals", label: "Deals", Icon: DollarSign },
    { path: "/segments", label: "Segments", Icon: Target },
    { path: "/interactions", label: "Interactions", Icon: MessageCircle },
    { path: "/support", label: "Support", Icon: Headphones },
    { path: "/reports", label: "Reports", Icon: BarChart3 },
    { path: "/settings", label: "Settings", Icon: Settings }

  ];

  const adminItems = [
    { path: "/admin", label: "Admin Panel", Icon: Shield }
  ];

  return (
    <div className="sidebar" style={{ width: "250px" }}>
      <div className="p-3">
        <h4 className="navbar-brand text-primary mb-4">
          CRM Pro
        </h4>
        <nav className="nav flex-column">
          {menuItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `nav-link d-flex align-items-center ${isActive ? 'active' : ''}`
              }
             >
               <item.Icon size={18} className="me-2" />
               {item.label}
             </NavLink>
          ))}
          
          {isAdmin() && (
            <>
              <hr className="my-3" />
              <div className="text-muted small mb-2 px-3">Admin</div>
              {adminItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => 
                    `nav-link d-flex align-items-center ${isActive ? 'active' : ''}`
                  }
                 >
                   <item.Icon size={18} className="me-2" />
                   {item.label}
                 </NavLink>
              ))}
            </>
          )}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;