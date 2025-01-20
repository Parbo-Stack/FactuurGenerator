import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./translations/en.json";
import nl from "./translations/nl.json";

const initI18n = async () => {
  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      nl: { translation: nl },
    },
    lng: "nl", // Default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });
};

// Initialize immediately
initI18n().catch(console.error);

export default i18n;