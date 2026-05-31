import ar from "@/i18n/ar.json";
import en from "@/i18n/en.json";

export type Locale = "en" | "ar";

export const translations = {
    en,
    ar,
};

// Update this to match your actual nested JSON structure
export type TranslationKey = string; // you can strongly type this if you want

export function getTranslation(locale: Locale, key: TranslationKey) {
    const keys = key.split(".");
    let current: any = translations[locale];

    for (const k of keys) {
        if (current[k] === undefined) {
            // Fallback to English if translation is missing
            let fallback: any = translations["en"];
            for (const fallbackKey of keys) {
                if (fallback[fallbackKey] === undefined) return key;
                fallback = fallback[fallbackKey];
            }
            return fallback;
        }
        current = current[k];
    }

    return current;
}