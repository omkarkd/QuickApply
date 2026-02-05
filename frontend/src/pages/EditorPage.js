import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { FileText, ArrowLeft, Sparkles, Zap, Download, Save, Loader2, FileDown, Mail, Linkedin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function EditorPage() {
  const navigate = useNavigate();
  const params = useParams();
  const auth = useAuth();
  
  const [title, setTitle] = React.useState('My Resume');
  const [rawText, setRawText] = React.useState('');
  const [parsedData, setParsedData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [downloading, setDownloading] = React.useState(null);
  const [parseMode, setParseMode] = React.useState('ai');
  const [isExisting, setIsExisting] = React.useState(false);

  React.useEffect(() => {
    if (params.resumeId) loadResume();
  }, [params.resumeId]);

  const loadResume = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API + '/resumes/' + params.resumeId, { headers: auth.getAuthHeaders() });
      setTitle(res.data.title);
      setRawText(res.data.raw_text);
      setParsedData(res.data.parsed_data);
      setIsExisting(true);
    } catch (e) {
      toast.error('Failed to load');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleParse = async (mode) => {
    if (!rawText.trim()) { toast.error('Paste text first'); return; }
    setLoading(true); setParseMode(mode);
    try {
      const res = await axios.post(API + (mode === 'ai' ? '/parse/ai' : '/parse/simple'), { text: rawText });
      setParsedData(res.data);
      toast.success('Parsed!');
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
      if (isExisting && params.resumeId) {
        await axios.put(API + '/resumes/' + params.resumeId, { title, raw_text: rawText, parsed_data: parsedData }, { headers: auth.getAuthHeaders() });
        toast.success('Updated!');
      } else {
        const res = await axios.post(API + '/resumes', { title, raw_text: rawText, parsed_data: parsedData }, { headers: auth.getAuthHeaders() });
        setIsExisting(true);
        navigate('/editor/' + res.data.id, { replace: true });
        toast.success('Saved!');
      }
    } catch (e) { toast.error('Save failed'); } finally { setSaving(false); }
  };

  const handleDownload = async (fmt) => {
    if (!parsedData) { toast.error('Parse first'); return; }
    setDownloading(fmt);
    try {
      const res = await axios.post(API + '/download/' + fmt, parsedData, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = 'resume.' + fmt;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      toast.success('Downloaded!');
    } catch (e) { toast.error('Download failed'); } finally { setDownloading(null); }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="bg-white border-b sticky top-0 z-50 px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} data-testid="back-to-dashboard-btn">
              <ArrowLeft className="w-4 h-4 mr-2" />Dashboard
            </Button>
            <Input value={title} onChange={e => setTitle(e.target.value)} className="h-9 w-48" data-testid="resume-title-input" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSave} disabled={saving || !parsedData} data-testid="save-resume-btn">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Save
            </Button>
            <Button onClick={() => handleDownload('pdf')} disabled={downloading || !parsedData} className="bg-indigo-950 text-white" data-testid="download-pdf-btn">
              {downloading === 'pdf' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}PDF
            </Button>
            <Button onClick={() => handleDownload('docx')} disabled={downloading || !parsedData} className="bg-lime-200 text-indigo-950" data-testid="download-docx-btn">
              {downloading === 'docx' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}DOCX
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-64px)]">
        <div className="flex-1 border-r bg-white flex flex-col">
          <Tabs defaultValue="input" className="flex-1 flex flex-col">
            <div className="border-b px-6 pt-4">
              <TabsList><TabsTrigger value="input" data-testid="tab-input">Paste</TabsTrigger><TabsTrigger value="edit" disabled={!parsedData} data-testid="tab-edit">Edit</TabsTrigger></TabsList>
            </div>
            <TabsContent value="input" className="flex-1 p-6 m-0">
              <div className="flex flex-col h-full gap-4">
                <Textarea value={rawText} onChange={e => setRawText(e.target.value)} placeholder="Paste resume here..." className="flex-1 min-h-[300px] font-mono text-sm" data-testid="resume-text-input" />
                <div className="flex gap-3">
                  <Button onClick={() => handleParse('ai')} disabled={loading || !rawText.trim()} className="flex-1 bg-indigo-950 text-white h-12" data-testid="parse-ai-btn">
                    {loading && parseMode === 'ai' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}AI Parse
                  </Button>
                  <Button onClick={() => handleParse('simple')} disabled={loading || !rawText.trim()} variant="outline" className="flex-1 h-12" data-testid="parse-simple-btn">
                    {loading && parseMode === 'simple' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}Simple
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="edit" className="flex-1 p-6 m-0 overflow-auto">
              {parsedData && (
                <div className="space-y-4">
                  <Input value={parsedData.name || ''} onChange={e => setParsedData({...parsedData, name: e.target.value})} placeholder="Name" data-testid="edit-name-input" />
                  <Input value={parsedData.email || ''} onChange={e => setParsedData({...parsedData, email: e.target.value})} placeholder="Email" data-testid="edit-email-input" />
                  <Input value={parsedData.linkedin || ''} onChange={e => setParsedData({...parsedData, linkedin: e.target.value})} placeholder="LinkedIn" data-testid="edit-linkedin-input" />
                  <Textarea value={parsedData.professional_summary || ''} onChange={e => setParsedData({...parsedData, professional_summary: e.target.value})} placeholder="Summary" data-testid="edit-summary-input" />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="w-[45%] bg-neutral-100 p-8 overflow-auto">
          <h3 className="text-sm font-semibold text-slate-600 uppercase mb-4">Preview</h3>
          {parsedData ? (
            <div className="bg-white p-8 shadow-xl" style={{ aspectRatio: '1/1.414' }} data-testid="resume-preview">
              {parsedData.name && <h1 className="text-2xl font-bold text-indigo-950 mb-1">{parsedData.name}</h1>}
              <div className="flex gap-3 text-sm text-slate-600 mb-6">
                {parsedData.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{parsedData.email}</span>}
                {parsedData.linkedin && <span className="flex items-center gap-1"><Linkedin className="w-3 h-3" />{parsedData.linkedin}</span>}
              </div>
              {parsedData.professional_summary && <div className="mb-4"><h2 className="text-sm font-bold uppercase border-b pb-1 mb-2">Summary</h2><p className="text-sm">{parsedData.professional_summary}</p></div>}
              {parsedData.technical_skills && parsedData.technical_skills.length > 0 && <div className="mb-4"><h2 className="text-sm font-bold uppercase border-b pb-1 mb-2">Skills</h2><div className="flex flex-wrap gap-1">{parsedData.technical_skills.map((s,i) => <span key={i} className="px-2 py-1 bg-lime-100 text-xs">{s}</span>)}</div></div>}
              {parsedData.experiences && parsedData.experiences.length > 0 && <div className="mb-4"><h2 className="text-sm font-bold uppercase border-b pb-1 mb-2">Experience</h2>{parsedData.experiences.map((exp,i) => <div key={i} className="mb-2"><strong className="text-sm">{exp.title}</strong><p className="text-xs text-slate-500">{exp.company} | {exp.from_date} - {exp.to_date}</p>{exp.bullets && exp.bullets.map((b,j) => <p key={j} className="text-xs ml-2">• {b}</p>)}</div>)}</div>}
              {parsedData.projects && parsedData.projects.length > 0 && <div className="mb-4"><h2 className="text-sm font-bold uppercase border-b pb-1 mb-2">Projects</h2>{parsedData.projects.map((p,i) => <div key={i} className="mb-2"><strong className="text-sm">{p.title}</strong>{p.bullets && p.bullets.map((b,j) => <p key={j} className="text-xs ml-2">• {b}</p>)}</div>)}</div>}
              {parsedData.education && parsedData.education.length > 0 && <div><h2 className="text-sm font-bold uppercase border-b pb-1 mb-2">Education</h2>{parsedData.education.map((edu,i) => <div key={i}><strong className="text-sm">{edu.title}</strong><p className="text-xs text-slate-500">{edu.institution}</p></div>)}</div>}
            </div>
          ) : (
            <div className="bg-white p-8 shadow-xl flex flex-col items-center justify-center" style={{ aspectRatio: '1/1.414' }}>
              <FileText className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500">Paste and parse to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
