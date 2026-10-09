import { useState, useEffect, useRef } from 'react';
import type { Language, ComplaintCategory, Complaint, WardStat, Scheme } from './types';
import { PUNE_WARDS, GOV_SCHEMES } from './data/mockData';
import { classifyText, resolveGeo, submitComplaint, fetchStats, fetchRecentComplaints, checkBackendHealth } from './lib/api';
import { BlurText } from './components/BlurText';
import { SpotlightCard } from './components/SpotlightCard';
import { CountUp } from './components/CountUp';
import { FadeContent } from './components/FadeContent';
import { HeroBackground } from './components/HeroBackground';

export function App() {
  const [lang, setLang] = useState<Language>('mr');
  const [activeTab, setActiveTab] = useState<'lodge' | 'dashboard' | 'schemes' | 'track'>('lodge');
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  // Form State
  const [transcript, setTranscript] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [, setSpeechSupported] = useState<boolean>(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [category, setCategory] = useState<ComplaintCategory>('pothole');
  const [selectedWardId, setSelectedWardId] = useState<number>(1);
  const [address, setAddress] = useState<string>('FC Road, Shivajinagar, Pune 411005');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 18.5308, lng: 73.8475 });
  const [citizenName, setCitizenName] = useState<string>('');
  const [citizenPhone, setCitizenPhone] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Submission & Result State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStep, setSubmitStep] = useState<string>('');
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  // Dashboard & Stats State
  const [wardStats, setWardStats] = useState<WardStat[]>([]);
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [selectedFilterWard, setSelectedFilterWard] = useState<string>('all');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');
  const [mapHoveredWard, setMapHoveredWard] = useState<string | null>(null);

  // Scheme Quiz State
  const [schemeAge, setSchemeAge] = useState<string>('');
  const [schemeIncome, setSchemeIncome] = useState<string>('');
  const [filteredSchemes, setFilteredSchemes] = useState<Scheme[]>(GOV_SCHEMES);

  // Tracking State
  const [trackQuery, setTrackQuery] = useState<string>('');
  const [trackedComplaint, setTrackedComplaint] = useState<Complaint | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Check health and load initial data
  useEffect(() => {
    checkBackendHealth().then(setBackendOnline);
    fetchStats().then(data => setWardStats(data.wards));
    fetchRecentComplaints().then(setRecentComplaints);
  }, []);

  // Web Speech API Initialization
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang === 'en' ? 'en-IN' : lang === 'hi' ? 'hi-IN' : 'mr-IN';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(prev => (prev ? prev + ' ' + currentTranscript : currentTranscript));
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError(lang === 'mr' ? 'मायक्रोफोन परवानगी नाकारली आहे. कृपया मजकूर टाइप करा.' : 'Microphone access denied. Please type your complaint.');
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      setSpeechSupported(false);
    }
  }, [lang]);

  // Handle Speech Toggle
  const toggleSpeech = () => {
    if (!recognitionRef.current) return;
    setSpeechError(null);

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.lang = lang === 'en' ? 'en-IN' : lang === 'hi' ? 'hi-IN' : 'mr-IN';
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Cannot start recording:', err);
      }
    }
  };

  // Image upload handling
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(lang === 'mr' ? 'कृपया ५ एमबी पेक्षा लहान फोटो निवडा.' : 'Please choose an image under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Geolocation trigger
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert(lang === 'mr' ? 'आपल्या ब्राउझरमध्ये जीपीएस सपोर्ट नाही.' : 'Geolocation not supported by browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        const res = await resolveGeo(latitude, longitude);
        setSelectedWardId(res.ward_id);
        setAddress(res.address);
      },
      () => {
        alert(lang === 'mr' ? 'स्थान माहिती मिळवता आली नाही. कृपया प्रभाग निवडा.' : 'Could not fetch GPS. Please select ward.');
      },
      { timeout: 8000 }
    );
  };

  // Handle Ward Selection Change
  const handleWardChange = (wardId: number) => {
    setSelectedWardId(wardId);
    const ward = PUNE_WARDS.find(w => w.id === wardId);
    if (ward) {
      setCoords({ lat: ward.lat, lng: ward.lng });
      setAddress(`${ward.name}, Pune, Maharashtra`);
    }
  };

  // Filter Government Schemes
  useEffect(() => {
    let result = GOV_SCHEMES;
    if (schemeAge) {
      const ageNum = parseInt(schemeAge, 10);
      if (!isNaN(ageNum)) {
        result = result.filter(s => (!s.minAge || ageNum >= s.minAge) && (!s.maxAge || ageNum <= s.maxAge));
      }
    }
    if (schemeIncome) {
      const incNum = parseInt(schemeIncome, 10);
      if (!isNaN(incNum)) {
        result = result.filter(s => !s.maxIncome || incNum <= s.maxIncome);
      }
    }
    setFilteredSchemes(result);
  }, [schemeAge, schemeIncome]);

  // Form Validation & Submission
  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!transcript.trim()) {
      errors.transcript = lang === 'mr' ? 'कृपया समस्येचे वर्णन बोला किंवा टाइप करा.' : 'Please describe or speak the civic issue.';
    }
    if (!citizenName.trim()) {
      errors.name = lang === 'mr' ? 'कृपया नागरिकाचे नाव प्रविष्ट करा.' : 'Please enter citizen name.';
    }
    if (!citizenPhone.trim() || !/^[6-9]\d{9}$/.test(citizenPhone.trim())) {
      errors.phone = lang === 'mr' ? 'कृपया वैध १०-अंकी भारतीय मोबाईल नंबर प्रविष्ट करा.' : 'Enter valid 10-digit Indian phone number.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setIsSubmitting(true);

    try {
      setSubmitStep(lang === 'mr' ? 'आवाज व समस्येचे AI विश्लेषण करत आहे...' : 'Analyzing issue with AI classification...');
      const classification = await classifyText(transcript, lang);

      setSubmitStep(lang === 'mr' ? 'पुणे प्रभाग व संबंधित विभाग निश्चित करत आहे...' : 'Assigning PMC ward and department...');
      const ward = PUNE_WARDS.find(w => w.id === selectedWardId) || PUNE_WARDS[0];

      setSubmitStep(lang === 'mr' ? 'अधिकृत तक्रार अर्ज (Letterhead) तयार करत आहे...' : 'Formatting official municipal letter...');

      const complaintData: Partial<Complaint> = {
        category: classification.category,
        department_key: classification.department_key,
        department_name: classification.department_name,
        lang,
        transcript,
        summary_local: classification.summary_local,
        summary_en: classification.summary_en,
        severity: classification.severity,
        lat: coords.lat,
        lng: coords.lng,
        address,
        ward_id: ward.id,
        ward_name: ward.name,
        image_url: imagePreview,
        citizen_name: citizenName,
        citizen_phone: citizenPhone,
        status: 'submitted',
        created_at: new Date().toISOString(),
        documents: classification.documents
      };

      const result = await submitComplaint(complaintData);

      const completeComplaint: Complaint = {
        ...complaintData as Complaint,
        id: result.id,
        ref_no: result.ref_no
      };

      setSubmittedComplaint(completeComplaint);
      setRecentComplaints(prev => [completeComplaint, ...prev]);

      // Update ward stats locally
      setWardStats(prev => prev.map(w => {
        if (w.ward_id === ward.id) {
          return {
            ...w,
            total: w.total + 1,
            by_status: { ...w.by_status, submitted: w.by_status.submitted + 1 }
          };
        }
        return w;
      }));
    } catch (err) {
      console.error(err);
      alert(lang === 'mr' ? 'तक्रार तयार करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.' : 'Error generating complaint.');
    } finally {
      setIsSubmitting(false);
      setSubmitStep('');
    }
  };

  // Track status lookup
  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError(null);
    const query = trackQuery.trim();
    if (!query) return;

    if (submittedComplaint && submittedComplaint.ref_no.toLowerCase() === query.toLowerCase()) {
      setTrackedComplaint(submittedComplaint);
      return;
    }

    const found = recentComplaints.find(c => c.ref_no.toLowerCase() === query.toLowerCase());
    if (found) {
      setTrackedComplaint(found);
    } else {
      setTrackError(lang === 'mr' ? 'दिलेल्या क्रमांकाची तक्रार आढळली नाही. कृपया योग्य संदर्भ क्रमांक तपासा.' : 'Complaint reference number not found.');
      setTrackedComplaint(null);
    }
  };

  // Copy Reference Number
  const copyRefNumber = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  // WhatsApp Share URL
  const getWhatsAppShareUrl = (complaint: Complaint) => {
    const text = encodeURIComponent(
      `*नागरिक मित्र AI तक्रार अर्ज पावती*\n` +
      `तक्रार संदर्भ क्र.: ${complaint.ref_no}\n` +
      `विषय: ${complaint.summary_local}\n` +
      `विभाग: ${complaint.department_name}\n` +
      `प्रभाग: ${complaint.ward_name}\n` +
      `स्थिती: नोंदणीकृत (Submitted)\n\n` +
      `पुणे महानगरपालिका नागरिक सेवा`
    );
    return `https://wa.me/?text=${text}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--page-bg)' }}>
      {/* Top Municipal Notification Bar */}
      <div className="no-print" style={{ background: 'var(--primary-forest)', color: 'var(--warm-beige)', padding: '0.45rem 1rem', fontSize: '0.8125rem', borderBottom: '1px solid var(--primary-hover)' }}>
        <div className="civic-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: backendOnline ? '#4ADE80' : 'var(--saffron-accent)' }}></span>
            <span style={{ fontWeight: 500 }}>{backendOnline ? (lang === 'mr' ? 'पुणे महानगरपालिका सर्व्हर: जोडलेले' : 'PMC API Server: Connected') : (lang === 'mr' ? 'स्थानिक AI सहाय्यक (Local Engine Active)' : 'Local Civic AI Active')}</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span>📍 पुणे महानगर क्षेत्र (Pune Urban)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: 'var(--saffron-accent)', fontWeight: 700 }}>📞 आपत्कालीन: १०८ / १८०० १०३ ०२२२</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="no-print" style={{ background: '#FFFFFF', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 40, boxShadow: 'var(--shadow-xs)' }}>
        <div className="civic-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 'var(--header-height)' }}>
          {/* Logo & Civic Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setActiveTab('lodge')}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'var(--primary-forest)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(52, 79, 31, 0.25)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--saffron-accent)' }}>record_voice_over</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-forest)', letterSpacing: '-0.02em' }}>
                  नागरिक मित्र <span style={{ color: 'var(--saffron-accent)' }}>AI</span>
                </span>
                <span className="civic-badge badge-forest" style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem' }}>पुणे PMC</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>
                {lang === 'mr' ? 'आवाज-आधारित नागरी तक्रार व योजना सारथी' : 'Voice-First Civic Grievance & Scheme Portal'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav style={{ display: 'flex', gap: '0.35rem', background: 'var(--warm-beige)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setActiveTab('lodge')}
              style={{
                border: 'none',
                background: activeTab === 'lodge' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'lodge' ? 'var(--primary-forest)' : 'var(--text-secondary)',
                padding: '0.5rem 0.95rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: activeTab === 'lodge' ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: activeTab === 'lodge' ? 'var(--shadow-xs)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: activeTab === 'lodge' ? 'var(--primary-forest)' : 'inherit' }}>campaign</span>
              <span>{lang === 'mr' ? 'तक्रार नोंदवा' : 'Lodge Issue'}</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                border: 'none',
                background: activeTab === 'dashboard' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'dashboard' ? 'var(--primary-forest)' : 'var(--text-secondary)',
                padding: '0.5rem 0.95rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: activeTab === 'dashboard' ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: activeTab === 'dashboard' ? 'var(--shadow-xs)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: activeTab === 'dashboard' ? 'var(--primary-forest)' : 'inherit' }}>map</span>
              <span>{lang === 'mr' ? 'प्रभाग डॅशबोर्ड' : 'Ward Map'}</span>
            </button>

            <button
              onClick={() => setActiveTab('schemes')}
              style={{
                border: 'none',
                background: activeTab === 'schemes' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'schemes' ? 'var(--primary-forest)' : 'var(--text-secondary)',
                padding: '0.5rem 0.95rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: activeTab === 'schemes' ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: activeTab === 'schemes' ? 'var(--shadow-xs)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: activeTab === 'schemes' ? 'var(--primary-forest)' : 'inherit' }}>assured_workload</span>
              <span>{lang === 'mr' ? 'शासकीय योजना' : 'Govt Schemes'}</span>
            </button>

            <button
              onClick={() => setActiveTab('track')}
              style={{
                border: 'none',
                background: activeTab === 'track' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'track' ? 'var(--primary-forest)' : 'var(--text-secondary)',
                padding: '0.5rem 0.95rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: activeTab === 'track' ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: activeTab === 'track' ? 'var(--shadow-xs)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: activeTab === 'track' ? 'var(--primary-forest)' : 'inherit' }}>search_check</span>
              <span>{lang === 'mr' ? 'स्थिती ट्रॅक' : 'Track Status'}</span>
            </button>
          </nav>

          {/* Right Action: Language Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'flex', background: 'var(--warm-beige)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-pill)', padding: '3px' }}>
              {(['mr', 'hi', 'en'] as Language[]).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  style={{
                    border: 'none',
                    background: lang === l ? 'var(--primary-forest)' : 'transparent',
                    color: lang === l ? '#FFFFFF' : 'var(--text-secondary)',
                    padding: '0.25rem 0.7rem',
                    borderRadius: 'var(--radius-pill)',
                    fontWeight: lang === l ? 700 : 500,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                >
                  {l === 'mr' ? 'मराठी' : l === 'hi' ? 'हिन्दी' : 'EN'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, padding: '1.5rem 0 3rem' }}>
        <div className="civic-container">

          {/* Hero Section */}
          <section className="no-print" style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(145deg, #FFFFFF, var(--warm-beige-light))',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem 1.75rem',
            marginBottom: '2rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {/* React Bits Subtle Ambient Civic Canvas */}
            <HeroBackground />

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div style={{ flex: '1 1 540px' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <span className="civic-badge badge-saffron">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>mic</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{lang === 'mr' ? 'मातृभाषेत थेट बोला' : 'Speak in Your Language'}</span>
                  </span>
                  <span className="civic-badge badge-forest">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</span>
                    {lang === 'mr' ? 'पुणे मनपा अधिकृत स्वरूप' : 'PMC Official Grievance Format'}
                  </span>
                </div>

                {/* React Bits BlurText subtle entrance animation */}
                <BlurText
                  key={lang}
                  text={lang === 'mr' ? 'तुमची समस्या, तुमचा आवाज.' : lang === 'hi' ? 'आपकी समस्या, आपकी आवाज़.' : 'Your voice. Your rights.'}
                  delay={80}
                  animateBy="words"
                  direction="top"
                  style={{ fontSize: '2.15rem', color: 'var(--primary-forest)', marginBottom: '0.5rem', fontWeight: 800 }}
                />

                <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '620px' }}>
                  {lang === 'mr'
                    ? 'पुणेकर नागरिकांसाठी रस्त्यावरील खड्डे, कचरा आणि रेशन कार्ड समस्या थेट मराठीत बोलून नोंदवा. आमचे AI अचूक विभाग शोधून अधिकृत तक्रार अर्ज पत्र तयार करेल.'
                    : 'Report potholes, garbage, or ration card problems directly by voice in Marathi, Hindi, or English. AI identifies the department and generates a ready-to-submit official letter.'}
                </p>

                {/* Quick Trust Highlights */}
                <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1.25rem', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--primary-forest)', fontSize: '20px' }}>timer</span>
                    <span>{lang === 'mr' ? '६० सेकंदात अर्ज तयार' : 'Ready in 60 seconds'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--primary-forest)', fontSize: '20px' }}>picture_as_pdf</span>
                    <span>{lang === 'mr' ? 'A4 प्रिंट किंवा PDF जतन' : 'Printable A4 Letter'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--primary-forest)', fontSize: '20px' }}>lock</span>
                    <span>{lang === 'mr' ? 'वैयक्तिक माहिती सुरक्षित' : 'PII Protected'}</span>
                  </div>
                </div>
              </div>

              {/* Quick Hero Banner Badge with React Bits FadeContent */}
              <FadeContent delay={0.15} duration={0.6}>
                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  textAlign: 'center',
                  minWidth: '220px',
                  boxShadow: 'var(--shadow-xs)'
                }}>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 600 }}>
                    {lang === 'mr' ? 'स्वीकृत नागरी तक्रारी' : 'Supported Issue Types'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      <span style={{ background: 'var(--warm-beige)', padding: '4px', borderRadius: '6px' }}>🕳️</span>
                      <span>{lang === 'mr' ? 'रस्त्यातील खड्डा (Pothole)' : 'Pothole / Road damage'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      <span style={{ background: 'var(--warm-beige)', padding: '4px', borderRadius: '6px' }}>🗑️</span>
                      <span>{lang === 'mr' ? 'कचरा साचणे (Garbage)' : 'Garbage dumping'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      <span style={{ background: 'var(--warm-beige)', padding: '4px', borderRadius: '6px' }}>📑</span>
                      <span>{lang === 'mr' ? 'रेशन कार्ड (Ration Card)' : 'Ration card service'}</span>
                    </div>
                  </div>
                </div>
              </FadeContent>
            </div>
          </section>

          {/* ===================== TAB 1: LODGE COMPLAINT ===================== */}
          {activeTab === 'lodge' && (
            <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: submittedComplaint ? '1fr' : '1fr', gap: '2rem' }}>
              {!submittedComplaint ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
                  {/* Left Column: Voice & Details Form */}
                  <div className="civic-card" style={{ padding: '2rem 1.75rem' }}>
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                      <h2 style={{ fontSize: '1.4rem', color: 'var(--primary-forest)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--saffron-accent)' }}>edit_note</span>
                        {lang === 'mr' ? 'समस्या सांगा किंवा लिहा' : 'Describe or Speak Your Issue'}
                      </h2>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        {lang === 'mr' ? 'माइक वर क्लिक करून बोला किंवा खालील चौकटीत लिहा' : 'Click mic to record in Marathi/Hindi, or type below'}
                      </p>
                    </div>

                    {/* Microphone Section */}
                    <div style={{
                      background: isRecording ? 'var(--warm-beige)' : 'var(--warm-beige-light)',
                      border: isRecording ? '2px solid var(--saffron-accent)' : '1px dashed var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.5rem',
                      textAlign: 'center',
                      marginBottom: '1.5rem',
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <button
                          type="button"
                          onClick={toggleSpeech}
                          className={isRecording ? 'animate-pulse-mic' : ''}
                          style={{
                            width: '90px',
                            height: '90px',
                            borderRadius: '50%',
                            background: isRecording ? 'var(--saffron-hover)' : 'var(--saffron-accent)',
                            color: 'var(--text-main)',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: isRecording ? 'var(--shadow-mic)' : '0 4px 14px rgba(244, 153, 26, 0.35)',
                            transition: 'all 0.2s ease'
                          }}
                          aria-label="Toggle Voice Input"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '42px', color: 'var(--text-main)' }}>
                            {isRecording ? 'mic' : 'mic_none'}
                          </span>
                        </button>

                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: isRecording ? 'var(--primary-forest)' : 'var(--text-main)' }}>
                            {isRecording
                              ? (lang === 'mr' ? 'ऐकत आहे... बोला' : 'Listening... Speak now')
                              : (lang === 'mr' ? 'माइक दाबा आणि बोला' : 'Tap to Speak')}
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                            {lang === 'mr' ? 'भाषा: मराठी (mr-IN) व हिन्दी समर्थित' : 'Supports Marathi, Hindi, & English'}
                          </div>
                        </div>

                        {/* Animated waveform bars while recording */}
                        {isRecording && (
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '30px', marginTop: '0.5rem' }}>
                            {[12, 24, 18, 28, 14, 22, 16, 26, 10].map((h, idx) => (
                              <div
                                key={idx}
                                style={{
                                  width: '4px',
                                  height: `${h}px`,
                                  background: 'var(--primary-forest)',
                                  borderRadius: '2px',
                                  animation: `waveBar 0.8s infinite ease-in-out ${idx * 0.1}s`
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {speechError && (
                        <div style={{ marginTop: '0.75rem', color: 'var(--danger)', fontSize: '0.8125rem', fontWeight: 600 }}>
                          {speechError}
                        </div>
                      )}
                    </div>

                    {/* Quick Sample Buttons */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                        {lang === 'mr' ? 'उदाहरणे (क्लिक करा):' : 'Sample Prompts:'}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setTranscript('माझ्या घराजवळ फर्ग्युसन कॉलेज रस्त्यावर मोठा खड्डा पडला आहे, काल रात्री दुचाकी घसरून अपघात झाला.');
                            setCategory('pothole');
                          }}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.45rem 0.75rem',
                            textAlign: 'left',
                            fontSize: '0.8125rem',
                            cursor: 'pointer',
                            color: 'var(--text-main)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          🕳️ "एफसी रोडवर मोठा खड्डा पडला आहे, अपघात होत आहेत..."
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTranscript('कोथरूड डीपी रस्त्यावरील कचराकुंडी गेल्या तीन दिवसांपासून साफ केलेली नाही, रस्त्यावर घाण पसरली आहे.');
                            setCategory('garbage');
                          }}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.45rem 0.75rem',
                            textAlign: 'left',
                            fontSize: '0.8125rem',
                            cursor: 'pointer',
                            color: 'var(--text-main)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          🗑️ "कचराकुंडी भरून वाहते आहे, दुर्गंधी सुटली आहे..."
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTranscript('माझ्या शिधापत्रिका (रेशन कार्ड) मध्ये नवीन कुटुंब सदस्याचे नाव जोडायचे आहे, आवश्यक कागदपत्रांची माहिती द्या.');
                            setCategory('ration_card');
                          }}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.45rem 0.75rem',
                            textAlign: 'left',
                            fontSize: '0.8125rem',
                            cursor: 'pointer',
                            color: 'var(--text-main)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          📑 "रेशन कार्डमध्ये मुलाचे नाव समाविष्ट करायचे आहे..."
                        </button>
                      </div>
                    </div>

                    {/* Textarea for editable transcript */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                        {lang === 'mr' ? 'तक्रारीचा मजकूर (तपासा / दुरुस्त करा) *' : 'Complaint Transcript (Review / Edit) *'}
                      </label>
                      <textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder={lang === 'mr' ? 'उदा. माझ्या परिसरातील रस्त्यावर कचरा साचला आहे...' : 'Describe the civic issue here...'}
                        rows={4}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-md)',
                          border: formErrors.transcript ? '1.5px solid var(--danger)' : '1px solid var(--border-color)',
                          background: '#FFFFFF',
                          lineHeight: 1.5,
                          fontSize: '0.95rem'
                        }}
                      />
                      {formErrors.transcript && (
                        <span style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginTop: '0.25rem', display: 'block' }}>
                          {formErrors.transcript}
                        </span>
                      )}
                    </div>

                    {/* Category Selector */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                        {lang === 'mr' ? 'समस्या प्रकार (Category)' : 'Issue Category'}
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                        {[
                          { key: 'pothole', icon: '🕳️', mr: 'खड्डा', en: 'Pothole' },
                          { key: 'garbage', icon: '🗑️', mr: 'कचरा', en: 'Garbage' },
                          { key: 'ration_card', icon: '📑', mr: 'रेशन कार्ड', en: 'Ration' }
                        ].map(c => (
                          <SpotlightCard
                            key={c.key}
                            as="button"
                            type="button"
                            onClick={() => setCategory(c.key as ComplaintCategory)}
                            spotlightColor={category === c.key ? 'rgba(52, 79, 31, 0.22)' : 'rgba(244, 153, 26, 0.22)'}
                            style={{
                              border: category === c.key ? '2px solid var(--primary-forest)' : '1px solid var(--border-color)',
                              background: category === c.key ? 'var(--warm-beige)' : '#FFFFFF',
                              color: category === c.key ? 'var(--primary-forest)' : 'var(--text-secondary)',
                              padding: '0.65rem 0.5rem',
                              borderRadius: 'var(--radius-md)',
                              fontWeight: category === c.key ? 700 : 500,
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.2rem',
                              fontSize: '0.875rem',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span style={{ fontSize: '1.25rem', marginBottom: '0.15rem' }}>{c.icon}</span>
                            <span>{lang === 'mr' ? c.mr : c.en}</span>
                          </SpotlightCard>
                        ))}
                      </div>
                    </div>

                    {/* Photo Upload with Preview */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                        {lang === 'mr' ? 'समस्येचे छायाचित्र (फोटो जोडा - ऐच्छिक)' : 'Attach Photo (Optional)'}
                      </label>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <label style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.6rem 1rem',
                          background: '#FFFFFF',
                          border: '1.5px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: 'var(--text-main)'
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary-forest)' }}>photo_camera</span>
                          <span>{imagePreview ? (lang === 'mr' ? 'फोटो बदला' : 'Change Photo') : (lang === 'mr' ? 'फोटो निवडा' : 'Choose Photo')}</span>
                          <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                        </label>

                        {imagePreview && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <img
                              src={imagePreview}
                              alt="Preview"
                              style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                            />
                            <button
                              type="button"
                              onClick={() => setImagePreview(null)}
                              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8125rem' }}
                            >
                              ✕ {lang === 'mr' ? 'काढा' : 'Remove'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Location & Citizen Contact */}
                  <div className="civic-card" style={{ padding: '2rem 1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.4rem', color: 'var(--primary-forest)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--primary-forest)' }}>location_on</span>
                          {lang === 'mr' ? 'स्थान व नागरिक संपर्क' : 'Location & Citizen Details'}
                        </h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          {lang === 'mr' ? 'तक्रार निवारणासाठी अचूक प्रभाग व मोबाईल नंबर आवश्यक आहे' : 'Accurate ward and contact for resolution updates'}
                        </p>
                      </div>

                      {/* Ward Selector */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                            {lang === 'mr' ? 'पुणे मनपा प्रभाग (Ward Office) *' : 'PMC Ward Office *'}
                          </label>
                          <button
                            type="button"
                            onClick={handleGetLocation}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--primary-forest)',
                              fontSize: '0.8125rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              cursor: 'pointer'
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>my_location</span>
                            <span>{lang === 'mr' ? 'जीपीएस स्थान वापरा' : 'Use GPS'}</span>
                          </button>
                        </div>
                        <select
                          value={selectedWardId}
                          onChange={(e) => handleWardChange(Number(e.target.value))}
                          style={{
                            width: '100%',
                            padding: '0.65rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            background: '#FFFFFF',
                            fontSize: '0.95rem'
                          }}
                        >
                          {PUNE_WARDS.map(w => (
                            <option key={w.id} value={w.id}>
                              प्रभाग {w.id}: {w.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Address / Landmark */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                          {lang === 'mr' ? 'अचूक पत्ता / जवळची खूण (Landmark) *' : 'Detailed Address / Landmark *'}
                        </label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="उदा. फर्ग्युसन कॉलेज रस्ता, वैकुंठ समोर..."
                          style={{
                            width: '100%',
                            padding: '0.65rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            background: '#FFFFFF',
                            fontSize: '0.95rem'
                          }}
                        />
                      </div>

                      {/* Citizen Name */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                          {lang === 'mr' ? 'नागरिकाचे पूर्ण नाव (Full Name) *' : 'Citizen Full Name *'}
                        </label>
                        <input
                          type="text"
                          value={citizenName}
                          onChange={(e) => setCitizenName(e.target.value)}
                          placeholder="उदा. रमेश विष्णू कुलकर्णी"
                          style={{
                            width: '100%',
                            padding: '0.65rem',
                            borderRadius: 'var(--radius-md)',
                            border: formErrors.name ? '1.5px solid var(--danger)' : '1px solid var(--border-color)',
                            background: '#FFFFFF',
                            fontSize: '0.95rem'
                          }}
                        />
                        {formErrors.name && (
                          <span style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginTop: '0.25rem', display: 'block' }}>
                            {formErrors.name}
                          </span>
                        )}
                      </div>

                      {/* Citizen Phone */}
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                          {lang === 'mr' ? 'मोबाईल नंबर (१० अंकी संपर्क क्रमांक) *' : 'Mobile Number (10 digits) *'}
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <span style={{
                            padding: '0.65rem 0.75rem',
                            background: 'var(--warm-beige)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            color: 'var(--text-main)',
                            fontSize: '0.95rem'
                          }}>
                            +91
                          </span>
                          <input
                            type="tel"
                            maxLength={10}
                            value={citizenPhone}
                            onChange={(e) => setCitizenPhone(e.target.value.replace(/\D/g, ''))}
                            placeholder="९८२२०१२३४५"
                            style={{
                              flex: 1,
                              padding: '0.65rem',
                              borderRadius: 'var(--radius-md)',
                              border: formErrors.phone ? '1.5px solid var(--danger)' : '1px solid var(--border-color)',
                              background: '#FFFFFF',
                              fontSize: '0.95rem'
                            }}
                          />
                        </div>
                        {formErrors.phone ? (
                          <span style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginTop: '0.25rem', display: 'block' }}>
                            {formErrors.phone}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                            🔒 {lang === 'mr' ? 'हा क्रमांक सार्वजनिक डॅशबोर्डवर कधीही प्रसिद्ध केला जाणार नाही.' : 'Your phone is strictly confidential and never displayed publicly.'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Submit Button & Progress Indicator */}
                    <div>
                      {isSubmitting ? (
                        <div style={{
                          background: 'var(--warm-beige-light)',
                          border: '1.5px solid var(--primary-forest)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontWeight: 700, color: 'var(--primary-forest)', fontSize: '0.95rem' }}>
                            ⚙️ {submitStep}
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            {lang === 'mr' ? 'कृपया प्रतीक्षा करा...' : 'Please wait while letter is generated...'}
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSubmitComplaint}
                          className="btn-primary"
                          style={{ width: '100%', fontSize: '1.05rem', padding: '0.9rem' }}
                        >
                          <span className="material-symbols-outlined">description</span>
                          <span>{lang === 'mr' ? 'अधिकृत PMC तक्रार पत्र तयार करा' : 'Generate Official Complaint Letter'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* ===================== RESULT & OFFICIAL LETTER SECTION ===================== */
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* Top Success Notification Banner */}
                  <div className="no-print" style={{
                    background: 'var(--success-bg)',
                    border: '1.5px solid var(--success)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--success)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>check</span>
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-forest)', fontWeight: 800 }}>
                          {lang === 'mr' ? 'तक्रार अर्ज यशस्वीरित्या तयार झाला आहे!' : 'Complaint Application Ready!'}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <span style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 600 }}>
                            {lang === 'mr' ? 'संदर्भ क्रमांक:' : 'Reference No:'}
                          </span>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            background: '#FFFFFF',
                            border: '1px solid var(--border-color)',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontWeight: 700,
                            color: 'var(--primary-forest)'
                          }}>
                            {submittedComplaint.ref_no}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyRefNumber(submittedComplaint.ref_no)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-forest)', fontWeight: 600, fontSize: '0.8125rem' }}
                          >
                            {copiedRef ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="btn-primary"
                        style={{ padding: '0.65rem 1.25rem' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>print</span>
                        <span>{lang === 'mr' ? 'अर्ज प्रिंट / PDF जतन' : 'Print / Save PDF'}</span>
                      </button>

                      <a
                        href={getWhatsAppShareUrl(submittedComplaint)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-saffron"
                        style={{ padding: '0.65rem 1.25rem', textDecoration: 'none' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>share</span>
                        <span>{lang === 'mr' ? 'WhatsApp वर पाठवा' : 'Share on WhatsApp'}</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => { setSubmittedComplaint(null); setTranscript(''); setImagePreview(null); }}
                        className="btn-outline"
                        style={{ padding: '0.65rem 1.25rem' }}
                      >
                        <span>{lang === 'mr' ? 'नवीन तक्रार नोंदवा' : 'New Complaint'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary & Enclosed Documents Card */}
                  <div className="no-print civic-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', color: 'var(--primary-forest)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--primary-forest)' }}>domain</span>
                        {lang === 'mr' ? 'संबधित महानगरपालिका विभाग' : 'Designated Department'}
                      </h4>
                      <p style={{ fontWeight: 700, color: 'var(--primary-forest)', fontSize: '1.05rem' }}>
                        {submittedComplaint.department_name}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        📍 {submittedComplaint.ward_name} ({submittedComplaint.address})
                      </p>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '1rem', color: 'var(--primary-forest)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--primary-forest)' }}>checklist</span>
                        {lang === 'mr' ? 'आवश्यक कागदपत्रे / पुरावे' : 'Required Documents Checklist'}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {submittedComplaint.documents.map((doc, idx) => (
                          <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                            <input type="checkbox" defaultChecked />
                            <span>{doc}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ================= Printable Official Letter ================= */}
                  <div className="print-only-letter" style={{
                    background: '#FFFFFF',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '3rem 2.5rem',
                    boxShadow: 'var(--shadow-md)',
                    maxWidth: '820px',
                    margin: '0 auto',
                    width: '100%',
                    color: '#000000'
                  }}>
                    {/* Municipal Letterhead */}
                    <div style={{ textAlign: 'center', borderBottom: '2px solid var(--primary-forest)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-forest)', letterSpacing: '0.02em' }}>
                        पुणे महानगरपालिका — नागरिक तक्रार निवारण कक्ष
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        PUNE MUNICIPAL CORPORATION — CITIZEN GRIEVANCE APPLICATION
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        जनसुविधा पोर्टल व नागरिक मित्र AI सहाय्यक प्रणाली अंतर्गत तयार अधिकृत अर्ज
                      </div>
                    </div>

                    {/* Metadata Header Box */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                      <div>
                        <strong>तक्रार संदर्भ क्रमांक:</strong> {submittedComplaint.ref_no}
                      </div>
                      <div>
                        <strong>दिनांक:</strong> {new Date().toLocaleDateString('mr-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </div>
                    </div>

                    {/* Addressed To Section */}
                    <div style={{ marginBottom: '1.25rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
                      <p><strong>प्रति,</strong></p>
                      <p>मा. विभागीय आयुक्त / क्षेत्रीय अधिकारी,</p>
                      <p><strong>{submittedComplaint.department_name}</strong>,</p>
                      <p>पुणे महानगरपालिका, प्रभाग: {submittedComplaint.ward_name}, पुणे.</p>
                    </div>

                    {/* Subject Line */}
                    <div style={{
                      background: 'var(--warm-beige-light)',
                      padding: '0.65rem 1rem',
                      borderLeft: '4px solid var(--primary-forest)',
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: 'var(--text-main)',
                      marginBottom: '1.5rem'
                    }}>
                      विषय: {submittedComplaint.summary_local}
                    </div>

                    {/* Citizen Info Block */}
                    <div style={{ marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                      <p><strong>अर्जदार नागरिकाचे नाव:</strong> {submittedComplaint.citizen_name}</p>
                      <p><strong>संपर्क क्रमांक:</strong> +91 {submittedComplaint.citizen_phone}</p>
                      <p><strong>घटनेचे / समस्येचे अचूक ठिकाण:</strong> {submittedComplaint.address}</p>
                      <p><strong>जीपीएस निर्देशांक (Coordinates):</strong> {submittedComplaint.lat.toFixed(4)}, {submittedComplaint.lng.toFixed(4)}</p>
                    </div>

                    {/* Detailed Formal Body */}
                    <div style={{ fontSize: '0.95rem', lineHeight: 1.8, marginBottom: '1.75rem', textAlign: 'justify' }}>
                      <p>महोदय / महोदया,</p>
                      <p style={{ marginTop: '0.5rem' }}>
                        मी उपरोक्त परिसरातील रहिवासी असून या पत्राद्वारे आपल्या निदर्शनास आणून देऊ इच्छितो की,
                        सध्या आमच्या भागात <strong>{submittedComplaint.summary_local}</strong> ही समस्या निर्माण झाली आहे.
                      </p>
                      <p style={{ marginTop: '0.5rem' }}>
                        नागरिकांचे मूळ निवेदन खालीलप्रमाणे आहे:
                        <br />
                        <em>"{submittedComplaint.transcript}"</em>
                      </p>
                      <p style={{ marginTop: '0.5rem' }}>
                        सदर समस्येमुळे नागरिकांना व दैनंदिन रहदारीला प्रचंड गैरसोयीचा सामना करावा लागत आहे. तरी प्रशासनाने या विषयाचे गांभीर्य लक्षात घेऊन संबंधितांना आदेश देऊन तात्काळ प्रत्यक्ष पाहणी करावी व लवकरात लवकर निवारण करावे ही नम्र विनंती.
                      </p>
                    </div>

                    {/* Enclosed Documents */}
                    <div style={{ marginBottom: '2rem', fontSize: '0.875rem' }}>
                      <strong>सोबत जोडलेली कागदपत्रे / पुरावे:</strong>
                      <ul style={{ paddingLeft: '1.5rem', marginTop: '0.35rem' }}>
                        {submittedComplaint.documents.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                        {submittedComplaint.image_url && <li>घटनेचे प्रत्यक्ष छायाचित्र (Geo-tagged Photo)</li>}
                      </ul>
                    </div>

                    {/* Sign-off */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '3rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        डिजिटल स्वाक्षरी व पडताळणी: नागरिक मित्र AI<br />
                        पुणे मनपा नागरिक सेवा सुरक्षा प्रणाली
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ height: '35px' }}></div>
                        <div style={{ borderTop: '1px solid #333', paddingTop: '0.25rem', fontWeight: 600, fontSize: '0.9rem' }}>
                          ( {submittedComplaint.citizen_name} )<br />
                          अर्जदार नागरिक
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB 2: PUBLIC DASHBOARD & MAP ===================== */}
          {activeTab === 'dashboard' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Dashboard Header & KPI Tiles */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-forest)' }}>
                      {lang === 'mr' ? 'पुणे प्रभाग नागरी समस्या डॅशबोर्ड' : 'Pune Municipal Public Ward Dashboard'}
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {lang === 'mr' ? 'सर्व १० प्रभागांमधील तक्रारींची वास्तविक स्थिती व पारदर्शकता' : 'Real-time transparency of complaints across all 10 wards'}
                    </p>
                  </div>
                  <span className="civic-badge badge-forest">
                    {lang === 'mr' ? 'नागरिक गोपनीयता: फोन व वैयक्तिक डेटा सुरक्षित' : 'Zero PII Leaked'}
                  </span>
                </div>

                {/* KPI Summary Tiles with React Bits CountUp */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className="civic-card" style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{lang === 'mr' ? 'एकूण नोंदवलेल्या तक्रारी' : 'Total Complaints'}</div>
                    <CountUp
                      to={wardStats.reduce((acc, w) => acc + w.total, 0)}
                      duration={1.2}
                      style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-forest)', marginTop: '0.25rem', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>पुणे महानगरपालिका सर्व प्रभाग</div>
                  </div>

                  <div className="civic-card" style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{lang === 'mr' ? 'निवारण पूर्ण (Resolved)' : 'Resolved'}</div>
                    <CountUp
                      to={wardStats.reduce((acc, w) => acc + w.by_status.resolved, 0)}
                      duration={1.2}
                      style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.25rem', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>कामाचा निपटारा पूर्ण</div>
                  </div>

                  <div className="civic-card" style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{lang === 'mr' ? 'काम सुरू (In Progress)' : 'In Progress'}</div>
                    <CountUp
                      to={wardStats.reduce((acc, w) => acc + w.by_status.in_progress, 0)}
                      duration={1.2}
                      style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--info)', marginTop: '0.25rem', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--info)', marginTop: '0.25rem' }}>कार्यदेश दिलेले</div>
                  </div>

                  <div className="civic-card" style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{lang === 'mr' ? 'पडताळणी सुरू (In Review)' : 'Under Review'}</div>
                    <CountUp
                      to={wardStats.reduce((acc, w) => acc + w.by_status.in_review, 0)}
                      duration={1.2}
                      style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--warning)', marginTop: '0.25rem', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '0.25rem' }}>क्षेत्रीय अधिकारी तपासणी</div>
                  </div>
                </div>
              </div>

              {/* Map & Ward Visualization with React Bits FadeContent */}
              <FadeContent duration={0.5}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
                  {/* Pune Interactive SVG Ward Map */}
                  <div className="civic-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-forest)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--primary-forest)' }}>hub</span>
                        {lang === 'mr' ? 'पुणे प्रभाग नकाशा (Pune Ward Centroids)' : 'Pune Ward Map'}
                      </h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>क्लिक करून प्रभाग माहिती पहा</span>
                    </div>

                    {/* Styled SVG Civic Map Canvas */}
                    <div style={{
                      width: '100%',
                      height: '340px',
                      background: 'var(--warm-beige-light)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <svg viewBox="0 0 600 400" style={{ width: '100%', height: '100%' }}>
                        {/* Stylized Mula-Mutha River representation */}
                        <path
                          d="M 50 160 Q 200 210, 320 180 T 580 150"
                          fill="none"
                          stroke="#BDD7EE"
                          strokeWidth="18"
                          strokeLinecap="round"
                        />
                        <path
                          d="M 180 80 Q 260 140, 320 180"
                          fill="none"
                          stroke="#BDD7EE"
                          strokeWidth="10"
                          strokeLinecap="round"
                        />

                        {/* Ward centroid nodes using curated palette */}
                        {[
                          { id: 1, name: 'Shivajinagar', x: 280, y: 170, color: '#344F1F', total: 38 },
                          { id: 2, name: 'Kasba Peth', x: 310, y: 210, color: '#F4991A', total: 29 },
                          { id: 3, name: 'Aundh-Baner', x: 160, y: 110, color: '#344F1F', total: 44 },
                          { id: 4, name: 'Kothrud', x: 190, y: 240, color: '#283D18', total: 51 },
                          { id: 5, name: 'Hadapsar', x: 470, y: 230, color: '#F4991A', total: 42 },
                          { id: 6, name: 'Yerawada', x: 420, y: 100, color: '#344F1F', total: 35 },
                          { id: 7, name: 'Bibwewadi', x: 340, y: 310, color: '#283D18', total: 26 },
                          { id: 8, name: 'Sinhagad Rd', x: 230, y: 320, color: '#F4991A', total: 33 },
                          { id: 9, name: 'Warje', x: 150, y: 290, color: '#344F1F', total: 28 },
                          { id: 10, name: 'Nagar Road', x: 460, y: 150, color: '#283D18', total: 31 }
                        ].map(node => (
                          <g
                            key={node.id}
                            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={() => setMapHoveredWard(`${node.name} (एकूण: ${node.total})`)}
                            onMouseLeave={() => setMapHoveredWard(null)}
                            onClick={() => setSelectedFilterWard(String(node.id))}
                          >
                            <circle cx={node.x} cy={node.y} r="22" fill={node.color} opacity="0.22" />
                            <circle cx={node.x} cy={node.y} r="12" fill={node.color} stroke="#FFFFFF" strokeWidth="2.5" />
                            <text x={node.x} y={node.y + 26} fontSize="11" fontWeight="700" fill="var(--text-main)" textAnchor="middle">
                              {node.name}
                            </text>
                          </g>
                        ))}
                      </svg>

                      {/* Map Hover / Selected Info overlay */}
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        right: '12px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(6px)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8125rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: '1px solid var(--border-color)'
                      }}>
                        <span style={{ fontWeight: 600, color: 'var(--primary-forest)' }}>
                          📍 {mapHoveredWard || (lang === 'mr' ? 'प्रभागावर माउस फिरवून तक्रारींची संख्या पहा' : 'Hover over any ward node')}
                        </span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                          पुणे मनपा अधिकृत प्रभाग १ ते १०
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ward Breakdown Table */}
                  <div className="civic-card" style={{ padding: '1.5rem', maxHeight: '420px', overflowY: 'auto' }}>
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-forest)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary-forest)' }}>table_chart</span>
                      {lang === 'mr' ? 'प्रभागनिहाय आकडेवारी' : 'Ward Statistics Table'}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {wardStats.map(w => {
                        const resRate = Math.round((w.by_status.resolved / (w.total || 1)) * 100);
                        return (
                          <div key={w.ward_id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                                {w.name}
                              </span>
                              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                <strong>{w.total}</strong> तक्रारी ({resRate}% पूर्ण)
                              </span>
                            </div>
                            {/* Progress bar */}
                            <div style={{ width: '100%', height: '6px', background: 'var(--warm-beige)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${resRate}%`, height: '100%', background: 'var(--primary-forest)', borderRadius: '3px' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </FadeContent>

              {/* Recent Public Complaints List with React Bits FadeContent */}
              <FadeContent duration={0.5} delay={0.1}>
                <div className="civic-card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-forest)' }}>
                      {lang === 'mr' ? 'नुकत्याच नोंदवलेल्या नागरी तक्रारी (सार्वजनिक यादी)' : 'Recent Civic Complaints (Sanitized Feed)'}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <select
                        value={selectedFilterWard}
                        onChange={(e) => setSelectedFilterWard(e.target.value)}
                        style={{ padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: '#FFFFFF', color: 'var(--text-main)', fontSize: '0.8125rem' }}
                      >
                        <option value="all">{lang === 'mr' ? 'सर्व प्रभाग (All Wards)' : 'All Wards'}</option>
                        {PUNE_WARDS.map(w => (
                          <option key={w.id} value={String(w.id)}>{w.name}</option>
                        ))}
                      </select>
                      <select
                        value={selectedFilterCategory}
                        onChange={(e) => setSelectedFilterCategory(e.target.value)}
                        style={{ padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: '#FFFFFF', color: 'var(--text-main)', fontSize: '0.8125rem' }}
                      >
                        <option value="all">{lang === 'mr' ? 'सर्व समस्या प्रकार' : 'All Categories'}</option>
                        <option value="pothole">{lang === 'mr' ? 'रस्त्यातील खड्डा' : 'Pothole'}</option>
                        <option value="garbage">{lang === 'mr' ? 'कचरा' : 'Garbage'}</option>
                        <option value="ration_card">{lang === 'mr' ? 'रेशन कार्ड' : 'Ration Card'}</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                    {recentComplaints
                      .filter(c => (selectedFilterCategory === 'all' || c.category === selectedFilterCategory) && (selectedFilterWard === 'all' || String(c.ward_id) === selectedFilterWard))
                      .map(c => (
                        <div
                          key={c.id}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <span style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                color: 'var(--primary-forest)'
                              }}>
                                {c.ref_no}
                              </span>
                              <span className={`civic-badge ${c.status === 'resolved' ? 'badge-success' : c.status === 'in_progress' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                                {c.status === 'resolved' ? 'पूर्ण (Resolved)' : c.status === 'in_progress' ? 'काम सुरू (In Progress)' : 'पडताळणी (In Review)'}
                              </span>
                            </div>
                            <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                              {c.summary_local}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                              📍 {c.ward_name} ({c.address})
                            </p>
                          </div>

                          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <span>नागरिक: {c.citizen_name}</span>
                            <span>{new Date(c.created_at).toLocaleDateString('mr-IN')}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </FadeContent>
            </div>
          )}

          {/* ===================== TAB 3: GOVERNMENT SCHEMES ===================== */}
          {activeTab === 'schemes' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-forest)' }}>
                  {lang === 'mr' ? 'महाराष्ट्र शासन व पुणे मनपा जनकल्याण योजना' : 'Maharashtra Govt & PMC Welfare Schemes'}
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {lang === 'mr' ? 'आपली पात्रता तपासा आणि आवश्यक कागदपत्रांची यादी मिळवा' : 'Check your eligibility and find required documents for official schemes'}
                </p>
              </div>

              {/* Eligibility Quiz / Filter Bar */}
              <div className="civic-card" style={{ padding: '1.25rem', background: 'var(--warm-beige)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-forest)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary-forest)' }}>filter_alt</span>
                  <span>{lang === 'mr' ? 'योजना पात्रता फिल्टर (Eligibility Quiz)' : 'Scheme Eligibility Filter'}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                      {lang === 'mr' ? 'आपले वय (Age)' : 'Your Age'}
                    </label>
                    <input
                      type="number"
                      placeholder="उदा. 45"
                      value={schemeAge}
                      onChange={(e) => setSchemeAge(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: '#FFFFFF' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                      {lang === 'mr' ? 'कमाल वार्षिक उत्पन्न (₹ Income)' : 'Max Annual Income (₹)'}
                    </label>
                    <input
                      type="number"
                      placeholder="उदा. 50000"
                      value={schemeIncome}
                      onChange={(e) => setSchemeIncome(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: '#FFFFFF' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => { setSchemeAge(''); setSchemeIncome(''); }}
                      className="btn-outline"
                      style={{ width: '100%', padding: '0.5rem' }}
                    >
                      {lang === 'mr' ? 'सर्व योजना दाखवा' : 'Reset Filter'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Schemes Grid with React Bits FadeContent */}
              <FadeContent duration={0.5}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
                  {filteredSchemes.map(s => (
                    <div key={s.id} className="civic-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-forest)', fontWeight: 800 }}>
                            {s.title[lang]}
                          </h3>
                          <span className="civic-badge badge-forest" style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                            महाराष्ट्र शासन
                          </span>
                        </div>

                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 500 }}>
                          🏛️ {s.department[lang]}
                        </p>

                        <div style={{
                          background: 'var(--warm-beige-light)',
                          borderLeft: '3px solid var(--saffron-accent)',
                          padding: '0.5rem 0.75rem',
                          marginBottom: '0.75rem',
                          fontSize: '0.875rem',
                          color: 'var(--text-main)',
                          fontWeight: 700
                        }}>
                          🎁 {s.benefit[lang]}
                        </div>

                        <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.5, marginBottom: '1rem' }}>
                          {s.description[lang]}
                        </p>

                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary-forest)', marginBottom: '0.35rem' }}>
                            📑 {lang === 'mr' ? 'आवश्यक कागदपत्रे:' : 'Required Documents:'}
                          </div>
                          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                            {s.requiredDocs[lang].map((doc, idx) => (
                              <li key={idx}>{doc}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {s.maxIncome ? `उत्पन्न मर्यादा: ₹${s.maxIncome.toLocaleString('en-IN')}` : 'सर्व उत्पन्न गट'}
                        </span>
                        <a
                          href={s.applicationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary"
                          style={{ padding: '0.45rem 0.9rem', fontSize: '0.8125rem', textDecoration: 'none' }}
                        >
                          <span>{lang === 'mr' ? 'अधिकृत पोर्टलवर जा' : 'Apply Online'}</span>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </FadeContent>

              {/* Disclaimer */}
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', background: 'var(--warm-beige)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                ⚠️ <strong>सूचना:</strong> सदर माहिती नागरिकांच्या मार्गदर्शनासाठी आहे. लाभ मिळण्याची अंतिम पात्रता शासकीय पडताळणीवर अवलंबून असेल.
              </div>
            </div>
          )}

          {/* ===================== TAB 4: TRACK STATUS ===================== */}
          {activeTab === 'track' && (
            <div className="animate-fade-in" style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <FadeContent duration={0.4}>
                <div className="civic-card" style={{ padding: '2rem 1.75rem' }}>
                  <h2 style={{ fontSize: '1.4rem', color: 'var(--primary-forest)', marginBottom: '0.5rem' }}>
                    {lang === 'mr' ? 'तक्रार स्थिती ट्रॅक करा' : 'Track Complaint Status'}
                  </h2>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                    {lang === 'mr' ? 'आपला तक्रार संदर्भ क्रमांक प्रविष्ट करा (उदा. NM-PUNE-20261009-1042)' : 'Enter reference number to track resolution'}
                  </p>

                  <form onSubmit={handleTrackSearch} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={trackQuery}
                      onChange={(e) => setTrackQuery(e.target.value)}
                      placeholder="NM-PUNE-YYYYMMDD-XXXX"
                      style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}
                    />
                    <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
                      <span className="material-symbols-outlined">search</span>
                      <span>{lang === 'mr' ? 'शोधा' : 'Search'}</span>
                    </button>
                  </form>

                  {trackError && (
                    <div style={{ marginTop: '1rem', color: 'var(--danger)', fontSize: '0.875rem', fontWeight: 600 }}>
                      {trackError}
                    </div>
                  )}
                </div>
              </FadeContent>

              {/* Tracking Result Timeline with React Bits FadeContent */}
              {trackedComplaint && (
                <FadeContent duration={0.5}>
                  <div className="civic-card" style={{ padding: '2rem 1.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                      <div>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>तक्रार संदर्भ क्र.</span>
                        <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary-forest)', fontFamily: 'var(--font-mono)' }}>
                          {trackedComplaint.ref_no}
                        </div>
                      </div>
                      <span className="civic-badge badge-forest">
                        {trackedComplaint.ward_name}
                      </span>
                    </div>

                    <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '1.5rem' }}>
                      {trackedComplaint.summary_local}
                    </p>

                    {/* Vertical Timeline */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', paddingLeft: '1.5rem' }}>
                      <div style={{ position: 'absolute', top: '10px', bottom: '10px', left: '7px', width: '2px', background: 'var(--primary-forest)' }}></div>

                      {[
                        { title: 'तक्रार नोंदणीकृत (Submitted)', note: 'नागरिकाकडून तक्रार प्राप्त झाली.', done: true, time: '2026-10-09 10:15' },
                        { title: 'क्षेत्रीय कार्यालयाकडे वर्ग (In Review)', note: 'प्रभाग अधिकाऱ्यांकडे तपासणीसाठी वर्ग.', done: trackedComplaint.status !== 'submitted', time: '2026-10-09 11:30' },
                        { title: 'कामकाज सुरू (In Progress)', note: 'दुरुस्ती अथवा स्वच्छता पथक नियुक्त.', done: trackedComplaint.status === 'in_progress' || trackedComplaint.status === 'resolved', time: '2026-10-09 14:00' },
                        { title: 'तक्रार निवारण पूर्ण (Resolved)', note: 'काम पूर्ण झाल्याची खात्री करण्यात आली.', done: trackedComplaint.status === 'resolved', time: '2026-10-09 16:45' }
                      ].map((step, idx) => (
                        <div key={idx} style={{ position: 'relative' }}>
                          <div style={{
                            position: 'absolute',
                            left: '-1.85rem',
                            top: '2px',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: step.done ? 'var(--primary-forest)' : 'var(--border-color)',
                            border: '2px solid #FFFFFF'
                          }}></div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: step.done ? 'var(--primary-forest)' : 'var(--text-secondary)' }}>
                            {step.title}
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            {step.note}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </FadeContent>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Municipal Civic Footer */}
      <footer className="no-print" style={{ background: '#FFFFFF', borderTop: '1px solid var(--border-color)', padding: '1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
        <div className="civic-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontWeight: 700, color: 'var(--primary-forest)' }}>नागरिक मित्र AI (Nagrik Mitra)</span> — पुणे महानगरपालिका नागरिक सहाय्यक पोर्टल
            <div style={{ fontSize: '0.75rem', marginTop: '0.2rem', color: 'var(--text-secondary)' }}>
              Open Source Civic-Tech Project for Pune Citizens • Built for Hackathon
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span>हेल्पलाइन: १८०० १०३ ०२२२</span>
            <span>ईमेल: info@punecorporation.org</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
