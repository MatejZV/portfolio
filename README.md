# Developer portfolio

A four-page static portfolio built with plain HTML, CSS, and JavaScript. The shared espresso-and-cream dark/light design includes responsive navigation, a responsive project gallery, and a Formspree contact form. No framework, build process, or package installation is required.

## Run locally

From this directory, start a local HTTP server with Python 3:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000` in a browser. Stop the server with Ctrl+C. Use HTTP rather than opening the HTML directly: the optional project asset URL helper expects HTTP or HTTPS URLs.

## Pages and shared files

| Page | Content |
| --- | --- |
| `index.html` | Hero/editor, verified About Me biography, and Contact call-to-action; no project cards |
| `projects.html` | The two real projects, all In Progress |
| `background.html` | Education, Skills, then Codecademy C# / JavaScript and Udemy C# Intermediate certificates with local PDFs |
| `contact.html` | Configured Formspree form and accessible feedback |

Every page includes the same semantic header, Settings control, footer, stylesheet, and scripts. The static header/footer markup is intentionally repeated; no framework or runtime HTML fetching is required. Keep these shared structures consistent when editing pages.

- `css/style.css`: shared warm palettes, cards, responsive page layouts, focus, and reduced motion.
- `js/theme.js`: early system/saved theme selection and the labelled Theme selector.
- `js/translations.js`: matching English, Slovenian, and German translation dictionaries.
- `js/i18n.js`: saved language, safe DOM translation, and native language buttons.
- `js/script.js`: shared navigation, translated project rendering/form feedback, guarded contact initialization, and automatic year. Pages without a gallery/form skip that initialization safely.
- `assets/`: technology logos, licenses, original certificate PDFs, and generated WebP previews.
- `tests/`: Node.js/Python checks; these do not run in the website.

## Certificates

Background includes the two existing Codecademy certificates followed by the Udemy **C# Intermediate: Classes, Interfaces and OOP** certificate. The Udemy course was taught by **Mosh Hamedani**, completed on **May 4, 2020**, and has a duration of **6 hours**. Its type is **Certificate of Completion**.

All three compact certificate cards keep their platform, title, and View Certificate link. Each link opens a WebP image in a native modal dialog on the same page; without JavaScript or modal-dialog support, it opens the image directly. The Udemy card keeps “C# Intermediate” with its full course title in the tooltip and accessible preview-link name. The dialog includes a secondary link to open the unchanged original PDF in a new tab.

`js/certificates.js` loads only on Background. Preview images load only when selected. The dialog supports Escape, a 44px-minimum Close button, outside clicks, explicit Tab wrapping, native background inertness, focus restoration, and body-scroll locking. Enlarge image toggles the full-resolution image inside a keyboard- and touch-scrollable region. Browser zoom remains available. Image-load failures show translated feedback and retain access to the original PDF. Controls, help, and accessible labels support English, Slovenian, and German and use the current theme colors.

The three full-page WebP previews were rendered directly from the original one-page PDFs with Poppler (`pdftoppm -singlefile -scale-to 2400 -png`) and encoded with Pillow at WebP quality 88, method 6. No certificate content was edited or cropped. Codecademy previews are 1697×2400 (148,336 and 150,956 bytes); Udemy is 2400×1785 (414,506 bytes). If a PDF is replaced, regenerate its matching WebP. Keep the three PDFs, previews, and all paths under `assets/certificates/`; paths remain relative for GitHub Pages project sites.

`tests/certificates.cjs` checks the three preview/PDF pairs, asset signatures, accessible markup, lazy opening, focus boundaries/restoration, close/backdrop behavior, zoom, error fallback, and progressive enhancement. Real-browser checks additionally verified all three previews at 1440×1000 and 390×844 in both themes, including native Escape, keyboard focus containment, scrolling availability, and all three languages.

## Color themes

The design uses Warm Espresso & Soft Copper in dark mode and Cream & Muted Terracotta in light mode, with shared typography, spacing, card shapes, and navigation. Theme colors live in CSS custom properties, including feedback states, tags, buttons, and focus outlines. Technology logos retain their original colors against a neutral backing.

The header **Settings** button opens one panel with a labelled **Theme** (System / Dark / Light) selector. The native control exposes the current selection, supports standard keyboard navigation, and has visible focus in both palettes. A Language section beneath it offers English, Slovenščina, and Deutsch.

On first visit, the site follows the system color scheme. Explicitly selecting a theme stores `portfolio-theme` in local storage. Selecting System follows system changes again and persists that mode across navigation and refresh. Without a saved choice, system changes apply automatically. Theme preferences synchronize across tabs; if storage is unavailable, switching still works for the current page. The small blocking `js/theme.js` script runs before the stylesheet to select the palette before rendering. With JavaScript disabled, CSS follows the system palette and hides the inactive toggle. No theme animations are added; existing reduced-motion support is retained.

The theme checks cover saved/system choices, live system changes, persistence, storage failures, cross-tab changes, and accessibility attributes. Actual first-paint behavior, responsive appearance, and keyboard/screen-reader output still require browser verification.

## Languages and translation maintenance

English (`en`) is the default, regardless of browser language. Settings offers 🇬🇧 English, 🇸🇮 Slovenščina (`sl`), and 🇩🇪 Deutsch (`de`) using native buttons with `aria-pressed`, native language names, and a visual checkmark. Tab reaches each button; Enter or Space selects it. Escape retains the existing Settings close/focus behavior.

The selected language is stored under `portfolio-language`, independently of `portfolio-theme`. Invalid stored values fall back to English; blocked storage still allows switching on the current page. Language changes synchronize across tabs. Switching updates the document `lang`, titles, descriptions, visible copy, translated attributes, project cards, and active form feedback without reloading or changing the page URL. Form values, field/control identities, listeners, and submission state remain intact. The current scroll coordinates are restored after text updates, subject to the page’s available scroll range.

`translations.js` and `i18n.js` load in the head to restore the language early. A small call at the end of each body translates parsed content before the deferred interaction script runs; `DOMContentLoaded` initializes the buttons and reapplies translations. This minimizes English flashing without hiding content or delaying access to the page. Actual first-paint behavior still needs browser verification. With JavaScript disabled, the original English HTML remains readable and the language controls stay hidden.

To change or add copy:

1. Use a descriptive, stable key in all three dictionaries in `js/translations.js`, such as `home.bio1` or `form.timeout`. English is the source of truth; maintain the same keys and `{parameter}` names in each language.
2. Add `data-i18n="home.bio1"` to a text-only element. For text beside an icon, date, link, or the copyright year, translate a small child span so the other children survive. Never put `data-i18n` on a container holding form fields or interactive descendants.
3. Use `data-i18n-aria-label`, `data-i18n-placeholder`, or `data-i18n-content` for translated attributes. URLs, email examples, technology names, proper names, certificate titles, and decorative source code remain unchanged.
4. For generated text, call `portfolioI18n.setText(element, key, params)`. It records the key and optional JSON parameters so existing text updates when language changes. Call `clearText(element)` to clear both feedback and its key; otherwise switching could revive an old message. Ordinary translations use `textContent`; no translated HTML is injected.
5. Projects keep their existing English data and add a `translationKey` prefix (`projects.nova` or `projects.betiq`) for `.title` and `.description` dictionary entries. Add matching entries when editing those English fields. New projects without a prefix retain their supplied text. Optional screenshots and project URLs still work as before.
6. To add another language, add its dictionary and native-name button to every Settings panel, then extend the language tests and coverage expectations. The supported language codes come from dictionary keys. Run every check below.

`tests/i18n.cjs` loads the actual page markup and scripts using a small DOM model. It checks source-text coverage, dictionary parity, all-page switching and persistence, blocked/invalid storage, document language and metadata, independent theme preferences, native button semantics and Escape, project text/identity, and contact validation, sending, success, HTTP, network, configuration, and timeout messages. It also checks changing languages during a submission and clearing old feedback. It makes no real requests and does not simulate browser layout or a screen reader.

Slovenian and German copy should receive a native-speaker review, particularly the study/qualification terminology, project descriptions, informal visitor address, and delivery-confirmation wording. Original names, qualifications, project progress, and missing checkout functionality retain their meaning.

## Automatic responsive layout

Display sizing is automatic; there are no Small / Medium / Large controls or stored size overrides. Relative typography, fluid gutters and spacing, and the browser’s default font size preserve zoom and accessibility text scaling. Touch controls retain a minimum 44px height.

The shared container uses fluid viewport gutters (`clamp(1rem, 5vw, 6rem)`) and a 100rem cap (1600px at the default font size). It occupies about 90% of laptop/desktop widths until the cap applies, with separately limited paragraph widths. The header remains viewport-wide. The desktop hero uses a 55/45 text/editor split and a substantial editor without a glow, featuring explicit syntax spans and contrast-tested colors for both themes. Project cards have consistent padding, title space on desktop, and technology tags aligned toward the bottom. Text line lengths are capped for readability. Projects use two columns on desktop/tablet and one at 600px and below; Education cards retain their existing two-column layout and stack at 700px and below. Certification cards use three columns above 1000px, two from 601px to 1000px, and one at 600px and below. Their shared grid rows keep card heights equal, with compact padding and links aligned at the bottom. Navigation switches to its mobile layout at 1000px. The narrowest screens use one skill column below 380px.

`tests/display.cjs` checks automatic sizing, responsive rules, the removal of size controls/scripts, and preservation of browser zoom. Browser review is still required in both themes at desktop, tablet, mobile, and 200%/400% zoom; source checks cannot establish the absence of rendered overflow or overlap.

The page shell uses a flexible viewport-height column so short pages keep the footer near the bottom. The footer spans the viewport with minimal responsive padding and a subtle top border. Section spacing retains the existing page-specific cascade. Contact headings, introduction, and form share one centered 42.5rem (680px default) column. Home’s About section keeps all three biography paragraphs in one readable column with a subtle link to Background; the decorative learning card is removed; Background uses one consistent section rhythm.

Home uses its own centered 82.5rem (1320px default) cap and fluid 20–32px default gutters. The navbar stays viewport-wide. Its 55/45 hero uses a responsive 24–64px gap and a substantial editor bounded within its right column. About keeps all three exact biography paragraphs in one readable column (50rem section cap, 70ch prose cap), followed by a subtle Explore My Background link; the preview card is removed. The closing CTA uses this centered container; the footer retains its full-width layout. Other pages retain their existing containers.

## Navigation and footer

The brand is **Matej ZV**, linking to `index.html`. Navbar links are **Home, Projects, Background**, in that order. Home and the brand both return to `index.html`; there is no separate About page. Settings and the accent-colored **Contact Me** action sit on the right. Equal outer CSS Grid tracks keep the center links aligned to the full navbar rather than the space left between the brand and actions. The brand and action groups align to the outer edges without wrapping on desktop. At 1000px and below, a hamburger opens the page links plus an accent-colored Contact Me action; the desktop Contact Me action is hidden. Standard page links navigate in the same tab and use static `aria-current="page"` states, independent of scroll position. The Home navigation link is marked current on Home; Contact is marked on its desktop/mobile actions.

Settings retains the saved/system theme implementation. Escape closes either disclosure and returns focus to its trigger; outside clicks and focus departure close panels. Opening one closes the other. The mobile menu focuses its first link. Each page has a skip link targeting its own focusable `main-content`. The sticky header's measured height provides an anchor offset. Without JavaScript, page navigation remains visible and Settings stays hidden.

Each footer contains only one centered copyright paragraph: © [current year] Matej ZV. All rights reserved. The `current-year` span is updated automatically by the existing script. Theme colors, the subtle top border, and the flexible page shell keep the footer consistent in both themes and at the bottom of short pages. Text can wrap on narrow screens or at high zoom. Contact also includes a GitHub profile link and SVG icon beneath the form.

## Customize projects

Edit the `projects` array in `js/script.js`. The gallery contains two real projects, all marked **In Progress**:

- **NOVA — E-commerce Storefront** — An in-progress e-commerce storefront featuring product browsing, search, category filtering, price sorting, and a shopping cart persisted in the browser. Checkout is not implemented yet. Technologies: TypeScript, Next.js, React, Tailwind CSS, Prisma, PostgreSQL.
- **BetIQ — Football Probability Prototype** — An in-progress mobile prototype exploring football outcome probabilities using a simplified Poisson model and mock expected-goal data. The match-detail screen is still being developed. Technologies: TypeScript, React Native, Expo, Expo Router.

Both projects appear only on the dedicated Projects page, in their original order, with no category controls. Home intentionally has no Featured Projects section or cards. Home links to the Projects page through primary navigation; the former “View My Projects” hero button was intentionally removed. Missing demos or repository URLs do not create buttons. The grid uses two columns on desktop/tablet and one on mobile. Missing screenshots, demos, and repository links remain omitted. Confirm descriptions and statuses before publishing; no project is presented as finished or deployed.

Each entry supports:

| Property | Purpose |
| --- | --- |
| `title`, `description` | Text displayed on the card |
| `technologies` | Array of technology tag strings |
| `status` | `planned`, `in-progress`, or `completed` |
| `icon`, `imageClass` | Decorative fallback icon and optional existing background class |
| `screenshot` | `null`, or an object containing `src` and descriptive `alt` text |
| `demoUrl`, `repositoryUrl` | Real destinations, or empty strings to omit the links |

For a screenshot, add your own image file and set `src` to its relative path. Describe the visible interface in `alt`; a screenshot without useful alt text is omitted. Missing, invalid, or failed images keep the decorative icon. Lazy-loaded images retain a layout box while loading, avoiding hidden-image loading problems. The fixed image area prevents layout shifts and `object-fit: contain` preserves the full screenshot.

Only HTTP(S) destinations are accepted. Relative paths resolve against the page URL. No demo, repository, or screenshot URLs have been invented. Links open in the same tab and have project-specific accessible names.

## Formspree configuration and delivery verification

The contact form on `contact.html` has a public HTTPS Formspree endpoint in its HTML `action`. JavaScript posts directly to `contactForm.action`; there is no separately configured submission endpoint. The public form ID is intended for client use. No recipient inbox address or private API credential is needed in the form source.

The visible form note identifies Formspree as the submission service. The success feedback states that Formspree accepted the message and inbox delivery has not been confirmed. An HTTP success means the service accepted the submission; it does not prove receipt in the destination inbox. No real message was sent during automated checks.

To verify delivery yourself:

1. Start the portfolio with `python3 -m http.server 8000 --bind 127.0.0.1` and open `http://127.0.0.1:8000/contact.html`. Ensure the form's service settings permit your test origin and that recipient verification is complete.
2. Submit an empty/invalid form first. Confirm errors appear and focus moves to the first invalid field, with no network request.
3. Open browser Developer Tools → Network. Enter a name, an email you control, and a harmless message with a unique timestamp. Submit once. Confirm one POST goes to the same Formspree URL as the form action, with an HTTP success response and the service-acceptance message.
4. Check the Formspree submissions dashboard and the intended inbox, including spam/junk. Only actual inbox receipt verifies message delivery. A dashboard entry alone confirms service receipt.
5. If the request fails or times out, confirm values remain and controls become usable again. Wait and check the dashboard/inbox before retrying, because the first request may have reached the service.
6. Repeat once from the actual published origin after any separately authorized deployment. Local success alone does not establish delivery from that origin.


