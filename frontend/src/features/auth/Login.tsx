import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Accessibility, Lock, Globe, HelpCircle, 
  Mic, Eye, EyeOff, Type, AlertTriangle, Building2, Heart, Mail, ArrowRight, User
} from 'lucide-react';
import { GlassCard } from '../../components/GlassCard';
import { Button } from '../../components/Button';
import { useAccessibility } from '../../core/contexts/AccessibilityContext';
import { ChatInterface } from '../../components/chat/ChatInterface';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { toggleHighContrast, toggleLargeText, toggleVoiceMode } = useAccessibility();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 1500);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-gradient-to-br from-[#FDFBF7] via-[#E8F5E9] to-[#E3F2FD] pb-10">
      
      {/* Top Header */}
      <header className="w-full py-6 px-8 lg:px-16 flex items-center justify-between z-20 border-b border-gray-200/50 bg-white/40 backdrop-blur-sm">
        
        {/* Logo Area */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-[#E8F5E9] rounded-full flex items-center justify-center text-[#2E7D32]">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2E7D32] leading-tight">Sahayak AI</h1>
            <p className="text-sm font-medium text-gray-500">Your Digital Companion</p>
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
            <Globe className="w-5 h-5 text-gray-600 mr-2" />
            <select className="bg-transparent text-gray-800 font-bold focus:outline-none cursor-pointer text-sm">
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="bn">বাংলা</option>
            </select>
          </div>
          <button className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 font-bold text-gray-800 hover:text-[#2E7D32] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2E7D32]">
            <Accessibility className="w-5 h-5 text-[#2E7D32]" />
            <span className="text-sm hidden sm:inline">Accessibility</span>
          </button>
          <button className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 font-bold text-gray-800 hover:text-[#2E7D32] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2E7D32]">
            <HelpCircle className="w-5 h-5 text-gray-600" />
            <span className="text-sm hidden sm:inline">Help</span>
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex flex-col lg:flex-row items-center lg:items-start px-8 lg:px-16 gap-12 max-w-[1600px] mx-auto w-full z-10 pt-12">
        
        {/* Left Column (Info) */}
        <div className="flex-1 flex flex-col w-full xl:pr-10 relative">
          
          {/* Main Hero Content - 2 Column Grid */}
          <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between gap-8 mb-12">
            
            {/* Text Side */}
            <div className="flex-1 max-w-lg z-10">
              {/* Tag */}
              <div className="inline-flex items-center space-x-2 bg-[#E8F5E9] text-[#2E7D32] px-4 py-2 rounded-full font-bold border border-[#A5D6A7] mb-6 shadow-sm">
                <Heart className="w-4 h-4" />
                <span className="text-sm">Made for Everyone. Accessible for All.</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#2E7D32] tracking-tight leading-[1.1] mb-6">
                Welcome to<br />Sahayak AI
              </h1>
              
              <h2 className="text-xl md:text-2xl font-bold text-gray-700 leading-snug mb-4">
                Accessible Government & Community Services for Everyone
              </h2>
              
              <p className="text-base text-gray-600 font-medium">
                Apply for schemes, check eligibility, connect with NGOs or caregivers. Use voice or text to easily navigate all services.
              </p>
            </div>

            {/* Illustration Side */}
            <div className="w-full lg:w-1/2 max-w-[400px] flex items-center justify-center shrink-0 z-10 relative">
               <img 
                src="/hero-illustration.png" 
                alt="Elderly couple and a wheelchair user interacting with an AI assistant on a tablet" 
                className="w-full h-auto object-contain mix-blend-multiply"
                style={{ 
                  backgroundColor: 'transparent',
                  WebkitMaskImage: 'radial-gradient(ellipse at center, black 50%, transparent 95%)',
                  maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 95%)'
                }}
              />
            </div>
          </div>

          {/* Trust Cards Bar */}
          <GlassCard className="w-full !p-5 border border-white/80 shadow-lg !rounded-3xl relative z-10 bg-white/90">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 divide-x-0 lg:divide-x border-gray-100">
              <div className="flex items-center space-x-4 px-2">
                <div className="w-12 h-12 bg-[#E8F5E9] text-[#2E7D32] rounded-full flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">Secure</h4>
                  <p className="text-sm text-gray-500 font-medium">Your data is safe</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 px-2 lg:pl-6">
                <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center shrink-0 shadow-sm shadow-blue-200/50">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">Accessible</h4>
                  <p className="text-sm text-gray-500 font-medium">For all abilities</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 px-2 lg:pl-6">
                <div className="w-12 h-12 bg-[#FFD54F] text-yellow-900 rounded-full flex items-center justify-center shrink-0">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">Private</h4>
                  <p className="text-sm text-gray-500 font-medium">Privacy priority</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 px-2 lg:pl-6">
                <div className="w-12 h-12 bg-red-100 text-red-700 rounded-full flex items-center justify-center shrink-0 shadow-sm shadow-red-200/50">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">Govt. Ready</h4>
                  <p className="text-sm text-gray-500 font-medium">Trusted reliable</p>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Bottom Controls */}
          <div className="flex flex-col xl:flex-row items-center justify-between w-full mt-10 relative z-10 gap-6">
            {/* Talk to Sahayak */}
            <button 
              onClick={() => setIsChatOpen(true)}
              className="flex items-center justify-center w-full xl:w-auto space-x-3 bg-white px-8 py-4 rounded-full border border-gray-200 shadow-md hover:bg-gray-50 transition-colors focus:ring-4 focus:ring-[#2E7D32]/50"
            >
              <Mic className="w-7 h-7 text-[#2E7D32]" />
              <div className="text-left">
                <div className="font-bold text-[#2E7D32] text-lg">Talk to Sahayak</div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Voice Assistant</div>
              </div>
            </button>

            {/* Accessibility Shortcuts */}
            <div className="flex items-center justify-center space-x-2 bg-white/80 p-2 rounded-full border border-gray-200 shadow-sm w-full xl:w-auto">
              <button onClick={toggleLargeText} className="flex items-center space-x-2 px-4 py-2.5 rounded-full font-bold text-sm text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-[#2E7D32]">
                <Type className="w-5 h-5 text-[#43A047]" /> <span className="hidden sm:inline">Large Text</span>
              </button>
              <div className="w-px h-6 bg-gray-300"></div>
              <button onClick={toggleHighContrast} className="flex items-center space-x-2 px-4 py-2.5 rounded-full font-bold text-sm text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-[#2E7D32]">
                <Eye className="w-5 h-5 text-black" /> <span className="hidden sm:inline">High Contrast</span>
              </button>
              <div className="w-px h-6 bg-gray-300"></div>
              <button onClick={toggleVoiceMode} className="flex items-center space-x-2 px-4 py-2.5 rounded-full font-bold text-sm text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-[#2E7D32]">
                <Mic className="w-5 h-5 text-[#81C784]" /> <span className="hidden sm:inline">Voice Mode</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (Login Form) */}
        <div className="w-full lg:w-[450px] flex flex-col z-20 pb-10">
          <GlassCard className="w-full shadow-2xl border-white/80 bg-white !p-8 !rounded-3xl">
            <h3 className="text-2xl font-extrabold mb-1 text-gray-900">
              Sign in to your account
            </h3>
            <p className="text-sm font-medium text-gray-500 mb-8">
              Access your dashboard and manage services
            </p>
            
            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-bold flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#2E7D32]">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-all outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#2E7D32]">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="block w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-all outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center text-gray-600 cursor-pointer font-medium text-sm">
                  <input type="checkbox" className="w-4 h-4 mr-2 rounded border-gray-300 text-[#2E7D32] focus:ring-[#2E7D32]" />
                  Remember me
                </label>
                <a href="#" className="font-bold text-sm text-[#2E7D32] hover:text-[#1B5E20]">
                  Forgot Password?
                </a>
              </div>

              <Button type="submit" isLoading={isLoading} className="mt-6 w-full flex items-center justify-center py-3.5 bg-gradient-to-r from-[#2E7D32] to-[#43A047] text-white rounded-xl shadow-md hover:shadow-lg transition-all group">
                <span>Sign In</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>

            <div className="mt-8 relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative px-4 bg-white text-xs font-bold text-gray-400 tracking-wider">
                OR CONTINUE WITH
              </div>
            </div>

            <button 
              type="button" 
              onClick={handleGoogleLogin} 
              className="mt-6 w-full flex items-center justify-center space-x-3 py-3.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 font-bold text-gray-700 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Continue with Google</span>
            </button>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 font-medium">
                Don't have an account?{' '}
                <a href="#" className="font-bold text-[#2E7D32] hover:text-[#1B5E20] ml-1">
                  Create Account
                </a>
              </p>
            </div>
          </GlassCard>

          {/* Need Help Card */}
          <div className="mt-6 bg-[#FFF8E1] rounded-2xl p-4 flex items-center justify-between shadow-sm border border-[#FFE082] cursor-pointer hover:bg-[#FFECB3] transition-colors self-center w-full max-w-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#FFD54F] rounded-full flex items-center justify-center text-yellow-900 font-bold shadow-sm">
                ?
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Need Help?</h4>
                <p className="text-xs text-gray-600">We are here to assist you</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-500" />
          </div>
        </div>
      </main>

      {isChatOpen && <ChatInterface onClose={() => setIsChatOpen(false)} />}
    </div>
  );
};

export default Login;
