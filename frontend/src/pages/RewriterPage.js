import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Wand2, FileText, Briefcase, Loader2, Sparkles, 
  CheckCircle2, ArrowRight, Copy, Download, TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function RewriterPage() {
  const { getAuthHeaders } = useAuth();
  
  // State for inputs
  const [resumeSource, setResumeSource] = useState('paste');
  const [jdSource, setJdSource] = useState('paste');
  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedJdId, setSelectedJdId] = useState('');
  
  // State for saved items
  const [savedResumes, setSavedResumes] = useState([]);
  const [savedJds, setSavedJds] = useState([]);
  
  // State for results
  const [rewriteResult, setRewriteResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [loadingJds, setLoadingJds] = useState(false);

  useEffect(() => {
    fetchSavedItems();
  }, []);

  const fetchSavedItems = async () => {
    setLoadingResumes(true);
    setLoadingJds(true);
    try {
      const [resumesRes, jdsRes] = await Promise.all([
        axios.get(`${API}/resumes`, { headers: getAuthHeaders() }),
        axios.get(`${API}/jds`, { headers: getAuthHeaders() })
      ]);
      setSavedResumes(resumesRes.data);
      setSavedJds(jdsRes.data);
    } catch (error) {
      console.error('Failed to load saved items:', error);
    } finally {
      setLoadingResumes(false);
      setLoadingJds(false);
    }
  };

  const loadSelectedResume = async (resumeId) => {
    if (!resumeId) return;
    try {
      const response = await axios.get(`${API}/resumes/${resumeId}`, { headers: getAuthHeaders() });
      setResumeText(response.data.raw_text);
      setSelectedResumeId(resumeId);
    } catch (error) {
      toast.error('Failed to load resume');
    }
  };

  const loadSelectedJd = async (jdId) => {
    if (!jdId) return;
    try {
      const response = await axios.get(`${API}/jds/${jdId}`, { headers: getAuthHeaders() });
      setJdText(response.data.raw_text);
      setSelectedJdId(jdId);
    } catch (error) {
      toast.error('Failed to load JD');
    }
  };

  const handleRewrite = async () => {
    if (!resumeText.trim() || !jdText.trim()) {
      toast.error('Please provide both resume and job description');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post(
        `${API}/rewrite-resume`,
        { resume_text: resumeText, jd_text: jdText },
        { headers: getAuthHeaders() }
      );
      setRewriteResult(response.data);
      toast.success('Resume rewritten successfully!');
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to rewrite resume';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (rewriteResult?.rewritten_resume) {
      navigator.clipboard.writeText(rewriteResult.rewritten_resume);
      toast.success('Copied to clipboard!');
    }
  };

  const handleSaveAsNew = async () => {
    if (!rewriteResult?.rewritten_resume) return;
    
    try {
      await axios.post(
        `${API}/resumes`,
        { 
          title: `Rewritten Resume - ${new Date().toLocaleDateString()}`,
          raw_text: rewriteResult.rewritten_resume,
          parsed_data: null
        },
        { headers: getAuthHeaders() }
      );
      toast.success('Saved as new resume!');
    } catch (error) {
      toast.error('Failed to save resume');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Sidebar />
      
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-indigo-950 tracking-tight flex items-center gap-3" style={{ fontFamily: 'Manrope' }}>
              <Wand2 className="w-8 h-8" />
              Resume Rewriter
            </h1>
            <p className="text-slate-600 mt-1">
              AI-powered resume optimization tailored to your target job description
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column - Inputs */}
            <div className="space-y-6">
              {/* Resume Input */}
              <Card className="border-neutral-200" data-testid="resume-input-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Your Resume
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={resumeSource} onValueChange={setResumeSource}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="paste" data-testid="resume-paste-tab">Paste Text</TabsTrigger>
                      <TabsTrigger value="saved" data-testid="resume-saved-tab">Load Saved</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="paste" className="m-0">
                      <Textarea
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        placeholder="Paste your current resume text here..."
                        className="min-h-[200px] font-mono text-sm"
                        data-testid="resume-text-area"
                      />
                    </TabsContent>
                    
                    <TabsContent value="saved" className="m-0">
                      <Select value={selectedResumeId} onValueChange={loadSelectedResume}>
                        <SelectTrigger data-testid="resume-select">
                          <SelectValue placeholder={loadingResumes ? "Loading..." : "Select a saved resume"} />
                        </SelectTrigger>
                        <SelectContent>
                          {savedResumes.map((resume) => (
                            <SelectItem key={resume.id} value={resume.id}>
                              {resume.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {resumeText && (
                        <Textarea
                          value={resumeText}
                          readOnly
                          className="min-h-[150px] font-mono text-sm mt-3 bg-neutral-50"
                        />
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* JD Input */}
              <Card className="border-neutral-200" data-testid="jd-input-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                    Target Job Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={jdSource} onValueChange={setJdSource}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="paste" data-testid="jd-paste-tab">Paste Text</TabsTrigger>
                      <TabsTrigger value="saved" data-testid="jd-saved-tab">Load Saved</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="paste" className="m-0">
                      <Textarea
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                        placeholder="Paste the job description you're targeting..."
                        className="min-h-[200px] font-mono text-sm"
                        data-testid="jd-text-area"
                      />
                    </TabsContent>
                    
                    <TabsContent value="saved" className="m-0">
                      <Select value={selectedJdId} onValueChange={loadSelectedJd}>
                        <SelectTrigger data-testid="jd-select">
                          <SelectValue placeholder={loadingJds ? "Loading..." : "Select a saved JD"} />
                        </SelectTrigger>
                        <SelectContent>
                          {savedJds.map((jd) => (
                            <SelectItem key={jd.id} value={jd.id}>
                              {jd.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {jdText && (
                        <Textarea
                          value={jdText}
                          readOnly
                          className="min-h-[150px] font-mono text-sm mt-3 bg-neutral-50"
                        />
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Rewrite Button */}
              <Button
                onClick={handleRewrite}
                disabled={loading || !resumeText.trim() || !jdText.trim()}
                className="w-full h-14 bg-indigo-950 hover:bg-indigo-900 text-white text-lg"
                data-testid="rewrite-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Rewriting Resume...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Rewrite My Resume
                  </>
                )}
              </Button>

              {/* Rewrite Rules Info */}
              <Card className="border-neutral-200 bg-indigo-50">
                <CardContent className="pt-4">
                  <h4 className="font-semibold text-indigo-950 mb-2">Rewriting Rules Applied:</h4>
                  <ul className="text-sm text-indigo-800 space-y-1">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-indigo-600" />
                      <span><strong>Keywords:</strong> Skills listed as bullet points</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-indigo-600" />
                      <span><strong>Alignment:</strong> Skills used in context within sentences</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-indigo-600" />
                      <span><strong>RPM:</strong> Performance metrics and results included</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Results */}
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {rewriteResult ? (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Score Comparison */}
                    <Card className="border-neutral-200" data-testid="score-comparison-card">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-center gap-6">
                          <div className="text-center">
                            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getScoreBg(rewriteResult.score_before)}`}>
                              <span className={`text-2xl font-bold ${getScoreColor(rewriteResult.score_before)}`}>
                                {Math.round(rewriteResult.score_before)}%
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mt-2">Before</p>
                          </div>
                          
                          <ArrowRight className="w-8 h-8 text-indigo-400" />
                          
                          <div className="text-center">
                            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getScoreBg(rewriteResult.score_after)}`}>
                              <span className={`text-2xl font-bold ${getScoreColor(rewriteResult.score_after)}`}>
                                {Math.round(rewriteResult.score_after)}%
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mt-2">After</p>
                          </div>
                        </div>
                        
                        <div className="text-center mt-4">
                          <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                            <TrendingUp className="w-4 h-4" />
                            +{Math.round(rewriteResult.score_after - rewriteResult.score_before)}% improvement
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Improvements Made */}
                    {rewriteResult.improvements && rewriteResult.improvements.length > 0 && (
                      <Card className="border-neutral-200" data-testid="improvements-card">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Improvements Made</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {rewriteResult.improvements.map((improvement, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                {improvement}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Rewritten Resume */}
                    <Card className="border-neutral-200" data-testid="rewritten-resume-card">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Rewritten Resume</CardTitle>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCopyToClipboard}
                              data-testid="copy-btn"
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleSaveAsNew}
                              data-testid="save-new-btn"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-white border rounded-lg p-4 max-h-[500px] overflow-auto">
                          <pre className="whitespace-pre-wrap text-sm font-mono text-slate-800" data-testid="rewritten-resume-text">
                            {rewriteResult.rewritten_resume}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Card className="border-neutral-200 border-dashed">
                      <CardContent className="py-20 text-center">
                        <Wand2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-600 mb-2">
                          Ready to Transform
                        </h3>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto">
                          Paste your resume and target job description, then click "Rewrite My Resume" to get an optimized version.
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
