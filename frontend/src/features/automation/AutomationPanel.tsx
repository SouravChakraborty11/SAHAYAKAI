import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, ArrowLeft, FileText, CheckCircle, Upload, Eye, Download, Search, 
  Clock, ShieldCheck, Play, RefreshCw, AlertTriangle, Mic, Copy, User, Calendar
} from 'lucide-react';
import { GlassCard } from '../../components/GlassCard';
import { useAccessibility } from '../../core/contexts/AccessibilityContext';
import { useExplain } from '../../core/hooks/useExplain';
import { AccessibilityMenu } from '../../components/AccessibilityMenu';
import { ChatInterface } from '../../components/chat/ChatInterface';

interface AutomationResult {
  success: boolean;
  status: string;
  reference_number?: string;
  submission_date?: string;
  scheme_name?: string;
  applicant_name?: string;
  screenshot?: string;
  receipt?: string;
  step_screenshots?: Array<{ step: string; filename: string }>;
  logs: string[];
}

interface TrackingDetails {
  reference_number: string;
  scheme_name: string;
  applicant_name: string;
  status: string;
  submission_date: string;
  last_updated: string;
  screenshot?: string;
  receipt?: string;
}

export const AutomationPanel: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useAccessibility();
  const explain = useExplain();

  // Form State
  const [selectedScheme, setSelectedScheme] = useState('PM-Kisan Samman Nidhi');
  const [applicantName, setApplicantName] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<AutomationResult | null>(null);

  // Status Tracking State
  const [trackingRef, setTrackingRef] = useState('');
  const [trackingResult, setTrackingResult] = useState<TrackingDetails | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  // Human Intervention State (Phase 7)
  const [pendingInterventions, setPendingInterventions] = useState<any[]>([]);
  const [interventionInput, setInterventionInput] = useState('');
  const [activeInterventionSession, setActiveInterventionSession] = useState<any | null>(null);
  const [isSubmittingIntervention, setIsSubmittingIntervention] = useState(false);
  const [interventionMessage, setInterventionMessage] = useState<string | null>(null);

  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    fetchPendingInterventions();
  }, []);

  const schemeOptions = [
    { name: 'PM-Kisan Samman Nidhi', url: 'https://pmkisan.gov.in' },
    { name: 'PM Awas Yojana (PMAY)', url: 'https://pmaymis.gov.in' },
    { name: 'National Disability Pension Scheme', url: 'https://nsap.nic.in' },
    { name: 'Senior Citizen Identity Card', url: 'https://socialjustice.gov.in' },
  ];

  const handleRunAutomation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName || !aadhaarNumber || !phoneNumber) return;

    setIsRunning(true);
    setResult(null);

    const schemeObj = schemeOptions.find(s => s.name === selectedScheme);
    const target_url = schemeObj ? schemeObj.url : 'https://example.com';

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/automation/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_url,
          applicant_name: applicantName,
          aadhaar_number: aadhaarNumber,
          phone_number: phoneNumber,
          scheme_name: selectedScheme,
          address
        })
      });

      if (res.ok) {
        const data: AutomationResult = await res.json();
        setResult(data);
        if (data.reference_number) {
          setTrackingRef(data.reference_number);
        }
      }
    } catch (err) {
      console.error('Automation execution failed', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleTrackStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingRef.trim()) return;

    setIsTracking(true);
    setTrackingResult(null);
    setTrackingError(null);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/automation/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference_number: trackingRef.trim()
        })
      });

      if (res.ok) {
        const data: TrackingDetails = await res.json();
        setTrackingResult(data);
      } else {
        const errData = await res.json();
        setTrackingError(errData.detail || 'Invalid Reference Number. Please check your reference code and try again.');
      }
    } catch (err) {
      console.error('Tracking failed', err);
      setTrackingError('Failed to connect to tracking server. Please try again.');
    } finally {
      setIsTracking(false);
    }
  };

  const fetchPendingInterventions = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/intervention/pending');
      if (res.ok) {
        const data = await res.json();
        setPendingInterventions(data.interventions || []);
        if (data.interventions && data.interventions.length > 0) {
          setActiveInterventionSession(data.interventions[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch pending interventions', err);
    }
  };

  const handleSubmitIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interventionInput.trim()) return;

    const session_id = activeInterventionSession ? activeInterventionSession.session_id : 'DEMO-INTERVENT-01';
    setIsSubmittingIntervention(true);
    setInterventionMessage(null);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/intervention/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id,
          user_input: interventionInput.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setInterventionMessage(`Input '${interventionInput}' submitted successfully. Playwright workflow resumed!`);
        setInterventionInput('');
        setTimeout(() => {
          setActiveInterventionSession(null);
          setInterventionMessage(null);
          fetchPendingInterventions();
        }, 3000);
      }
    } catch (err) {
      console.error('Intervention submit error', err);
      setInterventionMessage('Failed to submit input to automation server.');
    } finally {
      setIsSubmittingIntervention(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const getStatusBadgeColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('approved')) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (s.includes('rejected')) return 'bg-red-100 text-red-800 border-red-300';
    if (s.includes('verification') || s.includes('progress')) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#E8F5E9] to-[#E3F2FD] p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/dashboard')}
            onMouseEnter={() => explain("Back to Dashboard")}
            className="flex items-center space-x-2 bg-white px-5 py-3 rounded-full border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-700 font-bold"
          >
            <ArrowLeft className="w-5 h-5 text-[#2E7D32]" />
            <span>Dashboard</span>
          </button>
          
          <div className="flex items-center space-x-3 bg-white px-6 py-3 rounded-full shadow-sm border border-gray-200">
            <Bot className="w-6 h-6 text-[#2E7D32]" />
            <h1 className="text-2xl font-extrabold text-[#2E7D32]">Playwright Automation Hub</h1>
          </div>
        </div>

        {/* Hero Banner */}
        <GlassCard className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white !p-8 !rounded-3xl shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-white/20 px-4 py-1.5 rounded-full text-sm font-bold mb-4 backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Automated Government Scheme Submissions</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Seamless Browser Automation Engine</h2>
            <p className="text-white/90 text-lg font-medium leading-relaxed">
              Auto-fill scheme forms, upload documents, download official PDF receipts, handle Human Intervention (OTP/CAPTCHA), and track application status automatically with headless Playwright.
            </p>
          </div>
        </GlassCard>

        {/* Phase 7: Human Intervention Manager Interactive Card */}
        <GlassCard className="bg-gradient-to-r from-amber-500 to-orange-600 text-white !p-8 !rounded-3xl shadow-xl border-2 border-amber-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold text-amber-100 backdrop-blur-md">
                <AlertTriangle className="w-4 h-4 text-amber-200" />
                <span>Phase-7 Human Intervention Manager</span>
              </div>
              <h3 className="text-2xl font-extrabold">Active OTP / CAPTCHA Intervention Handler</h3>
              <p className="text-amber-100 text-sm font-medium leading-relaxed">
                When Playwright automation detects security verification (OTP or CAPTCHA) on government portals, the workflow automatically pauses, persists state, and prompts for human input to unblock and resume execution.
              </p>
            </div>

            <div className="w-full md:w-auto bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 space-y-3 shrink-0 min-w-[320px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-100 uppercase">Intervention Status</span>
                <span className="px-2.5 py-0.5 bg-amber-200 text-amber-900 rounded-full font-bold text-xs">
                  {activeInterventionSession ? activeInterventionSession.trigger_type || 'OTP/CAPTCHA' : 'READY'}
                </span>
              </div>

              <form onSubmit={handleSubmitIntervention} className="space-y-3">
                {activeInterventionSession && activeInterventionSession.captcha_image_path && (
                  <div className="p-2 bg-white/20 rounded-xl flex items-center justify-center">
                    <img 
                      src={`http://127.0.0.1:8000/api/v1/automation/files/screenshots/${activeInterventionSession.captcha_image_path}`} 
                      alt="CAPTCHA Challenge"
                      className="max-h-16 rounded shadow-sm"
                    />
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    required
                    placeholder="Enter OTP / CAPTCHA Code..."
                    value={interventionInput}
                    onChange={e => setInterventionInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white text-gray-900 placeholder-gray-400 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-amber-300 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingIntervention}
                  className="w-full py-3 bg-amber-950 text-white hover:bg-black rounded-xl font-extrabold text-xs transition-colors shadow-md flex items-center justify-center space-x-2"
                >
                  {isSubmittingIntervention ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Resuming Playwright...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Submit Input & Resume Workflow</span>
                    </>
                  )}
                </button>
              </form>

              {interventionMessage && (
                <div className="p-2.5 bg-emerald-900/80 border border-emerald-400/50 rounded-xl text-xs font-bold text-emerald-200 text-center">
                  {interventionMessage}
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Grid Layout: Form vs Status Tracker */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Form Auto-filler (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <GlassCard className="bg-white border border-gray-200 shadow-lg !p-8 !rounded-3xl">
              <h3 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center space-x-2">
                <Play className="w-6 h-6 text-[#2E7D32]" />
                <span>Automated Scheme Application</span>
              </h3>

              <form onSubmit={handleRunAutomation} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Target Scheme</label>
                  <select
                    value={selectedScheme}
                    onChange={e => setSelectedScheme(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#2E7D32] focus:outline-none"
                  >
                    {schemeOptions.map(opt => (
                      <option key={opt.name} value={opt.name}>{opt.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Applicant Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={applicantName}
                      onChange={e => setApplicantName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2E7D32] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Aadhaar Number</label>
                    <input
                      type="text"
                      required
                      placeholder="12-digit Aadhaar"
                      value={aadhaarNumber}
                      onChange={e => setAadhaarNumber(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2E7D32] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit Mobile"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2E7D32] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Address / State</label>
                    <input
                      type="text"
                      placeholder="City, State"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2E7D32] focus:outline-none"
                    />
                  </div>
                </div>

                {/* File Upload Selector */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Attach Supporting Document (Optional)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-4 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                    <input
                      type="file"
                      onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="doc-upload"
                    />
                    <label htmlFor="doc-upload" className="cursor-pointer flex items-center justify-center space-x-2 text-gray-600 font-bold text-sm">
                      <Upload className="w-5 h-5 text-[#2E7D32]" />
                      <span>{selectedFile ? selectedFile.name : 'Click to select Aadhaar / Certificate PDF or Image'}</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isRunning}
                  className="w-full py-4 bg-[#2E7D32] text-white rounded-xl font-extrabold text-base hover:bg-[#1B5E20] transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Executing Playwright Automation...</span>
                    </>
                  ) : (
                    <>
                      <Bot className="w-5 h-5" />
                      <span>Run Playwright Automation</span>
                    </>
                  )}
                </button>
              </form>
            </GlassCard>

            {/* Execution Result Card with Reference Number */}
            {result && (
              <GlassCard className="bg-white border-2 border-emerald-300 shadow-xl !p-8 !rounded-3xl space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-extrabold text-gray-900 flex items-center space-x-2">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                    <span>Application Submitted Successfully</span>
                  </h4>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs uppercase border border-emerald-300">
                    {result.status}
                  </span>
                </div>

                {/* Reference Number Box */}
                {result.reference_number && (
                  <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Generated Reference Number</span>
                      <div className="text-xl font-black text-emerald-950 font-mono mt-0.5">{result.reference_number}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(result.reference_number!)}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      <Copy className="w-4 h-4" />
                      <span>{copiedRef ? 'Copied!' : 'Copy Ref'}</span>
                    </button>
                  </div>
                )}

                {/* Execution Logs */}
                <div className="bg-gray-900 text-emerald-400 font-mono text-xs p-4 rounded-2xl space-y-1.5 overflow-x-auto max-h-48">
                  {result.logs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>

                {/* Actions: Download Receipt & Preview Screenshot */}
                <div className="flex flex-wrap gap-4 pt-2">
                  {result.receipt && (
                    <a
                      href={`http://127.0.0.1:8000/api/v1/automation/files/receipts/${result.receipt}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Receipt (PDF)</span>
                    </a>
                  )}

                  {result.screenshot && !result.step_screenshots && (
                    <a
                      href={`http://127.0.0.1:8000/api/v1/automation/files/screenshots/${result.screenshot}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors border border-gray-300"
                    >
                      <Eye className="w-4 h-4 text-gray-600" />
                      <span>View Browser Screenshot</span>
                    </a>
                  )}
                </div>

                {/* Step-by-Step Screenshot Gallery */}
                {result.step_screenshots && result.step_screenshots.length > 0 && (
                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    <h5 className="text-sm font-extrabold text-gray-900 flex items-center space-x-2">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span>Step-by-Step Live Screenshots ({result.step_screenshots.length} Steps Captured)</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {result.step_screenshots.map((s, idx) => (
                        <a
                          key={idx}
                          href={`http://127.0.0.1:8000/api/v1/automation/files/screenshots/${s.filename}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 transition-all"
                        >
                          <span className="truncate mr-2">Step {idx + 1}: {s.step}</span>
                          <Eye className="w-4 h-4 text-blue-600 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </GlassCard>
            )}
          </div>

          {/* Right Column: Application Status Tracker (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <GlassCard className="bg-white border border-gray-200 shadow-lg !p-8 !rounded-3xl">
              <h3 className="text-2xl font-extrabold text-gray-900 mb-4 flex items-center space-x-2">
                <Search className="w-6 h-6 text-blue-600" />
                <span>Track Application Status</span>
              </h3>
              <p className="text-sm text-gray-600 font-medium mb-6">
                Enter your generated reference number to fetch real-time application status.
              </p>

              <form onSubmit={handleTrackStatus} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Application Reference No.</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PMK-20260721-X8912"
                    value={trackingRef}
                    onChange={e => setTrackingRef(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono font-bold text-gray-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isTracking}
                  className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isTracking ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Fetching Details...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Track Status</span>
                    </>
                  )}
                </button>
              </form>

              {/* Error Alert for Invalid Reference Number */}
              {trackingError && (
                <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-700 font-bold text-sm flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <span>{trackingError}</span>
                </div>
              )}

              {/* Status Results Card */}
              {trackingResult && (
                <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                  <div className="p-5 bg-blue-50/70 border-2 border-blue-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-blue-200 pb-3">
                      <div>
                        <span className="text-xs font-bold text-blue-700 uppercase">Scheme Name</span>
                        <h4 className="text-lg font-extrabold text-blue-950">{trackingResult.scheme_name}</h4>
                      </div>
                      <span className={`px-3 py-1 rounded-full font-bold text-xs border ${getStatusBadgeColor(trackingResult.status)}`}>
                        {trackingResult.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-bold text-gray-500 block mb-0.5">Applicant Name</span>
                        <span className="font-extrabold text-gray-900 flex items-center">
                          <User className="w-3.5 h-3.5 mr-1 text-blue-600" />
                          {trackingResult.applicant_name}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-500 block mb-0.5">Reference No.</span>
                        <span className="font-extrabold text-gray-900 font-mono">{trackingResult.reference_number}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-500 block mb-0.5">Submission Date</span>
                        <span className="font-semibold text-gray-700 flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-blue-600" />
                          {trackingResult.submission_date}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-500 block mb-0.5">Last Updated</span>
                        <span className="font-semibold text-gray-700 flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1 text-blue-600" />
                          {trackingResult.last_updated}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {trackingResult.screenshot && (
                      <a
                        href={`http://127.0.0.1:8000/api/v1/automation/files/screenshots/${trackingResult.screenshot}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-2 rounded-xl border border-blue-200"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Portal Screenshot</span>
                      </a>
                    )}

                    {trackingResult.receipt && (
                      <a
                        href={`http://127.0.0.1:8000/api/v1/automation/files/receipts/${trackingResult.receipt}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Saved Receipt</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Playwright Feature Specs */}
            <GlassCard className="bg-emerald-50 border border-emerald-200 !p-6 !rounded-3xl">
              <h4 className="font-extrabold text-emerald-900 text-base mb-2">Automated Capabilities</h4>
              <ul className="text-sm font-semibold text-emerald-800 space-y-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Unique reference number generation & database indexing</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Live portal application tracking & status validation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>PDF receipt generation & screenshot audit logging</span>
                </li>
              </ul>
            </GlassCard>
          </div>

        </div>

      </div>

      {/* Floating AI Assistant Button */}
      <button 
        onClick={() => setIsChatOpen(true)}
        onMouseEnter={() => explain("Talk to Sahayak")}
        className="fixed bottom-6 right-6 z-40 px-8 py-5 rounded-full bg-[#2E7D32] text-white shadow-2xl flex items-center justify-center hover:bg-[#1B5E20] hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-[#2E7D32] border-4 border-white"
      >
        <Mic className="w-8 h-8 mr-3" />
        <span className="text-2xl font-extrabold tracking-wide">Talk to Sahayak</span>
      </button>

      {isChatOpen && <ChatInterface onClose={() => setIsChatOpen(false)} />}

      <AccessibilityMenu />
    </div>
  );
};

export default AutomationPanel;
