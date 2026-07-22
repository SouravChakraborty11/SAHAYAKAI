import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Building2, UserCheck, Activity, Calendar, Search, MapPin, Phone, 
  ArrowLeft, CheckCircle, Volume2, X, Trash2, Clock, Mic
} from 'lucide-react';
import { GlassCard } from '../../components/GlassCard';
import { useAccessibility } from '../../core/contexts/AccessibilityContext';
import { useExplain } from '../../core/hooks/useExplain';
import { AccessibilityMenu } from '../../components/AccessibilityMenu';
import { ChatInterface } from '../../components/chat/ChatInterface';

interface CareItem {
  id: string;
  type: 'ngo' | 'caregiver' | 'rehab_center';
  name: string;
  category: string;
  location: string;
  contact: string;
  email?: string;
  experience?: string;
  rating?: number;
  description: string;
  services: string[];
}

interface Appointment {
  id: number;
  provider_name: string;
  provider_type: string;
  appointment_date: string;
  contact_phone?: string;
  notes?: string;
  status: string;
  created_at: string;
}

export const CareCommunityHub: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useAccessibility();
  const explain = useExplain();

  const [activeTab, setActiveTab] = useState<'all' | 'ngo' | 'caregiver' | 'rehab' | 'appointments'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [providers, setProviders] = useState<CareItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<CareItem | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Form state
  const [bookingDate, setBookingDate] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sample seed data to ensure instant display + fallback
  const mockProviders: CareItem[] = [
    {
      id: 'ngo-1',
      type: 'ngo',
      name: 'Samarthanam Trust for the Disabled',
      category: 'Disability Support',
      location: 'Bengaluru, Karnataka',
      contact: '+91 80 2658 2570',
      email: 'info@samarthanam.org',
      description: 'Provides education, vocational training, assistive devices, and livelihood support for visually impaired and physically challenged individuals.',
      services: ['Assistive Devices', 'Vocational Training', 'Inclusive Education', 'Job Placement']
    },
    {
      id: 'ngo-2',
      type: 'ngo',
      name: 'Helpage India',
      category: 'Elderly Care',
      location: 'New Delhi & Pan India',
      contact: '1800-180-5789',
      email: 'headoffice@helpageindia.org',
      description: 'Leading national NGO advocating for elderly rights, mobile healthcare units, old age homes, and digital literacy for senior citizens.',
      services: ['Mobile Healthcare', 'Elder Helpline', 'Cataract Surgeries', 'Old Age Home Support']
    },
    {
      id: 'caregiver-1',
      type: 'caregiver',
      name: 'Sunita Sharma, RN',
      category: 'Home Nursing & Elderly Care',
      location: 'Mumbai, Maharashtra',
      contact: '+91 98200 12345',
      experience: '8 years',
      rating: 4.9,
      description: 'Certified nurse specializing in post-stroke recovery, tracheostomy care, medication management, and daily living assistance for elderly patients.',
      services: ['Post-Operative Care', 'Bedridden Patient Care', 'Vital Monitoring', 'Medication Admin']
    },
    {
      id: 'caregiver-2',
      type: 'caregiver',
      name: 'Rajesh Kumar, MPT',
      category: 'Physiotherapist & Mobility Specialist',
      location: 'Delhi NCR',
      contact: '+91 98111 67890',
      experience: '10 years',
      rating: 4.8,
      description: 'Specialized in neuro-rehabilitation, joint mobilization, paralysis recovery, and home-visit physical therapy sessions.',
      services: ['Neuro Rehab', 'Geriatric Physiotherapy', 'Pain Management', 'Mobility Training']
    },
    {
      id: 'rehab-1',
      type: 'rehab_center',
      name: 'NIMHANS Neuro-Rehabilitation Centre',
      category: 'Neurological & Mental Health Rehab',
      location: 'Bengaluru, Karnataka',
      contact: '+91 80 2699 5000',
      email: 'neurorehab@nimhans.ac.in',
      description: 'Premier national institute providing state-of-the-art neurological rehabilitation, speech therapy, cognitive retraining, and occupational therapy.',
      services: ['Cognitive Retraining', 'Speech Therapy', 'Occupational Therapy', 'Robotic Gait Training']
    },
    {
      id: 'rehab-2',
      type: 'rehab_center',
      name: 'Mobility India Disability & Rehab Centre',
      category: 'Orthotic & Prosthetic Rehab',
      location: 'Bengaluru, Karnataka',
      contact: '+91 80 2649 2222',
      email: 'e-mail@mobility-india.org',
      description: 'Specialized center offering custom prosthetic limbs, orthotic braces, wheelchair modifications, and comprehensive gait therapy.',
      services: ['Prosthetics & Orthotics', 'Wheelchair Fitting', 'Amputee Rehab', 'Pediatric Rehab']
    }
  ];

  useEffect(() => {
    setProviders(mockProviders);
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/appointments/');
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch (e) {
      console.error('Failed to fetch appointments', e);
    }
  };

  const handleOpenBooking = (provider: CareItem) => {
    setSelectedProvider(provider);
    setIsBookingOpen(true);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider || !bookingDate) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/appointments/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_name: selectedProvider.name,
          provider_type: selectedProvider.type,
          appointment_date: bookingDate,
          contact_phone: bookingPhone,
          notes: bookingNotes
        })
      });

      if (res.ok) {
        setIsBookingOpen(false);
        setBookingDate('');
        setBookingPhone('');
        setBookingNotes('');
        setSelectedProvider(null);
        fetchAppointments();
        setActiveTab('appointments');
      }
    } catch (e) {
      console.error('Booking failed', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAppointment = async (id: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/appointments/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchAppointments();
      }
    } catch (e) {
      console.error('Cancel failed', e);
    }
  };

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (language === 'hi') utterance.lang = 'hi-IN';
    else if (language === 'bn') utterance.lang = 'bn-IN';
    else utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const filteredProviders = providers.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'ngo') return matchesSearch && p.type === 'ngo';
    if (activeTab === 'caregiver') return matchesSearch && p.type === 'caregiver';
    if (activeTab === 'rehab') return matchesSearch && p.type === 'rehab_center';
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#E8F5E9] to-[#E3F2FD] p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/dashboard')}
            onMouseEnter={() => explain("Back to Dashboard")}
            className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-5 py-3 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-bold"
          >
            <ArrowLeft className="w-5 h-5 text-[#2E7D32]" />
            <span>Dashboard</span>
          </button>
          
          <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 px-6 py-3 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
            <Heart className="w-6 h-6 text-[#2E7D32] fill-current" />
            <h1 className="text-2xl font-extrabold text-[#2E7D32]">Care & Community Hub</h1>
          </div>
        </div>

        {/* Hero Card */}
        <GlassCard className="bg-gradient-to-r from-[#2E7D32] to-[#388E3C] text-white !p-8 !rounded-3xl shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-white dark:bg-gray-800/20 px-4 py-1.5 rounded-full text-sm font-bold mb-4 backdrop-blur-md">
              <UserCheck className="w-4 h-4" />
              <span>Verified NGOs, Caregivers & Rehabilitation Support</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Connecting You with Compassionate Care</h2>
            <p className="text-white/90 text-lg font-medium leading-relaxed">
              Find disability support NGOs, book home nurses and physical therapists, or schedule appointments with top rehabilitation centers near you.
            </p>
          </div>
        </GlassCard>

        {/* Controls Bar: Tabs & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto w-full md:w-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'all' ? 'bg-[#2E7D32] text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800'}`}
            >
              All Support
            </button>
            <button
              onClick={() => setActiveTab('ngo')}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap flex items-center space-x-2 ${activeTab === 'ngo' ? 'bg-[#2E7D32] text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800'}`}
            >
              <Building2 className="w-4 h-4" />
              <span>NGOs</span>
            </button>
            <button
              onClick={() => setActiveTab('caregiver')}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap flex items-center space-x-2 ${activeTab === 'caregiver' ? 'bg-[#2E7D32] text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800'}`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Caregivers</span>
            </button>
            <button
              onClick={() => setActiveTab('rehab')}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap flex items-center space-x-2 ${activeTab === 'rehab' ? 'bg-[#2E7D32] text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800'}`}
            >
              <Activity className="w-4 h-4" />
              <span>Rehab Centres</span>
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap flex items-center space-x-2 ${activeTab === 'appointments' ? 'bg-amber-600 text-white shadow-md' : 'text-amber-800 bg-amber-50 hover:bg-amber-100'}`}
            >
              <Calendar className="w-4 h-4" />
              <span>My Appointments ({appointments.length})</span>
            </button>
          </div>

          {/* Search Input */}
          {activeTab !== 'appointments' && (
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, location..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm text-sm font-medium focus:ring-2 focus:ring-[#2E7D32] focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Content Section */}
        {activeTab === 'appointments' ? (
          /* Appointments List */
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
              <Calendar className="w-6 h-6 text-amber-600" />
              <span>Scheduled Appointments</span>
            </h3>

            {appointments.length === 0 ? (
              <GlassCard className="!p-12 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-xl font-bold">No appointments scheduled yet.</p>
                <p className="text-sm mt-1">Browse NGOs, Caregivers, or Rehab Centres to book an appointment.</p>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {appointments.map(app => (
                  <GlassCard key={app.id} className="bg-white dark:bg-gray-800 border-2 border-amber-200 shadow-md !p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-xs uppercase">
                          {app.provider_type}
                        </span>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs flex items-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{app.status}</span>
                        </span>
                      </div>
                      <h4 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mb-1">{app.provider_name}</h4>
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 font-semibold text-sm mb-3">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>Date & Time: {app.appointment_date}</span>
                      </div>
                      {app.contact_phone && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
                          <strong>Contact Phone:</strong> {app.contact_phone}
                        </p>
                      )}
                      {app.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                          <strong>Notes:</strong> {app.notes}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                      <button
                        onClick={() => handleCancelAppointment(app.id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-bold text-sm transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Cancel Appointment</span>
                      </button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Provider Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map(item => (
              <GlassCard key={item.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg !p-6 flex flex-col justify-between hover:shadow-xl transition-shadow">
                <div>
                  {/* Category & Read Aloud */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] rounded-full font-bold text-xs">
                      {item.category}
                    </span>
                    <button
                      onClick={() => speakText(`${item.name}. ${item.description}`)}
                      className="p-2 text-gray-400 hover:text-[#2E7D32] hover:bg-gray-100 dark:bg-gray-800 rounded-full transition-colors"
                      title="Read details out loud"
                      onMouseEnter={() => explain("Read provider details")}
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mb-2 leading-snug">{item.name}</h3>

                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 font-medium mb-3">
                    <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{item.location}</span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed mb-4">
                    {item.description}
                  </p>

                  {/* Services Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {item.services.map((svc, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold">
                        {svc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    <Phone className="w-3.5 h-3.5 inline mr-1 text-[#2E7D32]" />
                    {item.contact}
                  </div>
                  <button
                    onClick={() => handleOpenBooking(item)}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-[#2E7D32] text-white rounded-xl font-bold text-sm hover:bg-[#1B5E20] shadow-sm transition-all"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Appointment</span>
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Booking Modal */}
        {isBookingOpen && selectedProvider && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <GlassCard className="w-full max-w-lg bg-white dark:bg-gray-800 !p-8 shadow-2xl rounded-3xl relative">
              <button 
                onClick={() => setIsBookingOpen(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mb-1">Book Appointment</h3>
              <p className="text-sm font-semibold text-[#2E7D32] mb-6">
                With: {selectedProvider.name}
              </p>

              <form onSubmit={handleCreateAppointment} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Preferred Date & Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tomorrow at 10:00 AM, or 25th July"
                    value={bookingDate}
                    onChange={e => setBookingDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2E7D32] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Contact Phone Number</label>
                  <input
                    type="tel"
                    placeholder="Your contact number for confirmation"
                    value={bookingPhone}
                    onChange={e => setBookingPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2E7D32] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Special Requirements / Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Mention specific care needs, patient details, or questions..."
                    value={bookingNotes}
                    onChange={e => setBookingNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2E7D32] focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsBookingOpen(false)}
                    className="px-5 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-[#2E7D32] text-white rounded-xl font-bold text-sm hover:bg-[#1B5E20] transition-colors shadow-md disabled:opacity-50"
                  >
                    {isSubmitting ? 'Confirming...' : 'Confirm Appointment'}
                  </button>
                </div>
              </form>
            </GlassCard>
          </div>
        )}

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

export default CareCommunityHub;
