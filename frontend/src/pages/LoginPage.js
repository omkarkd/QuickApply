import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { FileText, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(formData.email, formData.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.detail || 'Invalid credentials';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 noise-overlay flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-950 mb-8 transition-colors"
            data-testid="back-to-home-link"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-indigo-950 rounded-sm flex items-center justify-center">
              <FileText className="w-5 h-5 text-lime-200" />
            </div>
            <span className="font-semibold text-xl text-indigo-950 tracking-tight" style={{ fontFamily: 'Manrope' }}>
              QuickResume
            </span>
          </div>

          <h1 className="text-3xl font-bold text-indigo-950 tracking-tight mb-2" style={{ fontFamily: 'Manrope' }}>
            Welcome Back
          </h1>
          <p className="text-slate-600 mb-8">
            Log in to access your saved resumes
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-indigo-950 font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="h-12 bg-white border-neutral-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-sm input-focus-glow"
                data-testid="login-email-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-indigo-950 font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="h-12 bg-white border-neutral-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-sm input-focus-glow"
                data-testid="login-password-input"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-indigo-950 hover:bg-indigo-900 text-white rounded-sm font-semibold btn-hover-lift"
              data-testid="login-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Log In'
              )}
            </Button>
          </form>

          <p className="text-center text-slate-600 mt-6">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="text-indigo-950 font-medium hover:underline"
              data-testid="signup-link"
            >
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 bg-indigo-950 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-lime-200/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-lime-200/5 rounded-full blur-3xl"></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-10 text-center"
        >
          <div className="resume-paper max-w-xs mx-auto p-6 rounded-sm mb-8">
            <div className="space-y-3">
              <div className="h-5 w-32 bg-indigo-950 rounded-sm"></div>
              <div className="h-2 w-48 bg-slate-300 rounded-sm"></div>
              <div className="h-2 w-40 bg-slate-200 rounded-sm"></div>
              <div className="pt-3 space-y-1.5">
                <div className="h-3 w-24 bg-indigo-800 rounded-sm"></div>
                <div className="h-2 w-full bg-slate-200 rounded-sm"></div>
                <div className="h-2 w-4/5 bg-slate-200 rounded-sm"></div>
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Manrope' }}>
            Your Resumes, Organized
          </h2>
          <p className="text-indigo-200 max-w-sm mx-auto">
            Access your saved resumes anytime, anywhere. Edit and download with a single click.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
