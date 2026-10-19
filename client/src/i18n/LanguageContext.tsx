import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { enTranslations } from './locales/en';
import { mrTranslations } from './locales/mr';

export type LanguageMode = 'mr' | 'en' | 'bilingual';

export interface LanguageOption {
  id: LanguageMode;
  label: string;
  name: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: 'mr', label: 'मराठी', name: 'मराठी' },
  { id: 'en', label: 'English', name: 'English' },
  { id: 'bilingual', label: 'मराठी + English', name: 'मराठी + English' },
];

const LANGUAGE_STORAGE_KEY = 'zp_language';
const HAS_DEVANAGARI = /[\u0900-\u097F]/;

// Known teacher names dictionary
const TEACHER_NAMES_MAP: Record<string, { mr: string; en: string }> = {
  'श्री. एस. आर. पाटील': { mr: 'श्री. एस. आर. पाटील', en: 'Shri. S. R. Patil' },
  'Shri. S. R. Patil': { mr: 'श्री. एस. आर. पाटील', en: 'Shri. S. R. Patil' },
  'श्री. रमेश वसंत पवार': { mr: 'श्री. रमेश वसंत पवार', en: 'Shri. Ramesh Vasant Pawar' },
  'Shri. Ramesh Vasant Pawar': { mr: 'श्री. रमेश वसंत पवार', en: 'Shri. Ramesh Vasant Pawar' },
  'Shri. R. V. Shinde': { mr: 'श्री. आर. व्ही. शिंदे', en: 'Shri. R. V. Shinde' },
  'श्री. आर. व्ही. शिंदे': { mr: 'श्री. आर. व्ही. शिंदे', en: 'Shri. R. V. Shinde' },
  'Shri. M. P. Patil': { mr: 'श्री. एम. पी. पाटील', en: 'Shri. M. P. Patil' },
  'श्री. एम. पी. पाटील': { mr: 'श्री. एम. पी. पाटील', en: 'Shri. M. P. Patil' },
  'Smt. S. S. Bhadane': { mr: 'श्रीमती एस. एस. भदाणे', en: 'Smt. S. S. Bhadane' },
  'श्रीमती एस. एस. भदाणे': { mr: 'श्रीमती एस. एस. भदाणे', en: 'Smt. S. S. Bhadane' },
  'श्रीमती कविता किशोर पाटील': { mr: 'श्रीमती कविता किशोर पाटील', en: 'Smt. Kavita Kishor Patil' },
  'Smt. Kavita Kishor Patil': { mr: 'श्रीमती कविता किशोर पाटील', en: 'Smt. Kavita Kishor Patil' },
};

// Known designations dictionary
const DESIGNATION_DICTIONARY: Record<string, { mr: string; en: string }> = {
  'headmaster': { mr: 'मुख्याध्यापक', en: 'Headmaster' },
  'मुख्याध्यापक': { mr: 'मुख्याध्यापक', en: 'Headmaster' },
  'senior primary teacher': { mr: 'वरिष्ठ प्राथमिक शिक्षक', en: 'Senior Primary Teacher' },
  'वरिष्ठ प्राथमिक शिक्षक': { mr: 'वरिष्ठ प्राथमिक शिक्षक', en: 'Senior Primary Teacher' },
  'वरिष्ठ प्राथमिक शिक्षिका': { mr: 'वरिष्ठ प्राथमिक शिक्षक', en: 'Senior Primary Teacher' },
  'mathematics & science specialist': { mr: 'गणित व विज्ञान विषय शिक्षक', en: 'Mathematics & Science Specialist' },
  'गणित व विज्ञान विषय शिक्षक': { mr: 'गणित व विज्ञान विषय शिक्षक', en: 'Mathematics & Science Specialist' },
  'primary teacher & sports in-charge': { mr: 'क्रीडा प्रमुख व प्राथमिक शिक्षक', en: 'Primary Teacher & Sports In-charge' },
  'क्रीडा प्रमुख शिक्षक': { mr: 'क्रीडा प्रमुख व प्राथमिक शिक्षक', en: 'Primary Teacher & Sports In-charge' },
  'क्रीडा प्रमुख व प्राथमिक शिक्षक': { mr: 'क्रीडा प्रमुख व प्राथमिक शिक्षक', en: 'Primary Teacher & Sports In-charge' },
  'language & digital literacy teacher': { mr: 'भाषा व संगणक शिक्षिका', en: 'Language & Digital Literacy Teacher' },
  'भाषा व संगणक शिक्षिका': { mr: 'भाषा व संगणक शिक्षिका', en: 'Language & Digital Literacy Teacher' },
  'भाषा व संगणक शिक्षक': { mr: 'भाषा व संगणक शिक्षिका', en: 'Language & Digital Literacy Teacher' },
  'assistant teacher': { mr: 'सहशिक्षक', en: 'Assistant Teacher' },
  'सहशिक्षक': { mr: 'सहशिक्षक', en: 'Assistant Teacher' },
  'सहायक प्राथमिक शिक्षक': { mr: 'सहायक प्राथमिक शिक्षक', en: 'Assistant Primary Teacher' },
  'primary teacher': { mr: 'प्राथमिक शिक्षक', en: 'Primary Teacher' },
  'प्राथमिक शिक्षक': { mr: 'प्राथमिक शिक्षक', en: 'Primary Teacher' },
};

