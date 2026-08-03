import ar from "@/i18n/ar.json";
import en from "@/i18n/en.json";

export type Locale = "en" | "ar";

export const translations = {
    en,
    ar,
} as const;

// Update this to match your actual nested JSON structure
export type TranslationKey = string; // you can strongly type this if you want

export function getTranslation(locale: Locale, key: TranslationKey): string {
    const keys = key.split(".");
    let current: unknown = translations[locale];

    for (const k of keys) {
        if (current === undefined || current === null || typeof current !== 'object') {
            // Fallback to English if translation is missing
            let fallback: unknown = translations["en"];
            for (const fallbackKey of keys) {
                if (fallback === undefined || fallback === null || typeof fallback !== 'object' || !(fallbackKey in fallback)) return key;
                fallback = (fallback as Record<string, unknown>)[fallbackKey];
            }
            return String(fallback);
        }
        current = (current as Record<string, unknown>)[k];
    }

    return String(current);
}