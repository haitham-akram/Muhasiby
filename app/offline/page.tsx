import { getTranslation } from "@/lib/i18n";
import { cookies } from "next/headers";

export default function Fallback() {
  const cookieStore = cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value || "ar") as "ar" | "en";
  const t = (key: string) => getTranslation(locale, key);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="mb-4 text-2xl font-bold">Offline</h1>
      <p className="mb-8 text-text-secondary">
        You are offline and this page is not cached.
      </p>
      <button 
        className="rounded-xl bg-black px-6 py-3 text-white dark:bg-white dark:text-black"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.location.reload();
          }
        }}
      >
        Retry
      </button>
    </div>
  );
}
