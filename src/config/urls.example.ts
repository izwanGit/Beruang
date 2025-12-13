// src/config/urls.example.ts - TEMPLATE FILE
export const URLS = {
  // ⚠️ COPY THIS FILE to urls.ts and replace with your actual ngrok URLs
  AI_SERVER: 'REPLACE_WITH_YOUR_AI_NGROK_URL',
  METRO_SERVER: 'REPLACE_WITH_YOUR_METRO_NGROK_URL',
  
  // Endpoints
  PREDICT_TRANSACTION: '/predict-transaction',
  CHAT: '/chat',
  CHAT_STREAM: '/chat/stream',
};

export const AI_SERVER_URL = URLS.AI_SERVER;
export const PREDICT_TRANSACTION_URL = `${URLS.AI_SERVER}${URLS.PREDICT_TRANSACTION}`;
export const CHAT_URL = `${URLS.AI_SERVER}${URLS.CHAT}`;
export const CHAT_STREAM_URL = `${URLS.AI_SERVER}${URLS.CHAT_STREAM}`;