
const burger = document.getElementById('burger'), menu = document.getElementById('menu');
function setMenu(open) {
    menu.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.classList.toggle('locked', open);
}
burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false) });

const views = [...document.querySelectorAll('[data-view]')];
function route() {
    const hash = (location.hash.replace('#', '') || '/');
    const target = views.find(v => v.dataset.view === hash);
    if (!target) { window.location.replace('/Error/404.html'); return; }
    views.forEach(v => v.classList.toggle('active', v === target));
    document.querySelectorAll('#menuLinks a, #desktopNav a').forEach(a => a.classList.toggle('current', a.getAttribute('href') === '#' + hash));
    setMenu(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
    reveal(target);
}

addEventListener('hashchange', route);

// Check same-site navigation before leaving the current page. External links,
// telephone/email links, downloads, and links opening a new tab are left alone.
const checkedLinks = new Map();
function showSiteNotice(message) {
    let notice = document.getElementById('siteRuntimeNotice');
    if (!notice) {
        notice = document.createElement('div');
        notice.id = 'siteRuntimeNotice';
        notice.className = 'site-runtime-notice';
        notice.setAttribute('role', 'alert');
        notice.setAttribute('aria-live', 'polite');
        document.body.prepend(notice);
    }
    notice.textContent = message + ' If you need help, call ';
    const phone = document.createElement('a');
    phone.href = 'tel:+18565136584';
    phone.textContent = '(856) 513-6584';
    notice.appendChild(phone);
}

document.addEventListener('click', async event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        link.target === '_blank' || link.hasAttribute('download')) return;

    const rawHref = link.getAttribute('href');
    if (!rawHref || rawHref.startsWith('#') || /^(mailto:|tel:|javascript:)/i.test(rawHref)) return;

    let destination;
    try { destination = new URL(link.href, window.location.href); }
    catch (_) { return; }
    if (destination.origin !== window.location.origin) return;

    // Validate SPA routes locally without making a network request.
    if (destination.pathname === '/' && destination.hash.startsWith('#/')) {
        const requestedView = destination.hash.slice(1);
        if (!views.some(view => view.dataset.view === requestedView)) {
            event.preventDefault();
            window.location.assign('/Error/404.html');
        }
        return;
    }

    // Only inspect same-origin page links. A network failure is not treated as
    // a broken link; normal browser navigation is allowed in that case.
    const key = destination.href;
    event.preventDefault();
    try {
        let result = checkedLinks.get(key);
        if (!result) {
            result = fetch(destination.href, { method: 'HEAD', cache: 'no-store' })
                .then(response => ({ ok: response.ok, status: response.status }))
                .catch(() => null);
            checkedLinks.set(key, result);
        }
        const response = await result;
        if (response && response.status === 404) {
            showSiteNotice('That page is currently unavailable.');
            checkedLinks.delete(key);
            return;
        }
        window.location.assign(destination.href);
    } catch (_) {
        window.location.assign(destination.href);
    }
});

// Report JavaScript runtime errors and failed page resources without exposing
// technical details to visitors. Individual image failures use their own fallback.
window.addEventListener('error', event => {
    if (event.target && event.target !== window) {
        const tag = event.target.tagName;
        if (tag === 'SCRIPT' || tag === 'LINK' || tag === 'IFRAME') {
            showSiteNotice('Some website content could not load. Please refresh the page.');
        }
        return;
    }
    showSiteNotice('Some website features encountered a problem. Please refresh the page.');
});
window.addEventListener('unhandledrejection', () => {
    showSiteNotice('Some website features encountered a problem. Please refresh the page.');
});

const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }) }, { threshold: .1, rootMargin: '0px 0px -40px 0px' });
function reveal(scope) {
    scope.querySelectorAll('.fade-up:not(.in)').forEach((el, i) => {
        el.style.transitionDelay = (Math.min(i % 6, 5) * 60) + 'ms';
        io.observe(el);
    });
}

// Boulevard booking: open the overlay when it has loaded, otherwise fall back to the widget link
document.addEventListener('click', e => {
    const link = e.target.closest('a[data-blvd]');
    if (!link || !window.blvd || typeof window.blvd.openBookingWidget !== 'function') return;
    e.preventDefault();
    setMenu(false);
    try { window.blvd.openBookingWidget({ urlParams: {} }); }
    catch (error) { window.open(link.href, '_blank', 'noopener,noreferrer'); }
});

