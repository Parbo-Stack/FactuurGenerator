import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

type ConsentState = {
  analytics: boolean;
  advertising: boolean;
  decided: boolean;
};

const CONSENT_KEY = "factuurflow_cookie_consent";

export function CookieBanner() {
  const { i18n } = useTranslation();
  const isNL = i18n.language === "nl";
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    analytics: false,
    advertising: false,
    decided: false,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONSENT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.decided) {
          setConsent(parsed);
          applyConsent(parsed);
          return;
        }
      }
    } catch {}
    // Geen beslissing gevonden — toon banner
    setTimeout(() => setVisible(true), 800);
  }, []);

  const applyConsent = (c: ConsentState) => {
    // Google Analytics aan/uit zetten
    if (typeof window !== "undefined") {
      (window as any)[`ga-disable-G-XXXXXXXX`] = !c.analytics;
    }
  };

  const saveConsent = (c: ConsentState) => {
    const final = { ...c, decided: true, timestamp: new Date().toISOString() };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(final));
    setConsent(final);
    applyConsent(final);
    setVisible(false);
  };

  const acceptAll = () => saveConsent({ analytics: true, advertising: true, decided: true });
  const rejectAll = () => saveConsent({ analytics: false, advertising: false, decided: true });
  const saveCustom = () => saveConsent({ ...consent, decided: true });

  if (!visible) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]" />

      {/* Banner */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[9999] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={isNL ? "Cookie instellingen" : "Cookie settings"}
      >
        <div className="max-w-4xl mx-auto p-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <span className="text-2xl">🍪</span>
            <div>
              <h2 className="font-bold text-base text-gray-900 dark:text-white">
                {isNL ? "Wij gebruiken cookies" : "We use cookies"}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {isNL
                  ? "FactuurFlow gebruikt cookies om de website te verbeteren en anonieme gebruiksstatistieken bij te houden. Jouw factuurgegevens worden nooit gedeeld of opgeslagen op onze servers."
                  : "FactuurFlow uses cookies to improve the website and track anonymous usage statistics. Your invoice data is never shared or stored on our servers."}
              </p>
            </div>
          </div>

          {/* Details toggle */}
          {showDetails && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4 space-y-3 text-sm">
              {/* Noodzakelijk */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {isNL ? "Noodzakelijke cookies" : "Necessary cookies"}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                    {isNL
                      ? "Vereist voor de werking van de site. Taalinstellingen, formulierstatus."
                      : "Required for site functionality. Language settings, form state."}
                  </div>
                </div>
                <div className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded whitespace-nowrap">
                  {isNL ? "Altijd aan" : "Always on"}
                </div>
              </div>

              {/* Analytisch */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {isNL ? "Analytische cookies" : "Analytics cookies"}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                    {isNL
                      ? "Helpt ons begrijpen hoe bezoekers de site gebruiken. Volledig geanonimiseerd."
                      : "Helps us understand how visitors use the site. Fully anonymised."}
                  </div>
                </div>
                <button
                  onClick={() => setConsent(c => ({ ...c, analytics: !c.analytics }))}
                  className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                    consent.analytics ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                  role="switch"
                  aria-checked={consent.analytics}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                    consent.analytics ? "left-4" : "left-0.5"
                  }`} />
                </button>
              </div>

              {/* Advertenties */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {isNL ? "Advertentiecookies" : "Advertising cookies"}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                    {isNL
                      ? "Google AdSense voor relevante advertenties. Worden nooit gekoppeld aan factuurgegevens."
                      : "Google AdSense for relevant ads. Never linked to invoice data."}
                  </div>
                </div>
                <button
                  onClick={() => setConsent(c => ({ ...c, advertising: !c.advertising }))}
                  className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                    consent.advertising ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                  role="switch"
                  aria-checked={consent.advertising}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                    consent.advertising ? "left-4" : "left-0.5"
                  }`} />
                </button>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <button
              onClick={() => setShowDetails(d => !d)}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
            >
              {showDetails
                ? (isNL ? "Verberg details" : "Hide details")
                : (isNL ? "Instellingen aanpassen" : "Customise settings")}
            </button>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={rejectAll}
                className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {isNL ? "Alleen noodzakelijk" : "Necessary only"}
              </button>

              {showDetails && (
                <button
                  onClick={saveCustom}
                  className="px-4 py-2 text-sm font-medium border border-green-500 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                >
                  {isNL ? "Opslaan" : "Save preferences"}
                </button>
              )}

              <button
                onClick={acceptAll}
                className="px-4 py-2 text-sm font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                {isNL ? "Alles accepteren" : "Accept all"}
              </button>
            </div>
          </div>

          {/* Privacy link */}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
            {isNL ? "Lees ons " : "Read our "}
            <a
              href="/privacybeleid"
              className="underline hover:text-gray-600"
              target="_blank"
              rel="noopener noreferrer"
            >
              {isNL ? "privacybeleid" : "privacy policy"}
            </a>
            {isNL
              ? " voor meer informatie. Conform AVG/GDPR."
              : " for more information. GDPR compliant."}
          </p>
        </div>
      </div>
    </>
  );
}

// Hook voor andere componenten om consent te lezen
export function useCookieConsent() {
  const getConsent = (): ConsentState => {
    try {
      const saved = localStorage.getItem(CONSENT_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { analytics: false, advertising: false, decided: false };
  };
  return getConsent();
}
