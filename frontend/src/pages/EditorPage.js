import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { 
  FileText, ArrowLeft, Sparkles, Zap, Download, Save, 
  Loader2, FileDown, Mail, Linkedin, Briefcase, 
  GraduationCap, FolderOpen, User
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
      toast.success(`Resume parsed successfully with ${mode === 'ai' ? 'AI' : 'Simple'} mode`);
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to parse resume';
      toast.error(message);
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
          title,
          raw_text: rawText,
          parsed_data: parsedData
        }, { headers: getAuthHeaders() });
        toast.success('Resume updated');
      } else {
        const response = await axios.post(`${API}/resumes`, {
          title,
          raw_text: rawText,
          parsed_data: parsedData
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

  const updateParsedField = (field, value) => {
    setParsedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-neutral-50 noise-overlay">
      {/* Navigation */}
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
              <div className="h-6 w-px bg-neutral-200"></div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 w-48 bg-transparent border-transparent hover:border-neutral-300 focus:border-indigo-500 rounded-sm text-indigo-950 font-medium"
                placeholder="Resume Title"
                data-testid="resume-title-input"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={saving || !parsedData}
                className="border-indigo-200 text-indigo-950 hover:bg-indigo-50 rounded-sm"
                data-testid="save-resume-btn"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
              <Button
                onClick={() => handleDownload('pdf')}
                disabled={downloading || !parsedData}
                className="bg-indigo-950 hover:bg-indigo-900 text-white rounded-sm"
                data-testid="download-pdf-btn"
              >
                {downloading === 'pdf' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4 mr-2" />
                )}
                PDF
              </Button>
              <Button
                onClick={() => handleDownload('docx')}
                disabled={downloading || !parsedData}
                className="bg-lime-200 hover:bg-lime-300 text-indigo-950 rounded-sm"
                data-testid="download-docx-btn"
              >
                {downloading === 'docx' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                DOCX
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Editor */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Panel - Editor */}
        <div className="flex-1 border-r border-neutral-200 bg-white overflow-hidden flex flex-col">
          <Tabs defaultValue="input" className="flex-1 flex flex-col">
            <div className="border-b border-neutral-200 px-6 pt-4">
              <TabsList className="bg-neutral-100 rounded-sm">
                <TabsTrigger value="input" className="rounded-sm data-[state=active]:bg-white" data-testid="tab-input">
                  Paste Text
                </TabsTrigger>
                <TabsTrigger value="edit" className="rounded-sm data-[state=active]:bg-white" disabled={!parsedData} data-testid="tab-edit">
                  Edit Fields
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="input" className="flex-1 p-6 overflow-auto m-0">
              <div className="space-y-4 h-full flex flex-col">
                <div>
                  <Label className="text-indigo-950 font-medium mb-2 block">
                    Paste Your Resume Text
                  </Label>
                  <p className="text-sm text-slate-500 mb-3">
                    Copy and paste your resume content below. Include all sections like experience, education, skills, etc.
                  </p>
                </div>
                
                <Textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="John Doe
john.doe@email.com
linkedin.com/in/johndoe

Professional Summary
Experienced software engineer with 5+ years...

Technical Skills
JavaScript, React, Node.js, Python...

Experience
Senior Developer at Tech Corp
Jan 2020 - Present
• Led development of key features
• Improved performance by 40%

Education
BS Computer Science - MIT, 2019"
                  className="flex-1 min-h-[300px] bg-neutral-50 border-neutral-300 focus:border-indigo-500 rounded-sm resize-none font-mono text-sm"
                  data-testid="resume-text-input"
                />

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => handleParse('ai')}
                    disabled={loading || !rawText.trim()}
                    className="flex-1 bg-indigo-950 hover:bg-indigo-900 text-white rounded-sm h-12 btn-hover-lift"
                    data-testid="parse-ai-btn"
                  >
                    {loading && parseMode === 'ai' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    AI Parse (GPT-5.2)
                  </Button>
                  <Button
                    onClick={() => handleParse('simple')}
                    disabled={loading || !rawText.trim()}
                    variant="outline"
                    className="flex-1 border-indigo-200 text-indigo-950 hover:bg-indigo-50 rounded-sm h-12"
                    data-testid="parse-simple-btn"
                  >
                    {loading && parseMode === 'simple' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    Simple Parse
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="edit" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  {/* Personal Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-indigo-950 uppercase tracking-wide flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Personal Information
                    </h3>
                    <div className="grid gap-4">
                      <div>
                        <Label className="text-slate-700">Full Name</Label>
                        <Input
                          value={parsedData?.name || ''}
                          onChange={(e) => updateParsedField('name', e.target.value)}
                          className="mt-1 rounded-sm"
                          data-testid="edit-name-input"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-slate-700 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> Email
                          </Label>
                          <Input
                            value={parsedData?.email || ''}
                            onChange={(e) => updateParsedField('email', e.target.value)}
                            className="mt-1 rounded-sm"
                            data-testid="edit-email-input"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-700 flex items-center gap-1">
                            <Linkedin className="w-3 h-3" /> LinkedIn
                          </Label>
                          <Input
                            value={parsedData?.linkedin || ''}
                            onChange={(e) => updateParsedField('linkedin', e.target.value)}
                            className="mt-1 rounded-sm"
                            data-testid="edit-linkedin-input"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Professional Summary */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-indigo-950 uppercase tracking-wide">
                      Professional Summary
                    </h3>
                    <Textarea
                      value={parsedData?.professional_summary || ''}
                      onChange={(e) => updateParsedField('professional_summary', e.target.value)}
                      className="rounded-sm min-h-[100px]"
                      data-testid="edit-summary-input"
                    />
                  </div>

                  {/* Technical Skills */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-indigo-950 uppercase tracking-wide">
                      Technical Skills
                    </h3>
                    <Textarea
                      value={parsedData?.technical_skills?.join(', ') || ''}
                      onChange={(e) => updateParsedField('technical_skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      placeholder="Separate skills with commas"
                      className="rounded-sm"
                      data-testid="edit-skills-input"
                    />
                  </div>

                  {/* Experience */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-indigo-950 uppercase tracking-wide flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Experience
                    </h3>
                    {parsedData?.experiences?.map((exp, index) => (
                      <div key={index} className="p-4 bg-neutral-50 rounded-sm space-y-3 border border-neutral-200">
                        <Input
                          value={exp.title || ''}
                          onChange={(e) => {
                            const updated = [...(parsedData.experiences || [])];
                            updated[index] = { ...updated[index], title: e.target.value };
                            updateParsedField('experiences', updated);
                          }}
                          placeholder="Job Title"
                          className="font-medium rounded-sm"
                        />
                        <div className="grid grid-cols-3 gap-3">
                          <Input
                            value={exp.company || ''}
                            onChange={(e) => {
                              const updated = [...(parsedData.experiences || [])];
                              updated[index] = { ...updated[index], company: e.target.value };
                              updateParsedField('experiences', updated);
                            }}
                            placeholder="Company"
                            className="rounded-sm"
                          />
                          <Input
                            value={exp.from_date || ''}
                            onChange={(e) => {
                              const updated = [...(parsedData.experiences || [])];
                              updated[index] = { ...updated[index], from_date: e.target.value };
                              updateParsedField('experiences', updated);
                            }}
                            placeholder="From Date"
                            className="rounded-sm"
                          />
                          <Input
                            value={exp.to_date || ''}
                            onChange={(e) => {
                              const updated = [...(parsedData.experiences || [])];
                              updated[index] = { ...updated[index], to_date: e.target.value };
                              updateParsedField('experiences', updated);
                            }}
                            placeholder="To Date"
                            className="rounded-sm"
                          />
                        </div>
                        <Textarea
                          value={exp.bullets?.join('\n') || ''}
                          onChange={(e) => {
                            const updated = [...(parsedData.experiences || [])];
                            updated[index] = { ...updated[index], bullets: e.target.value.split('\n').filter(Boolean) };
                            updateParsedField('experiences', updated);
                          }}
                          placeholder="Bullet points (one per line)"
                          className="rounded-sm"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Projects */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-indigo-950 uppercase tracking-wide flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      Projects
                    </h3>
                    {parsedData?.projects?.map((proj, index) => (
                      <div key={index} className="p-4 bg-neutral-50 rounded-sm space-y-3 border border-neutral-200">
                        <Input
                          value={proj.title || ''}
                          onChange={(e) => {
                            const updated = [...(parsedData.projects || [])];
                            updated[index] = { ...updated[index], title: e.target.value };
                            updateParsedField('projects', updated);
                          }}
                          placeholder="Project Title"
                          className="font-medium rounded-sm"
                        />
                        <Textarea
                          value={proj.description || ''}
                          onChange={(e) => {
                            const updated = [...(parsedData.projects || [])];
                            updated[index] = { ...updated[index], description: e.target.value };
                            updateParsedField('projects', updated);
                          }}
                          placeholder="Description"
                          className="rounded-sm"
                        />
                        <Textarea
                          value={proj.bullets?.join('\n') || ''}
                          onChange={(e) => {
                            const updated = [...(parsedData.projects || [])];
                            updated[index] = { ...updated[index], bullets: e.target.value.split('\n').filter(Boolean) };
                            updateParsedField('projects', updated);
                          }}
                          placeholder="Bullet points (one per line)"
                          className="rounded-sm"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Education */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-indigo-950 uppercase tracking-wide flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Education
                    </h3>
                    {parsedData?.education?.map((edu, index) => (
                      <div key={index} className="p-4 bg-neutral-50 rounded-sm space-y-3 border border-neutral-200">
                        <Input
                          value={edu.title || ''}
                          onChange={(e) => {
                            const updated = [...(parsedData.education || [])];
                            updated[index] = { ...updated[index], title: e.target.value };
                            updateParsedField('education', updated);
                          }}
                          placeholder="Degree / Certificate"
                          className="font-medium rounded-sm"
                        />
                        <div className="grid grid-cols-3 gap-3">
                          <Input
                            value={edu.institution || ''}
                            onChange={(e) => {
                              const updated = [...(parsedData.education || [])];
                              updated[index] = { ...updated[index], institution: e.target.value };
                              updateParsedField('education', updated);
                            }}
                            placeholder="Institution"
                            className="rounded-sm"
                          />
                          <Input
                            value={edu.from_date || ''}
                            onChange={(e) => {
                              const updated = [...(parsedData.education || [])];
                              updated[index] = { ...updated[index], from_date: e.target.value };
                              updateParsedField('education', updated);
                            }}
                            placeholder="From"
                            className="rounded-sm"
                          />
                          <Input
                            value={edu.to_date || ''}
                            onChange={(e) => {
                              const updated = [...(parsedData.education || [])];
                              updated[index] = { ...updated[index], to_date: e.target.value };
                              updateParsedField('education', updated);
                            }}
                            placeholder="To"
                            className="rounded-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Preview */}
        <div className="w-[45%] bg-neutral-100 p-8 overflow-auto">
          <div className="sticky top-0">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
              Live Preview
            </h3>
            
            {parsedData ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="resume-paper bg-white rounded-sm p-8 overflow-auto"
                data-testid="resume-preview"
              >
                {/* Name */}
                {parsedData.name && (
                  <h1 className="text-2xl font-bold text-indigo-950 mb-1" style={{ fontFamily: 'Manrope' }}>
                    {parsedData.name}
                  </h1>
                )}

                {/* Contact */}
                <div className="flex flex-wrap gap-3 text-sm text-slate-600 mb-6">
                  {parsedData.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {parsedData.email}
                    </span>
                  )}
                  {parsedData.linkedin && (
                    <span className="flex items-center gap-1">
                      <Linkedin className="w-3 h-3" />
                      {parsedData.linkedin}
                    </span>
                  )}
                </div>

                {/* Professional Summary */}
                {parsedData.professional_summary && (
                  <div className="mb-6">
                    <h2 className="text-sm font-bold text-indigo-950 uppercase tracking-wide mb-2 border-b border-indigo-200 pb-1">
                      Professional Summary
                    </h2>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {parsedData.professional_summary}
                    </p>
                  </div>
                )}

                {/* Technical Skills */}
                {parsedData.technical_skills?.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-sm font-bold text-indigo-950 uppercase tracking-wide mb-2 border-b border-indigo-200 pb-1">
                      Technical Skills
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {parsedData.technical_skills.map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-lime-100 text-indigo-950 text-xs rounded-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {parsedData.experiences?.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-sm font-bold text-indigo-950 uppercase tracking-wide mb-3 border-b border-indigo-200 pb-1">
                      Experience
                    </h2>
                    <div className="space-y-4">
                      {parsedData.experiences.map((exp, i) => (
                        <div key={i}>
                          <h3 className="font-semibold text-indigo-900 text-sm">{exp.title}</h3>
                          {(exp.company || exp.from_date) && (
                            <p className="text-xs text-slate-500 italic">
                              {exp.company}{exp.company && exp.from_date && ' | '}{exp.from_date}{exp.to_date && ` - ${exp.to_date}`}
                            </p>
                          )}
                          {exp.bullets?.length > 0 && (
                            <ul className="mt-1 space-y-0.5">
                              {exp.bullets.map((bullet, j) => (
                                <li key={j} className="text-xs text-slate-700 flex items-start gap-1">
                                  <span className="text-indigo-400 mt-0.5">•</span>
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {parsedData.projects?.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-sm font-bold text-indigo-950 uppercase tracking-wide mb-3 border-b border-indigo-200 pb-1">
                      Projects
                    </h2>
                    <div className="space-y-4">
                      {parsedData.projects.map((proj, i) => (
                        <div key={i}>
                          <h3 className="font-semibold text-indigo-900 text-sm">{proj.title}</h3>
                          {proj.description && (
                            <p className="text-xs text-slate-600 mt-0.5">{proj.description}</p>
                          )}
                          {proj.bullets?.length > 0 && (
                            <ul className="mt-1 space-y-0.5">
                              {proj.bullets.map((bullet, j) => (
                                <li key={j} className="text-xs text-slate-700 flex items-start gap-1">
                                  <span className="text-indigo-400 mt-0.5">•</span>
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {parsedData.education?.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-sm font-bold text-indigo-950 uppercase tracking-wide mb-3 border-b border-indigo-200 pb-1">
                      Education
                    </h2>
                    <div className="space-y-3">
                      {parsedData.education.map((edu, i) => (
                        <div key={i}>
                          <h3 className="font-semibold text-indigo-900 text-sm">{edu.title}</h3>
                          {(edu.institution || edu.from_date) && (
                            <p className="text-xs text-slate-500 italic">
                              {edu.institution}{edu.institution && edu.from_date && ' | '}{edu.from_date}{edu.to_date && ` - ${edu.to_date}`}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="resume-paper bg-white rounded-sm p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2" style={{ fontFamily: 'Manrope' }}>
                  No Preview Yet
                </h3>
                <p className="text-sm text-slate-500 max-w-xs">
                  Paste your resume text and click "AI Parse" or "Simple Parse" to see the formatted preview.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
