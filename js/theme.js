// Runs before the stylesheet so the first render uses the saved/system theme.
(() => {
    const root = document.documentElement;
    const preference = window.matchMedia("(prefers-color-scheme: dark)");
    const storageKey = "portfolio-theme";
    let chosenTheme = "system";
    let select;

    function readTheme() {
        try {
            const value = window.localStorage.getItem(storageKey);
            return value === "dark" || value === "light" ? value : "system";
        } catch {
            return "system";
        }
    }

    function applyTheme() {
        const theme = chosenTheme === "system" ? (preference.matches ? "dark" : "light") : chosenTheme;
        root.setAttribute("data-theme", theme);
        const themeColor = document.querySelector('meta[name="theme-color"]');
        if (themeColor) themeColor.setAttribute("content", theme === "dark" ? "#211D1B" : "#FAF6F0");
        if (select) select.value = chosenTheme;
    }

    chosenTheme = readTheme();
    applyTheme();

    // Follow system changes until the visitor explicitly chooses a theme.
    preference.addEventListener("change", applyTheme);
    window.addEventListener("storage", (event) => {
        if (event.key === storageKey || event.key === null) {
            chosenTheme = readTheme();
            applyTheme();
        }
    });

    document.addEventListener("DOMContentLoaded", () => {
        select = document.querySelector("#theme-choice");
        const control = document.querySelector(".theme-control");
        if (!select || !control) return;
        select.addEventListener("change", () => {
            if (!["dark", "light", "system"].includes(select.value)) {
                applyTheme();
                return;
            }
            chosenTheme = select.value;
            try {
                window.localStorage.setItem(storageKey, chosenTheme);
            } catch {
                // Theme selection still works when storage is unavailable.
            }
            applyTheme();
        });
        applyTheme();
        control.hidden = false;
    });
})();
