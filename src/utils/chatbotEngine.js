/**
 * Simulated Local AI Chatbot Logic
 */
import { translations } from './translations';

export const getBotResponse = (message, lang = 'en') => {
  const msg = message.toLowerCase().trim();
  
  if (lang === 'kn') {
    // Kannada responses
    if (msg.includes('ಹಲೋ') || msg.includes('ನಮಸ್ಕಾರ') || msg.includes('ಹಾಯ್')) {
      return "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಕೃಷಿ ಸಹಾಯಕಿ. ನಿಮಗೆ ಮಣ್ಣು, ಬೆಳೆಗಳು ಅಥವಾ ರಸಗೊಬ್ಬರಗಳ ಬಗ್ಗೆ ಮಾಹಿತಿ ಬೇಕೇ?";
    }
    if (msg.includes('ಕೆಂಪು ಮಣ್ಣು') || msg.includes('ಕೆಂಪು')) {
      return "ಕೆಂಪು ಮಣ್ಣಿನಲ್ಲಿ ಸಾಮಾನ್ಯವಾಗಿ ಸಾರಜನಕ (Nitrogen) ಮತ್ತು ಸಾವಯವ ಪದಾರ್ಥಗಳು ಕಡಿಮೆ ಇರುತ್ತವೆ. ಇದಕ್ಕೆ ಯೂರಿಯಾ (Urea), ಡಿಎಪಿ (DAP), ಕಂಪೋಸ್ಟ್ ಅಥವಾ ಎನ್‌ಪಿಕೆ 19:19:19 ರಸಗೊಬ್ಬರಗಳನ್ನು ಬಳಸಲು ಶಿಫಾರಸು ಮಾಡಲಾಗುತ್ತದೆ.";
    }
    if (msg.includes('ಕಪ್ಪು ಮಣ್ಣು') || msg.includes('ಕಪ್ಪು')) {
      return "ಕಪ್ಪು ಮಣ್ಣು ಕ್ಯಾಲ್ಸಿಯಂ ಮತ್ತು ಪೊಟ್ಯಾಸಿಯಮ್‌ನಿಂದ ಸಮೃದ್ಧವಾಗಿದೆ. ಆದರೆ ರಂಜಕ ಕಡಿಮೆ ಇರಬಹುದು. ಇದಕ್ಕೆ ಡಿಎಪಿ (DAP), ಎಸ್‌ಎಸ್‌ಪಿ (SSP) ಅಥವಾ ಸಾವಯವ ಗೊಬ್ಬರ ಮತ್ತು ಝಿಂಕ್ ಸಲ್ಫೇಟ್ ಬಳಸಬಹುದು.";
    }
    if (msg.includes('ಹತ್ತಿ') || msg.includes('cotton')) {
      return "ಹತ್ತಿ ಬೆಳೆಗೆ ಕಪ್ಪು ಮಣ್ಣು ತುಂಬಾ ಸೂಕ್ತವಾಗಿದೆ. ಇದಕ್ಕೆ ಯೂರಿಯಾ, ಡಿಎಪಿ ಮತ್ತು ಪೊಟ್ಯಾಶ್ ರಸಗೊಬ್ಬರಗಳನ್ನು ಹಂತ ಹಂತವಾಗಿ ಹಾಕಬೇಕು.";
    }
    if (msg.includes('ಮೆಣಸಿನಕಾಯಿ') || msg.includes('chilli')) {
      return "ಮೆಣಸಿನಕಾಯಿ ಬೆಳೆಗೆ ಕೆಂಪು ಮಣ್ಣು ಸೂಕ್ತ. ಇದಕ್ಕೆ ಎನ್‌ಪಿಕೆ 19:19:19, ವರ್ಮಿಕಂಪೋಸ್ಟ್ (ಎರೆಗೊಬ್ಬರ) ಮತ್ತು ಲಘು ಪೋಷಕಾಂಶಗಳನ್ನು ನೀಡಬೇಕು.";
    }
    if (msg.includes('ಬಾಳೆ') || msg.includes('banana')) {
      return "ಬಾಳೆ ಬೆಳೆಗೆ ಹೆಚ್ಚಿನ ಪ್ರಮಾಣದ ಸಾವಯವ ಗೊಬ್ಬರಗಳು ಮತ್ತು ಪೊಟ್ಯಾಸಿಯಮ್ ರಸಗೊಬ್ಬರಗಳು (MOP) ಬೇಕಾಗುತ್ತವೆ. ಇದರಿಂದ ಹಣ್ಣಿನ ಗಾತ್ರ ಮತ್ತು ರುಚಿ ಹೆಚ್ಚುತ್ತದೆ.";
    }
    if (msg.includes('ರಸಗೊಬ್ಬರ') || msg.includes('ಗೊಬ್ಬರ')) {
      return "ರಸಗೊಬ್ಬರಗಳನ್ನು ಮಣ್ಣಿನ ತೇವಾಂಶ ಮತ್ತು ಬೆಳೆಗಳ ಹಂತ ನೋಡಿ ಹಾಕಬೇಕು. ರಾಸಾಯನಿಕ ಗೊಬ್ಬರಗಳ ಜೊತೆಗೆ ಕಡ್ಡಾಯವಾಗಿ ಕಂಪೋಸ್ಟ್ ಅಥವಾ ಎರೆಗೊಬ್ಬರ ಬಳಸಿ ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಕಾಪಾಡಿ.";
    }
    if (msg.includes('ಹವಾಮಾನ') || msg.includes('ಮಳೆ')) {
      return "ಮಳೆಗಾಲದಲ್ಲಿ ಯೂರಿಯಾ ಗೊಬ್ಬರವನ್ನು ಮೇಲುಗೊಬ್ಬರವಾಗಿ ಹಾಕಬೇಡಿ, ಏಕೆಂದರೆ ಅದು ನೀರಿನಲ್ಲಿ ಕೊಚ್ಚಿ ಹೋಗುತ್ತದೆ. ಒಣ ಹವಾಮಾನ ಇದ್ದಾಗ ಗೊಬ್ಬರ ಹಾಕಿದ ತಕ್ಷಣ ನೀರು ಉಣಿಸಿ.";
    }
    if (msg.includes('ರಸಸಾರ') || msg.includes('ph')) {
      return "ಮಣ್ಣಿನ ಆದರ್ಶ ರಸಸಾರ (pH) 6.0 ರಿಂದ 7.2 ಇರಬೇಕು. ಆಮ್ಲೀಯ ಮಣ್ಣಿಗೆ ಸುಣ್ಣ (Lime) ಮತ್ತು ಕ್ಷಾರೀಯ ಮಣ್ಣಿಗೆ ಜಿಪ್ಸಮ್ ಬಳಸಬೇಕು.";
    }
    return "ಕ್ಷಮಿಸಿ, ಆ ಪ್ರಶ್ನೆಗೆ ನನಗೆ ಉತ್ತರ ತಿಳಿದಿಲ್ಲ. ದಯವಿಟ್ಟು ರಸಗೊಬ್ಬರಗಳು, ಬೆಳೆಗಳು, ಕೆಂಪು/ಕಪ್ಪು ಮಣ್ಣು ಅಥವಾ ರಸಸಾರ (pH) ಕುರಿತು ಕೇಳಿ.";
  } else {
    // English responses
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      return "Hello! I am your AI Krishi Helper. How can I assist you with crops, soil type, or fertilizers today?";
    }
    if (msg.includes('red soil') || msg.includes('red')) {
      return "Red soil is usually low in Nitrogen and organic matter. Recommended fertilizers include Urea, DAP, Compost, Vermicompost, and NPK 19:19:19 to boost yield.";
    }
    if (msg.includes('black soil') || msg.includes('black')) {
      return "Black soil is rich in Calcium and Potassium, but can be low in Phosphorus. Recommended fertilizers: DAP, SSP, organic manure, and Zinc Sulphate.";
    }
    if (msg.includes('cotton')) {
      return "Cotton grows best in Black soil. Key recommended fertilizers are Urea, DAP, and Potash to support fiber density and boll growth.";
    }
    if (msg.includes('chilli') || msg.includes('chili')) {
      return "Chilli grows wonderfully in Red soil. Recommended nutrients: NPK 19:19:19, Vermicompost, and essential soil micronutrients.";
    }
    if (msg.includes('banana')) {
      return "Banana plants are heavy feeders requiring rich organic fertilizers and high-Potassium fertilizers (like MOP) for optimal growth.";
    }
    if (msg.includes('mango')) {
      return "Mango orchards benefit from farmyard manure, organic compost, and a balanced NPK fertilizer application before and after monsoon.";
    }
    if (msg.includes('fertilizer') || msg.includes('urea') || msg.includes('dap') || msg.includes('npk')) {
      return "Chemical fertilizers like Urea, DAP, and NPK provide fast nutrients. However, combining them with organic Vermicompost improves soil structure and organic carbon.";
    }
    if (msg.includes('weather') || msg.includes('rain')) {
      return "In rainy conditions, avoid immediate nitrogen broadcasting as it causes leaching. Under hot, dry weather, always irrigate lightly after fertilizer application to prevent fertilizer burn.";
    }
    if (msg.includes('ph') || msg.includes('acid') || msg.includes('alkaline')) {
      return "Soil pH should ideally be between 6.0 and 7.2. For acidic soils (pH < 6.0), add lime. For alkaline soils (pH > 7.5), incorporate organic compost or gypsum.";
    }
    return "I'm not sure about that. Try asking about soil types (Red/Black/Sandy), crops (Cotton/Chilli/Banana/Mango), or pH levels!";
  }
};
export const getSpeechEmulationText = (lang = 'en') => {
  if (lang === 'kn') {
    const list = [
      "ನನಗೆ ಮೆಣಸಿನಕಾಯಿ ಬೆಳೆಗೆ ಕೆಂಪು ಮಣ್ಣಿನಲ್ಲಿ ರಸಗೊಬ್ಬರ ಶಿಫಾರಸು ಬೇಕು",
      "ಕಪ್ಪು ಮಣ್ಣಿನಲ್ಲಿ ಹತ್ತಿ ಬೆಳೆಗೆ ಯಾವ ಗೊಬ್ಬರ ಹಾಕಬೇಕು?",
      "ಮಣ್ಣಿನ ರಸಸಾರ pH 5.5 ಇದ್ದರೆ ಏನು ಮಾಡಬೇಕು?"
    ];
    return list[Math.floor(Math.random() * list.length)];
  } else {
    const list = [
      "I need a fertilizer recommendation for Cotton in Black soil",
      "What is the best fertilizer for Chilli in Red soil with pH 6.5?",
      "How to treat high alkaline clay soil?"
    ];
    return list[Math.floor(Math.random() * list.length)];
  }
};
export const mockWeatherAPI = async (location) => {
  // Simulate weather based on location hash
  const loc = location || 'Bengaluru';
  const conditions = ['Sunny', 'Rainy', 'Humid', 'Dry'];
  const hash = loc.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const temp = 22 + (hash % 15);
  const humidity = 40 + (hash % 50);
  const condition = conditions[hash % conditions.length];
  
  return {
    location: loc,
    temperature: temp,
    humidity: humidity,
    condition: condition,
    windSpeed: 8 + (hash % 10),
    forecast: [
      { day: 'Today', temp: temp, cond: condition },
      { day: 'Tomorrow', temp: temp + 1, cond: condition === 'Rainy' ? 'Humid' : condition },
      { day: 'Day 3', temp: temp - 1, cond: 'Sunny' }
    ]
  };
};