// Class mappings
const CLASS_DICTIONARY: Record<string, { mr: string; en: string }> = {
  'इयत्ता १ ली': { mr: 'इयत्ता १ ली', en: 'Class 1st' },
  'इयत्ता २ री': { mr: 'इयत्ता २ री', en: 'Class 2nd' },
  'इयत्ता ३ री': { mr: 'इयत्ता ३ री', en: 'Class 3rd' },
  'इयत्ता ४ थी': { mr: 'इयत्ता ४ थी', en: 'Class 4th' },
  'इयत्ता ५ वी': { mr: 'इयत्ता ५ वी', en: 'Class 5th' },
  'इयत्ता ६ वी': { mr: 'इयत्ता ६ वी', en: 'Class 6th' },
  'इयत्ता ७ वी': { mr: 'इयत्ता ७ वी', en: 'Class 7th' },
  'वर्ग १ ला': { mr: 'इयत्ता १ ली', en: 'Class 1st' },
  'वर्ग २ रा': { mr: 'इयत्ता २ री', en: 'Class 2nd' },
  'वर्ग ३ रा': { mr: 'इयत्ता ३ री', en: 'Class 3rd' },
  'वर्ग ४ था': { mr: 'इयत्ता ४ थी', en: 'Class 4th' },
  'वर्ग ५ वी': { mr: 'इयत्ता ५ वी', en: 'Class 5th' },
  'वर्ग ६ वी': { mr: 'इयत्ता ६ वी', en: 'Class 6th' },
  'वर्ग ७ वी': { mr: 'इयत्ता ७ वी', en: 'Class 7th' },
  'class 1st': { mr: 'इयत्ता १ ली', en: 'Class 1st' },
  'class 2nd': { mr: 'इयत्ता २ री', en: 'Class 2nd' },
  'class 3rd': { mr: 'इयत्ता ३ री', en: 'Class 3rd' },
  'class 4th': { mr: 'इयत्ता ४ थी', en: 'Class 4th' },
  'class 5th': { mr: 'इयत्ता ५ वी', en: 'Class 5th' },
  'class 6th': { mr: 'इयत्ता ६ वी', en: 'Class 6th' },
  'class 7th': { mr: 'इयत्ता ७ वी', en: 'Class 7th' },
};

// Helper to sanitize Marathi strings (strip accidental English in parentheses or Latin letters)
export const cleanMarathi = (text: string): string => {
  if (!text) return '';
  return text.replace(/\s*\([A-Za-z0-9\s/&,.:;+_-]+\)/g, '').trim();
};

// Helper to sanitize English strings (strip accidental Devanagari in parentheses or characters)
export const cleanEnglish = (text: string): string => {
  if (!text) return '';
  // Check if string contains Devanagari inside parentheses: "Foo (मराठी)" -> "Foo"
  let cleaned = text.replace(/\s*\([\u0900-\u097F\s/&,.:;+_-]+\)/g, '').trim();
  // Check if string contains English inside parentheses with Devanagari outside: "मराठी (English)" -> "English"
  const outsideDevanagari = cleaned.match(/^[\u0900-\u097F\s,.:;+_-]+\(([A-Za-z0-9\s/&,.:;+_-]+)\)$/);
  if (outsideDevanagari) {
    return outsideDevanagari[1].trim();
  }
  // Strip any leftover Devanagari characters
  cleaned = cleaned.replace(/[\u0900-\u097F]+/g, '').trim();
  return cleaned || text;
};

/**
 * Universal bilingual parser that handles both:
 * - "Headmaster (मुख्याध्यापक)" [English outer, Marathi inner]
 * - "सहशिक्षक (Assistant Teacher)" [Marathi outer, English inner]
 */
