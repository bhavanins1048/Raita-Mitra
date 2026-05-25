import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ljaxkpfpivcdkxqyxmvb.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_sb2dd2gIemtOiOjpEcYx8A_DIwzjPk5'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// In case the tables do not exist or we get RLS/permission issues, we define a fallback LocalStorageDB system
const MOCK_FERTILIZERS = [
  {
    id: 'f1',
    fertilizer_name: 'Urea',
    suitable_soil: ['Red soil', 'Black soil', 'Sandy soil'],
    suitable_crop: ['Cotton', 'Paddy', 'Sugarcane'],
    quantity_per_acre: '50 kg',
    water_requirement: 'High',
    best_season: 'Rainy/Kharif',
    organic_alternatives: ['Compost', 'Vermicompost'],
    suitability_score: 90
  },
  {
    id: 'f2',
    fertilizer_name: 'DAP',
    suitable_soil: ['Red soil', 'Black soil'],
    suitable_crop: ['Cotton', 'Tomato', 'Paddy'],
    quantity_per_acre: '40 kg',
    water_requirement: 'Medium',
    best_season: 'Sowing season',
    organic_alternatives: ['Bone meal', 'Farmyard manure'],
    suitability_score: 95
  },
  {
    id: 'f3',
    fertilizer_name: 'Compost',
    suitable_soil: ['Red soil', 'Sandy soil', 'Clay soil'],
    suitable_crop: ['Chilli', 'Tomato', 'Banana', 'Mango', 'Grapes'],
    quantity_per_acre: '2 tons',
    water_requirement: 'Low',
    best_season: 'Any season',
    organic_alternatives: ['Vermicompost', 'Leaf mold'],
    suitability_score: 100
  },
  {
    id: 'f4',
    fertilizer_name: 'Vermicompost',
    suitable_soil: ['Red soil', 'Sandy soil', 'Clay soil'],
    suitable_crop: ['Chilli', 'Tomato', 'Banana', 'Mango', 'Grapes'],
    quantity_per_acre: '1.5 tons',
    water_requirement: 'Low',
    best_season: 'Any season',
    organic_alternatives: ['Compost', 'Bio-fertilizers'],
    suitability_score: 100
  },
  {
    id: 'f5',
    fertilizer_name: 'NPK 19:19:19',
    suitable_soil: ['Red soil', 'Clay soil'],
    suitable_crop: ['Chilli', 'Tomato', 'Mango', 'Grapes'],
    quantity_per_acre: '25 kg',
    water_requirement: 'Medium',
    best_season: 'Growth stage',
    organic_alternatives: ['Balanced organic manure'],
    suitability_score: 85
  },
  {
    id: 'f6',
    fertilizer_name: 'SSP (Single Super Phosphate)',
    suitable_soil: ['Black soil'],
    suitable_crop: ['Groundnut', 'Paddy', 'Sugarcane'],
    quantity_per_acre: '75 kg',
    water_requirement: 'Medium',
    best_season: 'Pre-sowing',
    organic_alternatives: ['Rock phosphate'],
    suitability_score: 90
  },
  {
    id: 'f7',
    fertilizer_name: 'Zinc Sulphate',
    suitable_soil: ['Black soil', 'Clay soil'],
    suitable_crop: ['Cotton', 'Chilli', 'Paddy'],
    quantity_per_acre: '10 kg',
    water_requirement: 'Medium',
    best_season: 'Early vegetative stage',
    organic_alternatives: ['Chelated zinc', 'Zinc-compost'],
    suitability_score: 80
  },
  {
    id: 'f8',
    fertilizer_name: 'Potash Fertilizers (MOP)',
    suitable_soil: ['Black soil', 'Sandy soil'],
    suitable_crop: ['Banana', 'Grapes', 'Sugarcane'],
    quantity_per_acre: '30 kg',
    water_requirement: 'High',
    best_season: 'Fruit development',
    organic_alternatives: ['Wood ash', 'Kelp meal'],
    suitability_score: 95
  }
];

