/* ==========================================
   1. NAVIGATION AND SETTINGS DISCLOSURES
========================================== */

const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const navItems = document.querySelectorAll(".nav-links a");
const navbar = document.querySelector(".navbar");
const siteHeader = document.querySelector(".site-header");
const settingsToggle = document.querySelector("#settings-toggle");
const settingsPanel = document.querySelector("#settings-panel");
const settingsContainer = document.querySelector(".settings-container");

function closeMenu() {
    navLinks.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("data-i18n-aria-label", "access.menuOpen");
    menuToggle.setAttribute("aria-label", globalThis.portfolioI18n?.t("access.menuOpen") ?? "Open navigation menu");
    menuToggle.textContent = "☰";
}

function closeSettings() {
    settingsPanel.hidden = true;
    settingsToggle.setAttribute("aria-expanded", "false");
}

menuToggle.addEventListener("click", () => {
    const opening = !navLinks.classList.contains("active");
    closeSettings();
    closeMenu();
    if (opening) {
        navLinks.classList.add("active");
        menuToggle.setAttribute("aria-expanded", "true");
        menuToggle.setAttribute("data-i18n-aria-label", "access.menuClose");
        menuToggle.setAttribute("aria-label", globalThis.portfolioI18n?.t("access.menuClose") ?? "Close navigation menu");
        menuToggle.textContent = "×";
        navItems[0]?.focus();
    }
});

settingsToggle.addEventListener("click", () => {
    const opening = settingsPanel.hidden;
    closeMenu();
    closeSettings();
    if (opening) {
        settingsPanel.hidden = false;
        settingsToggle.setAttribute("aria-expanded", "true");
    }
});

// Page links retain native same-tab navigation and static aria-current="page".
navItems.forEach((link) => link.addEventListener("click", () => {
    closeMenu();
    closeSettings();
}));

// Keep the native anchor behavior and move keyboard focus to its destination.
document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", () => {
        const id = link.getAttribute("href").slice(1);
        closeMenu();
        closeSettings();
        const target = document.getElementById(id);
        if (target?.getAttribute("tabindex") === "-1") target.focus({ preventScroll: true });
    });
});

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!settingsPanel.hidden) {
        closeSettings();
        settingsToggle.focus();
    } else if (navLinks.classList.contains("active")) {
        closeMenu();
        menuToggle.focus();
    }
});

document.addEventListener("click", (event) => {
    if (!navbar.contains(event.target)) closeMenu();
    if (!settingsContainer.contains(event.target)) closeSettings();
});

navbar.addEventListener("focusout", (event) => {
    if (!navbar.contains(event.relatedTarget)) closeMenu();
    if (!settingsContainer.contains(event.relatedTarget)) closeSettings();
});

function updateHeaderHeight() {
    document.documentElement.style.setProperty("--header-height", `${siteHeader.getBoundingClientRect().height}px`);
}

window.addEventListener("resize", () => {
    if (window.innerWidth > 1000) closeMenu();
    updateHeaderHeight();
});
if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
        updateHeaderHeight();
        }).observe(siteHeader);
}
window.addEventListener("load", updateHeaderHeight);

navbar.classList.add("navigation-ready");
siteHeader.classList.add("sticky-ready");
settingsToggle.hidden = false;
updateHeaderHeight();


/* ==========================================
   2. PROJECT DATA
========================================== */

// Store project information in one array.
//
// IMPORTANT:
// NOVA and BetIQ are real projects under development; descriptions reflect the source audit.
// Optional screenshot: { src: "images/your-file.webp", alt: "Describe the visible interface" }.
// Leave screenshot null until you have an image and useful alt text.
// Add demoUrl and repositoryUrl only when real destinations are available.

const projects = [
    {
        title: "NOVA — E-commerce Storefront",
        translationKey: "projects.nova",

        description:
            "An in-progress e-commerce storefront featuring product browsing, search, category filtering, price sorting, and a shopping cart persisted in the browser. Checkout is not implemented yet.",

        technologies: ["TypeScript", "Next.js", "React", "Tailwind CSS", "Prisma", "PostgreSQL"],

        icon: "🛒",

        imageClass: "",

        status: "in-progress",

        screenshot: null,
        demoUrl: "",
        repositoryUrl: ""
    },

    {
        title: "BetIQ — Football Probability Prototype",
        translationKey: "projects.betiq",

        description:
            "An in-progress mobile prototype exploring football outcome probabilities using a simplified Poisson model and mock expected-goal data. The match-detail screen is still being developed.",

        technologies: ["TypeScript", "React Native", "Expo", "Expo Router"],

        icon: "⚽",

        imageClass: "",

        status: "in-progress",

        screenshot: null,
        demoUrl: "",
        repositoryUrl: ""
    }
];


