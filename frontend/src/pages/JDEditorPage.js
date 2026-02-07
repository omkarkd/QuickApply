import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Briefcase, ArrowLeft, Sparkles, Zap, Save, Loader2, MapPin, Clock, DollarSign, Building, CheckCircle, Circle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function JDEditorPage() {
  const navigate = useNavigate();
  const params = useParams();
  const auth = useAuth();
  
  const [title, setTitle] = useState('New Job Description');
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parseMode, setParseMode] = useState('ai');
  const [isExisting, setIsExisting] = useState(false);

  useEffect(() => {
    if (params.jdId) loadJD();
  }, [params.jdId]);

  const loadJD = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API + '/jds/' + params.jdId, { headers: auth.getAuthHeaders() });
      setTitle(res.data.title);
      setRawText(res.data.raw_text);
      setParsedData(res.data.parsed_data);
      setIsExisting(true);
    } catch (e) {
      toast.error('Failed to load');
      navigate('/jd');
    } finally {
      setLoading(false);
    }
  };

  const handleParse = async (mode) => {
    if (!rawText.trim()) { toast.error('Paste JD text first'); return; }
    setLoading(true); setParseMode(mode);
    try {
      const res = await axios.post(API + '/parse/jd/' + mode, { text: rawText });
      setParsedData(res.data);
      toast.success('JD parsed with ' + (mode === 'ai' ? 'AI (CrewAI)' : 'Simple') + ' mode');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Parse failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!parsedData) { toast.error('Parse first'); return; }
    setSaving(true);
    try {
      if (isExisting && params.jdId) {
        await axios.put(API + '/jds/' + params.jdId, { title, raw_text: rawText, parsed_data: parsedData }, { headers: auth.getAuthHeaders() });
        toast.success('Updated!');
      } else {
        const res = await axios.post(API + '/jds', { title, raw_text: rawText, parsed_data: parsedData }, { headers: auth.getAuthHeaders() });
        setIsExisting(true);
        navigate('/jd/editor/' + res.data.id, { replace: true });
        toast.success('Saved!');
      }
    } catch (e) { toast.error('Save failed'); } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Sidebar />
      
      <div className="ml-64">
        <nav className="bg-white border-b sticky top-0 z-50 px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/jd')} data-testid="back-to-jd-btn">
                <ArrowLeft className="w-4 h-4 mr-2" />Back
              </Button>
              <Input value={title} onChange={e => setTitle(e.target.value)} className="h-9 w-64" data-testid="jd-title-input" />
            </div>
            <Button onClick={handleSave} disabled={saving || !parsedData} className="bg-indigo-950 text-white" data-testid="save-jd-btn">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Save JD
            </Button>
          </div>
        </nav>

        <div className="flex h-[calc(100vh-64px)]">
          {/* Left Panel - Editor */}
          <div className="flex-1 border-r bg-white flex flex-col">
            <Tabs defaultValue="input" className="flex-1 flex flex-col">
              <div className="border-b px-6 pt-4">
                <TabsList>
                  <TabsTrigger value="input" data-testid="tab-input">Paste JD</TabsTrigger>
                  <TabsTrigger value="edit" disabled={!parsedData} data-testid="tab-edit">Edit</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="input" className="flex-1 p-6 m-0">
                <div className="flex flex-col h-full gap-4">
                  <p className="text-sm text-slate-600">Paste the job description text below. Our AI will extract key requirements, skills, and details.</p>
                  <Textarea 
                    value={rawText} 
                    onChange={e => setRawText(e.target.value)} 
                    placeholder="Paste job description here...&#10;&#10;Example:&#10;Software Engineer at TechCorp&#10;Location: San Francisco, CA&#10;&#10;Requirements:&#10;- 5+ years of experience&#10;- Python, JavaScript required&#10;- React experience preferred..." 
                    className="flex-1 min-h-[300px] font-mono text-sm" 
                    data-testid="jd-text-input" 
                  />
                  <div className="flex gap-3">
                    <Button onClick={() => handleParse('ai')} disabled={loading || !rawText.trim()} className="flex-1 bg-indigo-950 text-white h-12" data-testid="parse-jd-ai-btn">
                      {loading && parseMode === 'ai' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}AI Parse (CrewAI)
                    </Button>
                    <Button onClick={() => handleParse('simple')} disabled={loading || !rawText.trim()} variant="outline" className="flex-1 h-12" data-testid="parse-jd-simple-btn">
                      {loading && parseMode === 'simple' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}Simple Parse
                    </Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="edit" className="flex-1 p-6 m-0 overflow-auto">
                {parsedData && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Job Title</label>
                        <Input value={parsedData.job_title || ''} onChange={e => setParsedData({...parsedData, job_title: e.target.value})} className="mt-1" data-testid="edit-job-title" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Company</label>
                        <Input value={parsedData.company || ''} onChange={e => setParsedData({...parsedData, company: e.target.value})} className="mt-1" data-testid="edit-company" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Location</label>
                        <Input value={parsedData.location || ''} onChange={e => setParsedData({...parsedData, location: e.target.value})} className="mt-1" data-testid="edit-location" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Job Type</label>
                        <Input value={parsedData.job_type || ''} onChange={e => setParsedData({...parsedData, job_type: e.target.value})} className="mt-1" data-testid="edit-job-type" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Experience Required</label>
                        <Input value={parsedData.experience_required || ''} onChange={e => setParsedData({...parsedData, experience_required: e.target.value})} className="mt-1" data-testid="edit-experience" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Salary Range</label>
                        <Input value={parsedData.salary_range || ''} onChange={e => setParsedData({...parsedData, salary_range: e.target.value})} className="mt-1" data-testid="edit-salary" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Must Have Skills (comma separated)</label>
                      <Textarea 
                        value={(parsedData.must_have_skills || []).join(', ')} 
                        onChange={e => setParsedData({...parsedData, must_have_skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} 
                        className="mt-1"
                        data-testid="edit-must-have-skills" 
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Good to Have Skills (comma separated)</label>
                      <Textarea 
                        value={(parsedData.good_to_have_skills || []).join(', ')} 
                        onChange={e => setParsedData({...parsedData, good_to_have_skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} 
                        className="mt-1"
                        data-testid="edit-good-to-have-skills" 
                      />
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Preview */}
          <div className="w-[45%] bg-neutral-100 p-8 overflow-auto">
            <h3 className="text-sm font-semibold text-slate-600 uppercase mb-4">JD Preview</h3>
            {parsedData ? (
              <div className="bg-white p-8 shadow-xl rounded-sm" data-testid="jd-preview">
                <div className="border-b border-neutral-200 pb-4 mb-6">
                  <h1 className="text-2xl font-bold text-indigo-950 mb-2">{parsedData.job_title || 'Job Title'}</h1>
                  {parsedData.company && (
                    <div className="flex items-center gap-2 text-slate-600 mb-2">
                      <Building className="w-4 h-4" />
                      <span>{parsedData.company}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    {parsedData.location && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{parsedData.location}</span>
                    )}
                    {parsedData.experience_required && (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{parsedData.experience_required}</span>
                    )}
                    {parsedData.salary_range && (
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{parsedData.salary_range}</span>
                    )}
                  </div>
                  {parsedData.job_type && (
                    <span className="inline-block mt-3 px-3 py-1 bg-lime-100 text-indigo-950 text-sm rounded-sm font-medium">
                      {parsedData.job_type}
                    </span>
                  )}
                </div>

                {parsedData.must_have_skills && parsedData.must_have_skills.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-sm font-bold text-indigo-950 uppercase mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-red-500" />Must Have Skills
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {parsedData.must_have_skills.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-red-50 text-red-700 text-sm rounded-sm border border-red-200">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {parsedData.good_to_have_skills && parsedData.good_to_have_skills.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-sm font-bold text-indigo-950 uppercase mb-3 flex items-center gap-2">
                      <Circle className="w-4 h-4 text-green-500" />Good to Have Skills
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {parsedData.good_to_have_skills.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-sm border border-green-200">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {parsedData.description && (
                  <div>
                    <h2 className="text-sm font-bold text-indigo-950 uppercase mb-2">Description</h2>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{parsedData.description}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white p-8 shadow-xl rounded-sm flex flex-col items-center justify-center min-h-[400px]">
                <Briefcase className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-500 text-center">Paste a job description and parse it to see the extracted data</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
