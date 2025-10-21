import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../components/Toast";

const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          addToast('Passwords do not match', 'error');
          setLoading(false);
          return;
        }
        
        const { error } = await signUp(formData.email, formData.password);
        if (error) {
          if (error.message.includes('already registered')) {
            addToast('This email is already registered. Try signing in instead.', 'error');
          } else {
            addToast(error.message, 'error');
          }
        } else {
          addToast('Account created successfully! Please check your email to verify your account.', 'success');
          setIsSignUp(false);
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            addToast('Invalid email or password. Please try again.', 'error');
          } else {
            addToast(error.message, 'error');
          }
        } else {
          addToast('Signed in successfully!', 'success');
          navigate('/dashboard');
        }
      }
    } catch (error) {
      addToast('An unexpected error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <div className="mb-3" style={{ fontSize: "3rem" }}>🥜</div>
                  <h2 className="h4 text-primary">NutMeg CRM</h2>
                  <p className="text-muted">
                    {isSignUp ? 'Create your account' : 'Sign in to your account'}
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Email address</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your password"
                      minLength={6}
                    />
                  </div>

                  {isSignUp && (
                    <div className="mb-3">
                      <label className="form-label">Confirm Password</label>
                      <input
                        type="password"
                        className="form-control"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        placeholder="Confirm your password"
                        minLength={6}
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        {isSignUp ? 'Creating Account...' : 'Signing In...'}
                      </>
                    ) : (
                      isSignUp ? 'Create Account' : 'Sign In'
                    )}
                  </button>
                </form>

                <div className="text-center">
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setFormData({ email: '', password: '', confirmPassword: '' });
                    }}
                  >
                    {isSignUp
                      ? 'Already have an account? Sign in'
                      : "Don't have an account? Sign up"
                    }
                  </button>
                </div>

                {!isSignUp && (
                  <div className="text-center mt-3">
                    <button
                      type="button"
                      className="btn btn-link text-decoration-none small"
                      onClick={() => addToast('Password reset functionality would be implemented here', 'info')}
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center mt-3">
              <small className="text-muted">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;