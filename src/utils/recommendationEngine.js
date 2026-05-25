/**
 * Recommendation logic for Agriculture Fertilizer System
 * Extended with multiple crop configurations.
 */

export function analyzeSoilAndCrop(inputs) {
  const {
    farmerName,
    location,
    soilType,
    cropType,
    plantCategory,
    nitrogen,
    phosphorus,
    potassium,
    ph,
    weatherCondition
  } = inputs;

  const N = parseFloat(nitrogen) || 0;
  const P = parseFloat(phosphorus) || 0;
  const K = parseFloat(potassium) || 0;
  const pHVal = parseFloat(ph) || 7.0;

  // Ideal N-P-K targets based on plant category and crop type
  let targetN = 50;
  let targetP = 40;
  let targetK = 40;
  let waterRequirement = 'Medium';
  let bestSeason = 'Any Season';
  let suggestedFertilizer = '';
  let quantityPerAc = '50 kg';
  let organicAlternatives = ['Compost', 'Vermicompost'];
  const soilAmendments = [];

  // Extended Crop Rules logic
  switch (cropType) {
    // COMMERCIAL CROPS
    case 'Cotton':
      targetN = 80; targetP = 40; targetK = 40;
      waterRequirement = 'Medium';
      bestSeason = 'Rainy/Kharif (June - October)';
      suggestedFertilizer = soilType === 'Black soil' ? 'DAP' : 'Urea';
      organicAlternatives = ['Farmyard manure', 'Neem cake'];
      break;
    case 'Sugarcane':
      targetN = 150; targetP = 80; targetK = 80;
      waterRequirement = 'Very High';
      bestSeason = 'Spring/Early Summer';
      suggestedFertilizer = 'Urea';
      organicAlternatives = ['Press mud compost', 'Green manure', 'Trash mulching'];
      break;
    case 'Paddy':
      targetN = 100; targetP = 50; targetK = 50;
      waterRequirement = 'Very High';
      bestSeason = 'Monsoon (Kharif)';
      suggestedFertilizer = 'Urea';
      organicAlternatives = ['Azolla biofertilizer', 'Sesbania green manure'];
      break;
    case 'Groundnut':
      targetN = 25; targetP = 50; targetK = 40;
      waterRequirement = 'Low';
      bestSeason = 'Kharif/Rabi';
      suggestedFertilizer = 'SSP (Single Super Phosphate)';
      organicAlternatives = ['Gypsum with Farmyard manure', 'Rhizobium cultures'];
      break;
    case 'Maize':
      targetN = 120; targetP = 60; targetK = 40;
      waterRequirement = 'Medium';
      bestSeason = 'Kharif/Rabi';
      suggestedFertilizer = 'NPK 19:19:19';
      organicAlternatives = ['Poultry manure', 'Compost'];
      break;
    case 'Ragi':
      targetN = 60; targetP = 30; targetK = 30;
      waterRequirement = 'Low';
      bestSeason = 'Rainy (Kharif)';
      suggestedFertilizer = 'DAP';
      organicAlternatives = ['Farmyard manure', 'Vermicompost'];
      break;
    case 'Tobacco':
      targetN = 40; targetP = 50; targetK = 120; // Needs low chlorine, high potassium
      waterRequirement = 'Medium';
      bestSeason = 'Post-monsoon';
      suggestedFertilizer = 'Sulphate of Potash (SOP)';
      organicAlternatives = ['Well-decomposed organic manure'];
      break;
    case 'Coffee':
      targetN = 100; targetP = 80; targetK = 110;
      waterRequirement = 'High';
      bestSeason = 'Pre-monsoon shower showers';
      suggestedFertilizer = 'NPK Complex (17:17:17)';
      organicAlternatives = ['Coffee pulp compost', 'Cattle manure'];
      break;
    case 'Arecanut':
      targetN = 100; targetP = 40; targetK = 140;
      waterRequirement = 'High';
      bestSeason = 'Post-monsoon (September - October)';
      suggestedFertilizer = 'Potash Fertilizers (MOP)';
      organicAlternatives = ['Green leaf mulching', 'Areca husk compost'];
      break;
    case 'Coconut':
      targetN = 500; targetP = 320; targetK = 1200; // g/palm/year represented as targets
      targetN = 90; targetP = 60; targetK = 150; // scaled for analysis
      waterRequirement = 'High';
      bestSeason = 'Monsoon (June - July)';
      suggestedFertilizer = 'NPK 15:15:15 + Neem Cake';
      organicAlternatives = ['Coir pith compost', 'Seaweed extract'];
      break;

    // VEGETABLES
    case 'Chilli':
      targetN = 60; targetP = 50; targetK = 50;
      waterRequirement = 'Medium';
      bestSeason = 'Kharif/Rabi';
      suggestedFertilizer = 'NPK 19:19:19';
      organicAlternatives = ['Vermicompost', 'Neem cake powder'];
      break;
    case 'Tomato':
      targetN = 60; targetP = 60; targetK = 60;
      waterRequirement = 'High';
      bestSeason = 'Year-round';
      suggestedFertilizer = 'NPK 19:19:19';
      organicAlternatives = ['Bone meal', 'Compost'];
      break;
    case 'Brinjal':
      targetN = 80; targetP = 60; targetK = 50;
      waterRequirement = 'Medium';
      bestSeason = 'Kharif/Summer';
      suggestedFertilizer = 'Urea + DAP blend';
      organicAlternatives = ['Vermicompost', 'Poultry manure'];
      break;
    case 'Onion':
      targetN = 100; targetP = 50; targetK = 80;
      waterRequirement = 'Medium';
      bestSeason = 'Rabi (Winter)';
      suggestedFertilizer = 'SSP + Potash (MOP)';
      organicAlternatives = ['Well-rotted farmyard manure'];
      break;
    case 'Potato':
      targetN = 120; targetP = 100; targetK = 120;
      waterRequirement = 'High';
      bestSeason = 'Winter (Rabi)';
      suggestedFertilizer = 'NPK 10:26:26';
      organicAlternatives = ['Compost', 'Wood ash'];
      break;
    case 'Lady Finger':
      targetN = 80; targetP = 50; targetK = 50;
      waterRequirement = 'Medium';
      bestSeason = 'Summer/Kharif';
      suggestedFertilizer = 'Urea';
      organicAlternatives = ['Vermicompost', 'Leaf manure'];
      break;
    case 'Beans':
      targetN = 30; targetP = 60; targetK = 45; // Legume fixates nitrogen
      waterRequirement = 'Medium';
      bestSeason = 'Winter/Summer';
      suggestedFertilizer = 'DAP';
      organicAlternatives = ['Rhizobium bio-fertilizer', 'Compost'];
      break;
    case 'Cucumber':
      targetN = 50; targetP = 40; targetK = 60;
      waterRequirement = 'High';
      bestSeason = 'Summer';
      suggestedFertilizer = 'NPK 19:19:19';
      organicAlternatives = ['Vermicompost', 'Fish emulsion'];
      break;
    case 'Cabbage':
      targetN = 120; targetP = 80; targetK = 80;
      waterRequirement = 'High';
      bestSeason = 'Winter (Rabi)';
      suggestedFertilizer = 'Urea + DAP';
      organicAlternatives = ['Chicken manure', 'Compost'];
      break;
    case 'Carrot':
      targetN = 60; targetP = 80; targetK = 100;
      waterRequirement = 'Medium';
      bestSeason = 'Winter (Rabi)';
      suggestedFertilizer = 'Potash Fertilizers (MOP)';
      organicAlternatives = ['Compost', 'Rock phosphate'];
      break;

    // FRUITS
    case 'Banana':
      targetN = 120; targetP = 40; targetK = 200;
      waterRequirement = 'Very High';
      bestSeason = 'Pre-monsoon planting';
      suggestedFertilizer = 'Potash Fertilizers (MOP)';
      organicAlternatives = ['Wood ash', 'Banana pseudostem compost'];
      break;
    case 'Mango':
      targetN = 50; targetP = 30; targetK = 60;
      waterRequirement = 'Low';
      bestSeason = 'Pre-monsoon (June)';
      suggestedFertilizer = 'Compost';
      organicAlternatives = ['Farmyard manure', 'Vermicompost'];
      break;
    case 'Grapes':
      targetN = 40; targetP = 40; targetK = 80;
      waterRequirement = 'Medium';
      bestSeason = 'Winter/Post-pruning';
      suggestedFertilizer = 'Potash Fertilizers (MOP)';
      organicAlternatives = ['Vermicompost', 'Fish emulsion'];
      break;
    case 'Papaya':
      targetN = 90; targetP = 90; targetK = 120;
      waterRequirement = 'High';
      bestSeason = 'Monsoon (June - July)';
      suggestedFertilizer = 'NPK 19:19:19';
      organicAlternatives = ['Poultry manure', 'Neem cake'];
      break;
    case 'Guava':
      targetN = 60; targetP = 60; targetK = 60;
      waterRequirement = 'Medium';
      bestSeason = 'Pre-monsoon (June)';
      suggestedFertilizer = 'Compost';
      organicAlternatives = ['Farmyard manure', 'Vermicompost'];
      break;
    case 'Pomegranate':
      targetN = 80; targetP = 40; targetK = 80;
      waterRequirement = 'Low (Drip irrigation)';
      bestSeason = 'Bahhar treatment (June/December)';
      suggestedFertilizer = 'NPK 19:19:19';
      organicAlternatives = ['Vermicompost', 'Sheep manure'];
      break;
    case 'Sapota':
      targetN = 50; targetP = 40; targetK = 80;
      waterRequirement = 'Low';
      bestSeason = 'Monsoon';
      suggestedFertilizer = 'Compost + SSP';
      organicAlternatives = ['Farmyard manure', 'Castor cake'];
      break;
    case 'Orange':
      targetN = 100; targetP = 60; targetK = 100;
      waterRequirement = 'High';
      bestSeason = 'Pre-monsoon';
      suggestedFertilizer = 'NPK balanced fertilizer';
      organicAlternatives = ['Vermicompost', 'Leaf mold'];
      break;
    case 'Watermelon':
      targetN = 80; targetP = 40; targetK = 80;
      waterRequirement = 'High';
      bestSeason = 'Summer (December - March)';
      suggestedFertilizer = 'Urea + Potash';
      organicAlternatives = ['Compost', 'Poultry manure'];
      break;
    case 'Jackfruit':
      targetN = 40; targetP = 30; targetK = 50;
      waterRequirement = 'Low';
      bestSeason = 'Monsoon';
      suggestedFertilizer = 'Compost';
      organicAlternatives = ['Forest leaf compost', 'Farmyard manure'];
      break;

    default:
      targetN = 60; targetP = 50; targetK = 50;
      suggestedFertilizer = 'NPK 19:19:19';
  }

  // Plant category adjustments
  if (plantCategory === 'Fruit plants') {
    targetK += 20; // Fruit needs potassium
  } else if (plantCategory === 'Vegetable plants') {
    targetP += 10; // Root/flowering needs phosphorus
  }

  // 2. Analyze Soil Types
  if (soilType === 'Red soil') {
    // Red soil lacks N and organic matter
    if (N < 30) {
      suggestedFertilizer = 'Urea';
      quantityPerAc = '60 kg';
    } else {
      suggestedFertilizer = 'NPK 19:19:19';
      quantityPerAc = '40 kg';
    }
    if (pHVal < 6.0) {
      soilAmendments.push('Red soil is acidic. Apply agricultural lime (dolomite) to raise pH.');
    }
  } else if (soilType === 'Black soil') {
    // Rich in Ca & K, might lack Zn or P
    if (P < 30) {
      suggestedFertilizer = 'DAP';
      quantityPerAc = '45 kg';
    } else {
      suggestedFertilizer = 'Zinc Sulphate';
      quantityPerAc = '10 kg';
    }
    if (pHVal > 8.0) {
      soilAmendments.push('Black soil is alkaline. Add organic manure or gypsum to buffer pH.');
    }
  } else if (soilType === 'Sandy soil') {
    // High leaching, poor nutrients. Recommends compost/vermicompost to improve soil structure
    suggestedFertilizer = 'Vermicompost';
    quantityPerAc = '2 tons';
    waterRequirement = 'High (due to low water retention)';
    soilAmendments.push('Sandy soil has poor water retention. Apply biochar or organic matter.');
  } else if (soilType === 'Clay soil') {
    // Retains water, can become compacted
    suggestedFertilizer = 'Compost';
    quantityPerAc = '1.5 tons';
    waterRequirement = 'Low (high water retention)';
    soilAmendments.push('Clay soil compacts easily. Incorporate sand, gypsum or organic mulch to improve aeration.');
  }

  // 3. pH Analysis General
  if (pHVal < 5.5) {
    soilAmendments.push('Highly acidic soil (pH < 5.5). Apply 500kg lime per acre.');
  } else if (pHVal > 8.5) {
    soilAmendments.push('Highly alkaline soil (pH > 8.5). Apply gypsum or elemental sulfur to balance.');
  }

  // 4. Weather Condition Adjustments
  let weatherAlert = '';
  if (weatherCondition === 'Rainy') {
    waterRequirement = 'Very Low (Rainfall covers crop needs)';
    weatherAlert = 'Avoid applying urea or top-dressing fertilizers immediately before heavy rain to prevent runoff.';
  } else if (weatherCondition === 'Dry' || weatherCondition === 'Sunny') {
    if (waterRequirement === 'Low') waterRequirement = 'Medium';
    else if (waterRequirement === 'Medium') waterRequirement = 'High';
    weatherAlert = 'Ensure proper irrigation after applying chemical fertilizers to avoid root burn.';
  } else if (weatherCondition === 'Humid') {
    weatherAlert = 'High humidity increases pest & fungal disease risk. Keep foliage dry during watering.';
  }

  // 5. Suitability score calculation (0 - 100)
  // Penalize score if N-P-K or pH are drastically out of ideal bounds
  let penalty = 0;
  const nDiff = Math.abs(N - targetN);
  const pDiff = Math.abs(P - targetP);
  const kDiff = Math.abs(K - targetK);

  penalty += Math.min(nDiff * 0.5, 20);
  penalty += Math.min(pDiff * 0.5, 20);
  penalty += Math.min(kDiff * 0.5, 20);

  // pH penalty (ideal is 6.0 to 7.2)
  if (pHVal < 6.0) {
    penalty += (6.0 - pHVal) * 15;
  } else if (pHVal > 7.5) {
    penalty += (pHVal - 7.5) * 15;
  }

  const suitabilityScore = Math.max(10, Math.round(100 - penalty));

  // Determine crop health status rating based on suitability
  let cropHealthStatus = 'Excellent';
  if (suitabilityScore < 50) cropHealthStatus = 'Critical / Poor';
  else if (suitabilityScore < 75) cropHealthStatus = 'Moderate';

  return {
    farmerName,
    location,
    soilType,
    cropType,
    plantCategory,
    nitrogen: N,
    phosphorus: P,
    potassium: K,
    ph: pHVal,
    weatherCondition,
    targetN,
    targetP,
    targetK,
    suggestedFertilizer,
    quantityPerAc,
    waterRequirement,
    bestSeason,
    organicAlternatives,
    soilAmendments,
    suitabilityScore,
    cropHealthStatus,
    weatherAlert,
    created_at: new Date().toISOString()
  };
}
