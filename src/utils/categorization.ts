// src/utils/categorization.ts

// --- AI Categorization Function ---
// This will call your *new* server, but we'll keep the fallback just in case.
export const categorizeTransaction = async (description: string) => {
  try {
    throw new Error('Classification server not implemented yet.');
  } catch (error) {
    console.log('AI categorization failed, using fallback:', error);
    return simpleCategorizeFallback(description);
  }
};

// --- Simple Fallback Categorization ---
export const simpleCategorizeFallback = (description: string) => {
  const desc = description.toLowerCase();
  // Needs subcategories
  const needsMap = {
    'Financial Services': [
      'rent', 'sewa', 'insurance', 'insurans', 'tax', 'cukai',
      'loan', 'ptptn', 'ansuran',
    ],
    'Food & Beverage': [
      'grocery', 'groceries', 'medication', 'medicine', 'ubat',
      'susu', 'formula', 'restaurant', 'restoran',
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
  const wantsMap = {
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
  return { category: 'wants', subCategory: 'Others' }; // Default
};