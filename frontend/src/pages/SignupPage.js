import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { FileText, ArrowLeft, Loader2, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

// Emergent Google OAuth URL
const GOOGLE_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/authorize";

const SignupPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, handleOAuthCallback } = useAuth();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Handle OAuth callback
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      setGoogleLoading(true);
      handleOAuthCallback(sessionId)
        .then(() => {
          toast.success('Account created with Google!');
          navigate('/dashboard');
        })
        .catch((error) => {
          toast.error('Google sign-up failed');
          console.error(error);
        })
        .finally(() => setGoogleLoading(false));
    }
  }, [searchParams, handleOAuthCallback, navigate]);

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

  const handleGoogleSignUp = () => {
    const redirectUrl = encodeURIComponent(window.location.origin + '/signup');
    window.location.href = `${GOOGLE_AUTH_URL}?redirect_url=${redirectUrl}`;
  };

  const benefits = [
    "AI-powered resume parsing",
    "Export as PDF or DOCX",
    "Save unlimited resumes",
    "JD matching & scoring"
  ];

  if (googleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-950 mx-auto mb-4" />
          <p className="text-slate-600">Creating your account...</p>
        </div>
      </div>
    );
  }

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

          {/* Google Sign-Up Button */}
          <Button
            type="button"
            onClick={handleGoogleSignUp}
            className="w-full h-12 bg-white border border-neutral-300 text-slate-700 hover:bg-neutral-50 rounded-sm font-medium mb-6 flex items-center justify-center gap-3"
            data-testid="google-signup-btn"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-neutral-50 text-slate-500">or sign up with email</span>
            </div>
          </div>

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