The form validates required fields, focuses the first invalid field, and sends `FormData` with an `Accept: application/json` header. It allows one request at a time, makes fields read-only during sending, and aborts the browser request after 15 seconds. HTTP errors, rate limits, network failures, and timeouts keep the visitor's values. `finally` always restores controls and clears the timer. Only a successful HTTP response clears values.

An aborted or disconnected request may already have reached the service; the visitor is advised to wait before retrying. Duplicate prevention applies only while a request is active in the current page. It does not provide server-side deduplication. Values remain in memory only and are lost if the page is refreshed or closed. JavaScript is required for the gallery and contact workflow; navigation remains available without it.

The public form ID belongs in client HTML. Private API keys, account passwords, deployment tokens, and other credentials must never be placed in these files. Messages are sent to a third-party service; review the service configuration and any privacy notice appropriate for your launch.

## Checks

Run from the project root with Node.js and Python 3 installed:

```sh
node --check js/script.js
node --check js/theme.js
node --check js/translations.js
node --check js/i18n.js
node --check js/certificates.js
node tests/display.cjs
node tests/theme.cjs
node tests/navigation.cjs
node tests/projects.cjs
node tests/contact.cjs
node tests/i18n.cjs
node tests/certificates.cjs
python3 tests/static.py
```

The JavaScript checks use small DOM stand-ins and mocked requests. They cover menu open/close, Escape and focus handling, resize, both project cards, descriptions, technology tags, status labels, repeat rendering, screenshot loading/failure, optional links, URL handling, validation, successful submissions, HTTP errors, network failure, timeout, duplicate prevention, and cleanup. The Python check verifies all four pages: ordered navigation/current-page states, brand/Home links, same-tab destinations, headings, nesting, labels, IDs, ARIA targets, cross-page anchors, PDFs, and repository-relative assets. No real messages are sent. These checks are not a full HTML/CSS validator or a browser accessibility audit.

