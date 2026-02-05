import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { FileText, ArrowLeft, Sparkles, Zap, Download, Save, Loader2, FileDown, Mail, Linkedin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

function EditorPage() {
  const navigate = useNavigate();
  const params = useParams();
  const auth = useAuth();
  
  const [title, setTitle] = useState('My Resume');
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [parseMode, setParseMode] = useState('ai');
  const [isExisting, setIsExisting] = useState(false);

  useEffect(function() {
    if (params.resumeId) {
      loadResume();
    }
  }, [params.resumeId]);

  async function loadResume() {
    setLoading(true);
    try {
      const res = await axios.get(API + '/resumes/' + params.resumeId, {
        headers: auth.getAuthHeaders()
      });
      setTitle(res.data.title);
      setRawText(res.data.raw_text);
      setParsedData(res.data.parsed_data);
      setIsExisting(true);
    } catch (err) {
      toast.error('Failed to load resume');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function handleParse(mode) {
    if (!rawText.trim()) {
      toast.error('Please paste your resume text first');
      return;
    }
    setLoading(true);
    setParseMode(mode);
    try {
      var endpoint = mode === 'ai' ? '/parse/ai' : '/parse/simple';
      var res = await axios.post(API + endpoint, { text: rawText });
      setParsedData(res.data);
      toast.success('Resume parsed with ' + (mode === 'ai' ? 'AI' : 'Simple') + ' mode');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to parse');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!parsedData) {
      toast.error('Please parse your resume first');
      return;
    }
    setSaving(true);
    try {
      if (isExisting && params.resumeId) {
        await axios.put(API + '/resumes/' + params.resumeId, {
          title: title,
          raw_text: rawText,
          parsed_data: parsedData
        }, { headers: auth.getAuthHeaders() });
        toast.success('Resume updated');
      } else {
        var res = await axios.post(API + '/resumes', {
          title: title,
          raw_text: rawText,
          parsed_data: parsedData
        }, { headers: auth.getAuthHeaders() });
        setIsExisting(true);
        navigate('/editor/' + res.data.id, { replace: true });
        toast.success('Resume saved');
      }
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload(format) {
    if (!parsedData) {
      toast.error('Please parse first');
      return;
    }
    setDownloading(format);
    try {
      var res = await axios.post(API + '/download/' + format, parsedData, { responseType: 'blob' });
      var blob = new Blob([res.data]);
      var url = window.URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'resume.' + format;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Downloaded as ' + format.toUpperCase());
    } catch (err) {
      toast.error('Download failed');
    } finally {
      setDownloading(null);
    }
  }

  function renderSkills() {
    if (!parsedData || !parsedData.technical_skills || parsedData.technical_skills.length === 0) return null;
    return (
      <div className="mb-6">
        <h2 className="text-sm font-bold text-indigo-950 uppercase mb-2 border-b border-indigo-200 pb-1">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {parsedData.technical_skills.map(function(skill, i) {
            return <span key={i} className="px-2 py-1 bg-lime-100 text-indigo-950 text-xs rounded-sm">{skill}</span>;
          })}
        </div>
      </div>
    );
  }

  function renderExperiences() {
    if (!parsedData || !parsedData.experiences || parsedData.experiences.length === 0) return null;
    return (
      <div className="mb-6">
        <h2 className="text-sm font-bold text-indigo-950 uppercase mb-2 border-b border-indigo-200 pb-1">Experience</h2>
        {parsedData.experiences.map(function(exp, i) {
          return (
            <div key={i} className="mb-3">
              <h3 className="font-semibold text-indigo-900 text-sm">{exp.title}</h3>
              <p className="text-xs text-slate-500 italic">{exp.company} | {exp.from_date} - {exp.to_date}</p>
              {exp.bullets && exp.bullets.map(function(b, j) {
                return <p key={j} className="text-xs text-slate-700 ml-2">• {b}</p>;
              })}
            </div>
          );
        })}
      </div>
    );
  }

  function renderProjects() {
    if (!parsedData || !parsedData.projects || parsedData.projects.length === 0) return null;
    return (
      <div className="mb-6">
        <h2 className="text-sm font-bold text-indigo-950 uppercase mb-2 border-b border-indigo-200 pb-1">Projects</h2>
        {parsedData.projects.map(function(p, i) {
          return (
            <div key={i} className="mb-3">
              <h3 className="font-semibold text-indigo-900 text-sm">{p.title}</h3>
              {p.description && <p className="text-xs text-slate-600">{p.description}</p>}
              {p.bullets && p.bullets.map(function(b, j) {
                return <p key={j} className="text-xs text-slate-700 ml-2">• {b}</p>;
              })}
            </div>
          );
        })}
      </div>
    );
  }

  function renderEducation() {
    if (!parsedData || !parsedData.education || parsedData.education.length === 0) return null;
    return (
      <div className="mb-6">
        <h2 className="text-sm font-bold text-indigo-950 uppercase mb-2 border-b border-indigo-200 pb-1">Education</h2>
        {parsedData.education.map(function(edu, i) {
          return (
            <div key={i} className="mb-2">
              <h3 className="font-semibold text-indigo-900 text-sm">{edu.title}</h3>
              <p className="text-xs text-slate-500 italic">{edu.institution} | {edu.from_date} - {edu.to_date}</p>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={function() { navigate('/dashboard'); }} className="text-slate-600" data-testid="back-to-dashboard-btn">
                <ArrowLeft className="w-4 h-4 mr-2" />Dashboard
              </Button>
              <div className="h-6 w-px bg-neutral-200"></div>
              <Input value={title} onChange={function(e) { setTitle(e.target.value); }} className="h-9 w-48 border-transparent" data-testid="resume-title-input" />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleSave} disabled={saving || !parsedData} className="border-indigo-200 text-indigo-950" data-testid="save-resume-btn">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Save
              </Button>
              <Button onClick={function() { handleDownload('pdf'); }} disabled={downloading || !parsedData} className="bg-indigo-950 text-white" data-testid="download-pdf-btn">
                {downloading === 'pdf' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}PDF
              </Button>
              <Button onClick={function() { handleDownload('docx'); }} disabled={downloading || !parsedData} className="bg-lime-200 text-indigo-950" data-testid="download-docx-btn">
                {downloading === 'docx' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}DOCX
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
                <TabsTrigger value="edit" disabled={!parsedData} data-testid="tab-edit">Edit</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="input" className="flex-1 p-6 overflow-auto m-0">
              <div className="space-y-4 h-full flex flex-col">
                <Label className="text-indigo-950 font-medium">Paste Your Resume</Label>
                <Textarea value={rawText} onChange={function(e) { setRawText(e.target.value); }} placeholder="John Doe&#10;john@email.com&#10;&#10;Summary&#10;...&#10;&#10;Skills&#10;JavaScript, React&#10;&#10;Experience&#10;..." className="flex-1 min-h-[300px] bg-neutral-50 font-mono text-sm" data-testid="resume-text-input" />
                <div className="flex gap-3 pt-2">
                  <Button onClick={function() { handleParse('ai'); }} disabled={loading || !rawText.trim()} className="flex-1 bg-indigo-950 text-white h-12" data-testid="parse-ai-btn">
                    {loading && parseMode === 'ai' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}AI Parse
                  </Button>
                  <Button onClick={function() { handleParse('simple'); }} disabled={loading || !rawText.trim()} variant="outline" className="flex-1 border-indigo-200 h-12" data-testid="parse-simple-btn">
                    {loading && parseMode === 'simple' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}Simple Parse
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="edit" className="flex-1 overflow-auto p-6 m-0">
              {parsedData && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-indigo-950 uppercase">Personal</h3>
                    <Input value={parsedData.name || ''} onChange={function(e) { setParsedData(Object.assign({}, parsedData, {name: e.target.value})); }} placeholder="Name" data-testid="edit-name-input" />
                    <div className="grid grid-cols-2 gap-4">
                      <Input value={parsedData.email || ''} onChange={function(e) { setParsedData(Object.assign({}, parsedData, {email: e.target.value})); }} placeholder="Email" data-testid="edit-email-input" />
                      <Input value={parsedData.linkedin || ''} onChange={function(e) { setParsedData(Object.assign({}, parsedData, {linkedin: e.target.value})); }} placeholder="LinkedIn" data-testid="edit-linkedin-input" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-indigo-950 uppercase">Summary</h3>
                    <Textarea value={parsedData.professional_summary || ''} onChange={function(e) { setParsedData(Object.assign({}, parsedData, {professional_summary: e.target.value})); }} className="min-h-[100px]" data-testid="edit-summary-input" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-indigo-950 uppercase">Skills</h3>
                    <Textarea value={(parsedData.technical_skills || []).join(', ')} onChange={function(e) { setParsedData(Object.assign({}, parsedData, {technical_skills: e.target.value.split(',').map(function(s){return s.trim();}).filter(Boolean)})); }} placeholder="Comma separated" data-testid="edit-skills-input" />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="w-[45%] bg-neutral-100 p-8 overflow-auto">
          <h3 className="text-sm font-semibold text-slate-600 uppercase mb-4">Preview</h3>
          {parsedData ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-sm p-8 shadow-xl" style={{ aspectRatio: '1/1.414' }} data-testid="resume-preview">
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
              {renderSkills()}
              {renderExperiences()}
              {renderProjects()}
              {renderEducation()}
            </motion.div>
          ) : (
            <div className="bg-white rounded-sm p-8 shadow-xl flex flex-col items-center justify-center text-center" style={{ aspectRatio: '1/1.414' }}>
              <FileText className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No Preview</h3>
              <p className="text-sm text-slate-500">Paste text and parse</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EditorPage;