export const parseBilingualString = (text: string): { mr: string; en: string } => {
  if (!text) return { mr: '', en: '' };

  const trimmed = text.trim();

  // Check known designation dictionary first
  const lowerKey = trimmed.toLowerCase();
  if (DESIGNATION_DICTIONARY[lowerKey]) {
    return DESIGNATION_DICTIONARY[lowerKey];
  }

  // Check for parenthesis: A (B)
  const parenMatch = trimmed.match(/^(.*?)\s*\(([^()]+)\)\s*$/);
  if (parenMatch) {
    const partA = parenMatch[1].trim();
    const partB = parenMatch[2].trim();

    if (HAS_DEVANAGARI.test(partB) && !HAS_DEVANAGARI.test(partA)) {
      // English (Marathi) e.g. "Headmaster (मुख्याध्यापक)"
      return { mr: partB, en: partA };
    }
    if (HAS_DEVANAGARI.test(partA) && !HAS_DEVANAGARI.test(partB)) {
      // Marathi (English) e.g. "सहशिक्षक (Assistant Teacher)"
      return { mr: partA, en: partB };
    }
  }

  // Devanagari text
  if (HAS_DEVANAGARI.test(trimmed)) {
    // Check if entire text has a known translation
    const known = DESIGNATION_DICTIONARY[trimmed];
    if (known) return known;
    return { mr: cleanMarathi(trimmed), en: cleanEnglish(trimmed) };
  }

  // Pure English text
  return { mr: cleanMarathi(trimmed), en: trimmed };
};

/**
 * Localizes a single string based on current language mode.
 */
export const localizeBilingualString = (text: string, lang: LanguageMode): string => {
  if (!text) return '';
  const parsed = parseBilingualString(text);

  if (lang === 'mr') {
    return parsed.mr || cleanMarathi(text);
  }
  if (lang === 'en') {
    return parsed.en || cleanEnglish(text);
  }
  // Bilingual: 'मराठी (English)'
  if (parsed.mr && parsed.en && parsed.mr !== parsed.en) {
    return `${parsed.mr} (${parsed.en})`;
  }
  return parsed.mr || parsed.en || text;
};

/**
 * Localizes a teacher's qualification string
 */
export const localizeQualification = (qual: string, lang: LanguageMode): string => {
  if (!qual) return '';
  if (lang === 'en') {
    return qual
      .replace(/मराठी व इतिहास/g, 'Marathi & History')
      .replace(/मराठी माध्यम/g, 'Marathi Medium')
      .replace(/गणित व भौतिकशास्त्र/g, 'Maths & Physics')
      .replace(/[\u0900-\u097F]+/g, '')
      .replace(/\(\s*\)/g, '')
      .trim();
  }
  if (lang === 'mr') {
    return qual
      .replace(/Marathi & History/gi, 'मराठी व इतिहास')
      .replace(/Marathi Medium/gi, 'मराठी माध्यम')
      .replace(/Maths & Physics/gi, 'गणित व भौतिकशास्त्र')
      .replace(/\([A-Za-z\s/&,.:;+_-]+\)/g, '')
      .trim();
  }
  // Bilingual: 'मराठी (English)'
  return qual;
};

/**
 * Localizes a class badge (e.g. "वर्ग ५ वी" -> "Class 5th")
 */
export const localizeClass = (cls: string, lang: LanguageMode): string => {
  if (!cls) return '';
  const key = cls.trim().toLowerCase();
  const found = CLASS_DICTIONARY[key] || CLASS_DICTIONARY[cls.trim()];
  if (found) {
    if (lang === 'mr') return found.mr;
    if (lang === 'en') return found.en;
    return `${found.mr} (${found.en})`;
  }
  if (lang === 'en') {
    const numMatch = cls.match(/\d+/);
    if (numMatch) return `Class ${numMatch[0]}`;
  }
  return cls;
};

/**
 * Localizes a subject name
 */
export const localizeSubject = (subj: string, lang: LanguageMode): string => {
  if (!subj) return '';
  if (lang === 'en') {
    return subj
      .replace(/मराठी,\s*इतिहास व नागरिकशास्त्र,\s*प्रशासन/g, 'Marathi, History & Civics, Administration')
      .replace(/मराठी,\s*परिसर अभ्यास,\s*हस्तकला व कार्यानुभव/g, 'Marathi, Environmental Studies, Art & Craft')
      .replace(/गणित,\s*सामान्य विज्ञान,\s*इंग्रजी/g, 'Mathematics, General Science, English')
      .replace(/शारीरिक शिक्षण व क्रीडा,\s*भूगोल/g, 'Physical Education & Sports, Geography')
      .replace(/इंग्रजी,\s*संगणक साक्षरता,\s*हिंदी/g, 'English, Digital Literacy, Hindi')
      .replace(/विज्ञान,\s*इंग्रजी/g, 'Science, English')
      .replace(/गणित/g, 'Mathematics')
      .replace(/विज्ञान/g, 'Science')
      .replace(/इतिहास/g, 'History')
      .replace(/भूगोल/g, 'Geography')
      .replace(/मराठी/g, 'Marathi')
      .replace(/इंग्रजी/g, 'English')
      .replace(/हिंदी/g, 'Hindi');
  }
  if (lang === 'mr') {
    return subj
      .replace(/Mathematics,\s*General Science,\s*English/gi, 'गणित, सामान्य विज्ञान, इंग्रजी')
      .replace(/Science,\s*English/gi, 'विज्ञान, इंग्रजी')
      .replace(/English,\s*Digital Literacy,\s*Hindi/gi, 'इंग्रजी, संगणक साक्षरता, हिंदी');
  }
  return subj;
};

