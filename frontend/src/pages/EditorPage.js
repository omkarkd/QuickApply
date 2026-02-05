import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  FileText, ArrowLeft, Sparkles, Zap, Download, Save, 
  Loader2, FileDown, Mail, Linkedin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EditorPage = () => {
  const navigate = useNavigate();
  const { resumeId } = useParams();
  const { getAuthHeaders } = useAuth();
  
  const [title, setTitle] = useState('My Resume');
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [parseMode, setParseMode] = useState('ai');
  const [isExistingResume, setIsExistingResume] = useState(false);

  useEffect(() => {
    if (resumeId) {
      fetchResume();
    }
  }, [resumeId]);

  const fetchResume = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/resumes/${resumeId}`, {
        headers: getAuthHeaders()
      });
      setTitle(response.data.title);
      setRawText(response.data.raw_text);
      setParsedData(response.data.parsed_data);
      setIsExistingResume(true);
    } catch (error) {
      toast.error('Failed to load resume');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleParse = async (mode) => {
    if (!rawText.trim()) {
      toast.error('Please paste your resume text first');
      return;
    }
    setLoading(true);
    setParseMode(mode);
    try {
      const endpoint = mode === 'ai' ? '/parse/ai' : '/parse/simple';
      const response = await axios.post(`${API}${endpoint}`, { text: rawText });
      setParsedData(response.data);
      toast.success(`Resume parsed with ${mode === 'ai' ? 'AI' : 'Simple'} mode`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to parse resume');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!parsedData) {
      toast.error('Please parse your resume first');
      return;
    }
    setSaving(true);
    try {
      if (isExistingResume && resumeId) {
        await axios.put(`${API}/resumes/${resumeId}`, {
          title, raw_text: rawText, parsed_data: parsedData
        }, { headers: getAuthHeaders() });
        toast.success('Resume updated');
      } else {
        const response = await axios.post(`${API}/resumes`, {
          title, raw_text: rawText, parsed_data: parsedData
        }, { headers: getAuthHeaders() });
        setIsExistingResume(true);
        navigate(`/editor/${response.data.id}`, { replace: true });
        toast.success('Resume saved');
      }
    } catch (error) {
      toast.error('Failed to save resume');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (format) => {
    if (!parsedData) {
      toast.error('Please parse your resume first');
      return;
    }
    setDownloading(format);
    try {
      const response = await axios.post(
        `${API}/download/${format}`,
        parsedData,
        { responseType: 'blob' }
      );
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to download ${format.toUpperCase()}`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="text-slate-600 hover:text-indigo-950"
                data-testid="back-to-dashboard-btn"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div className="h-6 w-px bg-neutral-200" />
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 w-48 border-transparent hover:border-neutral-300 rounded-sm"
                data-testid="resume-title-input"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={saving || !parsedData}
                className="border-indigo-200 text-indigo-950"
                data-testid="save-resume-btn"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
              <Button
                onClick={() => handleDownload('pdf')}
                disabled={downloading || !parsedData}
                className="bg-indigo-950 hover:bg-indigo-900 text-white"
                data-testid="download-pdf-btn"
              >
                {downloading === 'pdf' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                PDF
              </Button>
              <Button
                onClick={() => handleDownload('docx')}
                disabled={downloading || !parsedData}
                className="bg-lime-200 hover:bg-lime-300 text-indigo-950"
                data-testid="download-docx-btn"
              >
                {downloading === 'docx' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                DOCX
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-64px)]">
        <div className="flex-1 border-r border-neutral-200 bg-white overflow-hidden flex flex-col">
          <Tabs defaultValue="input" className="flex-1 flex flex-col">
            <div className="border-b border-neutral-200 px-6 pt-4">
              <TabsList className="bg-neutral-100">
                <TabsTrigger value="input" data-testid="tab-input">Paste Text</TabsTrigger>
                <TabsTrigger value="edit" disabled={!parsedData} data-testid="tab-edit">Edit Fields</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="input" className="flex-1 p-6 overflow-auto m-0">
              <div className="space-y-4 h-full flex flex-col">
                <Label className="text-indigo-950 font-medium">Paste Your Resume Text</Label>
                <Textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="John Doe&#10;john@email.com&#10;linkedin.com/in/johndoe&#10;&#10;Professional Summary&#10;...&#10;&#10;Technical Skills&#10;JavaScript, React, Python&#10;&#10;Experience&#10;Senior Dev at Tech Corp&#10;2020 - Present&#10;• Led feature development"
                  className="flex-1 min-h-[300px] bg-neutral-50 border-neutral-300 resize-none font-mono text-sm"
                  data-testid="resume-text-input"
                />
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => handleParse('ai')}
                    disabled={loading || !rawText.trim()}
                    className="flex-1 bg-indigo-950 hover:bg-indigo-900 text-white h-12"
                    data-testid="parse-ai-btn"
                  >
                    {loading && parseMode === 'ai' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    AI Parse (GPT-5.2)
                  </Button>
                  <Button
                    onClick={() => handleParse('simple')}
                    disabled={loading || !rawText.trim()}
                    variant="outline"
                    className="flex-1 border-indigo-200 text-indigo-950 h-12"
                    data-testid="parse-simple-btn"
                  >
                    {loading && parseMode === 'simple' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                    Simple Parse
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="edit" className="flex-1 overflow-auto p-6 m-0">
              {parsedData && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-indigo-950 uppercase">Personal Info</h3>
                    <Input
                      value={parsedData.name || ''}
                      onChange={(e) => setParsedData({...parsedData, name: e.target.value})}
                      placeholder="Full Name"
                      data-testid="edit-name-input"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        value={parsedData.email || ''}
                        onChange={(e) => setParsedData({...parsedData, email: e.target.value})}
                        placeholder="Email"
                        data-testid="edit-email-input"
                      />
                      <Input
                        value={parsedData.linkedin || ''}
                        onChange={(e) => setParsedData({...parsedData, linkedin: e.target.value})}
                        placeholder="LinkedIn"
                        data-testid="edit-linkedin-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-indigo-950 uppercase">Summary</h3>
                    <Textarea
                      value={parsedData.professional_summary || ''}
                      onChange={(e) => setParsedData({...parsedData, professional_summary: e.target.value})}
                      className="min-h-[100px]"
                      data-testid="edit-summary-input"
                    />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-indigo-950 uppercase">Skills</h3>
                    <Textarea
                      value={parsedData.technical_skills?.join(', ') || ''}
                      onChange={(e) => setParsedData({...parsedData, technical_skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                      placeholder="Separate with commas"
                      data-testid="edit-skills-input"
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="w-[45%] bg-neutral-100 p-8 overflow-auto">
          <h3 className="text-sm font-semibold text-slate-600 uppercase mb-4">Preview</h3>
          {parsedData ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-sm p-8 shadow-xl"
              style={{ aspectRatio: '1/1.414' }}
              data-testid="resume-preview"
            >
              {parsedData.name && <h1 className="text-2xl font-bold text-indigo-950 mb-1">{parsedData.name}</h1>}
              <div className="flex flex-wrap gap-3 text-sm text-slate-600 mb-6">
                {parsedData.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{parsedData.email}</span>}
                {parsedData.linkedin && <span className="flex items-center gap-1"><Linkedin className="w-3 h-3" />{parsedData.linkedin}</span>}
              </div>
              {parsedData.professional_summary && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-indigo-950 uppercase mb-2 border-b border-indigo-200 pb-1">Summary</h2>
                  <p className="text-sm text-slate-700">{parsedData.professional_summary}</p>
                </div>
              )}
              {parsedData.technical_skills?.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-indigo-950 uppercase mb-2 border-b border-indigo-200 pb-1">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {parsedData.technical_skills.map((skill, i) => (
                      <span key={i} className="px-2 py-1 bg-lime-100 text-indigo-950 text-xs rounded-sm">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
              {parsedData.experiences?.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-indigo-950 uppercase mb-2 border-b border-indigo-200 pb-1">Experience</h2>
                  {parsedData.experiences.map((exp, i) => (
                    <div key={i} className="mb-3">
                      <h3 className="font-semibold text-indigo-900 text-sm">{exp.title}</h3>
                      <p className="text-xs text-slate-500 italic">{exp.company} | {exp.from_date} - {exp.to_date}</p>
                      {exp.bullets?.map((b, j) => <p key={j} className="text-xs text-slate-700 ml-2">• {b}</p>)}
                    </div>
                  ))}
                </div>
              )}
              {parsedData.projects?.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-indigo-950 uppercase mb-2 border-b border-indigo-200 pb-1">Projects</h2>
                  {parsedData.projects.map((p, i) => (
                    <div key={i} className="mb-3">
                      <h3 className="font-semibold text-indigo-900 text-sm">{p.title}</h3>
                      {p.description && <p className="text-xs text-slate-600">{p.description}</p>}
                      {p.bullets?.map((b, j) => <p key={j} className="text-xs text-slate-700 ml-2">• {b}</p>)}
                    </div>
                  ))}
                </div>
              )}
              {parsedData.education?.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-indigo-950 uppercase mb-2 border-b border-indigo-200 pb-1">Education</h2>
                  {parsedData.education.map((e, i) => (
                    <div key={i} className="mb-2">
                      <h3 className="font-semibold text-indigo-900 text-sm">{e.title}</h3>
                      <p className="text-xs text-slate-500 italic">{e.institution} | {e.from_date} - {e.to_date}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <div className="bg-white rounded-sm p-8 shadow-xl flex flex-col items-center justify-center text-center" style={{ aspectRatio: '1/1.414' }}>
              <FileText className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No Preview</h3>
              <p className="text-sm text-slate-500">Paste text and parse to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
