-- Supabase Setup Script for Raita Mitra Fertilizer Recommendation System
-- Paste this script into the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql) and run it.

-- 1. Enable UUID Extension (in case it is not enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS recommendations;
DROP TABLE IF EXISTS soil_reports;
DROP TABLE IF EXISTS farmers;
DROP TABLE IF EXISTS fertilizers;

-- 3. Create 'fertilizers' table
CREATE TABLE fertilizers (
    id TEXT PRIMARY KEY,
    fertilizer_name TEXT NOT NULL,
    suitable_soil TEXT[] NOT NULL,
    suitable_crop TEXT[] NOT NULL,
    quantity_per_acre TEXT NOT NULL,
    water_requirement TEXT NOT NULL,
    best_season TEXT NOT NULL,
    organic_alternatives TEXT[] NOT NULL,
    suitability_score NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create 'farmers' table
CREATE TABLE farmers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create 'soil_reports' table
CREATE TABLE soil_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    soil_type TEXT NOT NULL,
    nitrogen NUMERIC NOT NULL,
    phosphorus NUMERIC NOT NULL,
    potassium NUMERIC NOT NULL,
    ph NUMERIC NOT NULL,
    moisture NUMERIC DEFAULT 40,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create 'recommendations' table
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    soil_report_id UUID REFERENCES soil_reports(id) ON DELETE CASCADE,
    crop_name TEXT NOT NULL,
    fertilizer_id TEXT REFERENCES fertilizers(id) ON DELETE SET NULL,
    recommendation_result JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Insert Initial Fertilizer Data
INSERT INTO fertilizers (id, fertilizer_name, suitable_soil, suitable_crop, quantity_per_acre, water_requirement, best_season, organic_alternatives, suitability_score) VALUES
('f1', 'Urea', ARRAY['Red soil', 'Black soil', 'Sandy soil'], ARRAY['Cotton', 'Paddy', 'Sugarcane'], '50 kg', 'High', 'Rainy/Kharif', ARRAY['Compost', 'Vermicompost'], 90),
('f2', 'DAP', ARRAY['Red soil', 'Black soil'], ARRAY['Cotton', 'Tomato', 'Paddy'], '40 kg', 'Medium', 'Sowing season', ARRAY['Bone meal', 'Farmyard manure'], 95),
('f3', 'Compost', ARRAY['Red soil', 'Sandy soil', 'Clay soil'], ARRAY['Chilli', 'Tomato', 'Banana', 'Mango', 'Grapes'], '2 tons', 'Low', 'Any season', ARRAY['Vermicompost', 'Leaf mold'], 100),
('f4', 'Vermicompost', ARRAY['Red soil', 'Sandy soil', 'Clay soil'], ARRAY['Chilli', 'Tomato', 'Banana', 'Mango', 'Grapes'], '1.5 tons', 'Low', 'Any season', ARRAY['Compost', 'Bio-fertilizers'], 100),
('f5', 'NPK 19:19:19', ARRAY['Red soil', 'Clay soil'], ARRAY['Chilli', 'Tomato', 'Mango', 'Grapes'], '25 kg', 'Medium', 'Growth stage', ARRAY['Balanced organic manure'], 85),
('f6', 'SSP (Single Super Phosphate)', ARRAY['Black soil'], ARRAY['Groundnut', 'Paddy', 'Sugarcane'], '75 kg', 'Medium', 'Pre-sowing', ARRAY['Rock phosphate'], 90),
('f7', 'Zinc Sulphate', ARRAY['Black soil', 'Clay soil'], ARRAY['Cotton', 'Chilli', 'Paddy'], '10 kg', 'Medium', 'Early vegetative stage', ARRAY['Chelated zinc', 'Zinc-compost'], 80),
('f8', 'Potash Fertilizers (MOP)', ARRAY['Black soil', 'Sandy soil'], ARRAY['Banana', 'Grapes', 'Sugarcane'], '30 kg', 'High', 'Fruit development', ARRAY['Wood ash', 'Kelp meal'], 95);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE fertilizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE soil_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS Policies for public access (so client can query/insert anonymously)
CREATE POLICY "Allow public select" ON fertilizers FOR SELECT USING (true);
CREATE POLICY "Allow public select" ON farmers FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON farmers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select" ON soil_reports FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON soil_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select" ON recommendations FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON recommendations FOR INSERT WITH CHECK (true);
