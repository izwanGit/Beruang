// src/utils/categorization.ts

// --- CONFIGURATION ---
// For Android Emulator use: 'http://10.0.2.2:1234/predict'
// For Physical Device use your PC's IP: 'http://192.168.0.8:1234/predict'
const AI_SERVER_URL = 'http://192.168.0.8:1234/predict';

type CategoryResult = {
  category: 'needs' | 'wants' | 'savings' | 'income';
  subCategory: string;
  isAi?: boolean;
};

// --- AI Categorization Function ---
export const categorizeTransaction = async (description: string): Promise<CategoryResult> => {
  try {
    console.log(`[AI] Asking server to categorize: "${description}"...`);

    // 1. Call the Python/Node server with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(AI_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();

    // 2. Map Server Response to App Schema
    // Server returns: { prediction: { category: "WANTS", subcategory: "Food & Beverage" } }
    return {
      category: data.prediction.category.toLowerCase(),
      subCategory: data.prediction.subcategory,
      isAi: true, 
    };

  } catch (error) {
    console.log('[AI] Categorization server failed/offline. Using fallback.', error);
    
    // 3. Failover to local logic
    const fallbackResult = simpleCategorizeFallback(description);
    return {
      ...fallbackResult,
      isAi: false,
    };
  }
};

// --- Simple Fallback Categorization (Offline) ---
export const simpleCategorizeFallback = (description: string): CategoryResult => {
  const desc = description.toLowerCase();
  
  // Needs subcategories
  const needsMap: Record<string, string[]> = {
    'Financial Services': [
      'rent', 'sewa', 'insurance', 'insurans', 'tax', 'cukai',
      'loan', 'ptptn', 'ansuran',
    ],
    'Food & Beverage': [
      'grocery', 'groceries', 'medication', 'medicine', 'ubat',
      'susu', 'formula', 'restaurant', 'restoran', 'rice', 'nasi', 'chicken', 'ayam'
    ],
    Transportation: [
      'transport', 'tambang', 'fuel', 'minyak', 'petrol', 'gas',
      'tng', 'tol', 'rapidkl', 'roadtax', 'tayar', 'tire',
    ],
    Telecommunication: [
      'internet', 'phone', 'telefon', 'bill', 'bil', 'utilities',
      'electricity', 'elektrik', 'tnb', 'water', 'air',
    ],
    Others: [
      'doctor', 'klinik', 'hospital', 'school', 'sekolah', 'textbook',
      'buku', 'repair', 'baiki', 'maintenance', 'servis', 'toiletries',
      'tandas', 'hygiene', 'yuran', 'bayar', 'pampers', 'diaper',
    ],
  };

  // Wants subcategories
  const wantsMap: Record<string, string[]> = {
    'Food & Beverage': [
      'starbucks', 'coffee', 'kopi', 'tealive', 'chatime',
      'durian', 'grabfood', 'foodpanda',
    ],
    Entertainment: [
      'movie', 'wayang', 'cinema', 'game', 'entertainment',
      'concert', 'konsert', 'karaoke', '4d', 'viu', 'tonton',
      'netflix', 'spotify', 'astro',
    ],
    Shopping: ['shopping', 'shopee', 'lazada', 'baju raya'],
    Others: [
      'vacation', 'percutian', 'hobby', 'gym', 'subscription',
      'langganan', 'delivery', 'membership',
    ],
  };

  for (const [sub, keywords] of Object.entries(needsMap)) {
    for (const kw of keywords) {
      if (desc.includes(kw)) return { category: 'needs', subCategory: sub };
    }
  }
  for (const [sub, keywords] of Object.entries(wantsMap)) {
    for (const kw of keywords) {
      if (desc.includes(kw)) return { category: 'wants', subCategory: sub };
    }
  }
  
  // Default if no keywords match
  return { category: 'wants', subCategory: 'Others' }; 
};