import React, { useState, useEffect, useRef } from 'react';
import { 
  Sprout, 
  Settings, 
  User, 
  MapPin, 
  Layers, 
  Grid, 
  Compass, 
  TrendingUp, 
  Droplet, 
  Activity, 
  MessageSquare, 
  Mic, 
  Volume2,
  Trash2, 
  Sun, 
  CloudRain, 
  Wind, 
  Globe, 
  Moon, 
  FileText, 
  BookmarkCheck,
  Send,
  HelpCircle,
  RefreshCw,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadarChart
} from 'recharts';
import { dbService } from './supabaseClient';
import { analyzeSoilAndCrop } from './utils/recommendationEngine';
import { getTranslation, getTranslatedOptions } from './utils/translations';
import { getBotResponse, getSpeechEmulationText, mockWeatherAPI } from './utils/chatbotEngine';

export default function App() {
  // Config states
  const [lang, setLang] = useState('en');
  const [darkMode, setDarkMode] = useState(false);
  const [tab, setTab] = useState('form'); // 'form' | 'dashboard' | 'history' | 'chatbot'
  const [loading, setLoading] = useState(false);
  
  // Weather state
  const [weather, setWeather] = useState({
    location: 'Bengaluru',
    temperature: 28,
    humidity: 62,
    condition: 'Sunny',
    windSpeed: 12,
    forecast: []
  });
  const [weatherSearch, setWeatherSearch] = useState('Bengaluru');

  // Input states
  const [inputs, setInputs] = useState({
    farmerName: '',
    location: 'Bengaluru',
    soilType: 'Red soil',
    cropType: 'Cotton',
    plantCategory: 'Commercial crops',
    nitrogen: '45',
    phosphorus: '35',
    potassium: '40',
    ph: '6.5',
    weatherCondition: 'Sunny'
  });

  // Current recommendation
  const [result, setResult] = useState(null);

  // History list
  const [history, setHistory] = useState([]);

  // Chatbot states
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: '' } // Welcome message gets generated in useEffect
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef(null);

  // Initial welcome message and loading history/weather
  useEffect(() => {
    setChatMessages([
      { sender: 'bot', text: getTranslation(lang, 'chatWelcome') }
    ]);
  }, [lang]);

  useEffect(() => {
    loadHistory();
    loadWeather('Bengaluru');
  }, []);

  // Sync inputs weather
  useEffect(() => {
    if (weather) {
      setInputs(prev => ({
        ...prev,
        weatherCondition: weather.condition,
        location: weather.location
      }));
    }
  }, [weather]);

  const loadHistory = async () => {
    const list = await dbService.getRecommendationHistory();
    setHistory(list);
  };

  const loadWeather = async (loc) => {
    try {
      const data = await mockWeatherAPI(loc);
      setWeather(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSliderChange = (name, value) => {
    setInputs(prev => ({ ...prev, [name]: value.toString() }));
  };

  const handleWeatherSearch = (e) => {
    e.preventDefault();
    if (weatherSearch.trim()) {
      loadWeather(weatherSearch);
    }
  };

  // Submit form recommendation
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputs.farmerName.trim()) {
      alert(lang === 'kn' ? 'ದಯವಿಟ್ಟು ರೈತನ ಹೆಸರನ್ನು ನಮೂದಿಸಿ' : 'Please enter the farmer name');
      return;
    }
    setLoading(true);
    
    // Process Recommendation
    const analysis = analyzeSoilAndCrop(inputs);
    
    // Save to Database
    await dbService.saveRecommendation(analysis);
    
    // Save locally
    setResult(analysis);
    setLoading(false);
    
    // Reload history list
    loadHistory();

    // Auto navigate to result visualization
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Voice Recognition Simulation with native fallback
  const startVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'kn' ? 'kn-IN' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);

      recognition.onstart = () => {
        console.log("Voice search started");
      };

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setChatInput(text);
        setIsListening(false);
      };

      recognition.onerror = (e) => {
        console.error("Speech recognition error", e);
        setIsListening(false);
        fallbackVoiceEmulation();
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      fallbackVoiceEmulation();
    }
  };

  const fallbackVoiceEmulation = () => {
    setIsListening(true);
    setTimeout(() => {
      const simulatedText = getSpeechEmulationText(lang);
      setChatInput(simulatedText);
      setIsListening(false);
    }, 1500);
  };

  // Chat message send
  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');

    setTimeout(() => {
      const response = getBotResponse(userText, lang);
      setChatMessages(prev => [...prev, { sender: 'bot', text: response }]);
    }, 600);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const clearRecommendationHistory = async () => {
    if (window.confirm(lang === 'kn' ? 'ನೀವು ಇತಿಹಾಸವನ್ನು ಅಳಿಸಲು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?' : 'Are you sure you want to clear the entire history?')) {
      await dbService.clearHistory();
      setHistory([]);
      alert(getTranslation(lang, 'historyCleared'));
    }
  };

  // Translation helpers
  const options = getTranslatedOptions(lang);

  // Chart configs: Recharts data formatting
  const latestRec = result || (history.length > 0 ? history[0] : null);

  const nutrientChartData = latestRec ? [
    {
      name: 'Nitrogen (N)',
      Current: parseFloat(latestRec.nitrogen),
      Ideal: parseFloat(latestRec.targetN)
    },
    {
      name: 'Phosphorus (P)',
      Current: parseFloat(latestRec.phosphorus),
      Ideal: parseFloat(latestRec.targetP)
    },
    {
      name: 'Potassium (K)',
      Current: parseFloat(latestRec.potassium),
      Ideal: parseFloat(latestRec.targetK)
    }
  ] : [
    { name: 'Nitrogen (N)', Current: 40, Ideal: 60 },
    { name: 'Phosphorus (P)', Current: 30, Ideal: 50 },
    { name: 'Potassium (K)', Current: 35, Ideal: 70 }
  ];

  const radarChartData = latestRec ? [
    { subject: 'N', A: parseFloat(latestRec.nitrogen), B: parseFloat(latestRec.targetN), fullMark: 150 },
    { subject: 'P', A: parseFloat(latestRec.phosphorus), B: parseFloat(latestRec.targetP), fullMark: 150 },
    { subject: 'K', A: parseFloat(latestRec.potassium), B: parseFloat(latestRec.targetK), fullMark: 150 },
    { subject: 'pH', A: parseFloat(latestRec.ph) * 10, B: 65, fullMark: 140 }
  ] : [
    { subject: 'N', A: 50, B: 80, fullMark: 150 },
    { subject: 'P', A: 35, B: 50, fullMark: 150 },
    { subject: 'K', A: 45, B: 70, fullMark: 150 },
    { subject: 'pH', A: 65, B: 65, fullMark: 140 }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-green-50/30 text-slate-800'}`}>
      
      {/* Header section with Dynamic green gradient and responsive grid */}
      <header className="relative overflow-hidden bg-gradient-to-r from-emerald-700 via-green-600 to-teal-700 text-white shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/20"></div>
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md shadow-inner border border-white/20">
              <Sprout className="w-8 h-8 text-green-200 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-sans">
                {getTranslation(lang, 'title')}
              </h1>
              <p className="text-xs md:text-sm text-green-100 mt-1 font-medium">
                {getTranslation(lang, 'subtitle')}
              </p>
            </div>
          </div>

          {/* Quick controls settings (Language, theme, user) */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Language toggle */}
            <button 
              onClick={() => setLang(lang === 'en' ? 'kn' : 'en')}
              className="bg-white/10 hover:bg-white/20 transition px-3 py-1.5 rounded-xl border border-white/15 flex items-center gap-2 text-sm font-semibold cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              <span>{lang === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
            </button>

            {/* Dark mode toggle */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="bg-white/10 hover:bg-white/20 transition p-2 rounded-xl border border-white/15 cursor-pointer"
              title={getTranslation(lang, 'darkMode')}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-200" />}
            </button>

            {/* Weather Widget */}
            <div className="bg-black/20 backdrop-blur-md border border-white/10 px-3 py-1 rounded-xl text-xs flex items-center gap-2 font-medium">
              {weather.condition === 'Rainy' ? <CloudRain className="w-4 h-4 text-blue-300" /> : <Sun className="w-4 h-4 text-amber-300 animate-spin-slow" />}
              <div>
                <p className="font-bold">{weather.location}: {weather.temperature}°C</p>
                <p className="text-[10px] text-green-200">{getTranslation(lang, weather.condition.toLowerCase())}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main navigation Tabs */}
      <nav className={`sticky top-0 z-30 border-b transition-colors duration-300 ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-green-100'} backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-4 flex justify-between md:justify-start gap-1 md:gap-4 py-2 overflow-x-auto scrollbar-none">
          <button 
            onClick={() => setTab('form')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
              tab === 'form' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                : 'text-slate-500 hover:bg-green-500/10'
            }`}
          >
            <Layers className="w-4 h-4" />
            {getTranslation(lang, 'farmerForm')}
          </button>
          
          <button 
            onClick={() => setTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
              tab === 'dashboard' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                : 'text-slate-500 hover:bg-green-500/10'
            }`}
          >
            <Grid className="w-4 h-4" />
            {getTranslation(lang, 'dashboard')}
          </button>

          <button 
            onClick={() => setTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
              tab === 'history' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                : 'text-slate-500 hover:bg-green-500/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            {getTranslation(lang, 'history')}
          </button>

          <button 
            onClick={() => setTab('chatbot')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
              tab === 'chatbot' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                : 'text-slate-500 hover:bg-green-500/10'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {getTranslation(lang, 'chatbot')}
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* VIEW 1: Form & Current Recommendation */}
        {tab === 'form' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Input Form Column */}
            <div className="lg:col-span-7">
              <div className={`p-6 rounded-3xl shadow-xl transition-colors duration-300 border ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-green-100'
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <Activity className="w-6 h-6 text-emerald-600" />
                  <h2 className="text-xl font-extrabold tracking-tight">
                    {getTranslation(lang, 'farmerForm')}
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Farmer profile grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-500">
                        {getTranslation(lang, 'farmerName')} *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          name="farmerName"
                          value={inputs.farmerName}
                          onChange={handleInputChange}
                          placeholder="e.g. Ramesh Gowda"
                          className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-500">
                        {getTranslation(lang, 'location')}
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          name="location"
                          value={inputs.location}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dropdowns row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-500">
                        {getTranslation(lang, 'soilType')}
                      </label>
                      <select 
                        name="soilType"
                        value={inputs.soilType}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-2xl border text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        {options.soils.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-500">
                        {getTranslation(lang, 'cropType')}
                      </label>
                      <select 
                        name="cropType"
                        value={inputs.cropType}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-2xl border text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        {options.crops.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-500">
                        {getTranslation(lang, 'plantCategory')}
                      </label>
                      <select 
                        name="plantCategory"
                        value={inputs.plantCategory}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-2xl border text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        {options.categories.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Nutrients N-P-K Sliders */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-extrabold tracking-wider uppercase text-slate-400">
                      {getTranslation(lang, 'idealNutrients')}
                    </h3>
                    
                    {/* Nitrogen */}
                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                      <div className="flex justify-between items-center mb-1 text-sm font-bold">
                        <span>{getTranslation(lang, 'nitrogen')}</span>
                        <span className="text-emerald-600 bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">{inputs.nitrogen} ppm</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="200" 
                        value={inputs.nitrogen}
                        onChange={(e) => handleSliderChange('nitrogen', e.target.value)}
                        className="w-full accent-emerald-600"
                      />
                    </div>

                    {/* Phosphorus */}
                    <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/10">
                      <div className="flex justify-between items-center mb-1 text-sm font-bold">
                        <span>{getTranslation(lang, 'phosphorus')}</span>
                        <span className="text-sky-600 bg-sky-100 dark:bg-sky-950/50 dark:text-sky-400 px-2.5 py-0.5 rounded-full">{inputs.phosphorus} ppm</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="200" 
                        value={inputs.phosphorus}
                        onChange={(e) => handleSliderChange('phosphorus', e.target.value)}
                        className="w-full accent-sky-600"
                      />
                    </div>

                    {/* Potassium */}
                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                      <div className="flex justify-between items-center mb-1 text-sm font-bold">
                        <span>{getTranslation(lang, 'potassium')}</span>
                        <span className="text-amber-600 bg-amber-100 dark:bg-amber-950/50 dark:text-amber-400 px-2.5 py-0.5 rounded-full">{inputs.potassium} ppm</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="200" 
                        value={inputs.potassium}
                        onChange={(e) => handleSliderChange('potassium', e.target.value)}
                        className="w-full accent-amber-600"
                      />
                    </div>
                  </div>

                  {/* pH and Weather row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {getTranslation(lang, 'soilPh')}
                        </label>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500">pH {inputs.ph}</span>
                      </div>
                      <input 
                        type="range" 
                        min="3.0" 
                        max="10.0" 
                        step="0.1"
                        value={inputs.ph}
                        onChange={(e) => handleSliderChange('ph', e.target.value)}
                        className="w-full accent-indigo-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                        <span>Acidic (3.0)</span>
                        <span>Neutral (7.0)</span>
                        <span>Alkaline (10.0)</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-500">
                        {getTranslation(lang, 'weather')}
                      </label>
                      <select 
                        name="weatherCondition"
                        value={inputs.weatherCondition}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-2xl border text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        {options.weathers.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-extrabold tracking-wide rounded-2xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-5 h-5" />
                    {loading ? getTranslation(lang, 'processing') : getTranslation(lang, 'submit')}
                  </button>
                </form>
              </div>
            </div>

            {/* Recommendation Result Column */}
            <div className="lg:col-span-5">
              {latestRec ? (
                <div className={`p-6 rounded-3xl shadow-xl transition-colors duration-300 border h-full flex flex-col ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-green-100'
                }`}>
                  <div className="flex items-center justify-between border-b pb-4 mb-5 border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <BookmarkCheck className="w-6 h-6 text-emerald-500" />
                      <h2 className="text-lg font-extrabold">{getTranslation(lang, 'recommendationTitle')}</h2>
                    </div>
                    {latestRec.created_at && (
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                        {new Date(latestRec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  {/* Suitability circular score block */}
                  <div className="flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500/5 to-teal-500/10 p-5 rounded-2xl border border-emerald-500/10 mb-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{getTranslation(lang, 'suitabilityScore')}</p>
                    <div className="relative flex items-center justify-center w-24 h-24 rounded-full border-4 border-emerald-500/20 bg-white dark:bg-slate-900 shadow-md">
                      <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{latestRec.suitabilityScore}%</span>
                    </div>
                    
                    {/* Health indicator bar */}
                    <div className="w-full mt-4">
                      <div className="flex justify-between items-center text-xs font-bold mb-1">
                        <span className="text-slate-400">{getTranslation(lang, 'healthStatus')}:</span>
                        <span className={`px-2 py-0.5 rounded-full ${
                          latestRec.suitabilityScore >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' :
                          latestRec.suitabilityScore >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        }`}>
                          {latestRec.suitabilityScore >= 80 ? getTranslation(lang, 'excellent') :
                           latestRec.suitabilityScore >= 50 ? getTranslation(lang, 'moderate') :
                           getTranslation(lang, 'poor')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fertilizer details card grid */}
                  <div className="space-y-4 flex-grow">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{getTranslation(lang, 'suggestedFertilizer')}</p>
                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{latestRec.suggestedFertilizer}</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{getTranslation(lang, 'dosage')}</p>
                        <p className="text-sm font-black">{latestRec.quantityPerAc}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{getTranslation(lang, 'waterReq')}</p>
                        <p className="text-sm font-extrabold flex items-center gap-1">
                          <Droplet className="w-4 h-4 text-blue-500" />
                          {latestRec.waterRequirement}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{getTranslation(lang, 'bestSeason')}</p>
                        <p className="text-xs font-black">{latestRec.bestSeason}</p>
                      </div>
                    </div>

                    {/* Organic Alternatives list */}
                    {latestRec.organicAlternatives && latestRec.organicAlternatives.length > 0 && (
                      <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{getTranslation(lang, 'organicAlternatives')}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {latestRec.organicAlternatives.map((org, i) => (
                            <span key={i} className="text-xs font-bold bg-green-100 text-green-700 dark:bg-green-950/80 dark:text-green-300 px-2.5 py-1 rounded-xl">
                              {org}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Soil Amendments list */}
                    {latestRec.soilAmendments && latestRec.soilAmendments.length > 0 && (
                      <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{getTranslation(lang, 'soilAmendments')}</p>
                        <ul className="space-y-1">
                          {latestRec.soilAmendments.map((amend, i) => (
                            <li key={i} className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-start gap-1">
                              <span className="mt-0.5">•</span>
                              <span>{amend}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Weather Warning */}
                    {latestRec.weatherAlert && (
                      <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-2 items-start text-xs font-medium text-slate-400">
                        <AlertTriangle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-blue-500">{getTranslation(lang, 'weatherAlert')}: </span>
                          {latestRec.weatherAlert}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`p-8 rounded-3xl shadow-xl transition-colors duration-300 border h-full flex flex-col justify-center items-center text-center ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-green-100'
                }`}>
                  <HelpCircle className="w-16 h-16 text-emerald-200 mb-4 animate-bounce" />
                  <h3 className="text-lg font-bold mb-1">{lang === 'kn' ? 'ಯಾವುದೇ ಶಿಫಾರಸು ಇಲ್ಲ' : 'No Recommendation Yet'}</h3>
                  <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                    {lang === 'kn' ? 'ರಸಗೊಬ್ಬರ ಶಿಫಾರಸುಗಳನ್ನು ಪಡೆಯಲು ಎಡಭಾಗದ ಫಾರ್ಮ್ ತುಂಬಿ ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಿ.' : 'Fill the farmer input form on the left and submit to analyze soil and generate a recommendation.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: Dashboard & Charts */}
        {tab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Soil Type */}
              <div className={`p-6 rounded-3xl border shadow-md flex items-center gap-4 transition-colors ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-green-100'
              }`}>
                <div className="p-4 bg-emerald-500/10 rounded-2xl">
                  <Layers className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{getTranslation(lang, 'soilType')}</p>
                  <p className="text-lg font-black">{latestRec ? latestRec.soilType : 'N/A'}</p>
                </div>
              </div>

              {/* Card 2: Crop Status */}
              <div className={`p-6 rounded-3xl border shadow-md flex items-center gap-4 transition-colors ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-green-100'
              }`}>
                <div className="p-4 bg-indigo-500/10 rounded-2xl">
                  <Sprout className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{getTranslation(lang, 'cropType')}</p>
                  <p className="text-lg font-black">{latestRec ? `${latestRec.cropType} (${latestRec.plantCategory})` : 'N/A'}</p>
                </div>
              </div>

              {/* Card 3: Suitability index */}
              <div className={`p-6 rounded-3xl border shadow-md flex items-center gap-4 transition-colors ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-green-100'
              }`}>
                <div className="p-4 bg-amber-500/10 rounded-2xl">
                  <Activity className="w-8 h-8 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{getTranslation(lang, 'suitabilityScore')}</p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {latestRec ? `${latestRec.suitabilityScore}%` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Recharts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Chart A: Nutrient Balance Bar chart */}
              <div className={`p-6 rounded-3xl border shadow-lg transition-colors ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-green-100'
              }`}>
                <h3 className="text-base font-extrabold mb-4">{getTranslation(lang, 'soilAnalysis')}</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={nutrientChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#f1f5f9"} />
                      <XAxis dataKey="name" stroke={darkMode ? "#94a3b8" : "#64748b"} />
                      <YAxis stroke={darkMode ? "#94a3b8" : "#64748b"} />
                      <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#ffffff', borderColor: '#22c55e' }} />
                      <Legend />
                      <Bar dataKey="Current" fill="#22c55e" radius={[4, 4, 0, 0]} name={getTranslation(lang, 'current')} />
                      <Bar dataKey="Ideal" fill="#3b82f6" radius={[4, 4, 0, 0]} name={getTranslation(lang, 'ideal')} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart B: Polar Radar Chart */}
              <div className={`p-6 rounded-3xl border shadow-lg transition-colors ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-green-100'
              }`}>
                <h3 className="text-base font-extrabold mb-4">{getTranslation(lang, 'idealNutrients')} (Radar View)</h3>
                <div className="h-80 flex justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                      <PolarGrid stroke={darkMode ? "#334155" : "#cbd5e1"} />
                      <PolarAngleAxis dataKey="subject" stroke={darkMode ? "#94a3b8" : "#64748b"} />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} stroke={darkMode ? "#94a3b8" : "#64748b"} />
                      <Radar name={getTranslation(lang, 'current')} dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                      <Radar name={getTranslation(lang, 'ideal')} dataKey="B" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Current Weather API Info */}
            <div className={`p-6 rounded-3xl border shadow-lg transition-colors ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-green-100'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-extrabold">{getTranslation(lang, 'waterAdvice')}</h3>
                  <p className="text-xs text-slate-400 font-medium">Adapting watering logic to local humidity forecasts</p>
                </div>

                {/* Weather city search */}
                <form onSubmit={handleWeatherSearch} className="flex gap-2">
                  <input 
                    type="text" 
                    value={weatherSearch}
                    onChange={(e) => setWeatherSearch(e.target.value)}
                    placeholder="Search city e.g. Hubli"
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                  <button type="submit" className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer hover:bg-emerald-700 transition">
                    Search
                  </button>
                </form>
              </div>

              {/* Weather statistics panel */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex flex-col justify-center items-center text-center">
                  <Sun className="w-6 h-6 text-amber-500 mb-1" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Condition</span>
                  <span className="text-sm font-extrabold">{weather.condition}</span>
                </div>
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex flex-col justify-center items-center text-center">
                  <Droplet className="w-6 h-6 text-blue-500 mb-1" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Humidity</span>
                  <span className="text-sm font-extrabold">{weather.humidity}%</span>
                </div>
                <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex flex-col justify-center items-center text-center">
                  <ThermometerIcon className="w-6 h-6 text-rose-500 mb-1" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Temperature</span>
                  <span className="text-sm font-extrabold">{weather.temperature}°C</span>
                </div>
                <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/10 flex flex-col justify-center items-center text-center">
                  <Wind className="w-6 h-6 text-teal-500 mb-1" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Wind Speed</span>
                  <span className="text-sm font-extrabold">{weather.windSpeed} km/h</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: History list */}
        {tab === 'history' && (
          <div className={`p-6 rounded-3xl border shadow-xl transition-colors ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-green-100'
          }`}>
            <div className="flex items-center justify-between border-b pb-4 mb-6 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-emerald-600" />
                <h2 className="text-lg font-black">{getTranslation(lang, 'historyTitle')}</h2>
              </div>
              
              {history.length > 0 && (
                <button 
                  onClick={clearRecommendationHistory}
                  className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-500/10 px-3 py-1.5 rounded-xl transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  {getTranslation(lang, 'clearHistory')}
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <HelpCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-semibold">{getTranslation(lang, 'noHistory')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {history.map((item, idx) => (
                  <div 
                    key={item.id || idx} 
                    className={`p-5 rounded-2xl border transition hover:shadow-md cursor-pointer ${
                      darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                    onClick={() => {
                      setResult(item);
                      setTab('form');
                    }}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{item.farmerName}</span>
                      <span className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Crop:</span>
                        <span className="font-bold">{item.cropType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Soil Type:</span>
                        <span className="font-bold">{item.soilType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Fertilizer:</span>
                        <span className="font-bold text-emerald-500">{item.suggestedFertilizer} ({item.quantityPerAc})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Suitability:</span>
                        <span className="font-bold text-blue-500">{item.suitabilityScore}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: AI chatbot assistance */}
        {tab === 'chatbot' && (
          <div className={`p-6 rounded-3xl border shadow-xl transition-colors h-[550px] flex flex-col ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-green-100'
          }`}>
            <div className="flex items-center justify-between border-b pb-4 mb-4 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-600 text-white rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black">{getTranslation(lang, 'chatbot')}</h2>
                  <p className="text-[10px] text-slate-400 font-bold">Ask about soils, inputs, dosage or watering</p>
                </div>
              </div>
            </div>

            {/* Chat Messages container */}
            <div className="flex-grow overflow-y-auto space-y-4 pr-2 scrollbar-thin">
              {chatMessages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl text-xs font-semibold leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-emerald-600 text-white rounded-br-none shadow-md' 
                      : darkMode ? 'bg-slate-800 text-slate-200 rounded-bl-none' : 'bg-slate-100 text-slate-700 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input message tray */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder={getTranslation(lang, 'chatPlaceholder')}
                className={`flex-grow px-4 py-3 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />

              {/* Speech Voice emulation button */}
              <button 
                onClick={startVoiceInput}
                className={`p-3 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                }`}
                title="Voice input"
              >
                <Mic className="w-4 h-4" />
              </button>

              <button 
                onClick={sendChatMessage}
                className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </main>

      <footer className="max-w-7xl mx-auto px-4 py-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs font-bold text-slate-400">
        <p>© 2026 Agri-Smart Fertilizer Recommendation System. All rights reserved.</p>
        <p className="mt-1 text-slate-500 text-[10px]">Built using React, Tailwind CSS v4, and Supabase Database.</p>
      </footer>
    </div>
  );
}

// Simple thermometer fallback icon to avoid import errors
function ThermometerIcon({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z" />
    </svg>
  );
}
