import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { FileText, Plus, MoreVertical, Edit, Trash2, Download, LogOut, User, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout, getAuthHeaders } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await axios.get(`${API}/resumes`, {
        headers: getAuthHeaders()
      });
      setResumes(response.data);
    } catch (error) {
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (resumeId) => {
    setDeletingId(resumeId);
    try {
      await axios.delete(`${API}/resumes/${resumeId}`, {
        headers: getAuthHeaders()
      });
      setResumes(resumes.filter(r => r.id !== resumeId));
      toast.success('Resume deleted');
    } catch (error) {
      toast.error('Failed to delete resume');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 noise-overlay">
      {/* Navigation */}
      <nav className="bg-white border-b border-neutral-200">
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
            
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 text-slate-700" data-testid="user-menu-btn">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-indigo-950" />
                    </div>
                    <span className="hidden sm:inline">{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-red-600 cursor-pointer"
                    data-testid="logout-btn"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-indigo-950 tracking-tight" style={{ fontFamily: 'Manrope' }}>
              My Resumes
            </h1>
            <p className="text-slate-600 mt-1">
              Manage and edit your saved resumes
            </p>
          </div>
          <Button 
            onClick={() => navigate('/editor')}
            className="bg-indigo-950 hover:bg-indigo-900 text-white rounded-sm btn-hover-lift"
            data-testid="new-resume-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Resume
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-950" />
          </div>
        ) : resumes.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-indigo-950" />
            </div>
            <h2 className="text-xl font-semibold text-indigo-950 mb-2" style={{ fontFamily: 'Manrope' }}>
              No resumes yet
            </h2>
            <p className="text-slate-600 mb-6 max-w-sm mx-auto">
              Create your first resume by pasting your content and letting us format it for you.
            </p>
            <Button 
              onClick={() => navigate('/editor')}
              className="bg-indigo-950 hover:bg-indigo-900 text-white rounded-sm btn-hover-lift"
              data-testid="create-first-resume-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Resume
            </Button>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-stagger">
            {resumes.map((resume, index) => (
              <motion.div
                key={resume.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card className="group bg-white border-neutral-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 rounded-sm overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold text-indigo-950 truncate" style={{ fontFamily: 'Manrope' }}>
                          {resume.title || 'Untitled Resume'}
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-500 mt-1">
                          Updated {formatDate(resume.updated_at)}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid={`resume-menu-${resume.id}`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => navigate(`/editor/${resume.id}`)}
                            className="cursor-pointer"
                            data-testid={`edit-resume-${resume.id}`}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(resume.id)}
                            className="text-red-600 cursor-pointer"
                            disabled={deletingId === resume.id}
                            data-testid={`delete-resume-${resume.id}`}
                          >
                            {deletingId === resume.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="bg-neutral-50 rounded-sm p-4 mb-4 aspect-[1/1.2] overflow-hidden">
                      <div className="space-y-2 opacity-60">
                        <div className="h-4 w-24 bg-indigo-950/20 rounded-sm"></div>
                        <div className="h-2 w-32 bg-slate-300 rounded-sm"></div>
                        <div className="h-2 w-28 bg-slate-200 rounded-sm"></div>
                        <div className="pt-2 space-y-1">
                          <div className="h-2 w-full bg-slate-200 rounded-sm"></div>
                          <div className="h-2 w-5/6 bg-slate-200 rounded-sm"></div>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline"
                      className="w-full border-indigo-200 text-indigo-950 hover:bg-indigo-50 rounded-sm"
                      onClick={() => navigate(`/editor/${resume.id}`)}
                      data-testid={`open-resume-${resume.id}`}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Open Editor
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