### Current checks and conservative cleanup (2026-11-09)

Before cleanup, both syntax checks and the display, theme, navigation, and contact tests passed. The project and static tests failed because they still required the intentionally removed Home hero button. Those assertions now check the existing Projects navigation link; the static test also retains its ordered primary-navigation checks on every page. All eleven commands above pass after the footer and multilingual updates. Home contains only Hero/editor → About Me → Contact CTA; the original biography is preserved and the separate About page is removed. Background combines Education, Skills, and Certificates in that order; the former separate pages have been removed and internal links updated. Navigation/Settings behavior is checked on every page, including first-link focus, Escape, outside clicks, resize, and skip-link focus. Theme tests cover all-page markup and cross-page saved preferences. The gallery renders both projects only on Projects; Home is checked to contain no gallery or cards; pages without a gallery initialize safely. Contact mocks still cover validation, service acceptance, HTTP/network failures, the 15-second timeout, duplicate prevention, preserved values, and control cleanup. No real contact requests are made.

The warm palette and contrast tests remain intact. Certificate PDFs, project data, About text, education and skill details, and the contact endpoint are preserved. Certificate lightbox browser checks are documented above; a full manual accessibility and responsive review of the entire site remains advisable. The cleanup removes confirmed unused selectors, duplicate responsive declarations, inactive About grid rules, overridden CTA Flexbox styling, and comments that merely narrate code. Current layout values and mobile behavior are preserved.