/* ==========================================
   3. PROJECT ELEMENTS
========================================== */

const projectsContainer = document.querySelector("#projects-container");


/* ==========================================
   4. CREATE STATUS BADGE
========================================== */

function createStatusBadge(status) {

    const badge = document.createElement("span");

    badge.className = "project-status";

    if (status === "completed") {

        globalThis.portfolioI18n?.setText(badge, "status.completed") ?? (badge.textContent = "Completed");
        badge.classList.add("status-completed");

    } else if (status === "in-progress") {

        globalThis.portfolioI18n?.setText(badge, "status.progress") ?? (badge.textContent = "In Progress");
        badge.classList.add("status-in-progress");

    } else {

        globalThis.portfolioI18n?.setText(badge, "status.planned") ?? (badge.textContent = "Planned");
        badge.classList.add("status-planned");
    }

    return badge;
}


/* ==========================================
   5. CREATE A PROJECT CARD
========================================== */

// Resolve local paths and web URLs, rejecting malformed or executable URLs.
function getProjectUrl(value) {
    if (typeof value !== "string" || !value.trim()) return null;
    try {
        const url = new URL(value.trim(), document.baseURI);
        return ["http:", "https:"].includes(url.protocol) ? url.href : null;
    } catch {
        return null;
    }
}

function createProjectCard(project) {

    const card = document.createElement("article");
    card.className = "project-card";

    const image = document.createElement("div");
    image.className = "project-image";

    if (project.imageClass) {
        image.classList.add(project.imageClass);
    }

    const icon = document.createElement("span");
    icon.textContent = project.icon;
    icon.setAttribute("aria-hidden", "true");

    // The decorative icon is also the fallback for missing or broken images.
    image.appendChild(icon);
    const screenshotUrl = getProjectUrl(project.screenshot?.src);
    const screenshotAlt = project.screenshot?.alt;
    if (screenshotUrl && typeof screenshotAlt === "string" && screenshotAlt.trim()) {
        const screenshot = document.createElement("img");
        screenshot.alt = screenshotAlt.trim();
        screenshot.loading = "lazy";
        screenshot.decoding = "async";
        // Keep a real layout box so lazy loading can detect the image on screen.
        // A display:none image may never load in some browsers.
        screenshot.style.opacity = "0";
        screenshot.addEventListener("load", () => {
            screenshot.style.opacity = "1";
            icon.hidden = true;
        }, { once: true });
        screenshot.addEventListener("error", () => {
            screenshot.remove();
            icon.hidden = false;
        }, { once: true });
        image.appendChild(screenshot);
        screenshot.src = screenshotUrl;
    }

    const content = document.createElement("div");
    content.className = "project-content";

    const statusBadge = createStatusBadge(project.status);

    const title = document.createElement("h3");
    title.textContent = project.title;
    if (project.translationKey) globalThis.portfolioI18n?.setText(title, `${project.translationKey}.title`);

    const description = document.createElement("p");
    description.textContent = project.description;
    if (project.translationKey) globalThis.portfolioI18n?.setText(description, `${project.translationKey}.description`);

    const techContainer = document.createElement("div");
    techContainer.className = "project-tech";

    project.technologies.forEach((technology) => {

        const tag = document.createElement("span");

        // Use textContent so data is treated as text
        tag.textContent = technology;

        techContainer.appendChild(tag);
    });

    content.append(
        statusBadge,
        title,
        description,
        techContainer
    );

    // Render only real, usable links. Missing URLs never create dead buttons.
    const links = document.createElement("div");
    links.className = "project-links";
    [
        { url: project.demoUrl, label: "Live Demo", key: "projects.demo" },
        { url: project.repositoryUrl, label: "GitHub Repository", key: "projects.repo" }
    ].forEach(({ url, label, key }) => {
        const href = getProjectUrl(url);
        if (!href) return;
        const link = document.createElement("a");
        link.className = "project-link";
        link.href = href;
        link.textContent = label;
        globalThis.portfolioI18n?.setText(link, key);
        // Project-specific names distinguish links in a screen reader's link list.
        link.setAttribute("aria-label", `${label}: ${project.title}`);
        if (globalThis.portfolioI18n) {
            link.setAttribute("data-i18n-aria-label", "projects.linkLabel");
            link.setAttribute("data-i18n-params", JSON.stringify({
                label: { key }, title: project.translationKey ? { key: `${project.translationKey}.title` } : project.title
            }));
            link.setAttribute("aria-label", globalThis.portfolioI18n.t("projects.linkLabel", JSON.parse(link.getAttribute("data-i18n-params"))));
        }
        links.appendChild(link);
    });
    if (links.childElementCount) content.appendChild(links);

    card.append(image, content);

    return card;
}


