import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { FileText, Sparkles, Download, Shield, ArrowRight, Zap, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "AI-Powered Parsing",
      description: "GPT-5.2 extracts and structures your resume content intelligently"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Simple Parsing",
      description: "Fast regex-based parsing for quick formatting needs"
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: "Multiple Formats",
      description: "Export as PDF or DOCX with professional styling"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Save & Manage",
      description: "Store unlimited resumes in your personal dashboard"
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 noise-overlay">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-50/80 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-950 rounded-sm flex items-center justify-center">
                <FileText className="w-4 h-4 text-lime-200" />
              </div>
              <span className="font-semibold text-indigo-950 tracking-tight" style={{ fontFamily: 'Manrope' }}>
                QuickResume
              </span>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-indigo-950 hover:bg-indigo-900 text-white rounded-sm btn-hover-lift"
                  data-testid="nav-dashboard-btn"
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/login')}
                    className="text-indigo-950 hover:bg-indigo-100 rounded-sm"
                    data-testid="nav-login-btn"
                  >
                    Log In
                  </Button>
                  <Button 
                    onClick={() => navigate('/signup')}
                    className="bg-indigo-950 hover:bg-indigo-900 text-white rounded-sm btn-hover-lift"
                    data-testid="nav-signup-btn"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-lime-200 rounded-sm text-sm font-medium text-indigo-950">
                <Sparkles className="w-4 h-4" />
                AI-Powered Resume Formatting
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-indigo-950 tracking-tight leading-tight" style={{ fontFamily: 'Manrope' }}>
                Transform Your Resume in
                <span className="block text-lime-600">One Click</span>
              </h1>
              
              <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
                Paste your resume text and watch it transform into a professionally formatted document. 
                Choose AI-powered parsing or simple formatting. Download as PDF or DOCX.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={() => navigate(user ? '/editor' : '/signup')}
                  size="lg"
                  className="bg-indigo-950 hover:bg-indigo-900 text-white rounded-sm px-8 py-6 text-base font-semibold btn-hover-lift"
                  data-testid="hero-get-started-btn"
                >
                  Start Formatting
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/login')}
                  className="border-indigo-950 text-indigo-950 hover:bg-indigo-50 rounded-sm px-8 py-6 text-base font-semibold"
                  data-testid="hero-login-btn"
                >
                  I Have an Account
                </Button>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-indigo-200 border-2 border-white flex items-center justify-center">
                      <Users className="w-4 h-4 text-indigo-700" />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-indigo-950">2,500+</span> resumes formatted this month
                </p>
              </div>
            </motion.div>

            {/* Right - Preview */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-lime-200/30 rounded-lg blur-3xl"></div>
              <div className="relative bg-white rounded-sm border border-neutral-200 shadow-2xl p-8">
                <div className="resume-paper p-6 overflow-hidden">
                  <div className="space-y-4">
                    <div className="h-6 w-48 bg-indigo-950 rounded-sm"></div>
                    <div className="h-3 w-64 bg-slate-300 rounded-sm"></div>
                    <div className="h-3 w-56 bg-slate-200 rounded-sm"></div>
                    <div className="pt-4 space-y-2">
                      <div className="h-4 w-32 bg-indigo-800 rounded-sm"></div>
                      <div className="h-3 w-full bg-slate-200 rounded-sm"></div>
                      <div className="h-3 w-5/6 bg-slate-200 rounded-sm"></div>
                    </div>
                    <div className="pt-4 space-y-2">
                      <div className="h-4 w-28 bg-indigo-800 rounded-sm"></div>
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="h-6 w-16 bg-lime-200 rounded-sm"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 lg:px-8 bg-white border-y border-neutral-200">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-indigo-950 tracking-tight mb-4" style={{ fontFamily: 'Manrope' }}>
              Everything You Need
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Professional resume formatting with flexible options
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group p-6 bg-neutral-50 border border-neutral-200 rounded-sm hover:border-indigo-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 bg-indigo-950 rounded-sm flex items-center justify-center text-lime-200 mb-4 group-hover:scale-105 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-indigo-950 mb-2" style={{ fontFamily: 'Manrope' }}>
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-indigo-950 rounded-sm p-12 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-lime-200/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4" style={{ fontFamily: 'Manrope' }}>
                Ready to Format Your Resume?
              </h2>
              <p className="text-lg text-indigo-200 mb-8 max-w-xl mx-auto">
                Join thousands of professionals who trust QuickResume for their career documents.
              </p>
              <Button 
                onClick={() => navigate(user ? '/editor' : '/signup')}
                size="lg"
                className="bg-lime-200 hover:bg-lime-300 text-indigo-950 rounded-sm px-8 py-6 text-base font-semibold btn-hover-lift"
                data-testid="cta-get-started-btn"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 lg:px-8 border-t border-neutral-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-950 rounded-sm flex items-center justify-center">
              <FileText className="w-3 h-3 text-lime-200" />
            </div>
            <span className="text-sm text-slate-600">
              QuickResume © 2024
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Built with precision and care
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