### Browser verification before launch

Browser testing was unavailable in the audit environment: no browser executable, Playwright, or Puppeteer was installed. The current project grid uses one column at widths up to 600px and two above 600px; rendered layouts remain unverified.

Test at 320px and 375px (mobile), 380px/381px, 600px/601px, 700px/701px, 900px/901px, and 1000px/1001px (breakpoint boundaries), 768px (tablet), and 1280px (desktop), in both color themes:

- Confirm no horizontal scrolling, cropped text, or overlapping controls, including with long project names and 200%/400% zoom.
- Use Tab/Shift+Tab, Enter, Space, and Escape. Check skip-link focus, menu state, focus after choosing a section, and visible focus rings.
- Disable JavaScript: mobile navigation should stay visible and gallery/contact notices should be readable.
- Confirm both project cards remain visible at every breakpoint. Check screen-reader announcements of form status and field errors associated with their inputs.
- Supply a real screenshot, then deliberately break its path. Confirm lazy loading works and the icon returns after failure.
- Check reduced-motion preferences and keyboard navigation in at least two browsers.
- Test actual contact delivery, offline failure, and throttled requests. Do not repeatedly submit real messages just to test rate limiting; use mocks for that case.

## Metadata and SEO

Each page includes an English fallback language declaration, responsive viewport, one main heading, a title/description, and basic Open Graph/summary-card metadata. Language selection updates `lang`, the page title, and description/title metadata; Home retains its original short title while detail-page titles include Matej ZV. A final domain and share image have not been supplied.