/* ==========================================
   6. DISPLAY PROJECTS
========================================== */

// Render every project in its original order.
function displayProjects() {
    if (!projectsContainer) return;
    projectsContainer.replaceChildren();
    projects.forEach((project) => {
        projectsContainer.appendChild(createProjectCard(project));
    });
}

displayProjects();


/* ==========================================
   7. CONTACT FORM ELEMENTS
========================================== */

// Find the contact form
const contactForm = document.querySelector("#contact-form");

if (contactForm) {


// Find input fields
const nameInput = document.querySelector("#contact-name");
const emailInput = document.querySelector("#contact-email");
const messageInput = document.querySelector("#contact-message");

// Find field error messages
const nameError = document.querySelector("#name-error");
const emailError = document.querySelector("#email-error");
const messageError = document.querySelector("#message-error");

// Find the overall form status message
const formStatus = document.querySelector("#form-status");


/* ==========================================
   8. EMAIL VALIDATION
========================================== */

// Check whether an email has a basic valid structure
function isValidEmail(email) {

    // This pattern is a basic format check,
    // not proof that an email address exists.
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailPattern.test(email);
}


/* ==========================================
   9. SHOW A FIELD ERROR
========================================== */

// Display a validation error below an input
function showFieldError(input, errorElement, message, key) {

    // Add a red border
    input.classList.add("input-error");

    // Display the error message
    globalThis.portfolioI18n?.setText(errorElement, key) ?? (errorElement.textContent = message);

    // Tell screen readers the input is invalid
    input.setAttribute("aria-invalid", "true");
}


/* ==========================================
   10. CLEAR A FIELD ERROR
========================================== */

// Remove an error from a valid input
function clearFieldError(input, errorElement) {

    // Remove the red border
    input.classList.remove("input-error");

    // Clear the error message
    globalThis.portfolioI18n?.clearText(errorElement) ?? (errorElement.textContent = "");

    // Update the accessibility state
    input.setAttribute("aria-invalid", "false");
}


/* ==========================================
   11. VALIDATE THE CONTACT FORM
========================================== */

// Check all fields and return true if valid
function validateContactForm() {

    // Start by assuming all fields are valid
    let isValid = true;

    // Read values and remove surrounding spaces
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();


    // --------------------------------------
    // NAME VALIDATION
    // --------------------------------------

    if (name.length < 2) {

        showFieldError(
            nameInput,
            nameError,
            "Please enter at least 2 characters.",
            "form.nameError"
        );

        // One invalid field makes the form invalid
        isValid = false;

    } else {

        clearFieldError(nameInput, nameError);
    }


    // --------------------------------------
    // EMAIL VALIDATION
    // --------------------------------------

    if (!isValidEmail(email)) {

        showFieldError(
            emailInput,
            emailError,
            "Please enter a valid email address.",
            "form.emailError"
        );

        isValid = false;

    } else {

        clearFieldError(emailInput, emailError);
    }


    // --------------------------------------
    // MESSAGE VALIDATION
    // --------------------------------------

    if (message.length < 10) {

        showFieldError(
            messageInput,
            messageError,
            "Please write at least 10 characters.",
            "form.messageError"
        );

        isValid = false;

    } else {

        clearFieldError(messageInput, messageError);
    }


    // Return the final validation result
    return isValid;
}


/* ==========================================
   12. HANDLE CONTACT FORM SUBMISSION
========================================== */

const submitButton = document.querySelector("#contact-submit");
const requestTimeoutMs = 15000;
let isSubmitting = false;

contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // A flag also blocks Enter-key and programmatic duplicate submissions.
    if (isSubmitting) return;

    formStatus.classList.remove("success", "error");
    if (!validateContactForm()) {
        formStatus.classList.add("error");
        globalThis.portfolioI18n?.setText(formStatus, "form.invalid") ?? (formStatus.textContent = "Please correct the highlighted fields.");
        contactForm.querySelector('[aria-invalid="true"]').focus();
        return;
    }

    // A public form ID must be configured before sending any personal data.
    if (contactForm.action.includes("YOUR_FORM_ID")) {
        formStatus.classList.add("error");
        globalThis.portfolioI18n?.setText(formStatus, "form.unconfigured") ?? (formStatus.textContent = "Sending is not set up yet. Your message is still here. Please return when contact delivery is available.");
        return;
    }

    const originalButtonText = submitButton.textContent;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);
    isSubmitting = true;
    submitButton.disabled = true;
    globalThis.portfolioI18n?.setText(submitButton, "form.sendingButton") ?? (submitButton.textContent = "Sending…");
    globalThis.portfolioI18n?.setText(formStatus, "form.sending") ?? (formStatus.textContent = "Sending your message…");

    // Keep fields readable and focusable, but prevent edits to the message in flight.
    formFields.forEach(({ input }) => { input.readOnly = true; });

    try {
        const response = await fetch(contactForm.action, {
            method: "POST",
            body: new FormData(contactForm),
            headers: { Accept: "application/json" },
            signal: controller.signal
        });

        // fetch only rejects for connection errors; HTTP failures need this check.
        if (!response.ok) {
            formStatus.classList.add("error");
            if (response.status === 429) {
                globalThis.portfolioI18n?.setText(formStatus, "form.rateLimit") ??
                    (formStatus.textContent = "Too many requests. Please wait before trying again. Your message has been kept.");
            } else {
                globalThis.portfolioI18n?.setText(formStatus, "form.http", { status: response.status }) ??
                    (formStatus.textContent = `The form service could not accept your message (HTTP ${response.status}). Your message has been kept. Please try again later.`);
            }
            return;
        }

        formStatus.classList.add("success");
        globalThis.portfolioI18n?.setText(formStatus, "form.success") ?? (formStatus.textContent = "Thank you! Formspree accepted your message. Inbox delivery has not been confirmed.");
        // Clear values only after the service confirms success.
        contactForm.reset();
    } catch (error) {
        formStatus.classList.add("error");
        if (controller.signal.aborted) {
            globalThis.portfolioI18n?.setText(formStatus, "form.timeout") ??
                (formStatus.textContent = "The request timed out. Delivery could not be confirmed. Your message has been kept; please wait before retrying to avoid sending it twice.");
        } else {
            globalThis.portfolioI18n?.setText(formStatus, "form.network") ??
                (formStatus.textContent = "A network error prevented delivery confirmation. Check your connection. Your message has been kept; please wait before retrying.");
        }
    } finally {
        // Always release the timer and controls, including after HTTP errors.
        window.clearTimeout(timeoutId);
        isSubmitting = false;
        submitButton.disabled = false;
        globalThis.portfolioI18n?.setText(submitButton, "contact.send") ?? (submitButton.textContent = originalButtonText);
        formFields.forEach(({ input }) => { input.readOnly = false; });
    }
});

/* ==========================================
   13. CLEAR OLD FORM FEEDBACK WHEN EDITING
========================================== */

// Group all form fields with their error elements
const formFields = [
    { input: nameInput, error: nameError },
    { input: emailInput, error: emailError },
    { input: messageInput, error: messageError }
];

// Clear an old error when the visitor edits that field
formFields.forEach((field) => {

    field.input.addEventListener("input", () => {

        // Preserve the sending status while a request is in progress.
        if (isSubmitting) return;

        // Clear the current field's old error
        clearFieldError(field.input, field.error);

        // Clear the previous overall form status
        globalThis.portfolioI18n?.clearText(formStatus) ?? (formStatus.textContent = "");

        formStatus.classList.remove("success", "error");
    });
});


}

/* ==========================================
   14. AUTOMATIC COPYRIGHT YEAR
========================================== */

const yearElement = document.querySelector("#current-year");

// Get the current year from the visitor's device
const currentYear = new Date().getFullYear();

yearElement.textContent = currentYear;
