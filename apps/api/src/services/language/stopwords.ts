import { SupportedLanguage } from './types';

/**
 * English stop words
 */
export const STOP_WORDS_EN = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
]);

/**
 * Hindi stop words
 */
export const STOP_WORDS_HI = new Set([
  'और', 'का', 'की', 'है', 'में', 'यह', 'से', 'को', 'एक', 'पर', 'के', 'ने', 'हैं', 'हैं', 'हैं',
  'मैं', 'तुम', 'वह', 'हम', 'आप', 'उन्हें', 'मुझे', 'उसे', 'हमें', 'उन्हें', 'मेरा', 'तुम्हारा', 'उसका', 'हमारा', 'उनका',
  'यह', 'वह', 'ये', 'वे', 'मैं', 'तुम', 'वह', 'हम', 'आप', 'उन्हें', 'मुझे', 'उसे', 'हमें', 'उन्हें',
  'कर', 'करता', 'करती', 'करते', 'करना', 'करने', 'किया', 'की', 'किए', 'करें', 'करेंगे', 'करेंगी', 'करेंगे',
  'हो', 'होता', 'होती', 'होते', 'होना', 'होने', 'हुआ', 'हुई', 'हुए', 'हों', 'होंगे', 'होंगी', 'होंगे',
  'जा', 'जाता', 'जाती', 'जाते', 'जाना', 'जाने', 'गया', 'गई', 'गए', 'जाएं', 'जाएंगे', 'जाएंगी', 'जाएंगे',
  'आ', 'आता', 'आती', 'आते', 'आना', 'आने', 'आया', 'आई', 'आए', 'आएं', 'आएंगे', 'आएंगी', 'आएंगे',
  'दे', 'देता', 'देती', 'देते', 'देना', 'देने', 'दिया', 'दी', 'दिए', 'दें', 'देंगे', 'देंगी', 'देंगे',
  'ले', 'लेता', 'लेती', 'लेते', 'लेना', 'लेना', 'लिया', 'ली', 'लिए', 'लें', 'लेंगे', 'लेंगी', 'लेंगे'
]);

/**
 * Urdu stop words
 */
export const STOP_WORDS_UR = new Set([
  'اور', 'کا', 'کی', 'ہے', 'میں', 'یہ', 'سے', 'کو', 'ایک', 'پر', 'کے', 'نے', 'ہیں',
  'میں', 'تم', 'وہ', 'ہم', 'آپ', 'ان', 'مجھے', 'اسے', 'ہمیں', 'میرا', 'تمہارا', 'اس کا', 'ہمارا', 'ان کا',
  'کر', 'کرتا', 'کرتی', 'کرتے', 'کرنا', 'کرنے', 'کیا', 'کی', 'کیے', 'کریں',
  'ہو', 'ہوتا', 'ہوتی', 'ہوتے', 'ہونا', 'ہونے', 'ہوا', 'ہوئی', 'ہوئے', 'ہوں',
  'جا', 'جاتا', 'جاتی', 'جاتے', 'جانا', 'جانے', 'گیا', 'گئی', 'گئے', 'جائیں',
  'آ', 'آتا', 'آتی', 'آتے', 'آنا', 'آنے', 'آیا', 'آئی', 'آئے', 'آئیں',
  'دے', 'دیتا', 'دیتی', 'دیتے', 'دینا', 'دینے', 'دیا', 'دی', 'دیے', 'دیں',
  'لے', 'لیتا', 'لیتی', 'لیتے', 'لینا', 'لینا', 'لیا', 'لی', 'لیے', 'لیں'
]);

/**
 * Urdu-English stop words (combination)
 */
export const STOP_WORDS_UR_EN = new Set([
  ...STOP_WORDS_EN,
  ...STOP_WORDS_UR,
  'kya', 'hai', 'aur', 'mein', 'yeh', 'se', 'ko', 'ka', 'ki', 'ke'
]);

/**
 * Hinglish stop words (combination of English and Hindi)
 */
export const STOP_WORDS_HINGLISH = new Set([
  // English stop words
  ...STOP_WORDS_EN,
  // Common Hinglish words
  'kya', 'hai', 'aur', 'mein', 'yeh', 'toh', 'ko', 'se', 'par', 'ke', 'ki', 'ka', 'ne', 'koi', 'kuch', 'sab', 'abhi', 'phir', 'bhi', 'ya', 'nahi', 'kyun', 'kaise', 'kahan', 'kab',
  'accha', 'badhiya', 'khush', 'pyaar', 'sundar', 'amazing', 'best', 'good', 'nice', 'beautiful',
  'bura', 'gussa', 'dukh', 'nafrat', 'bad', 'worst', 'hate', 'angry', 'sad',
  'kya', 'hai', 'aur', 'mein', 'yeh', 'toh', 'ko', 'se', 'par', 'ke', 'ki', 'ka', 'ne', 'koi', 'kuch', 'sab', 'abhi', 'phir', 'bhi', 'ya', 'nahi', 'kyun', 'kaise', 'kahan', 'kab'
]);

/**
 * Get stop words for a specific language
 */
export function getStopWords(language: SupportedLanguage): Set<string> {
  switch (language) {
    case 'en':
      return STOP_WORDS_EN;
    case 'hi':
      return STOP_WORDS_HI;
    case 'ur':
      return STOP_WORDS_UR;
    case 'hi-en':
      return STOP_WORDS_HINGLISH;
    case 'ur-en':
      return STOP_WORDS_UR_EN;
    default:
      return STOP_WORDS_EN;
  }
}