Before launch, review page metadata and verify personal copy remains accurate. Once the final public URL is known, add a canonical link and `og:url` using that same absolute HTTPS URL. Add `og:image` and descriptive `og:image:alt` only after supplying an actual share image. Keep title and description metadata consistent. A sitemap can be added once the public URL is known; no domain-dependent metadata has been fabricated. The gallery requires JavaScript, which limits visibility to crawlers that do not execute scripts.

## GitHub Pages deployment (requires explicit approval)

No deployment, push, publishing workflow, or Pages configuration has been performed. Do not enable Pages or push to an existing publishing branch until you explicitly approve publication. Once Pages is enabled, later pushes to its source branch can publish automatically.

After approval:

1. Create or select your actual GitHub repository. Review the files before committing; keep all four HTML pages, `css/`, `js/`, `assets/`, `.nojekyll`, `.gitignore`, README, and tests. No build command or dependency install is needed. The empty `.nojekyll` file requests plain static serving.
2. Run the checks above. Inspect `git status --short --untracked-files=all` and the complete `git diff --cached` after staging intended files. Commit and push to the intended repository and branch only after approval. No repository URL is assumed here.
3. In the repository, open **Settings → Pages → Build and deployment**. Select **Deploy from a branch**, choose the branch containing these files (usually `main`) and **/(root)**, then save. Repository visibility and account plan must support Pages.
4. Watch the Pages build in **Actions**. Open the exact URL shown in Pages settings, including its repository subpath and trailing slash. Enable **Enforce HTTPS** when available. Do not add a custom domain unless you own and intend to use it.
5. Verify CSS, JavaScript, images, navigation, project links, and actual contact delivery on that URL. Complete the production checklist below.

