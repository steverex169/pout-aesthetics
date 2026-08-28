
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
    const target = views.find(v => v.dataset.view === hash) || views[0];
    views.forEach(v => v.classList.toggle('active', v === target));
    document.querySelectorAll('#menuLinks a').forEach(a => a.classList.toggle('current', a.getAttribute('href') === '#' + hash));
    setMenu(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
    reveal(target);
}
addEventListener('hashchange', route);

const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }) }, { threshold: .1, rootMargin: '0px 0px -40px 0px' });
function reveal(scope) {
    scope.querySelectorAll('.fade-up:not(.in)').forEach((el, i) => {
        el.style.transitionDelay = (Math.min(i % 6, 5) * 60) + 'ms';
        io.observe(el);
    });
}

document.querySelectorAll('.ba-stage').forEach(stage => {
    const after = stage.querySelector('.ba-after'), handle = stage.querySelector('.ba-handle');
    let dragging = false;
    const move = x => {
        const r = stage.getBoundingClientRect();
        let p = Math.max(2, Math.min(98, ((x - r.left) / r.width) * 100));
        after.style.clipPath = 'inset(0 0 0 ' + p + '%)';
        handle.style.left = p + '%';
    };
    stage.addEventListener('pointerdown', e => { dragging = true; stage.setPointerCapture(e.pointerId); move(e.clientX) });
    stage.addEventListener('pointermove', e => { if (dragging) move(e.clientX) });
    stage.addEventListener('pointerup', () => dragging = false);
    stage.addEventListener('pointercancel', () => dragging = false);
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

const baFilter = document.getElementById('baFilter');
if (baFilter) {
    baFilter.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        [...baFilter.children].forEach(x => x.classList.toggle('on', x === b));
        const f = b.dataset.f;
        document.querySelectorAll('#baGrid .ba-case').forEach(c => { c.style.display = (f === 'all' || c.dataset.cat === f) ? '' : 'none' });
    });
}

document.querySelectorAll('.member-bio-collapsible .bio-toggle').forEach(toggle => {
    const bio = toggle.closest('.member-bio-collapsible');
    if (!bio) return;

    toggle.addEventListener('click', () => {
        const expanded = bio.classList.toggle('expanded');
        toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        toggle.textContent = expanded ? 'Read less' : 'Read more';
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

route();