export const getLocalStorageData = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Local storage read error", e);
    return null;
  }
}

export const setLocalStorageData = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error("Local storage write error", e);
  }
}

export const dbService = {
  async getFertilizers() {
    try {
      const { data, error } = await supabase.from('fertilizers').select('*');
      if (error || !data || data.length === 0) throw new Error(error?.message || "No data");
      return data;
    } catch (err) {
      console.warn("Using mock fertilizers fallback:", err.message);
      let local = getLocalStorageData('agri_fertilizers');
      if (!local || local.length === 0) {
        setLocalStorageData('agri_fertilizers', MOCK_FERTILIZERS);
        local = MOCK_FERTILIZERS;
      }
      return local;
    }
  },

  async saveRecommendation(recommendation) {
    try {
      // 1. Insert Farmer
      const { data: farmerData, error: fError } = await supabase
        .from('farmers')
        .insert([{ name: recommendation.farmerName, location: recommendation.location }])
        .select()
        .single();
      
      if (fError) throw fError;

      // 2. Insert Soil Report
      const { data: soilData, error: sError } = await supabase
        .from('soil_reports')
        .insert([{
          farmer_id: farmerData.id,
          soil_type: recommendation.soilType,
          nitrogen: recommendation.nitrogen,
          phosphorus: recommendation.phosphorus,
          potassium: recommendation.potassium,
          ph: recommendation.ph,
          moisture: recommendation.moisture || 40
        }])
        .select()
        .single();

      if (sError) throw sError;

      // 3. Find Fertilizer ID
      const fertilizers = await this.getFertilizers();
      const fert = fertilizers.find(f => f.fertilizer_name.toLowerCase() === recommendation.suggestedFertilizer.toLowerCase());
      const fertilizerId = fert ? fert.id : null;

      // 4. Save Recommendation
      const { data: recData, error: rError } = await supabase
        .from('recommendations')
        .insert([{
          farmer_id: farmerData.id,
          soil_report_id: soilData.id,
          crop_name: recommendation.cropType,
          fertilizer_id: fertilizerId,
          recommendation_result: recommendation
        }])
        .select()
        .single();

      if (rError) throw rError;
      return recData;
    } catch (err) {
      console.warn("Using local storage fallback to save recommendation:", err.message);
      
      const farmers = getLocalStorageData('agri_farmers') || [];
      const newFarmer = { id: 'farmer_' + Date.now(), name: recommendation.farmerName, location: recommendation.location };
      farmers.push(newFarmer);
      setLocalStorageData('agri_farmers', farmers);

      const recommendations = getLocalStorageData('agri_recommendations') || [];
      const newRec = {
        id: 'rec_' + Date.now(),
        farmer_id: newFarmer.id,
        crop_name: recommendation.cropType,
        recommendation_result: {
          ...recommendation,
          id: 'rec_' + Date.now(),
          created_at: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      };
      recommendations.unshift(newRec); // Latest first
      setLocalStorageData('agri_recommendations', recommendations);

      return newRec;
    }
  },

  async getRecommendationHistory() {
    try {
      const { data, error } = await supabase
        .from('recommendations')
        .select('*, farmers(*), soil_reports(*), fertilizers(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(item => ({
        ...item.recommendation_result,
        id: item.id,
        created_at: item.created_at
      }));
    } catch (err) {
      console.warn("Using local storage fallback to get recommendation history:", err.message);
      const recs = getLocalStorageData('agri_recommendations') || [];
      return recs.map(r => r.recommendation_result);
    }
  },

  async clearHistory() {
    try {
      // Clear in local storage
      setLocalStorageData('agri_recommendations', []);
      setLocalStorageData('agri_farmers', []);
      
      // Also try database deletion if available (optional)
      await supabase.from('recommendations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (err) {
      console.warn("Local clear finished. DB clear omitted or failed:", err.message);
    }
  }
};
