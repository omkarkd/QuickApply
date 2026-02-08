import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { 
  Target, FileText, Briefcase, Loader2, Sparkles, 
  CheckCircle2, XCircle, AlertCircle, RefreshCw, Save,
  TrendingUp, ListChecks, Gauge, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function MatchScorePage() {
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
  const [scoreResult, setScoreResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [loadingJds, setLoadingJds] = useState(false);
  
  // State for editable resume
  const [editedResumeText, setEditedResumeText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [reScoring, setReScoring] = useState(false);

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

  const handleCalculateScore = async () => {
    const textToScore = isEditing ? editedResumeText : resumeText;
    if (!textToScore.trim() || !jdText.trim()) {
      toast.error('Please provide both resume and job description');
      return;
    }
    
    setLoading(true);
    setReScoring(false);
    
    try {
      const response = await axios.post(
        `${API}/match-score`,
        { resume_text: textToScore, jd_text: jdText },
        { headers: getAuthHeaders() }
      );
      setScoreResult(response.data);
      setEditedResumeText(textToScore);
      toast.success('Score calculated!');
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to calculate score';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReScore = async () => {
    if (!editedResumeText.trim() || !jdText.trim()) {
      toast.error('Please provide both resume and job description');
      return;
    }
    
    setReScoring(true);
    
    try {
      const response = await axios.post(
        `${API}/match-score`,
        { resume_text: editedResumeText, jd_text: jdText },
        { headers: getAuthHeaders() }
      );
      setScoreResult(response.data);
      toast.success('Re-scored successfully!');
    } catch (error) {
      toast.error('Failed to re-score');
    } finally {
      setReScoring(false);
    }
  };

  const handleAddKeyword = (keyword) => {
    // Add keyword to skills section in resume
    const skillsMatch = editedResumeText.match(/skills?:?\s*([^\n]+)/i);
    if (skillsMatch) {
      const newText = editedResumeText.replace(
        skillsMatch[0],
        `${skillsMatch[0]}, ${keyword}`
      );
      setEditedResumeText(newText);
    } else {
      // Add skills section if not present
      setEditedResumeText(`${editedResumeText}\n\nSkills: ${keyword}`);
    }
    toast.success(`Added "${keyword}" to resume`);
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

  const getProgressColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Sidebar />
      
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-indigo-950 tracking-tight flex items-center gap-3" style={{ fontFamily: 'Manrope' }}>
              <Target className="w-8 h-8" />
              Resume Match Score
            </h1>
            <p className="text-slate-600 mt-1">
              Compare your resume against a job description and see how well you match
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
                    Resume
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
                        placeholder="Paste your resume text here..."
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
                    Job Description
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
                        placeholder="Paste the job description here..."
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

              {/* Calculate Button */}
              <Button
                onClick={handleCalculateScore}
                disabled={loading || !resumeText.trim() || !jdText.trim()}
                className="w-full h-14 bg-indigo-950 hover:bg-indigo-900 text-white text-lg"
                data-testid="calculate-score-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Calculate Match Score
                  </>
                )}
              </Button>
            </div>

            {/* Right Column - Results */}
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {scoreResult ? (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Overall Score */}
                    <Card className="border-neutral-200" data-testid="score-result-card">
                      <CardContent className="pt-6">
                        <div className="text-center mb-6">
                          <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBg(scoreResult.overall_score)}`}>
                            <span className={`text-5xl font-bold ${getScoreColor(scoreResult.overall_score)}`}>
                              {Math.round(scoreResult.overall_score)}%
                            </span>
                          </div>
                          <h2 className="text-xl font-semibold text-indigo-950 mt-4">Overall Match Score</h2>
                        </div>

                        {/* Score Breakdown */}
                        <div className="space-y-4">
                          <div data-testid="keywords-score">
                            <div className="flex items-center justify-between mb-2">
                              <span className="flex items-center gap-2 text-sm font-medium">
                                <ListChecks className="w-4 h-4 text-indigo-600" />
                                Keywords Match
                              </span>
                              <span className={`font-semibold ${getScoreColor(scoreResult.keywords_score)}`}>
                                {scoreResult.keywords_score}%
                              </span>
                            </div>
                            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${getProgressColor(scoreResult.keywords_score)} transition-all duration-500`}
                                style={{ width: `${scoreResult.keywords_score}%` }}
                              />
                            </div>
                          </div>

                          <div data-testid="alignment-score">
                            <div className="flex items-center justify-between mb-2">
                              <span className="flex items-center gap-2 text-sm font-medium">
                                <TrendingUp className="w-4 h-4 text-indigo-600" />
                                Keyword Alignment
                              </span>
                              <span className={`font-semibold ${getScoreColor(scoreResult.alignment_score)}`}>
                                {scoreResult.alignment_score}%
                              </span>
                            </div>
                            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${getProgressColor(scoreResult.alignment_score)} transition-all duration-500`}
                                style={{ width: `${scoreResult.alignment_score}%` }}
                              />
                            </div>
                          </div>

                          <div data-testid="rpm-score">
                            <div className="flex items-center justify-between mb-2">
                              <span className="flex items-center gap-2 text-sm font-medium">
                                <Gauge className="w-4 h-4 text-indigo-600" />
                                RPM (Performance Metrics)
                              </span>
                              <span className={`font-semibold ${getScoreColor(scoreResult.rpm_score)}`}>
                                {scoreResult.rpm_score}%
                              </span>
                            </div>
                            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${getProgressColor(scoreResult.rpm_score)} transition-all duration-500`}
                                style={{ width: `${scoreResult.rpm_score}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Keywords Analysis */}
                    <Card className="border-neutral-200" data-testid="keywords-analysis-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Keyword Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Present Keywords */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-green-700 flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Present Keywords ({scoreResult.present_keywords.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {scoreResult.present_keywords.map((keyword, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                                data-testid={`present-keyword-${i}`}
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Missing Keywords */}
                        <div>
                          <h4 className="text-sm font-medium text-red-700 flex items-center gap-2 mb-2">
                            <XCircle className="w-4 h-4" />
                            Missing Keywords ({scoreResult.missing_keywords.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {scoreResult.missing_keywords.map((keyword, i) => (
                              <button
                                key={i}
                                onClick={() => handleAddKeyword(keyword)}
                                className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full hover:bg-red-200 transition-colors flex items-center gap-1 group"
                                data-testid={`missing-keyword-${i}`}
                                title="Click to add to resume"
                              >
                                {keyword}
                                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-slate-500 mt-2">Click a missing keyword to add it to your resume</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Suggestions */}
                    {scoreResult.suggestions && scoreResult.suggestions.length > 0 && (
                      <Card className="border-neutral-200" data-testid="suggestions-card">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                            Improvement Suggestions
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {scoreResult.suggestions.map((suggestion, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="text-indigo-600 mt-0.5">→</span>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Editable Resume Section */}
                    <Card className="border-neutral-200" data-testid="edit-resume-card">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Edit & Re-Score</CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(!isEditing)}
                            data-testid="toggle-edit-btn"
                          >
                            {isEditing ? 'Cancel Edit' : 'Edit Resume'}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {isEditing ? (
                          <div className="space-y-4">
                            <Textarea
                              value={editedResumeText}
                              onChange={(e) => setEditedResumeText(e.target.value)}
                              className="min-h-[200px] font-mono text-sm"
                              data-testid="edited-resume-textarea"
                            />
                            <div className="flex gap-3">
                              <Button
                                onClick={handleReScore}
                                disabled={reScoring}
                                className="flex-1 bg-indigo-950 hover:bg-indigo-900 text-white"
                                data-testid="rescore-btn"
                              >
                                {reScoring ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Re-scoring...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Re-Calculate Score
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-600">
                            Click "Edit Resume" to modify your resume text and add missing keywords, then re-calculate your score.
                          </p>
                        )}
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
                        <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-600 mb-2">
                          Ready to Analyze
                        </h3>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto">
                          Paste or load your resume and job description, then click "Calculate Match Score" to see detailed analysis.
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