// Replace failed image requests with a neutral, branded placeholder.
document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => {
        if (img.dataset.fallbackApplied) return;
        img.dataset.fallbackApplied = 'true';
        img.classList.add('image-load-failed');
        const label = (img.alt || 'Image unavailable').replace(/[<>]/g, '');
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><rect width="640" height="400" fill="#211b22"/><path d="M270 155h100v90H270zM290 135h60v20h-60z" fill="none" stroke="#a61377" stroke-width="4"/><text x="320" y="285" fill="#e9dce6" font-family="Arial,sans-serif" font-size="20" text-anchor="middle">' + label.slice(0,48) + '</text></svg>';
        img.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    }, { once: true });
});

const hero = document.querySelector('.hero');
if (hero && !matchMedia('(prefers-reduced-motion: reduce)').matches && matchMedia('(pointer: fine)').matches) {
    const bloomEl = hero.querySelector('.bloom');
    if (bloomEl) {
        hero.addEventListener('pointermove', e => {
            const r = hero.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
            bloomEl.style.translate = (x * 44).toFixed(1) + 'px ' + (y * 30).toFixed(1) + 'px';
        });
        hero.addEventListener('pointerleave', () => { bloomEl.style.translate = '' });
    }
}

const baSearch = document.getElementById('baSearch');
const baFilterSelect = document.getElementById('baFilterSelect');
const baNoResults = document.getElementById('baNoResults');
const baCases = [...document.querySelectorAll('#baGrid .ba-case')];

function filterBAResults() {
    const search = (baSearch?.value || '').trim().toLowerCase();
    const category = baFilterSelect?.value || 'all';

    let visibleCount = 0;

    baCases.forEach(card => {
        const cardCategory = (card.dataset.cat || '').toLowerCase();
        const cardText = card.textContent.toLowerCase();

        const matchesCategory =
            category === 'all' ||
            cardCategory === category;

        const matchesSearch =
            !search ||
            cardText.includes(search) ||
            cardCategory.includes(search);

        const show = matchesCategory && matchesSearch;

        card.style.display = show ? '' : 'none';

        if (show) {
            visibleCount++;
        }
    });

    if (baNoResults) {
        baNoResults.hidden = visibleCount !== 0;
    }
}

if (baSearch) {
    baSearch.addEventListener('input', filterBAResults);
}

if (baFilterSelect) {
    baFilterSelect.addEventListener('change', filterBAResults);
}

document.querySelectorAll('.team .member').forEach(card => {
    const bio = card.querySelector('.member-bio');
    const button = card.querySelector('.team-read-more');

    if (!bio || !button) return;

    button.setAttribute('aria-expanded', 'false');

    button.addEventListener('click', () => {
        const expanded = bio.classList.toggle('expanded');

        /* expand only this card */
        card.classList.toggle('expanded-card', expanded);

        button.textContent = expanded
            ? 'Read less'
            : 'Read more';

        button.setAttribute(
            'aria-expanded',
            expanded ? 'true' : 'false'
        );
    });
});

const termsAccepted = document.getElementById('termsAccepted');
const termsStatus = document.getElementById('termsStatus');
if (termsAccepted && termsStatus) {
    const storageKey = 'pout_terms_accepted';
    const updateTermsState = accepted => {
        localStorage.setItem(storageKey, accepted ? 'true' : 'false');
        termsStatus.textContent = accepted ? 'Accepted on this device.' : 'Not accepted yet.';
    };
    const saved = localStorage.getItem(storageKey) === 'true';
    termsAccepted.checked = saved;
    updateTermsState(saved);
    termsAccepted.addEventListener('change', () => updateTermsState(termsAccepted.checked));
}


/* Highlight today's opening-hours row using the clinic's New Jersey timezone. */
function updateFooterToday() {
    const dayKey = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        timeZone: 'America/New_York'
    }).format(new Date()).toLowerCase();
    document.querySelectorAll('.foot-hour[data-days]').forEach(row => {
        const isToday = row.dataset.days.split(',').includes(dayKey);
        row.classList.toggle('is-today', isToday);
        const badge = row.querySelector('.foot-today');
        if (badge) badge.hidden = !isToday;
        row.toggleAttribute('aria-current', isToday);
        if (isToday) row.setAttribute('aria-current', 'date');
        else row.removeAttribute('aria-current');
    });
}
updateFooterToday();

route();
