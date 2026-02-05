import React, { useState, useEffect } from 'react';
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

  function loadResume() {
    setLoading(true);
    axios.get(API + '/resumes/' + params.resumeId, { headers: auth.getAuthHeaders() })
      .then(function(res) {
        setTitle(res.data.title);
        setRawText(res.data.raw_text);
        setParsedData(res.data.parsed_data);
        setIsExisting(true);
        setLoading(false);
      })
      .catch(function() {
        toast.error('Failed to load');
        navigate('/dashboard');
        setLoading(false);
      });
  }

  function handleParse(mode) {
    if (!rawText.trim()) { toast.error('Paste text first'); return; }
    setLoading(true);
    setParseMode(mode);
    var endpoint = mode === 'ai' ? '/parse/ai' : '/parse/simple';
    axios.post(API + endpoint, { text: rawText })
      .then(function(res) {
        setParsedData(res.data);
        toast.success('Parsed!');
        setLoading(false);
      })
      .catch(function(e) {
        toast.error(e.response && e.response.data && e.response.data.detail ? e.response.data.detail : 'Parse failed');
        setLoading(false);
      });
  }

  function handleSave() {
    if (!parsedData) { toast.error('Parse first'); return; }
    setSaving(true);
    var data = { title: title, raw_text: rawText, parsed_data: parsedData };
    var promise;
    if (isExisting && params.resumeId) {
      promise = axios.put(API + '/resumes/' + params.resumeId, data, { headers: auth.getAuthHeaders() });
    } else {
      promise = axios.post(API + '/resumes', data, { headers: auth.getAuthHeaders() });
    }
    promise.then(function(res) {
      if (!isExisting) {
        setIsExisting(true);
        navigate('/editor/' + res.data.id, { replace: true });
      }
      toast.success('Saved!');
      setSaving(false);
    }).catch(function() {
      toast.error('Save failed');
      setSaving(false);
    });
  }

  function handleDownload(fmt) {
    if (!parsedData) { toast.error('Parse first'); return; }
    setDownloading(fmt);
    axios.post(API + '/download/' + fmt, parsedData, { responseType: 'blob' })
      .then(function(res) {
        var url = window.URL.createObjectURL(new Blob([res.data]));
        var a = document.createElement('a');
        a.href = url;
        a.download = 'resume.' + fmt;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Downloaded!');
        setDownloading(null);
      })
      .catch(function() {
        toast.error('Download failed');
        setDownloading(null);
      });
  }

  function goBack() {
    navigate('/dashboard');
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="bg-white border-b sticky top-0 z-50 px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={goBack} data-testid="back-to-dashboard-btn">
              <ArrowLeft className="w-4 h-4 mr-2" />Dashboard
            </Button>
            <Input value={title} onChange={function(e) { setTitle(e.target.value); }} className="h-9 w-48" data-testid="resume-title-input" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSave} disabled={saving || !parsedData} data-testid="save-resume-btn">
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
      </nav>

      <div className="flex h-[calc(100vh-64px)]">
        <div className="flex-1 border-r bg-white flex flex-col">
          <Tabs defaultValue="input" className="flex-1 flex flex-col">
            <div className="border-b px-6 pt-4">
              <TabsList>
                <TabsTrigger value="input" data-testid="tab-input">Paste</TabsTrigger>
                <TabsTrigger value="edit" disabled={!parsedData} data-testid="tab-edit">Edit</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="input" className="flex-1 p-6 m-0">
              <div className="flex flex-col h-full gap-4">
                <Textarea 
                  value={rawText} 
                  onChange={function(e) { setRawText(e.target.value); }} 
                  placeholder="Paste resume here..." 
                  className="flex-1 min-h-[300px] font-mono text-sm" 
                  data-testid="resume-text-input" 
                />
                <div className="flex gap-3">
                  <Button onClick={function() { handleParse('ai'); }} disabled={loading || !rawText.trim()} className="flex-1 bg-indigo-950 text-white h-12" data-testid="parse-ai-btn">
                    {loading && parseMode === 'ai' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}AI Parse
                  </Button>
                  <Button onClick={function() { handleParse('simple'); }} disabled={loading || !rawText.trim()} variant="outline" className="flex-1 h-12" data-testid="parse-simple-btn">
                    {loading && parseMode === 'simple' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}Simple
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="edit" className="flex-1 p-6 m-0 overflow-auto">
              {parsedData && (
                <div className="space-y-4">
                  <Input value={parsedData.name || ''} onChange={function(e) { setParsedData(Object.assign({}, parsedData, { name: e.target.value })); }} placeholder="Name" data-testid="edit-name-input" />
                  <Input value={parsedData.email || ''} onChange={function(e) { setParsedData(Object.assign({}, parsedData, { email: e.target.value })); }} placeholder="Email" data-testid="edit-email-input" />
                  <Input value={parsedData.linkedin || ''} onChange={function(e) { setParsedData(Object.assign({}, parsedData, { linkedin: e.target.value })); }} placeholder="LinkedIn" data-testid="edit-linkedin-input" />
                  <Textarea value={parsedData.professional_summary || ''} onChange={function(e) { setParsedData(Object.assign({}, parsedData, { professional_summary: e.target.value })); }} placeholder="Summary" data-testid="edit-summary-input" />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <ResumePreview data={parsedData} />
      </div>
    </div>
  );
}

