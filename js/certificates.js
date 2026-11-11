// Progressive enhancement: preview links still open the image without JavaScript.
(() => {
    const dialog = document.querySelector('#certificate-dialog');
    if (!dialog || typeof dialog.showModal !== 'function') return;
    const image = dialog.querySelector('img');
    const title = dialog.querySelector('#certificate-course');
    const pdf = dialog.querySelector('#certificate-pdf');
    const close = dialog.querySelector('#certificate-close');
    const zoom = dialog.querySelector('#certificate-zoom');
    const viewport = dialog.querySelector('.certificate-viewport');
    const error = dialog.querySelector('#certificate-error');
    let opener;
    let previousOverflow;

    document.querySelectorAll('[data-certificate-preview]').forEach(link => {
        link.setAttribute('aria-haspopup', 'dialog');
        link.setAttribute('aria-controls', dialog.id);
        link.addEventListener('click', event => {
            // Preserve modified clicks and the browser's open-in-new-tab behavior.
            if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            opener = link;
            const heading = document.getElementById(link.dataset.certificateHeading);
            title.textContent = heading.title || heading.textContent;
            image.alt = title.textContent;
            pdf.href = link.dataset.certificatePdf;
            error.hidden = true;
            image.hidden = false;
            image.src = link.href;
            zoom.setAttribute('aria-pressed', 'false');
            viewport.classList.remove('is-zoomed');
            previousOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            dialog.showModal();
            viewport.scrollTop = 0;
            viewport.scrollLeft = 0;
            close.focus();
        });
    });
    close.addEventListener('click', () => dialog.close());
    // Only the empty overlay closes the dialog; image and panel clicks stay open.
    dialog.addEventListener('click', event => {
        if (event.target === dialog) dialog.close();
    });
    // Keep Tab cycling within the controls, including at the browser's tab boundary.
    dialog.addEventListener('keydown', event => {
        if (event.key !== 'Tab') return;
        const first = close;
        const last = viewport;
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });
    // Native modal dialogs make the background inert and handle Escape via cancel.
    dialog.addEventListener('close', () => {
        document.body.style.overflow = previousOverflow;
        image.removeAttribute('src');
        opener?.focus({ preventScroll: true });
    });
    zoom.addEventListener('click', () => {
        const enlarged = zoom.getAttribute('aria-pressed') !== 'true';
        zoom.setAttribute('aria-pressed', String(enlarged));
        viewport.classList.toggle('is-zoomed', enlarged);
    });
    image.addEventListener('error', () => {
        image.hidden = true;
        error.hidden = false;
    });
})();
