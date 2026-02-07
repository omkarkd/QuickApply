import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Bot, Loader2, CheckCircle, XCircle, ExternalLink, MessageSquare, FileText, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function TelegramSettingsPage() {
  const { getAuthHeaders } = useAuth();
  const [settings, setSettings] = useState({ bot_token: '', is_active: false, chat_id: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tokenInput, setTokenInput] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(API + '/telegram/settings', { headers: getAuthHeaders() });
      setSettings(res.data);
      setTokenInput(res.data.bot_token || '');
    } catch (e) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.put(API + '/telegram/settings', {
        bot_token: tokenInput,
        is_active: settings.is_active
      }, { headers: getAuthHeaders() });
      setSettings(res.data);
      toast.success('Settings saved!');
    } catch (e) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (checked) => {
    if (!tokenInput && checked) {
      toast.error('Please enter a bot token first');
      return;
    }
    setSettings({ ...settings, is_active: checked });
    setSaving(true);
    try {
      const res = await axios.put(API + '/telegram/settings', {
        bot_token: tokenInput,
        is_active: checked
      }, { headers: getAuthHeaders() });
      setSettings(res.data);
      toast.success(checked ? 'Bot activated!' : 'Bot deactivated');
    } catch (e) {
      toast.error('Failed to update');
      setSettings({ ...settings, is_active: !checked });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Sidebar />
        <div className="ml-64 flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-950" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Sidebar />
      
      <main className="ml-64 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-indigo-950 tracking-tight" style={{ fontFamily: 'Manrope' }}>
              Telegram Bot Settings
            </h1>
            <p className="text-slate-600 mt-1">Connect a Telegram bot to parse resumes and job descriptions on the go</p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Bot className="w-6 h-6 text-indigo-950" />
                  </div>
                  <div>
                    <CardTitle>Application Bot</CardTitle>
                    <CardDescription>Your personal resume & JD parsing assistant</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {settings.is_active ? (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-slate-500">
                      <XCircle className="w-4 h-4" />Inactive
                    </span>
                  )}
                  <Switch 
                    checked={settings.is_active} 
                    onCheckedChange={handleToggle}
                    disabled={saving}
                    data-testid="telegram-toggle"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="bot-token" className="text-slate-700">Bot Token</Label>
                <p className="text-sm text-slate-500 mb-2">
                  Get your bot token from <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline inline-flex items-center gap-1">@BotFather <ExternalLink className="w-3 h-3" /></a>
                </p>
                <Input
                  id="bot-token"
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                  className="font-mono"
                  data-testid="bot-token-input"
                />
              </div>

              <Button onClick={handleSave} disabled={saving} className="bg-indigo-950 text-white" data-testid="save-telegram-btn">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Settings
              </Button>
            </CardContent>
          </Card>

          {/* How it works */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-indigo-950 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="font-medium text-indigo-950">Start a conversation</p>
                    <p className="text-sm text-slate-600">Send "hi" or "/start" to your bot on Telegram</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-indigo-950 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="font-medium text-indigo-950">Choose document type</p>
                    <p className="text-sm text-slate-600">Select "Resume" or "JD" when prompted</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-indigo-950 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                  <div>
                    <p className="font-medium text-indigo-950">Send your text</p>
                    <p className="text-sm text-slate-600">Paste your resume or job description text</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-lime-200 text-indigo-950 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-indigo-950">Auto-saved & parsed!</p>
                    <p className="text-sm text-slate-600">View your parsed document in the dashboard</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-sm font-medium text-indigo-950 mb-2">Supported document types:</p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Resumes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    <span>Job Descriptions</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
