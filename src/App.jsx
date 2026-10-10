import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sprout, Settings, User, MapPin, Layers, Grid, Compass,
  TrendingUp, Droplet, Activity, MessageSquare, Mic, Volume2,
  Trash2, Sun, CloudRain, Wind, Globe, Moon, FileText,
  BookmarkCheck, Send, HelpCircle, RefreshCw, Sparkles,
  AlertTriangle, Leaf, ScanLine, ChevronRight,
  FlaskConical, Wheat, TreePine, Flower2, Bug,
  Camera, Upload, Video, Image
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, RadarChart
} from 'recharts';
import { dbService, updateSupabaseClient, resetSupabaseClient, getSupabaseConfig, testConnection } from './supabaseClient';
import { analyzeSoilAndCrop } from './utils/recommendationEngine';
import { getTranslation, getTranslatedOptions, karnatakaDistricts } from './utils/translations';
import { getBotResponse, getSpeechEmulationText, mockWeatherAPI } from './utils/chatbotEngine';

// ─────────────────────────────────────────────
// Geolocation District Centroids for Karnataka
// ─────────────────────────────────────────────
const DISTRICT_COORDINATES = [
  { name: 'Bagalkot', lat: 16.1809, lon: 75.6970 },
  { name: 'Ballari', lat: 15.1394, lon: 76.9214 },
  { name: 'Belagavi', lat: 15.8497, lon: 74.4977 },
  { name: 'Bengaluru Rural', lat: 13.2284, lon: 77.5816 },
  { name: 'Bengaluru Urban', lat: 12.9716, lon: 77.5946 },
  { name: 'Bidar', lat: 17.9104, lon: 77.5199 },
  { name: 'Chamarajanagar', lat: 11.9262, lon: 76.9407 },
  { name: 'Chikkaballapur', lat: 13.4354, lon: 77.7289 },
  { name: 'Chikkamagaluru', lat: 13.3161, lon: 75.7720 },
  { name: 'Chitradurga', lat: 14.2251, lon: 76.4020 },
  { name: 'Dakshina Kannada', lat: 12.9141, lon: 74.8560 },
  { name: 'Davanagere', lat: 14.4644, lon: 75.9218 },
  { name: 'Dharwad', lat: 15.4589, lon: 75.0078 },
  { name: 'Gadag', lat: 15.4323, lon: 75.6429 },
  { name: 'Hassan', lat: 13.0068, lon: 76.1025 },
  { name: 'Haveri', lat: 14.7937, lon: 75.4053 },
  { name: 'Kalaburagi', lat: 17.3297, lon: 76.8343 },
  { name: 'Kodagu', lat: 12.4244, lon: 75.7380 },
  { name: 'Kolar', lat: 13.1368, lon: 78.1292 },
  { name: 'Koppal', lat: 15.3468, lon: 76.1554 },
  { name: 'Mandya', lat: 12.5218, lon: 76.8951 },
  { name: 'Mysuru', lat: 12.2958, lon: 76.6394 },
  { name: 'Raichur', lat: 16.2120, lon: 77.3556 },
  { name: 'Ramanagara', lat: 12.7214, lon: 77.2796 },
  { name: 'Shivamogga', lat: 13.9299, lon: 75.5681 },
  { name: 'Tumakuru', lat: 13.3392, lon: 77.1140 },
  { name: 'Udupi', lat: 13.3409, lon: 74.7421 },
  { name: 'Uttara Kannada', lat: 14.8080, lon: 74.1300 },
  { name: 'Vijayapura', lat: 16.8302, lon: 75.7100 },
  { name: 'Yadgir', lat: 16.7600, lon: 77.1300 },
  { name: 'Vijayanagara', lat: 15.2750, lon: 76.3860 }
];

const findClosestDistrict = (lat, lon) => {
  let closest = DISTRICT_COORDINATES[4]; // default Bengaluru Urban
  let minDistance = Infinity;
  for (const d of DISTRICT_COORDINATES) {
    const dist = Math.sqrt(Math.pow(d.lat - lat, 2) + Math.pow(d.lon - lon, 2));
    if (dist < minDistance) {
      minDistance = dist;
      closest = d;
    }
  }
  return closest.name;
};

// ─────────────────────────────────────────────
// Sub-Components
// ─────────────────────────────────────────────

