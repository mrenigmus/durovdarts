import { MyContext } from "@/types/MyContext";
import { I18n } from "@grammyjs/i18n";
import path from "path";

export const i18n = new I18n<MyContext>({
  defaultLocale: "ru", // see below for more information
  directory: path.join(__dirname, "../i18n"), // Load all translation files from locales/.
  fluentBundleOptions: {
    useIsolating: false,
  },
  useSession: true,
});