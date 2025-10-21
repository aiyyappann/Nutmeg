import { useState, createContext, useContext } from "react";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

let toastId = 0; // Use a simple counter for unique IDs

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 3000) => {
    const id = toastId++; // Increment the counter for a unique ID
    const toast = { id, message, type, duration };
    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="toast-container position-fixed"
      style={{
        top: '100px',    // Changed from 50%
        right: '20px',
        zIndex: 1055
        // Removed transform: 'translateY(-50%)'
      }}
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast show align-items-center text-white bg-${getBootstrapType(toast.type)} border-0 mb-2`}
          role="alert"
          style={{ minWidth: '300px' }}
        >
          <div className="d-flex">
            <div className="toast-body">
              {toast.message}
            </div>
            <button
              type="button"
              className="btn-close btn-close-white me-2 m-auto"
              onClick={() => onRemove(toast.id)}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const getBootstrapType = (type) => {
  switch (type) {
    case 'success': return 'success';
    case 'error': return 'danger';
    case 'warning': return 'warning';
    default: return 'primary';
  }
};

const Toast = () => {
  return null; // ToastContainer is rendered by ToastProvider
};

export default Toast;
