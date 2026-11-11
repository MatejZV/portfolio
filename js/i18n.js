// Loaded in the head: restore language early, independently of the theme preference.
(() => {
    const dictionaries = window.portfolioTranslations;
    const storageKey = "portfolio-language";
    const validLanguage = (value) => Object.hasOwn(dictionaries, value) ? value : "en";
    function readLanguage() {
        try { return validLanguage(window.localStorage.getItem(storageKey)); }
        catch { return "en"; }
    }
    let language = readLanguage();
    document.documentElement.lang = language;

    function t(key, params = {}) {
        const selected = dictionaries[language];
        const source = Object.hasOwn(selected, key) ? selected[key] :
            (Object.hasOwn(dictionaries.en, key) ? dictionaries.en[key] : key);
        return source.replace(/\{(\w+)\}/g, (match, name) => {
            const value = params[name];
            if (value && typeof value === "object") return t(value.key, value.params);
            return value === undefined ? match : String(value);
        });
    }
    function translateElement(element) {
        let params = {};
        try { params = JSON.parse(element.getAttribute("data-i18n-params") || "{}"); }
        catch { /* An invalid optional parameter map must not stop page translation. */ }
        const key = element.getAttribute("data-i18n");
        if (key) element.textContent = t(key, params);
        for (const attribute of ["aria-label", "placeholder", "content"]) {
            const attributeKey = element.getAttribute(`data-i18n-${attribute}`);
            if (attributeKey) element.setAttribute(attribute, t(attributeKey, params));
        }
    }
    function apply() {
        document.documentElement.lang = language;
        document.querySelectorAll("[data-i18n], [data-i18n-aria-label], [data-i18n-placeholder], [data-i18n-content]").forEach(translateElement);
        document.querySelectorAll("[data-language]").forEach((button) => {
            button.setAttribute("aria-pressed", String(button.getAttribute("data-language") === language));
        });
    }
    function setLanguage(value) {
        const left = window.scrollX;
        const top = window.scrollY;
        language = validLanguage(value);
        try { window.localStorage.setItem(storageKey, language); }
        catch { /* Switching still works for this page when storage is blocked. */ }
        apply();
        // Text reflow must not navigate or smooth-scroll away from the visitor's position.
        window.scrollTo?.({ left, top, behavior: "instant" });
    }
    // Dynamic UI stores its translation key, not its translated sentence, as state.
    // This allows in-flight form feedback to change language without resubmitting.
    function setText(element, key, params = {}) {
        element.setAttribute("data-i18n", key);
        element.setAttribute("data-i18n-params", JSON.stringify(params));
        element.textContent = t(key, params);
        return true;
    }
    function clearText(element) {
        element.removeAttribute("data-i18n");
        element.removeAttribute("data-i18n-params");
        element.textContent = "";
        return true;
    }
    window.portfolioI18n = { t, apply, setLanguage, setText, clearText, get language() { return language; } };
    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll("[data-language]").forEach((button) => {
            // Native buttons provide Tab, Enter and Space; Escape remains handled by Settings.
            button.addEventListener("click", () => setLanguage(button.getAttribute("data-language")));
        });
        document.querySelectorAll(".language-control").forEach((control) => { control.hidden = false; });
        apply();
    });
    window.addEventListener("storage", (event) => {
        if (event.key === storageKey || event.key === null) {
            language = readLanguage();
            apply();
        }
    });
})();
