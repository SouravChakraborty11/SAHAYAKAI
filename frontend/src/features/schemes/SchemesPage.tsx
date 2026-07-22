import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, CheckCircle, Search as SearchIcon, Briefcase, User, MapPin, Calendar, Loader2 } from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { GlassCard } from '../../components/GlassCard';
import { AccessibilityMenu } from '../../components/AccessibilityMenu';
import { apiSearchSchemes, apiCheckEligibility } from '../../core/api';

const SchemesPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') === 'eligibility' ? 'eligibility' : 'search';

  const [activeTab, setActiveTab] = useState<'search' | 'eligibility'>(initialTab);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Eligibility State
  const [profile, setProfile] = useState({
    age: '',
    income: '',
    occupation: '',
    state: '',
    caste: 'General',
    gender: 'Male'
  });
  const [eligibilityResult, setEligibilityResult] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResult(null);
    try {
      const res = await apiSearchSchemes(searchQuery);
      setSearchResult(res.answer);
    } catch (err) {
      setSearchResult("Failed to fetch scheme information. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleEligibility = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);
    setEligibilityResult(null);
    try {
      const res = await apiCheckEligibility(profile);
      setEligibilityResult(res.result);
    } catch (err) {
      setEligibilityResult("Failed to check eligibility. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-24 bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 flex items-center px-6 sm:px-10 shrink-0 shadow-sm">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">Government Schemes & Eligibility</h1>
        </header>

        <div className="flex-1 overflow-auto p-6 sm:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Tabs */}
            <div className="flex space-x-2 mb-6">
              <button
                onClick={() => setActiveTab('search')}
                className={`flex-1 py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 transition-all ${
                  activeTab === 'search' 
                    ? 'bg-[#2E7D32] text-white shadow-lg' 
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                }`}
              >
                <SearchIcon className="w-5 h-5" />
                <span>Search Schemes</span>
              </button>
              <button
                onClick={() => setActiveTab('eligibility')}
                className={`flex-1 py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 transition-all ${
                  activeTab === 'eligibility' 
                    ? 'bg-[#2E7D32] text-white shadow-lg' 
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                <span>Check Eligibility</span>
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'search' && (
              <GlassCard className="bg-white dark:bg-gray-800 !p-8 !rounded-3xl shadow-md border-2 border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Find Relevant Government Schemes</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 font-medium">Ask questions about government schemes, benefits, or procedures and our AI assistant will fetch the details for you.</p>
                
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g. What are the benefits of PM-Kisan Samman Nidhi?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-14 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-lg font-medium focus:ring-2 focus:ring-[#2E7D32] focus:border-[#2E7D32] outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    className="w-full py-4 bg-[#2E7D32] text-white rounded-xl font-bold text-lg hover:bg-[#1B5E20] transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isSearching ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <SearchIcon className="w-6 h-6 mr-2" />}
                    {isSearching ? 'Searching...' : 'Search Schemes'}
                  </button>
                </form>

                {searchResult && (
                  <div className="mt-8 p-6 bg-[#FDFBF7] dark:bg-gray-900 border-2 border-[#E8F5E9] dark:border-gray-700 rounded-2xl shadow-inner">
                    <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">Answer:</h3>
                    <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-medium leading-relaxed">
                      {searchResult}
                    </div>
                  </div>
                )}
              </GlassCard>
            )}

            {activeTab === 'eligibility' && (
              <GlassCard className="bg-white dark:bg-gray-800 !p-8 !rounded-3xl shadow-md border-2 border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Eligibility Checker</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 font-medium">Provide your basic details to find out which government schemes you are eligible for.</p>
                
                <form onSubmit={handleEligibility} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar className="w-4 h-4 text-[#2E7D32]" />
                        <span>Age</span>
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 35"
                        value={profile.age}
                        onChange={(e) => setProfile({...profile, age: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-medium focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        <User className="w-4 h-4 text-[#2E7D32]" />
                        <span>Annual Income (₹)</span>
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 150000"
                        value={profile.income}
                        onChange={(e) => setProfile({...profile, income: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-medium focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        <Briefcase className="w-4 h-4 text-[#2E7D32]" />
                        <span>Occupation</span>
                      </label>
                      <select
                        value={profile.occupation}
                        onChange={(e) => setProfile({...profile, occupation: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-medium focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent outline-none"
                      >
                        <option value="">Select Occupation</option>
                        <option value="Farmer">Farmer</option>
                        <option value="Student">Student</option>
                        <option value="Unemployed">Unemployed</option>
                        <option value="Self-Employed">Self-Employed</option>
                        <option value="Salaried">Salaried</option>
                        <option value="Senior Citizen">Senior Citizen</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        <MapPin className="w-4 h-4 text-[#2E7D32]" />
                        <span>State</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Maharashtra"
                        value={profile.state}
                        onChange={(e) => setProfile({...profile, state: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-medium focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        <User className="w-4 h-4 text-[#2E7D32]" />
                        <span>Gender</span>
                      </label>
                      <select
                        value={profile.gender}
                        onChange={(e) => setProfile({...profile, gender: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-medium focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        <User className="w-4 h-4 text-[#2E7D32]" />
                        <span>Category / Caste</span>
                      </label>
                      <select
                        value={profile.caste}
                        onChange={(e) => setProfile({...profile, caste: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-medium focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent outline-none"
                      >
                        <option value="General">General</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="Minority">Minority</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isChecking}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center"
                  >
                    {isChecking ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <CheckCircle className="w-6 h-6 mr-2" />}
                    {isChecking ? 'Analyzing Eligibility...' : 'Check My Eligibility'}
                  </button>
                </form>

                {eligibilityResult && (
                  <div className="mt-8 p-6 bg-blue-50 dark:bg-gray-900 border-2 border-blue-100 dark:border-gray-700 rounded-2xl shadow-inner">
                    <h3 className="text-xl font-bold mb-3 text-blue-900 dark:text-blue-100">Your Eligibility Report:</h3>
                    <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-medium leading-relaxed">
                      {eligibilityResult}
                    </div>
                  </div>
                )}
              </GlassCard>
            )}

          </div>
        </div>
      </main>

      <AccessibilityMenu />
    </div>
  );
};

export default SchemesPage;
