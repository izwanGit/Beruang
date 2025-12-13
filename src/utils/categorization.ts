// src/utils/categorization.ts

import { Platform } from 'react-native';
import { PREDICT_TRANSACTION_URL } from '../config/urls';

type CategoryResult = {
  category: 'needs' | 'wants' | 'savings' | 'income';
  subCategory: string;
  isAi?: boolean;
};

// --- AI Categorization Function ---
export const categorizeTransaction = async (description: string): Promise<CategoryResult> => {
  try {
    console.log(`[AI] 📡 Connecting to: ${PREDICT_TRANSACTION_URL}`);
    console.log(`[AI] 🔍 Asking to categorize: "${description}"...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(PREDICT_TRANSACTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ description }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI] ❌ Server error: ${response.status}: ${errorText}`);
      throw new Error(`Server status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`[AI] ✅ Result: ${data.prediction.category} - ${data.prediction.subcategory}`);

    return {
      category: data.prediction.category.toLowerCase(),
      subCategory: data.prediction.subcategory,
      isAi: true, 
    };

  } catch (error) {
    console.warn('[AI] ⚠️ Offline/Fallback Mode triggered:', error);
    
    // Failover to local logic
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
    'Financial Services': ['rent', 'sewa', 'insurance', 'tax', 'loan', 'ptptn'],
    'Food & Beverage': ['grocery', 'groceries', 'medication', 'medicine', 'rice', 'nasi', 'chicken'],
    Transportation: ['transport', 'fuel', 'minyak', 'petrol', 'tng', 'tol', 'rapidkl'],
    Telecommunication: ['internet', 'phone', 'bill', 'utilities', 'electricity', 'water'],
    Others: ['doctor', 'clinic', 'school', 'repair', 'maintenance'],
  };

  // Wants subcategories
  const wantsMap: Record<string, string[]> = {
    'Food & Beverage': ['starbucks', 'coffee', 'kopi', 'tealive', 'mcd', 'kfc', 'restaurant'],
    Entertainment: ['movie', 'cinema', 'game', 'netflix', 'spotify'],
    Shopping: ['shopping', 'shopee', 'lazada', 'clothes', 'zara', 'uniqlo'],
    Others: ['vacation', 'hobby', 'gym'],
  };

  for (const [sub, keywords] of Object.entries(needsMap)) {
    if (keywords.some(kw => desc.includes(kw))) return { category: 'needs', subCategory: sub };
  }
  for (const [sub, keywords] of Object.entries(wantsMap)) {
    if (keywords.some(kw => desc.includes(kw))) return { category: 'wants', subCategory: sub };
  }
  
  // Default
  return { category: 'wants', subCategory: 'Others' }; 
};