See [GitHub's publishing-source instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

### Repository-relative paths

Keep HTML asset references such as `css/style.css`, `js/script.js`, and `images/your-file.webp` relative, without a leading `/`. CSS `url(...)` paths resolve relative to the stylesheet, so an image next to the `css/` directory would use `../images/your-file.webp`. Project screenshot and internal project URLs resolve against the document URL. Keep local project paths inside the repository and preserve filename case. Page links such as `projects.html` resolve within the repository; local anchors such as `#main-content` stay on the current page. Background retains the `education`, `skills`, and `learning` IDs (for example, `background.html#education`). The footer has no links; the skip link targets the current page’s `#main-content`, and the Home biography is available at `index.html#about`. No project screenshots are configured yet; optional screenshot paths must be checked again when supplied.

To preview a repository subpath, run this from the project root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory ..
```

Open `http://127.0.0.1:8000/portfolio/` for this checkout. Stop the server with Ctrl+C. This serves the parent directory locally; use only for development. The automated checks also exercise a synthetic `/repository/` base URL.

### Credentials and configuration

`.gitignore` excludes environment files, private key files, local credential/tool directories, dependencies, caches, and editor files. Ignore rules do not remove files already tracked by Git and are not a substitute for reviewing staged changes. Never force-add excluded credentials. GitHub Pages serves static files publicly; it cannot hide a secret in JavaScript or read server environment variables for this page.

Keep the public Formspree endpoint configurable through the existing form `action` in `contact.html`; no build-time secret is needed. Do not put private Formspree API keys or GitHub tokens there. If a credential is ever committed, revoke/rotate it and remove it from Git history before publishing.

## Production launch checklist

- [ ] Explicitly approve publication before pushing to a publishing branch or enabling Pages.
- [ ] Review all project statuses, descriptions, and personal copy for accuracy; supply only real URLs and details.
- [ ] Verify the configured public Formspree endpoint and recipient settings; confirm actual inbox delivery with one controlled submission.
- [ ] Run all automated checks and review staged files for private data or credentials.
- [ ] Preview the repository subpath; check filename case and every supplied screenshot/link.
- [ ] Complete the browser verification above, including mobile, keyboard, zoom, reduced motion, and screen-reader checks. Preserve the warm espresso/cream design.
- [ ] After approved deployment, confirm HTTPS and successful asset requests on the exact Pages URL.
- [ ] Send one controlled contact message from that origin and confirm receipt.
- [ ] Add canonical and share metadata only when the actual public URL and image exist.
- [ ] Recheck the published version after updates; remember that pushes may trigger publication.

## Outstanding launch blockers

- The public Formspree endpoint is configured, but inbox delivery remains unverified. Complete recipient verification and a controlled browser delivery test before advertising delivery as working.
- Confirm project statuses and descriptions remain accurate as development continues. Screenshots and project links are optional; their absence does not break the gallery.
- Complete visual, keyboard, screen-reader, zoom, and live-delivery checks in a real browser. Mock tests cannot establish production accessibility or responsive rendering.
- Supply the final deployment URL to finish canonical and share-URL metadata. This improves SEO but does not prevent static hosting.