function ResumePreview(props) {
  var data = props.data;
  if (!data) {
    return (
      <div className="w-[45%] bg-neutral-100 p-8 overflow-auto">
        <h3 className="text-sm font-semibold text-slate-600 uppercase mb-4">Preview</h3>
        <div className="bg-white p-8 shadow-xl flex flex-col items-center justify-center" style={{ aspectRatio: '1/1.414' }}>
          <FileText className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500">Paste and parse to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[45%] bg-neutral-100 p-8 overflow-auto">
      <h3 className="text-sm font-semibold text-slate-600 uppercase mb-4">Preview</h3>
      <div className="bg-white p-8 shadow-xl" style={{ aspectRatio: '1/1.414' }} data-testid="resume-preview">
        {data.name && <h1 className="text-2xl font-bold text-indigo-950 mb-1">{data.name}</h1>}
        <div className="flex gap-3 text-sm text-slate-600 mb-6">
          {data.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{data.email}</span>}
          {data.linkedin && <span className="flex items-center gap-1"><Linkedin className="w-3 h-3" />{data.linkedin}</span>}
        </div>
        {data.professional_summary && (
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase border-b pb-1 mb-2">Summary</h2>
            <p className="text-sm">{data.professional_summary}</p>
          </div>
        )}
        {data.technical_skills && data.technical_skills.length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase border-b pb-1 mb-2">Skills</h2>
            <div className="flex flex-wrap gap-1">
              {data.technical_skills.map(function(s, i) {
                return <span key={i} className="px-2 py-1 bg-lime-100 text-xs">{s}</span>;
              })}
            </div>
          </div>
        )}
        {data.experiences && data.experiences.length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase border-b pb-1 mb-2">Experience</h2>
            {data.experiences.map(function(exp, i) {
              return (
                <div key={i} className="mb-2">
                  <strong className="text-sm">{exp.title}</strong>
                  <p className="text-xs text-slate-500">{exp.company} | {exp.from_date} - {exp.to_date}</p>
                  {exp.bullets && exp.bullets.map(function(b, j) {
                    return <p key={j} className="text-xs ml-2">• {b}</p>;
                  })}
                </div>
              );
            })}
          </div>
        )}
        {data.projects && data.projects.length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase border-b pb-1 mb-2">Projects</h2>
            {data.projects.map(function(p, i) {
              return (
                <div key={i} className="mb-2">
                  <strong className="text-sm">{p.title}</strong>
                  {p.bullets && p.bullets.map(function(b, j) {
                    return <p key={j} className="text-xs ml-2">• {b}</p>;
                  })}
                </div>
              );
            })}
          </div>
        )}
        {data.education && data.education.length > 0 && (
          <div>
            <h2 className="text-sm font-bold uppercase border-b pb-1 mb-2">Education</h2>
            {data.education.map(function(edu, i) {
              return (
                <div key={i}>
                  <strong className="text-sm">{edu.title}</strong>
                  <p className="text-xs text-slate-500">{edu.institution}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default EditorPage;
