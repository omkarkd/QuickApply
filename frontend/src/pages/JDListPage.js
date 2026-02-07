import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Briefcase, Plus, MoreVertical, Edit, Trash2, Loader2, MapPin, Clock, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function JDListPage() {
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  const [jds, setJds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchJDs();
  }, []);

  const fetchJDs = async () => {
    try {
      const response = await axios.get(API + '/jds', { headers: getAuthHeaders() });
      setJds(response.data);
    } catch (error) {
      toast.error('Failed to load job descriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jdId) => {
    setDeletingId(jdId);
    try {
      await axios.delete(API + '/jds/' + jdId, { headers: getAuthHeaders() });
      setJds(jds.filter(j => j.id !== jdId));
      toast.success('JD deleted');
    } catch (error) {
      toast.error('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Sidebar />
      
      <main className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-indigo-950 tracking-tight" style={{ fontFamily: 'Manrope' }}>
                Job Descriptions
              </h1>
              <p className="text-slate-600 mt-1">Parse and manage job descriptions</p>
            </div>
            <Button 
              onClick={() => navigate('/jd/editor')}
              className="bg-indigo-950 hover:bg-indigo-900 text-white"
              data-testid="new-jd-btn"
            >
              <Plus className="w-4 h-4 mr-2" />New JD
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-950" />
            </div>
          ) : jds.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
              <div className="w-20 h-20 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-10 h-10 text-indigo-950" />
              </div>
              <h2 className="text-xl font-semibold text-indigo-950 mb-2">No job descriptions yet</h2>
              <p className="text-slate-600 mb-6 max-w-sm mx-auto">Parse your first job description to extract key requirements.</p>
              <Button onClick={() => navigate('/jd/editor')} className="bg-indigo-950 hover:bg-indigo-900 text-white" data-testid="create-first-jd-btn">
                <Plus className="w-4 h-4 mr-2" />Add Job Description
              </Button>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {jds.map((jd, index) => (
                <motion.div
                  key={jd.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Card className="group bg-white border-neutral-200 hover:border-indigo-300 hover:shadow-lg transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold text-indigo-950 truncate">
                            {jd.parsed_data?.job_title || jd.title || 'Untitled JD'}
                          </CardTitle>
                          <CardDescription className="text-sm text-slate-500 mt-1">
                            {jd.parsed_data?.company || 'Company not specified'}
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100" data-testid={`jd-menu-${jd.id}`}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate('/jd/editor/' + jd.id)} data-testid={`edit-jd-${jd.id}`}>
                              <Edit className="w-4 h-4 mr-2" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(jd.id)} className="text-red-600" disabled={deletingId === jd.id} data-testid={`delete-jd-${jd.id}`}>
                              {deletingId === jd.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 mb-4">
                        {jd.parsed_data?.location && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin className="w-3 h-3" />
                            <span>{jd.parsed_data.location}</span>
                          </div>
                        )}
                        {jd.parsed_data?.experience_required && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Clock className="w-3 h-3" />
                            <span>{jd.parsed_data.experience_required}</span>
                          </div>
                        )}
                        {jd.parsed_data?.job_type && (
                          <span className="inline-block px-2 py-1 bg-lime-100 text-indigo-950 text-xs rounded-sm">
                            {jd.parsed_data.job_type}
                          </span>
                        )}
                      </div>
                      
                      {jd.parsed_data?.must_have_skills && jd.parsed_data.must_have_skills.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-indigo-950 uppercase mb-1">Must Have</p>
                          <div className="flex flex-wrap gap-1">
                            {jd.parsed_data.must_have_skills.slice(0, 3).map((skill, i) => (
                              <span key={i} className="px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded-sm">{skill}</span>
                            ))}
                            {jd.parsed_data.must_have_skills.length > 3 && (
                              <span className="px-2 py-0.5 bg-neutral-100 text-slate-600 text-xs rounded-sm">+{jd.parsed_data.must_have_skills.length - 3}</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <p className="text-xs text-slate-500 mb-4">Updated {formatDate(jd.updated_at)}</p>
                      
                      <Button variant="outline" className="w-full border-indigo-200 text-indigo-950 hover:bg-indigo-50" onClick={() => navigate('/jd/editor/' + jd.id)} data-testid={`open-jd-${jd.id}`}>
                        <Edit className="w-4 h-4 mr-2" />View Details
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