/**
 * Localizes teacher name
 */
export const localizeTeacherName = (name: string, lang: LanguageMode): string => {
  if (!name) return '';
  const trimmed = name.trim();
  if (TEACHER_NAMES_MAP[trimmed]) {
    const entry = TEACHER_NAMES_MAP[trimmed];
    if (lang === 'mr') return entry.mr;
    if (lang === 'en') return entry.en;
    return `${entry.mr} (${entry.en})`;
  }
  if (lang === 'en') {
    // If name begins with श्री. or श्रीमती, replace with Shri. or Smt.
    let enName = trimmed
      .replace(/^श्री\.\s*/, 'Shri. ')
      .replace(/^श्रीमती\s*/, 'Smt. ')
      .replace(/^डॉ\.\s*/, 'Dr. ');
    return enName;
  }
  return trimmed;
};

/**
 * Localizes an entire teacher object for rendering in UI
 */
export const localizeTeacherData = (teach: any, lang: LanguageMode): any => {
  if (!teach) return teach;
  return {
    ...teach,
    name: localizeTeacherName(teach.name, lang),
    designation: localizeBilingualString(teach.designation, lang),
    qualification: localizeQualification(teach.qualification, lang),
    assignedClasses: (teach.assignedClasses || []).map((c: string) => localizeClass(c, lang)),
    subjectSpecialization: (teach.subjectSpecialization || []).map((s: string) => localizeSubject(s, lang)),
  };
};

interface LanguageContextType {
  language: LanguageMode;
  setLanguage: (lang: LanguageMode) => void;
  t: (key: string, defaultText?: string) => string;
  tBilingual: (mrOrCombined: string, enText?: string) => string;
  localizeTeacher: (teacher: any) => any;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string | Date) => string;
  formatNumber: (num: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageMode>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageMode | null;
      if (saved && ['mr', 'en', 'bilingual'].includes(saved)) {
        return saved;
      }
    } catch (e) {}
    return 'en';
  });

  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      document.documentElement.lang = language === 'mr' ? 'mr' : 'en';
    } catch (e) {}
  }, [language]);

  const setLanguage = (lang: LanguageMode) => {
    setLanguageState(lang);
  };

  const t = useMemo(() => {
    return (key: string, defaultText?: string): string => {
      const mr = mrTranslations[key];
      const en = enTranslations[key];

      if (language === 'mr') {
        const raw = mr || en || defaultText || key;
        return cleanMarathi(raw);
      }

      if (language === 'en') {
        const raw = en || defaultText || mr || key;
        return cleanEnglish(raw);
      }

      // Bilingual mode: 'मराठी (English)'
      if (mr && en) {
        const cMr = cleanMarathi(mr);
        const cEn = cleanEnglish(en);
        if (cMr === cEn) return cMr;
        return `${cMr} (${cEn})`;
      }

      if (mr) return cleanMarathi(mr);
      if (en) return cleanEnglish(en);
      return defaultText || key;
    };
  }, [language]);

  const tBilingual = useMemo(() => {
    return (mrOrCombined: string, enText?: string): string => {
      if (enText !== undefined) {
        const cMr = cleanMarathi(mrOrCombined);
        const cEn = cleanEnglish(enText);

        if (language === 'mr') return cMr;
        if (language === 'en') return cEn;
        if (cMr === cEn) return cMr;
        return `${cMr} (${cEn})`;
      }

      // If combined bilingual string provided
      return localizeBilingualString(mrOrCombined, language);
    };
  }, [language]);

  const localizeTeacher = useMemo(() => {
    return (teacher: any) => localizeTeacherData(teacher, language);
  }, [language]);

  const formatCurrency = useMemo(() => {
    return (amount: number): string => {
      if (isNaN(amount)) return '₹0';
      const formatted = amount.toLocaleString('en-IN');
      return `₹${formatted}`;
    };
  }, []);

  const formatDate = useMemo(() => {
    return (dateString: string | Date): string => {
      if (!dateString) return '-';
      try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return String(dateString);
        return d.toLocaleDateString(language === 'mr' ? 'mr-IN' : 'en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      } catch (e) {
        return String(dateString);
      }
    };
  }, [language]);

  const formatNumber = useMemo(() => {
    return (num: number): string => {
      if (isNaN(num)) return '0';
      return num.toLocaleString(language === 'mr' ? 'mr-IN' : 'en-IN');
    };
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        tBilingual,
        localizeTeacher,
        formatCurrency,
        formatDate,
        formatNumber,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