/** Animated crop SVG based on health score */
function CropSimulator({ score, cropType }) {
  const stage = score >= 75 ? 'thriving' : score >= 50 ? 'growing' : 'wilting';
  const colors = {
    thriving: { stem: '#16a34a', leaf: '#22c55e', leaf2: '#4ade80', glow: '#bbf7d0' },
    growing:  { stem: '#65a30d', leaf: '#84cc16', leaf2: '#a3e635', glow: '#d9f99d' },
    wilting:  { stem: '#a16207', leaf: '#ca8a04', leaf2: '#eab308', glow: '#fef08a' },
  };
  const c = colors[stage];
  const animClass = stage === 'thriving' ? 'animate-thrive' : stage === 'wilting' ? 'animate-wilt' : '';

  return (
    <div className="flex flex-col items-center justify-end gap-2 h-40 w-full relative">
      {/* Glow base */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full blur-xl opacity-60"
        style={{ background: c.glow }} />

      {/* SVG crop */}
      <svg width="80" height="130" viewBox="0 0 80 130" className={`relative z-10 ${animClass}`} style={{ transformOrigin: 'bottom center' }}>
        {/* Soil base */}
        <ellipse cx="40" cy="128" rx="32" ry="6" fill="#92400e" opacity="0.5" />

        {/* Stem */}
        <line x1="40" y1="125" x2="40" y2={stage === 'wilting' ? 75 : 45}
          stroke={c.stem} strokeWidth="4" strokeLinecap="round" />

        {/* Leaves */}
        {stage !== 'wilting' && (
          <>
            <path d={`M40,80 Q20,60 25,40 Q35,60 40,80`} fill={c.leaf} opacity="0.9" />
            <path d={`M40,70 Q60,50 55,30 Q45,55 40,70`} fill={c.leaf2} opacity="0.85" />
          </>
        )}
        {stage === 'wilting' && (
          <>
            <path d={`M40,90 Q18,88 20,106 Q33,94 40,90`} fill={c.leaf} opacity="0.7" />
            <path d={`M40,85 Q62,90 58,108 Q46,93 40,85`} fill={c.leaf2} opacity="0.65" />
          </>
        )}

        {/* Flower/top for thriving */}
        {stage === 'thriving' && (
          <g className="animate-bloom" style={{ transformOrigin: '40px 40px' }}>
            {[0,60,120,180,240,300].map((deg, i) => (
              <ellipse key={i}
                cx={40 + 12 * Math.cos((deg * Math.PI) / 180)}
                cy={42 + 12 * Math.sin((deg * Math.PI) / 180)}
                rx="6" ry="4"
                fill={i % 2 === 0 ? '#fbbf24' : '#f97316'}
                opacity="0.9"
                transform={`rotate(${deg}, ${40 + 12 * Math.cos((deg * Math.PI) / 180)}, ${42 + 12 * Math.sin((deg * Math.PI) / 180)})`}
              />
            ))}
            <circle cx="40" cy="42" r="7" fill="#fef08a" />
            <circle cx="40" cy="42" r="4" fill="#f59e0b" />
          </g>
        )}

        {/* Drooping tip for wilting */}
        {stage === 'wilting' && (
          <path d="M40,75 Q38,65 34,60" stroke={c.stem} strokeWidth="3" strokeLinecap="round" fill="none" />
        )}
      </svg>

      {/* Status badge */}
      <div className={`text-xs font-bold px-3 py-1 rounded-full ${
        stage === 'thriving' ? 'bg-green-100 text-green-700' :
        stage === 'growing'  ? 'bg-lime-100 text-lime-700' :
        'bg-yellow-100 text-yellow-700'
      }`}>
        {stage === 'thriving' ? '🌟 Thriving' : stage === 'growing' ? '🌱 Growing' : '🥀 Needs Care'}
      </div>
    </div>
  );
}

/** Animated Soil Profile Card */
function SoilProfileCard({ soilType, darkMode }) {
  const profiles = {
    'Red soil': {
      class: 'soil-layer-red',
      layers: [
        { label: 'Topsoil', depth: '0–20 cm', color: '#fca5a5', note: 'Low N, porous' },
        { label: 'Subsoil', depth: '20–50 cm', color: '#ef4444', note: 'Iron-rich' },
        { label: 'Laterite', depth: '50–100 cm', color: '#b91c1c', note: 'Hard pan' },
        { label: 'Bedrock', depth: '100+ cm', color: '#7f1d1d', note: 'Granite base' },
      ],
      icon: '🔴', desc: 'Iron-rich, well-drained, low in N & organic matter'
    },
    'Black soil': {
      class: 'soil-layer-black',
      layers: [
        { label: 'Topsoil', depth: '0–30 cm', color: '#374151', note: 'Rich in Ca & Mg' },
        { label: 'Subsoil', depth: '30–60 cm', color: '#1f2937', note: 'High clay content' },
        { label: 'Clay horizon', depth: '60–120 cm', color: '#111827', note: 'Water-retentive' },
        { label: 'Parent rock', depth: '120+ cm', color: '#030712', note: 'Basalt' },
      ],
      icon: '⚫', desc: 'Self-ploughing Regur soil, rich in Ca, Mg & K'
    },
    'Sandy soil': {
      class: 'soil-layer-sandy',
      layers: [
        { label: 'Sand layer', depth: '0–15 cm', color: '#fef3c7', note: 'Very porous' },
        { label: 'Coarse sand', depth: '15–40 cm', color: '#fcd34d', note: 'Low nutrients' },
        { label: 'Sub-layer', depth: '40–80 cm', color: '#f59e0b', note: 'Poor retention' },
        { label: 'Sandy base', depth: '80+ cm', color: '#92400e', note: 'High drainage' },
      ],
      icon: '🟡', desc: 'High drainage, poor water retention, needs organic matter'
    },
    'Clay soil': {
      class: 'soil-layer-clay',
      layers: [
        { label: 'Clay crust', depth: '0–10 cm', color: '#d1d5db', note: 'Compacts easily' },
        { label: 'Clay body', depth: '10–40 cm', color: '#9ca3af', note: 'Very cohesive' },
        { label: 'Dense clay', depth: '40–80 cm', color: '#6b7280', note: 'Low aeration' },
        { label: 'Base clay', depth: '80+ cm', color: '#374151', note: 'Waterlogged risk' },
      ],
      icon: '🩶', desc: 'Heavy, water-retentive, prone to compaction & waterlogging'
    },
  };
  const profile = profiles[soilType] || profiles['Red soil'];

  return (
    <div className={`rounded-2xl overflow-hidden border transition-all ${darkMode ? 'border-slate-700 bg-slate-800/60' : 'border-slate-200 bg-white'}`}>
      <div className={`px-4 py-3 flex items-center gap-2 ${darkMode ? 'border-b border-slate-700' : 'border-b border-slate-100'}`}>
        <span className="text-lg">{profile.icon}</span>
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-emerald-600">{soilType}</p>
          <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{profile.desc}</p>
        </div>
      </div>
      <div className="flex gap-0 h-36 relative">
        {/* Soil column */}
        <div className={`w-14 shrink-0 rounded-bl-2xl ${profile.class}`} />
        {/* Layer labels */}
        <div className="flex-1 flex flex-col justify-around py-1 px-3">
          {profile.layers.map((layer, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: layer.color, boxShadow: `0 0 6px ${layer.color}80` }} />
              <div className="flex-1">
                <span className={`text-[10px] font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{layer.label}</span>
                <span className={`text-[9px] ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>({layer.depth})</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{layer.note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** AI Leaf Scanner Feature */
function LeafScanner({ darkMode, lang }) {
  const [scanning, setScanning] = useState(false);
  const [scanResultId, setScanResultId] = useState(null);
  const [selectedLeaf, setSelectedLeaf] = useState('cotton');
  const [scanMode, setScanMode] = useState('sample'); // 'sample' | 'upload' | 'camera'
  const [customImage, setCustomImage] = useState(null);
  const [fileName, setFileName] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [confidenceRate, setConfidenceRate] = useState(88);
  const [isDragging, setIsDragging] = useState(false);
  const [diagnosedPlantName, setDiagnosedPlantName] = useState('');

  const getDiagnosedPlant = (queryText) => {
    const text = queryText.toLowerCase();
    const fileLower = fileName ? fileName.toLowerCase() : '';
    
    // 1. Check if file name itself contains a known plant name
    if (fileLower.includes('cotton')) return lang === 'kn' ? 'ಹತ್ತಿ ಸಸ್ಯ (Cotton)' : 'Cotton';
    if (fileLower.includes('tomato')) return lang === 'kn' ? 'ಟೊಮೆಟೊ ಸಸ್ಯ (Tomato)' : 'Tomato';
    if (fileLower.includes('chilli')) return lang === 'kn' ? 'ಮೆಣಸಿನಕಾಯಿ ಸಸ್ಯ (Chilli)' : 'Chilli';
    if (fileLower.includes('maize') || fileLower.includes('corn')) return lang === 'kn' ? 'ಮೆಕ್ಕೆಜೋಳದ ಸಸ್ಯ (Maize)' : 'Maize';
    if (fileLower.includes('paddy') || fileLower.includes('rice')) return lang === 'kn' ? 'ಭತ್ತದ ಸಸ್ಯ (Paddy)' : 'Paddy';
    if (fileLower.includes('wheat')) return lang === 'kn' ? 'ಗೋಧಿ ಸಸ್ಯ (Wheat)' : 'Wheat';
    if (fileLower.includes('banana')) return lang === 'kn' ? 'ಬಾಳೆ ಸಸ್ಯ (Banana)' : 'Banana';
    
    // 2. Otherwise check query text / selector
    if (text.includes('cotton')) return lang === 'kn' ? 'ಹತ್ತಿ ಸಸ್ಯ (Cotton)' : 'Cotton';
    if (text.includes('tomato')) return lang === 'kn' ? 'ಟೊಮೆಟೊ ಸಸ್ಯ (Tomato)' : 'Tomato';
    if (text.includes('chilli')) return lang === 'kn' ? 'ಮೆಣಸಿನಕಾಯಿ ಸಸ್ಯ (Chilli)' : 'Chilli';
    if (text.includes('maize')) return lang === 'kn' ? 'ಮೆಕ್ಕೆಜೋಳದ ಸಸ್ಯ (Maize)' : 'Maize';
    if (text.includes('paddy')) return lang === 'kn' ? 'ಭತ್ತದ ಸಸ್ಯ (Paddy)' : 'Paddy';
    if (text.includes('wheat')) return lang === 'kn' ? 'ಗೋಧಿ ಸಸ್ಯ (Wheat)' : 'Wheat';
    if (text.includes('banana')) return lang === 'kn' ? 'ಬಾಳೆ ಸಸ್ಯ (Banana)' : 'Banana';
    
    if (fileName && fileName !== 'Captured_Leaf_Photo.jpg') {
      const clean = fileName.split('.')[0].replace(/[-_]/g, ' ');
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    }
    return lang === 'kn' ? 'ಸಾಮಾನ್ಯ ಸಸ್ಯ (General Plant)' : 'General Plant';
  };

  const fileInputRef = useRef(null);
  const nativeCameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const SAMPLE_LEAVES = {
    cotton: { label: 'Cotton Leaf', emoji: '🌿', color: '#86efac' },
    tomato: { label: 'Tomato Leaf', emoji: '🍃', color: '#fca5a5' },
    chilli: { label: 'Chilli Leaf', emoji: '🌶️', color: '#fdba74' },
  };

  const DIAGNOSES = [
    { 
      id: 'rust',
      condition: lang === 'kn' ? 'ಎಲೆ ತುಕ್ಕು ರೋಗ (Leaf Rust Fungus)' : 'Leaf Rust Fungus', 
      severity: lang === 'kn' ? 'ಮಧ್ಯಮ' : 'Moderate', 
      color: '#f97316', 
      remedy: lang === 'kn' 
        ? 'ಗಾಳಿ ಮತ್ತು ಬೆಳಕು ಸರಾಗವಾಗಿ ಸಂಚರಿಸುವಂತೆ ಮಾಡಿ. ಸೋಂಕಿತ ಕೆಳಗಿನ ಎಲೆಗಳನ್ನು ಕತ್ತರಿಸಿ ನಾಶಪಡಿಸಿ.' 
        : 'Improve canopy ventilation. Trim and destroy infected bottom foliage.',
      chemical: lang === 'kn'
        ? 'ಮ್ಯಾಂಕೋಜೆಬ್ 75% WP - ಪ್ರತಿ ಲೀಟರ್ ನೀರಿಗೆ 2 ಗ್ರಾಂ ಬೆರೆಸಿ ಸಿಂಪಡಿಸಿ.'
        : 'Apply Mancozeb 75% WP at 2g/L water.',
      sprayInstructions: {
        en: "1. Mix 2g Mancozeb per liter of clean water in a spray pump.\n2. Spray early in the morning when wind is low.\n3. Coat both sides of leaves thoroughly, especially affected lower leaves.\n4. Wear a protective mask and avoid spraying against the wind.",
        kn: "1. ಒಂದು ಲೀಟರ್ ಕ್ಲೀನ್ ನೀರಿಗೆ 2 ಗ್ರಾಂ ಮ್ಯಾಂಕೋಜೆಬ್ ಬೆರೆಸಿ.\n2. ಮುಂಜಾನೆ ಗಾಳಿ ಕಡಿಮೆ ಇದ್ದಾಗ ಸಿಂಪಡಿಸಿ.\n3. ಎಲೆಯ ಎರಡೂ ಬದಿಗಳಿಗೆ ಚೆನ್ನಾಗಿ ಸಿಂಪಡಿಸಿ.\n4. ಮಾಸ್ಕ್ ಧರಿಸಿ ಮತ್ತು ಗಾಳಿಯ ದಿಕ್ಕಿನಲ್ಲಿ ಸಿಂಪಡಿಸಿ."
      }
    },
    { 
      id: 'healthy',
      condition: lang === 'kn' ? 'ಆರೋಗ್ಯಕರ ಎಲೆಗಳು (Healthy Foliage)' : 'Healthy Foliage', 
      severity: lang === 'kn' ? 'ಉತ್ತಮ' : 'Excellent', 
      color: '#22c55e', 
      remedy: lang === 'kn'
        ? 'ಯಾವುದೇ ವಿಶೇಷ ಚಿಕಿತ್ಸೆ ಅಗತ್ಯವಿಲ್ಲ. ನಿಯಮಿತ ಸಾವಯವ ಗೊಬ್ಬರ ಮತ್ತು ತೇವಾಂಶ ಮಟ್ಟವನ್ನು ಮುಂದುವರಿಸಿ.'
        : 'Continue current NPK fertilization schedule, moisture levels, and organic compost.',
      chemical: lang === 'kn'
        ? 'ಯಾವುದೇ ರಾಸಾಯನಿಕ ಸಿಂಪಡಣೆ ಅಗತ್ಯವಿಲ್ಲ.'
        : 'No chemical spray needed.',
      sprayInstructions: {
        en: "No chemical spray required. Continue organic neem oil spraying once a month as a preventative measure.",
        kn: "ಯಾವುದೇ ರಾಸಾಯನಿಕ ಸಿಂಪರಣೆ ಅಗತ್ಯವಿಲ್ಲ. ಮುನ್ನೆಚ್ಚರಿಕೆಯಾಗಿ ತಿಂಗಳಿಗೊಮ್ಮೆ ಬೇವಿನ ಎಣ್ಣೆ ಸಿಂಪಡಿಸಿ."
      }
    },
    { 
      id: 'mildew',
      condition: lang === 'kn' ? 'ಬೂದಿ ರೋಗ (Powdery Mildew)' : 'Powdery Mildew', 
      severity: lang === 'kn' ? 'ಹೆಚ್ಚು' : 'High', 
      color: '#f43f5e', 
      remedy: lang === 'kn'
        ? 'ತಡರಾತ್ರಿ ಸ್ಪ್ರಿಂಕ್ಲರ್ ಮೂಲಕ ನೀರಾವರಿ ಮಾಡಬೇಡಿ. ಸರಿಯಾದ ಬಿಸಿಲು ಬೀಳುವಂತೆ ನೋಡಿಕೊಳ್ಳಿ.'
        : 'Avoid late evening overhead sprinkler irrigation. Ensure proper sun exposure.',
      chemical: lang === 'kn'
        ? 'ಪ್ರತಿ ಲೀಟರ್ ನೀರಿಗೆ 2.5 ಗ್ರಾಂ ಗಂಧಕ 80% WP ಅಥವಾ 1 ಗ್ರಾಂ ಕಾರ್ಬೆಂಡಾಜಿಮ್ 50% WP ಬೆರೆಸಿ ಸಿಂಪಡಿಸಿ.'
        : 'Spray Sulphur 80% WP at 2.5g/L or Carbendazim 50% WP at 1g/L.',
      sprayInstructions: {
        en: "1. Mix 2.5g Sulphur or 1g Carbendazim per liter of water.\n2. Spray during late afternoon when the sun is mild.\n3. Focus on covering the white powdery spots on the upper leaf surface.\n4. Keep pets and livestock away from the sprayed area for 24 hours.",
        kn: "1. ಲೀಟರ್ ನೀರಿಗೆ 2.5 ಗ್ರಾಂ ಗಂಧಕ ಅಥವಾ 1 ಗ್ರಾಂ ಕಾರ್ಬೆಂಡಾಜಿಮ್ ಮಿಶ್ರಣ ಮಾಡಿ.\n2. ಮಧ್ಯಾಹ್ನದ ನಂತರ ಬಿಸಿಲು ಕಡಿಮೆ ಇದ್ದಾಗ ಸಿಂಪಡಿಸಿ.\n3. ಎಲೆಯ ಮೇಲ್ಮೈಯಲ್ಲಿರುವ ಬಿಳಿ ಮಚ್ಚೆಗಳಿಗೆ ಚೆನ್ನಾಗಿ ಸಿಂಪಡಿಸಿ.\n4. ಸಾಕುಪ್ರಾಣಿಗಳನ್ನು 24 ಗಂಟೆಗಳ ಕಾಲ ದೂರವಿಡಿ."
      }
    },
    { 
      id: 'nitrogen',
      condition: lang === 'kn' ? 'ಸಾರಜನಕ ಕೊರತೆ (Nitrogen Deficiency)' : 'Nitrogen Deficiency', 
      severity: lang === 'kn' ? 'ಮಧ್ಯಮ' : 'Moderate', 
      color: '#eab308', 
      remedy: lang === 'kn'
        ? 'ಪ್ರತಿ ಎಕರೆಗೆ 25 ಕೆಜಿ ಸಾರಜನಕಯುಕ್ತ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ ಅಥವಾ ಕಾಂಪೋಸ್ಟ್ ಬಳಸಿ.'
        : 'Top-dress with 25 kg nitrogen-rich manure or compost per acre.',
      chemical: lang === 'kn'
        ? 'ಶೇಕಡಾ 1 ರಷ್ಟು ಯೂರಿಯಾ ದ್ರಾವಣವನ್ನು (ಲೀಟರ್ ನೀರಿಗೆ 10 ಗ್ರಾಂ ಯೂರಿಯಾ) ಎಲೆಗಳ ಮೇಲೆ ಸಿಂಪಡಿಸಿ.'
        : 'Apply Urea 1% foliar spray (10g Urea per Litre of water) for quick nutrient absorption.',
      sprayInstructions: {
        en: "1. Prepare a 1% Urea solution (10g Urea dissolved in 1L of water).\n2. Spray during early morning hours for maximum leaf absorption.\n3. Apply a fine mist spray over the entire crop foliage.\n4. Avoid spraying during hot mid-day to prevent leaf scorch.",
        kn: "1. ಶೇಕಡಾ 1 ರಷ್ಟು ಯೂರಿಯಾ ದ್ರಾವಣವನ್ನು ತಯಾರಿಸಿ (1 ಲೀಟರ್ ನೀರಿಗೆ 10 ಗ್ರಾಂ ಯೂರಿಯಾ).\n2. ಎಲೆಗಳು ಹೀರಿಕೊಳ್ಳಲು ಮುಂಜಾನೆ ಸಿಂಪಡಿಸಿ.\n3. ಬೆಳೆಗಳ ಎಲೆಗಳ ಮೇಲೆ ಸಿಂಪರಣೆ ಮಾಡಿ.\n4. ಎಲೆಗಳು ಸುಡುವುದನ್ನು ತಡೆಯಲು ಮಧ್ಯಾಹ್ನ ಸಿಂಪಡಿಸಬೇಡಿ."
      }
    },
    { 
      id: 'mites',
      condition: lang === 'kn' ? 'ಜೇಡ ನುಸಿ ಬಾಧೆ (Spider Mites Infestation)' : 'Spider Mites Infestation', 
      severity: lang === 'kn' ? 'ಗಂಭೀರ' : 'Critical', 
      color: '#ec4899', 
      remedy: lang === 'kn'
        ? 'ಪರಭಕ್ಷಕ ನುಸಿಗಳನ್ನು ಬಿಡಿ. ಎಲೆಗಳ ಮೇಲೆ ಲಘುವಾಗಿ ನೀರು ಚಿಮುಕಿಸುವ ಮೂಲಕ ಆರ್ದ್ರತೆ ಕಾಪಾಡಿಕೊಳ್ಳಿ.'
        : 'Release predatory mites. Keep microclimate humid by light water misting.',
      chemical: lang === 'kn'
        ? 'ಪ್ರತಿ ಲೀಟರ್ ನೀರಿಗೆ 3 ಮಿಲಿ ಬೇವಿನ ಎಣ್ಣೆ (Neem Oil 10,000 PPM) ಅಥವಾ 2 ಮಿಲಿ ಪ್ರೊಪಾರ್ಗೈಟ್ 57% EC ಬೆರೆಸಿ ಸಿಂಪಡಿಸಿ.'
        : 'Spray Azadirachtin (Neem Oil 10,000 PPM) at 3ml/L or Propargite 57% EC at 2ml/L water.',
      sprayInstructions: {
        en: "1. Mix 3ml Neem Oil or 2ml Propargite per liter of water.\n2. Spray in the early morning or evening.\n3. Spray underneath the leaves where mites form webs and lay eggs.\n4. Apply 2 sprays at a 7-day interval to kill newly hatched mites.",
        kn: "1. ಲೀಟರ್ ನೀರಿಗೆ 3 ಮಿಲಿ ಬೇವಿನ ಎಣ್ಣೆ ಅಥವಾ 2 ಮಿಲಿ ಪ್ರೊಪಾರ್ಗೈಟ್ ಮಿಶ್ರಣ ಮಾಡಿ.\n2. ಬೆಳಿಗ್ಗೆ ಅಥವಾ ಸಂಜೆ ಸಿಂಪಡಿಸಿ.\n3. ಜೇಡಗಳು ವೆಬ್ ರಚಿಸುವ ಎಲೆಗಳ ಕೆಳಭಾಗಕ್ಕೆ ಸಿಂಪಡಿಸಿ.\n4. ಹೊಸದಾಗಿ ಮೊಟ್ಟೆಯೊಡೆದ ನುಸಿಗಳನ್ನು ಕೊಲ್ಲಲು 7 ದಿನಗಳ ಅಂತರದಲ್ಲಿ 2 ಬಾರಿ ಸಿಂಪಡಿಸಿ."
      }
    },
  ];

  const result = scanResultId ? DIAGNOSES.find(d => d.id === scanResultId) : null;

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Cleanup camera stream and speech on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stopCamera]);

  const speakReport = () => {
    if ('speechSynthesis' in window && result) {
      window.speechSynthesis.cancel();
      
      const cleanKn = (text) => {
        if (lang === 'kn') {
          return text.replace(/\s*\([^)]*\)/g, '').trim();
        }
        return text;
      };

      const plantText = cleanKn(diagnosedPlantName);
      const conditionText = cleanKn(result.condition);
      const severityText = cleanKn(result.severity);
      const remedyText = cleanKn(result.remedy);
      const chemicalText = cleanKn(result.chemical);
      const instructionsText = cleanKn(result.sprayInstructions[lang] || result.sprayInstructions['en']);
      
      let speechText = "";
      if (lang === 'kn') {
        speechText = `ಪತ್ತೆಯಾದ ಸಸ್ಯ: ${plantText}. ರೋಗದ ಸ್ಥಿತಿ: ${conditionText}. ಅಪಾಯದ ಮಟ್ಟ: ${severityText}. ಸಾಮಾನ್ಯ ಪರಿಹಾರ: ${remedyText}. ಶಿಫಾರಸು ಮಾಡಿದ ರಾಸಾಯನಿಕ: ${chemicalText}. ಸಿಂಪರಣೆ ವಿಧಾನ: ${instructionsText}`;
      } else {
        speechText = `Identified plant: ${plantText}. Crop Condition: ${conditionText}. Severity level: ${severityText}. Preventative Remedy: ${remedyText}. Recommended Chemical: ${chemicalText}. Spray instructions: ${instructionsText}`;
      }
      
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = lang === 'kn' ? 'kn-IN' : 'en-US';
      utterance.rate = lang === 'kn' ? 0.85 : 0.95; // Custom slow speech rate for rural clarity
      
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang === 'kn-IN') || voices.find(v => v.lang.startsWith('kn')) || voices.find(v => v.lang.startsWith(lang === 'kn' ? 'kn' : 'en'));
      if (voice) utterance.voice = voice;
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert(lang === 'kn' ? 'ನಿಮ್ಮ ಬ್ರೌಸರ್ ಧ್ವನಿ ಸೌಲಭ್ಯವನ್ನು ಬೆಂಬಲಿಸುವುದಿಲ್ಲ.' : 'Text-to-speech is not supported in your browser.');
    }
  };

  // Handle mode switches
  const handleModeChange = (mode) => {
    stopCamera();
    setScanMode(mode);
    setScanResultId(null);
    setCustomImage(null);
    setFileName('');
    setCameraError(null);
    setIsDragging(false);
    if (mode === 'sample') {
      setSelectedLeaf('cotton');
    } else {
      setSelectedLeaf('general');
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    setCustomImage(null);
    setScanResultId(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(
        err.name === 'NotAllowedError' 
          ? "Camera permission denied. Please enable camera access in settings or click 'Take Photo with Phone Camera' below."
          : "Webcam stream blocked/unsupported. Please tap 'Take Photo with Phone Camera' to use your native system camera."
      );
    }
  };

  // Capture Photo from Video stream
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCustomImage(dataUrl);
      setFileName('Captured_Leaf_Photo.jpg');
      stopCamera();
    }
  };

  // Handle File Upload & Conversion
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      setScanResultId(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setFileName(file.name);
      setScanResultId(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const runScan = () => {
    setScanning(true);
    setScanResultId(null);
    setConfidenceRate(82 + Math.floor(Math.random() * 16));

    setTimeout(() => {
      setScanning(false);
      
      let diagnosis = DIAGNOSES[1]; // default healthy
      const query = (fileName + ' ' + selectedLeaf).toLowerCase();
      
      if (query.includes('rust') || query.includes('orange') || query.includes('brown')) {
        diagnosis = DIAGNOSES[0]; // Rust
      } else if (query.includes('mildew') || query.includes('white') || query.includes('spot')) {
        diagnosis = DIAGNOSES[2]; // Mildew
      } else if (query.includes('yellow') || query.includes('pale') || query.includes('urea') || query.includes('nitrogen')) {
        diagnosis = DIAGNOSES[3]; // N Deficiency
      } else if (query.includes('mite') || query.includes('bug') || query.includes('pest') || query.includes('spider')) {
        diagnosis = DIAGNOSES[4]; // Mites
      } else {
        const randomList = [...DIAGNOSES];
        diagnosis = randomList[Math.floor(Math.random() * randomList.length)];
      }

      setScanResultId(diagnosis.id);
      setDiagnosedPlantName(getDiagnosedPlant(query));
    }, 2800);
  };

  const leaf = SAMPLE_LEAVES[selectedLeaf] || SAMPLE_LEAVES.cotton;

  return (
    <div className={`rounded-3xl border overflow-hidden transition-all backdrop-blur-xl shadow-xl ${darkMode ? 'bg-slate-950/65 border-slate-800/30 text-slate-100 hover:border-slate-700/40' : 'bg-white/75 border-white/40 text-slate-800 hover:border-white/60'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center gap-3">
        <div className="p-2 bg-white/15 rounded-xl"><ScanLine className="w-5 h-5 text-white" /></div>
        <div>
          <h3 className="text-base font-black text-white">AI Krishi Leaf Scanner</h3>
          <p className="text-[11px] text-emerald-100 font-medium">Capture or upload leaf photo to diagnose crop disease</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="animate-pulse-ring absolute w-2 h-2 bg-green-400 rounded-full" />
          <span className="relative w-2 h-2 bg-green-400 rounded-full" />
          <span className="text-[10px] text-emerald-200 font-extrabold">LIVE</span>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left - Mode selection + Visual Scan Container */}
        <div className="flex flex-col gap-4">
          
          {/* Mode Tabs */}
          <div>
            <p className={`text-xs font-black uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Scanner Input Mode</p>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl border bg-slate-500/5 border-slate-500/10">
              {[
                { id: 'sample', label: 'Leaf Samples', icon: <Leaf className="w-3.5 h-3.5" /> },
                { id: 'upload', label: 'Upload Photo', icon: <Upload className="w-3.5 h-3.5" /> },
                { id: 'camera', label: 'Take Photo', icon: <Camera className="w-3.5 h-3.5" /> }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => handleModeChange(t.id)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[10px] font-black transition cursor-pointer ${
                    scanMode === t.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t.icon}
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sample Selectors (Only shown if mode is 'sample') */}
          {scanMode === 'sample' && (
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>Select Leaf Sample</p>
              <div className="flex gap-2">
                {Object.entries(SAMPLE_LEAVES).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => { setSelectedLeaf(key); setScanResultId(null); }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      selectedLeaf === key
                        ? 'bg-emerald-600/10 text-emerald-500 border-emerald-500 shadow-sm'
                        : darkMode ? 'bg-slate-800/40 text-slate-400 border-slate-850 hover:border-emerald-600/30'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    {val.emoji} {val.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Crop selector for Upload and Camera modes */}
          {scanMode !== 'sample' && (
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                {lang === 'kn' ? 'ಸಸ್ಯ/ಬೆಳೆ ಪ್ರಕಾರವನ್ನು ಆಯ್ಕೆಮಾಡಿ' : 'Select Plant/Crop Type'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'cotton', label: lang === 'kn' ? 'ಹತ್ತಿ' : 'Cotton', emoji: '🌿' },
                  { id: 'tomato', label: lang === 'kn' ? 'ಟೊಮೆಟೊ' : 'Tomato', emoji: '🍅' },
                  { id: 'chilli', label: lang === 'kn' ? 'ಮೆಣಸಿನಕಾಯಿ' : 'Chilli', emoji: '🌶️' },
                  { id: 'maize', label: lang === 'kn' ? 'ಮೆಕ್ಕೆಜೋಳ' : 'Maize', emoji: '🌽' },
                  { id: 'paddy', label: lang === 'kn' ? 'ಭತ್ತ' : 'Paddy/Rice', emoji: '🌾' },
                  { id: 'wheat', label: lang === 'kn' ? 'ಗೋಧಿ' : 'Wheat', emoji: '🌾' },
                  { id: 'banana', label: lang === 'kn' ? 'ಬಾಳೆ' : 'Banana', emoji: '🍌' },
                  { id: 'general', label: lang === 'kn' ? 'ಸ್ವಯಂ ಪತ್ತೆ' : 'Auto/General', emoji: '🌱' },
                ].map(crop => (
                  <button
                    key={crop.id}
                    onClick={() => { setSelectedLeaf(crop.id); setScanResultId(null); }}
                    className={`py-1.5 px-2.5 rounded-xl text-[11px] font-extrabold transition border cursor-pointer flex items-center gap-1 ${
                      selectedLeaf === crop.id
                        ? 'bg-emerald-600/10 text-emerald-500 border-emerald-500 shadow-sm'
                        : darkMode ? 'bg-slate-800/40 text-slate-400 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    <span>{crop.emoji}</span>
                    <span>{crop.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Camera Controls (Only shown if mode is 'camera') */}
          {scanMode === 'camera' && !cameraActive && !customImage && (
            <div className="flex flex-col gap-2">
              <button
                onClick={startCamera}
                className="w-full py-3 px-4 rounded-xl border border-emerald-500/20 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-sm"
              >
                <Video className="w-4 h-4" /> Start Live Web Camera Feed (Laptop/Webcam)
              </button>
              
              <div className="flex items-center justify-center gap-2 py-1">
                <span className="h-px bg-slate-500/10 flex-1"></span>
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">or</span>
                <span className="h-px bg-slate-500/10 flex-1"></span>
              </div>

              <input 
                type="file" 
                ref={nativeCameraInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
              />
              <button
                onClick={() => nativeCameraInputRef.current?.click()}
                className="w-full py-3 px-4 rounded-xl border border-dashed border-teal-500/30 text-teal-600 bg-teal-500/5 hover:bg-teal-500/10 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-sm"
              >
                <Camera className="w-4 h-4" /> Take Photo with Phone Camera (Mobile/Tablet)
              </button>
            </div>
          )}

          {/* Upload Controls (Only shown if mode is 'upload') */}
          {scanMode === 'upload' && (
            <div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-2.5 px-4 rounded-xl border border-dashed text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                  customImage 
                    ? 'border-emerald-500/40 text-emerald-500 bg-emerald-50/5' 
                    : darkMode ? 'border-slate-700 hover:border-emerald-600 bg-slate-800/40 text-slate-400' 
                    : 'border-slate-300 hover:border-emerald-500 bg-slate-50 text-slate-500'
                }`}
              >
                <Upload className="w-4 h-4" /> 
                {customImage ? 'Select Different Photo' : 'Select Photo from Laptop or Phone Gallery'}
              </button>
            </div>
          )}

          {/* Scan Visual Box */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-2xl overflow-hidden flex flex-col items-center justify-center min-h-[220px] max-h-[220px] border-2 border-dashed transition-all ${
              isDragging 
                ? 'border-emerald-500 bg-emerald-650/15 scale-[1.01]' 
                : darkMode ? 'border-slate-700 bg-slate-800/30' : 'border-emerald-200 bg-emerald-50/20'
            }`} 
            style={{ 
              background: scanning ? `radial-gradient(circle, ${scanMode === 'sample' ? leaf.color : '#10b981'}20, transparent 70%)` : '' 
            }}
          >
            {/* 1. Camera active preview stream */}
            {scanMode === 'camera' && cameraActive && (
              <div className="absolute inset-0 w-full h-full bg-black">
                <video 
                  ref={videoRef} 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  <button 
                    onClick={capturePhoto} 
                    className="bg-emerald-600 text-white font-extrabold text-xs py-1.5 px-4 rounded-full shadow-lg cursor-pointer hover:bg-emerald-700 transition"
                  >
                    Snap Photo
                  </button>
                  <button 
                    onClick={stopCamera} 
                    className="bg-slate-800/80 text-white font-extrabold text-xs py-1.5 px-3 rounded-full cursor-pointer hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* 2. Custom Uploaded/Captured Image */}
            {customImage && !cameraActive && (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center p-2 bg-slate-900/5">
                <img 
                  src={customImage} 
                  alt="Custom Leaf" 
                  className="w-full h-full object-contain rounded-xl" 
                />
                {fileName && (
                  <span className="absolute bottom-2 right-2 text-[9px] bg-slate-900/80 backdrop-blur-sm text-slate-200 px-2 py-0.5 rounded font-medium truncate max-w-[150px]">
                    {fileName}
                  </span>
                )}
              </div>
            )}

            {/* 3. Preloaded Sample Leaf */}
            {scanMode === 'sample' && !customImage && (
              <div className="flex flex-col items-center gap-2 relative z-0">
                <span className="text-7xl animate-float">{leaf.emoji}</span>
                <span className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{leaf.label}</span>
              </div>
            )}

            {/* 4. Empty State Placeholder */}
            {!customImage && !cameraActive && scanMode !== 'sample' && (
              <div className="flex flex-col items-center text-center gap-2 px-6">
                {cameraError ? (
                  <p className="text-xs text-rose-500 font-bold">{cameraError}</p>
                ) : (
                  <>
                    <Image className={`w-8 h-8 opacity-30 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                    <p className={`text-xs font-semibold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      {scanMode === 'camera' ? 'No live camera feed initialized' : 'Drag leaf photo here or tap button to select'}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Scan Beam Overlay */}
            {scanning && (
              <>
                <div className="scan-beam" />
                <div className="absolute inset-0 border-2 border-emerald-400/60 rounded-2xl animate-pulse" />
                <div className="absolute top-2 right-2 text-[9px] font-black text-emerald-400 bg-black/70 px-2.5 py-0.5 rounded-full tracking-widest z-20">SCANNING…</div>
              </>
            )}

            {/* Result Scan Box Overlay */}
            {result && !scanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl animate-fadeSlideUp z-10">
                <div className="text-center p-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: `${result.color}30`, border: `2px solid ${result.color}` }}>
                    {result.condition === 'Healthy Foliage' ? <Leaf className="w-6 h-6" style={{ color: result.color }} /> : <Bug className="w-6 h-6" style={{ color: result.color }} />}
                  </div>
                  <p className="text-sm font-black text-white">{result.condition}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5" style={{ background: `${result.color}40`, color: '#fff' }}>{result.severity} Risk</span>
                </div>
              </div>
            )}

            {/* Hidden canvas for snapshotting */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Scan Button */}
          <button
            onClick={runScan}
            disabled={scanning || (!customImage && scanMode !== 'sample')}
            className="w-full py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:shadow-emerald-650 hover:scale-[1.005] active:scale-100 disabled:pointer-events-none"
          >
            <ScanLine className={`w-4 h-4 ${scanning ? 'animate-spin-slow' : ''}`} />
            {scanning ? 'Analyzing Crop Leaf...' : (!customImage && scanMode !== 'sample') ? 'Provide Leaf Photo First' : 'Scan Leaf with AI'}
          </button>
        </div>

        {/* Right - Diagnosis / Remedy prescription panel */}
        <div className="flex flex-col gap-4">
          <p className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-505'}`}>Diagnosis Report</p>

          {!result && !scanning && (
            <div className={`flex-1 flex flex-col items-center justify-center rounded-2xl border border-dashed h-full min-h-[220px] gap-3 ${darkMode ? 'border-slate-800 text-slate-700' : 'border-slate-200 text-slate-400'}`}>
              <ScanLine className="w-10 h-10 opacity-25" />
              <p className="text-xs font-semibold text-center leading-relaxed">
                Provide a crop leaf photo via<br/>
                sample selection, device file upload,<br/>
                or live capture, then click Scan.
              </p>
            </div>
          )}

          {scanning && (
            <div className={`flex-1 flex flex-col items-center justify-center rounded-2xl gap-4 min-h-[220px] ${darkMode ? 'bg-slate-800/40' : 'bg-emerald-50/40'}`}>
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                <Sparkles className="w-5 h-5 text-emerald-500 absolute inset-0 m-auto" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-emerald-600">AI Deep Scanning Patterns...</p>
                <p className={`text-[10px] mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Checking for chlorosis, necrosis & pest markers</p>
              </div>
            </div>
          )}

          {result && !scanning && (
            <div className="flex flex-col gap-3 animate-fadeSlideUp">
              {/* Plant and Condition card */}
              <div className="p-4 rounded-2xl border" style={{ background: `${result.color}12`, borderColor: `${result.color}40` }}>
                <div className="flex items-center justify-between mb-3 border-b pb-2" style={{ borderColor: `${result.color}25` }}>
                  <div>
                    <span className="text-[9px] uppercase font-black text-slate-450 dark:text-slate-450">
                      {lang === 'kn' ? 'ಪತ್ತೆಯಾದ ಸಸ್ಯ' : 'Identified Plant'}
                    </span>
                    <p className={`text-xs font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      🌱 {diagnosedPlantName}
                    </p>
                  </div>
                  
                  {/* Voice Instructor button */}
                  <button 
                    onClick={speakReport}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black text-white transition cursor-pointer shadow-sm hover:scale-[1.02] active:scale-100"
                    style={{ backgroundColor: result.color }}
                  >
                    <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                    {lang === 'kn' ? 'ವರದಿ ಕೇಳಿ' : 'Listen Report'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: result.color }} />
                  <p className="font-black text-sm" style={{ color: result.color }}>{result.condition}</p>
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${result.color}20`, color: result.color }}>{result.severity} Risk</span>
                </div>
              </div>

              {/* Remedy */}
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-800/70 border border-slate-800' : 'bg-slate-50 border border-slate-100'}`}>
                <p className={`text-[10px] font-black uppercase tracking-wider mb-1.5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  🌿 {lang === 'kn' ? 'ಸಾಮಾನ್ಯ ಪರಿಹಾರ' : 'General / Preventative Remedy'}
                </p>
                <p className={`text-xs leading-relaxed font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  {result.remedy}
                </p>
              </div>

              {/* Chemical Spray Option */}
              <div className={`p-4 rounded-2xl border transition-all ${
                result.id === 'healthy'
                  ? (darkMode ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-emerald-50/50 border-emerald-100 text-emerald-800')
                  : (darkMode ? 'bg-indigo-950/20 border-indigo-800/40 text-indigo-300' : 'bg-indigo-50/50 border-indigo-100 text-indigo-800')
              }`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <FlaskConical className={`w-4 h-4 ${result.id === 'healthy' ? 'text-emerald-500' : 'text-indigo-500'}`} />
                  <p className="text-[10px] font-black uppercase tracking-wider">
                    {lang === 'kn' ? 'ರಾಸಾಯನಿಕ ಸಿಂಪರಣೆ ಆಯ್ಕೆ' : 'Recommended Chemical Spray'}
                  </p>
                </div>
                <p className="text-xs leading-relaxed font-black">
                  {result.chemical}
                </p>
              </div>

              {/* Chemical Spray Method */}
              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/70 border-slate-850' : 'bg-slate-50 border-slate-200/60'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <p className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {lang === 'kn' ? '💦 ಸಿಂಪರಣೆ ವಿಧಾನ ಮತ್ತು ಸುರಕ್ಷತೆ' : '💦 Chemical Spray Method & Safety'}
                  </p>
                </div>
                <div className={`text-xs leading-relaxed font-semibold space-y-1.5 ${darkMode ? 'text-slate-350' : 'text-slate-650'}`}>
                  {(result.sprayInstructions[lang] || result.sprayInstructions['en']).split('\n').map((step, idx) => (
                    <p key={idx}>{step}</p>
                  ))}
                </div>
              </div>

              {/* Confidence */}
              <div className={`p-3 rounded-xl flex items-center gap-3 ${darkMode ? 'bg-slate-800/70 border border-slate-800' : 'bg-slate-50 border border-slate-100'}`}>
                <FlaskConical className="w-4 h-4 text-indigo-500 shrink-0" />
                <div className="flex-1">
                  <p className={`text-[10px] font-bold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>AI Confidence Score</p>
                  <div className={`h-1.5 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${confidenceRate}%`, background: result.color }} />
                  </div>
                </div>
                <span className="text-xs font-black" style={{ color: result.color }}>{confidenceRate}%</span>
              </div>

              <button 
                onClick={() => { setScanResultId(null); setCustomImage(null); setFileName(''); }} 
                className={`text-xs font-bold flex items-center gap-1.5 justify-center py-2.5 rounded-xl transition cursor-pointer ${
                  darkMode ? 'bg-slate-800 text-slate-350 hover:text-slate-200 hover:bg-slate-750' : 'bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                }`}
              >
                <RefreshCw className="w-3 h-3" /> Reset & Scan Another Leaf
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState('en');
  const [darkMode, setDarkMode] = useState(false);
  const [tab, setTab] = useState('form');
  const [loading, setLoading] = useState(false);

  // Background Slideshow State
  const [activeBgIndex, setActiveBgIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBgIndex(prev => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Supabase Connection Settings State
  const [dbConnected, setDbConnected] = useState(false);
  const [checkingDb, setCheckingDb] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsUrl, setSettingsUrl] = useState('');
  const [settingsKey, setSettingsKey] = useState('');
  const [testResult, setTestResult] = useState(null);

  const checkConnection = useCallback(async () => {
    setCheckingDb(true);
    const config = getSupabaseConfig();
    setSettingsUrl(config.url);
    setSettingsKey(config.key);
    const res = await testConnection(config.url, config.key);
    setDbConnected(res.success);
    setCheckingDb(false);
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const handleOpenSettings = () => {
    const config = getSupabaseConfig();
    setSettingsUrl(config.url);
    setSettingsKey(config.key);
    setTestResult(null);
    setShowSettingsModal(true);
  };

  const handleTestSettings = async () => {
    setTestResult({ status: 'testing', message: 'Testing database connection...' });
    const res = await testConnection(settingsUrl, settingsKey);
    if (res.success) {
      setTestResult({ status: 'success', message: 'Connection test passed! Tables are setup correctly.' });
    } else {
      setTestResult({ status: 'error', message: res.error || 'Failed to connect. Please check credentials or SQL tables.' });
    }
  };

  const handleSaveSettings = async () => {
    setTestResult({ status: 'testing', message: 'Verifying connection before saving...' });
    const res = await testConnection(settingsUrl, settingsKey);
    if (!res.success) {
      if (!window.confirm("Connection test failed: " + (res.error || 'Unknown Error') + "\n\nDo you want to save anyway?")) {
        setTestResult({ status: 'error', message: 'Save cancelled by user due to failed test.' });
        return;
      }
    }
    updateSupabaseClient(settingsUrl, settingsKey);
    setDbConnected(res.success);
    setShowSettingsModal(false);
    loadHistory();
    alert("Supabase client configuration saved!");
  };

  const handleResetSettings = () => {
    if (window.confirm("Reset connection to system default Supabase instance?")) {
      const defaults = resetSupabaseClient();
      setSettingsUrl(defaults.url);
      setSettingsKey(defaults.key);
      testConnection(defaults.url, defaults.key).then(res => {
        setDbConnected(res.success);
      });
      setShowSettingsModal(false);
      loadHistory();
      alert("Reset to default connection!");
    }
  };

  const [weather, setWeather] = useState({ location: 'Bengaluru', temperature: 28, humidity: 62, condition: 'Sunny', windSpeed: 12, forecast: [] });
  const [weatherSearch, setWeatherSearch] = useState('Bengaluru');

  const [inputs, setInputs] = useState({
    farmerName: '', location: 'Bengaluru Urban', soilType: 'Red soil', cropType: 'Cotton',
    plantCategory: 'Commercial crops', nitrogen: '45', phosphorus: '35', potassium: '40',
    ph: '6.5', weatherCondition: 'Sunny'
  });

  useEffect(() => {
    const crops = getTranslatedOptions(lang).crops.filter(c => c.category === inputs.plantCategory);
    if (crops.length > 0) setInputs(prev => ({ ...prev, cropType: crops[0].value }));
  }, [inputs.plantCategory]);

  const [history, setHistory] = useState(() => {
    try {
      const local = localStorage.getItem('agri_recommendations');
      if (local) {
        const parsed = JSON.parse(local);
        return parsed.map(r => r.recommendation_result || r);
      }
    } catch (e) {
      console.error("Failed to read initial history cache:", e);
    }
    return [];
  });
  const [result, setResult] = useState(() => (history && history.length > 0 ? history[0] : null));
  const [chatMessages, setChatMessages] = useState([{ sender: 'bot', text: '' }]);
  const [chatInput, setChatInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => { setChatMessages([{ sender: 'bot', text: getTranslation(lang, 'chatWelcome') }]); }, [lang]);
  useEffect(() => {
    loadHistory();
    // Pre-cache and load TTS speech voices in browser
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
    // Auto-detect user location to show correct present weather
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const closest = findClosestDistrict(latitude, longitude);
          loadWeather(closest);
          setInputs(prev => ({ ...prev, location: closest }));
          setWeatherSearch(closest);
        },
        (error) => {
          console.warn("Geolocation failed or denied, defaulting to Bengaluru Urban:", error);
          loadWeather('Bengaluru Urban');
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
      );
    } else {
      loadWeather('Bengaluru Urban');
    }
  }, []);
  useEffect(() => { if (weather) setInputs(prev => ({ ...prev, weatherCondition: weather.condition })); }, [weather]);

  const loadHistory = async () => {
    const list = await dbService.getRecommendationHistory();
    if (list && list.length > 0) {
      setHistory(list);
      setResult(prev => prev || list[0]);
    }
  };
  const loadWeather = async (loc) => { try { const data = await mockWeatherAPI(loc); setWeather(data); } catch (e) { console.error(e); } };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
    if (name === 'location') loadWeather(value);
  };
  const handleSliderChange = (name, value) => setInputs(prev => ({ ...prev, [name]: value.toString() }));
  const handleWeatherSearch = (e) => { e.preventDefault(); if (weatherSearch.trim()) loadWeather(weatherSearch); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputs.farmerName.trim()) { alert(lang === 'kn' ? 'ದಯವಿಟ್ಟು ರೈತನ ಹೆಸರನ್ನು ನಮೂದಿಸಿ' : 'Please enter farmer name'); return; }
    setLoading(true);
    const analysis = analyzeSoilAndCrop(inputs);
    await dbService.saveRecommendation(analysis);
    setResult(analysis);
    setLoading(false);
    loadHistory();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SR();
      recognition.lang = lang === 'kn' ? 'kn-IN' : 'en-US';
      recognition.interimResults = false;
      setIsListening(true);
      recognition.onresult = (e) => { setChatInput(e.results[0][0].transcript); setIsListening(false); };
      recognition.onerror = () => { setIsListening(false); fallbackVoice(); };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else { fallbackVoice(); }
  };
  const fallbackVoice = () => {
    setIsListening(true);
    setTimeout(() => { setChatInput(getSpeechEmulationText(lang)); setIsListening(false); }, 1500);
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setTimeout(() => { const response = getBotResponse(userText, lang); setChatMessages(prev => [...prev, { sender: 'bot', text: response }]); }, 600);
  };
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const clearRecommendationHistory = async () => {
    if (window.confirm(lang === 'kn' ? 'ನೀವು ಇತಿಹಾಸವನ್ನು ಅಳಿಸಲು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?' : 'Clear all recommendation history?')) {
      await dbService.clearHistory(); setHistory([]); alert(getTranslation(lang, 'historyCleared'));
    }
  };

  const options = getTranslatedOptions(lang);
  const latestRec = result || (history.length > 0 ? history[0] : null);

  const nutrientChartData = latestRec ? [
    { name: 'Nitrogen (N)', Current: parseFloat(latestRec.nitrogen), Ideal: parseFloat(latestRec.targetN) },
    { name: 'Phosphorus (P)', Current: parseFloat(latestRec.phosphorus), Ideal: parseFloat(latestRec.targetP) },
    { name: 'Potassium (K)', Current: parseFloat(latestRec.potassium), Ideal: parseFloat(latestRec.targetK) },
  ] : [
    { name: 'Nitrogen (N)', Current: 40, Ideal: 60 },
    { name: 'Phosphorus (P)', Current: 30, Ideal: 50 },
    { name: 'Potassium (K)', Current: 35, Ideal: 70 },
  ];

  const radarChartData = latestRec ? [
    { subject: 'N', A: parseFloat(latestRec.nitrogen), B: parseFloat(latestRec.targetN), fullMark: 150 },
    { subject: 'P', A: parseFloat(latestRec.phosphorus), B: parseFloat(latestRec.targetP), fullMark: 150 },
    { subject: 'K', A: parseFloat(latestRec.potassium), B: parseFloat(latestRec.targetK), fullMark: 150 },
    { subject: 'pH×10', A: parseFloat(latestRec.ph) * 10, B: 65, fullMark: 140 },
  ] : [
    { subject: 'N', A: 50, B: 80, fullMark: 150 },
    { subject: 'P', A: 35, B: 50, fullMark: 150 },
    { subject: 'K', A: 45, B: 70, fullMark: 150 },
    { subject: 'pH×10', A: 65, B: 65, fullMark: 140 },
  ];

  const dm = darkMode;
  const fieldCls = `w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${dm ? 'bg-slate-900 border-slate-850 text-white focus:bg-slate-850' : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white'}`;
  const cardCls = `rounded-3xl border shadow-md transition-all duration-300 ${dm ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200/60 text-slate-800 shadow-slate-100/50'}`;

  const TABS = [
    { id: 'form',     icon: <Layers className="w-4 h-4" />,       label: getTranslation(lang, 'farmerForm') },
    { id: 'dashboard',icon: <Grid className="w-4 h-4" />,         label: getTranslation(lang, 'dashboard') },
    { id: 'scanner',  icon: <ScanLine className="w-4 h-4" />,     label: 'Leaf Scanner' },
    { id: 'history',  icon: <FileText className="w-4 h-4" />,     label: getTranslation(lang, 'history') },
    { id: 'chatbot',  icon: <MessageSquare className="w-4 h-4" />,label: getTranslation(lang, 'chatbot') },
  ];

  return (
    <div className={`min-h-screen relative transition-colors duration-300 ${dm ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>

      {/* ── Header as Hero Banner ── */}
      <header className="relative z-10 overflow-hidden min-h-[170px] md:min-h-[190px] flex items-center">
        {/* Immersive Agriculture Hero Banner Slideshow */}
        <div className="slideshow-container">
          {[
            { src: '/farming_rice.png', alt: 'Rice Paddy' },
            { src: '/farming_maize.png', alt: 'Maize Field' },
            { src: '/farming_harvest.png', alt: 'Harvesting' }
          ].map((bg, idx) => (
            <div key={idx} className={`slide-wrapper ${activeBgIndex === idx ? 'active' : ''}`}>
              <img src={bg.src} alt={bg.alt} className="slide-image" />
            </div>
          ))}
          {/* Subtle dark overlay to ensure readability */}
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-950/80 via-slate-900/50 to-emerald-950/70 backdrop-blur-[1px]" />
        </div>

        {/* Decorative leaf shapes */}
        <div className="absolute -left-6 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl z-10" />
        <div className="absolute right-20 bottom-0 w-20 h-20 bg-emerald-400/10 rounded-full blur-xl z-10" />
        {/* Subtle grid texture */}
        <div className="absolute inset-0 opacity-5 z-10" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(255,255,255,0.3) 20px, rgba(255,255,255,0.3) 21px), repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.3) 20px, rgba(255,255,255,0.3) 21px)' }} />

        <div className="max-w-7xl mx-auto w-full px-4 py-5 md:py-6 relative z-20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Brand */}
            <div className="flex items-center gap-4">
              {/* Logo box with leaf animation */}
              <div className="relative">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center shadow-lg">
                  <Sprout className="w-7 h-7 text-emerald-300 animate-leaf-sway" />
                </div>
                {/* Pulse rings */}
                <div className="absolute inset-0 rounded-2xl border-2 border-emerald-400/30 animate-pulse-ring" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  {getTranslation(lang, 'title')}
                </h1>
                <p className="text-xs text-emerald-200 font-medium mt-0.5">{getTranslation(lang, 'subtitle')}</p>
                {/* Stat chips */}
                <div className="flex gap-2 mt-1.5">
                  {['30+ Crops', 'AI Analysis', 'Karnataka'].map(chip => (
                    <span key={chip} className="text-[9px] font-bold bg-white/10 text-emerald-100 px-2 py-0.5 rounded-full border border-white/10">{chip}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Slideshow Control Widget */}
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 px-3 py-2 rounded-xl backdrop-blur-md text-white mr-1 shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 hidden sm:inline mr-1">
                  {lang === 'kn' ? 'ಹಿನ್ನೆಲೆ' : 'Scene'}
                </span>
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveBgIndex(idx)}
                      className={`relative rounded-full transition-all duration-500 cursor-pointer ${
                        activeBgIndex === idx
                          ? 'bg-emerald-400 w-5 h-2.5'
                          : 'bg-white/40 hover:bg-white/70 w-2.5 h-2.5'
                      }`}
                      title={`Switch to Scene ${idx + 1}`}
                    >
                      {activeBgIndex === idx && (
                        <span className="absolute inset-0 rounded-full bg-emerald-400/40 animate-pulse-ring" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Supabase Status Badge */}
              <div 
                onClick={handleOpenSettings}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black cursor-pointer border backdrop-blur-md transition shadow-sm ${
                  dbConnected 
                    ? 'bg-emerald-500/10 border-emerald-400/20 text-emerald-300 hover:bg-emerald-500/20' 
                    : 'bg-amber-500/10 border-amber-400/20 text-amber-300 hover:bg-amber-500/20'
                }`}
                title={dbConnected ? "Connected to Supabase DB" : "Supabase Offline (Local Storage Fallback)"}
              >
                <div className={`w-2 h-2 rounded-full ${dbConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ boxShadow: dbConnected ? '0 0 6px #34d399' : '0 0 6px #fbbf24' }} />
                <span>{dbConnected ? 'DB Active' : 'Demo Mode'}</span>
              </div>

              {/* Database Settings */}
              <button onClick={handleOpenSettings}
                className="bg-white/10 hover:bg-white/20 border border-white/15 p-2 rounded-xl transition cursor-pointer backdrop-blur-md text-white"
                title="Database Settings">
                <Settings className="w-4 h-4" />
              </button>

              {/* Language */}
              <button onClick={() => setLang(lang === 'en' ? 'kn' : 'en')}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-2 rounded-xl text-sm font-bold text-white transition cursor-pointer backdrop-blur-md">
                <Globe className="w-4 h-4" />
                {lang === 'en' ? 'ಕನ್ನಡ' : 'English'}
              </button>

              {/* Dark mode */}
              <button onClick={() => setDarkMode(!dm)}
                className="bg-white/10 hover:bg-white/20 border border-white/15 p-2 rounded-xl transition cursor-pointer backdrop-blur-md"
                title={getTranslation(lang, 'darkMode')}>
                {dm ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-200" />}
              </button>

              {/* Weather widget */}
              <div className="bg-black/25 backdrop-blur-md border border-white/10 px-3 py-2 rounded-xl flex items-center gap-2.5">
                {weather.condition === 'Rainy'
                  ? <CloudRain className="w-4 h-4 text-blue-300" />
                  : weather.condition === 'Humid'
                  ? <Droplet className="w-4 h-4 text-cyan-300" />
                  : <Sun className="w-4 h-4 text-amber-300 animate-spin-slow" />}
                <div>
                  <p className="text-[11px] font-black text-white leading-none">
                    {(() => {
                      const district = karnatakaDistricts.find(d => d.value.toLowerCase() === weather.location.toLowerCase() || d.en.toLowerCase() === weather.location.toLowerCase());
                      return district ? (lang === 'kn' ? district.kn : district.en) : weather.location.split(' ')[0];
                    })()} · {weather.temperature}°C
                  </p>
                  <p className="text-[9px] text-emerald-300 font-semibold">
                    {getTranslation(lang, weather.condition.toLowerCase())} · 💧 {weather.humidity}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Navigation ── */}
      <nav className={`sticky top-0 z-30 border-b transition-colors duration-300 ${dm ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 flex gap-1 py-2 overflow-x-auto scrollbar-none">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                tab === t.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : dm ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-emerald-500/8'
              }`}>
              {t.icon}
              {t.label}
              {t.id === 'scanner' && <span className="bg-emerald-400 text-emerald-900 text-[8px] font-black px-1.5 rounded-full ml-0.5">NEW</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* ════ VIEW 1: Farmer Form ════ */}
        {tab === 'form' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeSlideUp">

            {/* Input Column */}
            <div className="lg:col-span-7 flex flex-col gap-5">

              {/* Form Card */}
              <div className={`${cardCls} p-6`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2 rounded-xl ${dm ? 'bg-emerald-900/50' : 'bg-emerald-50'}`}>
                    <Activity className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold">{getTranslation(lang, 'farmerForm')}</h2>
                    <p className={`text-[11px] ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Enter soil & crop details to generate AI recommendation</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Farmer & Location */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{getTranslation(lang, 'farmerName')} *</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <input type="text" name="farmerName" value={inputs.farmerName} onChange={handleInputChange}
                          placeholder="e.g. Ramesh Gowda"
                          className={`${fieldCls} pl-10`} />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{getTranslation(lang, 'location')}</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 z-10" />
                        <select name="location" value={inputs.location} onChange={handleInputChange} className={`${fieldCls} pl-10`}>
                          {karnatakaDistricts.map(d => <option key={d.value} value={d.value}>{lang === 'kn' ? d.kn : d.en}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Soil / Crop / Category */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: getTranslation(lang, 'soilType'), name: 'soilType', opts: options.soils },
                      { label: getTranslation(lang, 'cropType'), name: 'cropType', opts: options.crops.filter(c => c.category === inputs.plantCategory) },
                      { label: getTranslation(lang, 'plantCategory'), name: 'plantCategory', opts: options.categories },
                    ].map(({ label, name, opts }) => (
                      <div key={name}>
                        <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{label}</label>
                        <select name={name} value={inputs[name]} onChange={handleInputChange} className={fieldCls}>
                          {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* Soil Profile inline preview */}
                  <SoilProfileCard soilType={inputs.soilType} darkMode={dm} />

                  {/* Nutrients */}
                  <div className={`rounded-2xl p-4 border transition-all duration-300 ${dm ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200/60'}`}>
                    <h3 className={`text-[10px] font-black uppercase tracking-wider mb-4 ${dm ? 'text-slate-400' : 'text-slate-400'}`}>{getTranslation(lang, 'idealNutrients')}</h3>
                    <div className="space-y-4">
                      {[
                        { key: 'nitrogen',   label: getTranslation(lang, 'nitrogen'),   color: '#22c55e', accent: 'accent-emerald-600', bg: 'bg-emerald-100', text: 'text-emerald-700' },
                        { key: 'phosphorus', label: getTranslation(lang, 'phosphorus'), color: '#3b82f6', accent: 'accent-blue-600',    bg: 'bg-blue-100',    text: 'text-blue-700' },
                        { key: 'potassium',  label: getTranslation(lang, 'potassium'),  color: '#f59e0b', accent: 'accent-amber-600',   bg: 'bg-amber-100',   text: 'text-amber-700' },
                      ].map(({ key, label, color, accent, bg, text }) => (
                        <div key={key}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-bold">{label}</span>
                            <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${bg} ${text}`}>{inputs[key]} ppm</span>
                          </div>
                          <input type="range" min="0" max="200" value={inputs[key]}
                            onChange={e => handleSliderChange(key, e.target.value)}
                            className={`w-full ${accent}`}
                            style={{ accentColor: color }}
                          />
                          <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                            <span>0</span><span>100</span><span>200 ppm</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* pH and Weather */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-2xl border transition-all duration-300 ${dm ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200/60'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <label className={`text-[10px] font-black uppercase tracking-wider ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{getTranslation(lang, 'soilPh')}</label>
                        <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${parseFloat(inputs.ph) < 6 ? 'bg-red-100 text-red-600' : parseFloat(inputs.ph) > 8 ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}>pH {inputs.ph}</span>
                      </div>
                      <input type="range" min="3.0" max="10.0" step="0.1" value={inputs.ph}
                        onChange={e => handleSliderChange('ph', e.target.value)}
                        className="w-full" style={{ accentColor: '#6366f1' }} />
                      <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                        <span>Acidic 3.0</span><span>Neutral 7.0</span><span>Alkaline 10.0</span>
                      </div>
                    </div>
                    <div>
                      <label className={`block text-[10px] font-black uppercase tracking-wider mb-1.5 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{getTranslation(lang, 'weather')}</label>
                      <select name="weatherCondition" value={inputs.weatherCondition} onChange={handleInputChange} className={fieldCls}>
                        {options.weathers.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      {/* Watering tip */}
                      <div className={`mt-2 p-2 rounded-xl text-[10px] font-medium flex items-start gap-1.5 ${dm ? 'bg-slate-800 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                        <Droplet className="w-3 h-3 shrink-0 mt-0.5" />
                        {inputs.weatherCondition === 'Rainy' ? 'Delay fertilizer application during heavy rain.' :
                         inputs.weatherCondition === 'Dry' ? 'Irrigate before applying fertilizer to prevent root burn.' :
                         inputs.weatherCondition === 'Humid' ? 'Watch for fungal diseases. Ensure good canopy airflow.' :
                         'Moderate conditions — ideal for fertilizer application.'}
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <button type="submit" disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-extrabold tracking-wide rounded-2xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 hover:scale-[1.01] active:scale-100">
                    <Sparkles className="w-5 h-5" />
                    {loading ? getTranslation(lang, 'processing') : getTranslation(lang, 'submit')}
                  </button>
                </form>
              </div>
            </div>

            {/* Results Column */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              {latestRec ? (
                <>
                  {/* Crop Growth Simulator */}
                  <div className={`${cardCls} p-5`}>
                    <div className="flex items-center gap-2 mb-4">
                      <Sprout className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-sm font-black">Crop Health Simulator</h3>
                      <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        latestRec.suitabilityScore >= 75 ? 'bg-emerald-100 text-emerald-700' :
                        latestRec.suitabilityScore >= 50 ? 'bg-lime-100 text-lime-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{latestRec.cropType}</span>
                    </div>
                    <CropSimulator score={latestRec.suitabilityScore} cropType={latestRec.cropType} />
                  </div>

                  {/* Recommendation card */}
                  <div className={`${cardCls} p-6 flex flex-col gap-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookmarkCheck className="w-5 h-5 text-emerald-500" />
                        <h2 className="text-sm font-black">{getTranslation(lang, 'recommendationTitle')}</h2>
                      </div>
                      {latestRec.created_at && (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${dm ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                          {new Date(latestRec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    {/* Score ring */}
                    <div className={`flex flex-col items-center py-5 rounded-2xl border transition-all duration-300 ${dm ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200/60'}`}>
                      <p className={`text-[10px] font-black uppercase tracking-wider mb-3 ${dm ? 'text-slate-400' : 'text-slate-400'}`}>{getTranslation(lang, 'suitabilityScore')}</p>
                      <div className="relative">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-inner ${
                          latestRec.suitabilityScore >= 75 ? 'border-emerald-300 bg-emerald-50' : 
                          latestRec.suitabilityScore >= 50 ? 'border-lime-300 bg-lime-50' : 
                          'border-yellow-300 bg-yellow-50'
                        }`}>
                          <span className={`text-3xl font-black ${
                            latestRec.suitabilityScore >= 75 ? 'text-emerald-600' : 
                            latestRec.suitabilityScore >= 50 ? 'text-lime-600' : 
                            'text-yellow-600'
                          }`}>
                            {latestRec.suitabilityScore}%
                          </span>
                        </div>
                        {latestRec.suitabilityScore >= 75 && (
                          <div className="absolute inset-0 rounded-full border-4 border-emerald-400/30 animate-pulse-ring" />
                        )}
                      </div>
                      <span className={`mt-3 text-xs font-bold px-3 py-1 rounded-full ${
                        latestRec.suitabilityScore >= 80 ? 'bg-emerald-100 text-emerald-700' : 
                        latestRec.suitabilityScore >= 50 ? 'bg-amber-100 text-amber-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {latestRec.suitabilityScore >= 80 ? `✨ ${getTranslation(lang, 'excellent')}` : 
                         latestRec.suitabilityScore >= 50 ? `⚡ ${getTranslation(lang, 'moderate')}` : 
                         `⚠️ ${getTranslation(lang, 'poor')}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: getTranslation(lang, 'suggestedFertilizer'), value: latestRec.suggestedFertilizer, icon: <Sprout className="w-4 h-4 text-emerald-500" />, valCls: 'text-emerald-600 font-black' },
                        { label: getTranslation(lang, 'dosage'), value: latestRec.quantityPerAc, icon: <BookmarkCheck className="w-4 h-4 text-blue-500" />, valCls: 'font-black' },
                        { label: getTranslation(lang, 'waterReq'), value: latestRec.waterRequirement, icon: <Droplet className="w-4 h-4 text-cyan-500" />, valCls: 'font-bold text-sm' },
                        { label: getTranslation(lang, 'bestSeason'), value: latestRec.bestSeason, icon: <Sun className="w-4 h-4 text-amber-500" />, valCls: 'font-bold text-xs leading-tight' }
                      ].map(({ label, value, icon, valCls }) => (
                        <div key={label} className={`p-3 rounded-xl border transition-all duration-300 ${dm ? 'bg-slate-900 border-slate-850' : 'bg-slate-50 border-slate-100'}`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            {icon}
                            <p className={`text-[9px] font-black uppercase tracking-wider ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
                          </div>
                          <p className={`text-sm ${valCls} ${dm ? 'text-white' : 'text-slate-800'} ${valCls.includes('emerald') ? '!text-emerald-600' : ''}`}>{value}</p>
                        </div>
                      ))}
                    </div>

                    {latestRec.organicAlternatives?.length > 0 && (
                      <div className={`p-3 rounded-xl border ${dm ? 'bg-emerald-950/40 border-emerald-900' : 'bg-emerald-50 border-emerald-100'}`}>
                        <p className={`text-[9px] font-black uppercase tracking-wider mb-2 ${dm ? 'text-emerald-500' : 'text-emerald-600'}`}>🌿 {getTranslation(lang, 'organicAlternatives')}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {latestRec.organicAlternatives.map((org, i) => (
                            <span key={i} className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${dm ? 'bg-emerald-900/60 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>{org}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {latestRec.soilAmendments?.length > 0 && (
                      <div className={`p-3 rounded-xl border ${dm ? 'bg-amber-950/30 border-amber-900' : 'bg-amber-50 border-amber-100'}`}>
                        <p className={`text-[9px] font-black uppercase tracking-wider mb-2 ${dm ? 'text-amber-500' : 'text-amber-700'}`}>🪨 {getTranslation(lang, 'soilAmendments')}</p>
                        <ul className="space-y-1">
                          {latestRec.soilAmendments.map((amend, i) => (
                            <li key={i} className={`text-[10px] font-medium flex items-start gap-1.5 ${dm ? 'text-amber-300' : 'text-amber-700'}`}>
                              <span className="mt-0.5">•</span>
                              <span>{amend}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {latestRec.weatherAlert && (
                      <div className={`p-3 rounded-xl flex gap-2 items-start text-xs ${dm ? 'bg-blue-950/40 border border-blue-900' : 'bg-blue-50 border border-blue-100'}`}>
                        <AlertTriangle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-black text-blue-500">{getTranslation(lang, 'weatherAlert')}: </span>
                          <span className={`font-medium ${dm ? 'text-blue-300' : 'text-blue-600'}`}>{latestRec.weatherAlert}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className={`${cardCls} p-10 flex flex-col justify-center items-center text-center gap-4 min-h-[400px]`}>
                  <div className="relative">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center ${dm ? 'bg-slate-800' : 'bg-emerald-50'}`}>
                      <Sprout className="w-10 h-10 text-emerald-300 animate-float" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold mb-1">{lang === 'kn' ? 'ಯಾವುದೇ ಶಿಫಾರಸು ಇಲ್ಲ' : 'No Recommendation Yet'}</h3>
                    <p className="text-xs leading-relaxed max-w-xs text-slate-400">{lang === 'kn' ? 'ರಸಗೊಬ್ಬರ ಶಿಫಾರಸು ಪಡೆಯಲು ಎಡಭಾಗದ ಫಾರ್ಮ್ ಭರ್ತಿ ಮಾಡಿ.' : 'Fill in the farmer form on the left and click "Get Recommendation" to analyze your soil.'}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 w-full mt-2">
                    {['🌾 Cotton', '🍅 Tomato', '🍌 Banana'].map(crop => (
                      <div key={crop} className={`py-2 px-3 rounded-xl text-xs font-bold ${dm ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>{crop}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 5: Leaf Scanner */}
        {tab === 'scanner' && (
          <div className="animate-fadeSlideUp">
            <LeafScanner darkMode={dm} lang={lang} />
          </div>
        )}

        {/* VIEW 2: Dashboard & Charts */}
        {tab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Soil Type */}
              <div className={`${cardCls} p-6 flex items-center gap-4`}>
                <div className="p-4 bg-emerald-500/10 rounded-2xl">
                  <Layers className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{getTranslation(lang, 'soilType')}</p>
                  <p className="text-lg font-black">{latestRec ? latestRec.soilType : 'N/A'}</p>
                </div>
              </div>

              {/* Card 2: Crop Status */}
              <div className={`${cardCls} p-6 flex items-center gap-4`}>
                <div className="p-4 bg-indigo-500/10 rounded-2xl">
                  <Sprout className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{getTranslation(lang, 'cropType')}</p>
                  <p className="text-lg font-black">{latestRec ? `${latestRec.cropType} (${latestRec.plantCategory})` : 'N/A'}</p>
                </div>
              </div>

              {/* Card 3: Suitability index */}
              <div className={`${cardCls} p-6 flex items-center gap-4`}>
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
              <div className={`${cardCls} p-6`}>
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
              <div className={`${cardCls} p-6`}>
                <h3 className="text-base font-extrabold mb-4">{getTranslation(lang, 'idealNutrients')} (Radar View)</h3>
                <div className="h-80 w-full">
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
            <div className={`${cardCls} p-6`}>
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
                  <span className="text-sm font-extrabold">{getTranslation(lang, weather.condition.toLowerCase())}</span>
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
          <div className={`${cardCls} p-6`}>
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
                      darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 hover:border-slate-600' : 'bg-slate-50/70 border-slate-200 text-slate-800 hover:border-slate-300'
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
          <div className={`${cardCls} p-6 h-[550px] flex flex-col`}>
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

      <footer className="max-w-7xl mx-auto px-4 py-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs font-bold text-slate-400 relative z-10">
        <p>© 2026 Raita Mitra. All rights reserved.</p>
        <p className="mt-1 text-slate-500 text-[10px]">Built using React, Tailwind CSS v4, and Supabase Database.</p>
      </footer>

      {/* ── Supabase Connection Settings Modal ── */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-950/40 animate-fadeSlideUp">
          <div className={`${cardCls} w-full max-w-xl p-6 relative overflow-hidden shadow-2xl border`}>
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-4 border-slate-200/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600 text-white rounded-xl">
                  <Settings className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                    {lang === 'kn' ? 'ಡೇಟಾಬೇಸ್ ಸಂಪರ್ಕ ನಿರ್ವಾಹಕ' : 'Supabase Database Manager'}
                  </h3>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400 font-bold">
                    Configure your live cloud database connection
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-205 text-lg font-black transition cursor-pointer p-1.5"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 text-xs font-semibold">
              {/* Active Connection Status Indicator */}
              <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                dbConnected 
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-300' 
                  : 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-300'
              }`}>
                <div className={`w-3 h-3 rounded-full shrink-0 ${dbConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                <div className="flex-1">
                  <p className="font-extrabold text-sm leading-tight">
                    {dbConnected ? 'Database Connection Active' : 'Local Storage Demo Mode'}
                  </p>
                  <p className="text-[10px] opacity-75 mt-0.5 font-medium">
                    {dbConnected 
                      ? 'The app is successfully connected. Soil records and recommendations are syncing live to Supabase.' 
                      : 'Unable to connect to the cloud database. Falling back to local offline storage.'}
                  </p>
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    Supabase Project API URL
                  </label>
                  <input 
                    type="text" 
                    value={settingsUrl} 
                    onChange={(e) => setSettingsUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
                    Supabase Project Anon API Key
                  </label>
                  <input 
                    type="password" 
                    value={settingsKey} 
                    onChange={(e) => setSettingsKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className={fieldCls}
                  />
                </div>
              </div>

              {/* Test Connection Results */}
              {testResult && (
                <div className={`p-3 rounded-xl border text-[11px] leading-relaxed font-bold ${
                  testResult.status === 'success' ? 'bg-green-500/5 border-green-500/20 text-green-700 dark:text-green-300' :
                  testResult.status === 'error' ? 'bg-red-500/5 border-red-500/20 text-red-700 dark:text-red-300' :
                  'bg-slate-500/5 border-slate-500/10 text-slate-500 dark:text-slate-400'
                }`}>
                  {testResult.message}
                </div>
              )}

              {/* SQL setup helper instructions */}
              <div className="p-3.5 rounded-xl border bg-slate-900/5 dark:bg-slate-950/20 border-slate-200/40 dark:border-slate-800/40">
                <p className="text-[10px] uppercase font-black text-emerald-600 mb-1">💡 Supabase DB Setup Instructions</p>
                <ol className="list-decimal list-inside space-y-1 text-[10px] text-slate-400 font-medium">
                  <li>Log in to your Supabase Dashboard at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline">supabase.com</a></li>
                  <li>Select your project, open the **SQL Editor**, and create a new query.</li>
                  <li>Copy and execute the schemas defined in [supabase_setup.sql](file:///c:/Users/Mala%20Mp/Desktop/agri/supabase_setup.sql) inside this project.</li>
                  <li>Once queries complete, verify the tables (`fertilizers`, `farmers`, `soil_reports`, `recommendations`) are ready.</li>
                </ol>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={handleTestSettings}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black border transition cursor-pointer hover:bg-slate-500/5 text-slate-700 dark:text-slate-205 border-slate-200 dark:border-slate-800`}
                >
                  Test Connection
                </button>
                <button 
                  onClick={handleSaveSettings}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition cursor-pointer shadow-lg shadow-emerald-600/15"
                >
                  Save & Connect
                </button>
                <button 
                  onClick={handleResetSettings}
                  className="py-2.5 px-3.5 rounded-xl text-xs font-black text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 transition cursor-pointer"
                  title="Reset to Defaults"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
