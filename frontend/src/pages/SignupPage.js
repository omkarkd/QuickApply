import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { FileText, ArrowLeft, Loader2, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const SignupPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await register(formData.name, formData.email, formData.password);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    "AI-powered resume parsing",
    "Export as PDF or DOCX",
    "Save unlimited resumes",
    "Edit anytime, anywhere"
  ];

  return (
    <div className="min-h-screen bg-neutral-50 noise-overlay flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex flex-1 bg-indigo-950 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-lime-200/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-lime-200/5 rounded-full blur-3xl"></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-10"
        >
          <h2 className="text-3xl font-bold text-white mb-6" style={{ fontFamily: 'Manrope' }}>
            Start Your Journey
          </h2>
          <p className="text-indigo-200 mb-8 max-w-sm">
            Create your account and transform your resume in minutes.
          </p>
          
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-6 h-6 bg-lime-200 rounded-sm flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-indigo-950" />
                </div>
                <span className="text-white">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Side - Form */}
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
            Create Account
          </h1>
          <p className="text-slate-600 mb-8">
            Get started with your free account
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-indigo-950 font-medium">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-12 bg-white border-neutral-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-sm input-focus-glow"
                data-testid="signup-name-input"
              />
            </div>

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
                data-testid="signup-email-input"
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
                minLength={6}
                className="h-12 bg-white border-neutral-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-sm input-focus-glow"
                data-testid="signup-password-input"
              />
              <p className="text-xs text-slate-500">Must be at least 6 characters</p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-indigo-950 hover:bg-indigo-900 text-white rounded-sm font-semibold btn-hover-lift"
              data-testid="signup-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <p className="text-center text-slate-600 mt-6">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="text-indigo-950 font-medium hover:underline"
              data-testid="login-link"
            >
              Log in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;
