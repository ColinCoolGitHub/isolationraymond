// ===== LANGUAGE TOGGLE =====
let currentLang = 'fr';

function applyLanguage() {
    document.getElementById('langText').textContent = currentLang === 'fr' ? 'EN' : 'FR';
    document.querySelectorAll('.mobile-lang-text').forEach(el => {
        el.textContent = currentLang === 'fr' ? 'EN' : 'FR';
    });

    document.documentElement.lang = currentLang;

    document.title = currentLang === 'en'
        ? 'Isolations J. Raymond | Thermal & Acoustic Insulation – Residential & Commercial'
        : 'Isolations J. Raymond | Isolation thermique et acoustique – Résidentiel et Commercial';

    document.querySelectorAll('[data-en]').forEach(el => {
        const text = el.getAttribute(`data-${currentLang}`);
        if (text) el.innerHTML = text;
    });
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'fr' : 'en';
    applyLanguage();
}

document.getElementById('langToggle').addEventListener('click', toggleLanguage);
document.querySelectorAll('.mobile-lang').forEach(btn => btn.addEventListener('click', toggleLanguage));

// ===== HEADER SCROLL =====
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ===== HERO: B&W -> color on scroll + soft parallax =====
const heroImg = document.querySelector('.hero-media img');
const heroInner = document.querySelector('.hero-inner');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reducedMotion && heroImg) {
    let ticking = false;
    const updateHero = () => {
        const y = window.scrollY;
        const p = Math.min(y / (window.innerHeight * 0.55), 1);
        heroImg.style.filter = `grayscale(${1 - p})`;
        if (heroInner && y < window.innerHeight) {
            heroInner.style.opacity = 1 - (y / window.innerHeight) * 0.6;
        }
        ticking = false;
    };
    window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(updateHero); ticking = true; }
    }, { passive: true });
    updateHero();
}

// ===== MOBILE MENU =====
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');

menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
});

document.querySelectorAll('.mobile-link, .mobile-cta').forEach(link => {
    link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    });
});

// ===== SCROLL REVEAL =====
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ===== ABOUT VIDEO: 4 horizontal strips assemble quickly, react to mouse =====
(function () {
    const stage = document.getElementById('videoStage');
    const video = document.getElementById('stageVideo');
    const strips = Array.from(document.querySelectorAll('.video-strip'));
    if (!stage || !video || strips.length !== 4) return;

    const ctxs = strips.map(c => c.getContext('2d'));
    // strips 0 & 2 come from the left, 1 & 3 from the right
    const dirs = [-1, 1, -1, 1];
    const stagger = 0.13;       // delay between strips along the scroll range
    const parts = [0, 0, 0, 0]; // per-strip assembly 0 -> 1, eased toward scroll target
    let active = false;

    const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    // scroll-scrubbed progress: assembles going down, disassembles going up
    function scrollProgress() {
        const rect = stage.getBoundingClientRect();
        const vh = window.innerHeight;
        return Math.min(Math.max((vh - rect.top) / (vh * 0.85), 0), 1);
    }

    function sizeCanvases() {
        if (!video.videoWidth) return;
        const w = video.videoWidth;
        const h = Math.floor(video.videoHeight / 4);
        strips.forEach(c => { if (c.width !== w) { c.width = w; c.height = h; } });
    }

    function render() {
        if (!active) return;
        sizeCanvases();
        if (!reducedMotion) {
            const p = scrollProgress();
            strips.forEach((c, i) => {
                // each strip occupies a shifted slice of the global progress
                const local = Math.min(Math.max((p - i * stagger) / (1 - 3 * stagger), 0), 1);
                const targetPart = easeInOut(local);
                parts[i] += (targetPart - parts[i]) * 0.18;
                c.style.transform = `translateX(${dirs[i] * 110 * (1 - parts[i])}%)`;
                c.style.opacity = Math.min(1, 0.25 + parts[i] * 0.9);
            });
        }
        if (video.readyState >= 2 && video.videoWidth) {
            const w = video.videoWidth;
            const h = video.videoHeight / 4;
            ctxs.forEach((ctx, i) => {
                ctx.drawImage(video, 0, i * h, w, h, 0, 0, strips[i].width, strips[i].height);
            });
        }
        requestAnimationFrame(render);
    }

    // video pauses offscreen; rendering loop only runs when visible
    const stageWatch = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            active = entry.isIntersecting;
            if (active) {
                video.play().catch(() => {});
                requestAnimationFrame(render);
            } else {
                video.pause();
            }
        });
    }, { rootMargin: '80px' });
    stageWatch.observe(stage);

    if (reducedMotion) {
        strips.forEach(c => { c.style.transform = 'none'; c.style.opacity = 1; });
    }
})();

// ===== PROJECT GALLERY =====
const projectData = {
    saintbruno: {
        title: 'Quartier des Promenades, Saint-Bruno',
        images: ['projetSaint-bruno.jpg']
    },
    carredelagare: {
        title: 'Carré de la Gare',
        images: ['projetCarreDeLaGare.jpg']
    },
    epiphanie: {
        title: "L'Épiphanie, 32 logements",
        images: ['projetEpiphanie.jpg']
    }
};

let galleryImages = [];
let galleryTitle = '';
let galleryIndex = 0;

function renderGalleryImage() {
    const img = document.getElementById('lightboxImage');
    const caption = document.getElementById('lightboxCaption');
    img.src = galleryImages[galleryIndex];
    img.alt = galleryTitle;
    caption.textContent = galleryImages.length > 1
        ? `${galleryTitle} (${galleryIndex + 1} / ${galleryImages.length})`
        : galleryTitle;
}

function openGallery(key) {
    const project = projectData[key];
    if (!project) return;
    galleryImages = project.images;
    galleryTitle = project.title;
    galleryIndex = 0;
    renderGalleryImage();
    document.getElementById('lightbox').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeGallery() {
    document.getElementById('lightbox').classList.remove('active');
    document.body.style.overflow = '';
}

function navigateGallery(direction) {
    galleryIndex = (galleryIndex + direction + galleryImages.length) % galleryImages.length;
    renderGalleryImage();
}

document.addEventListener('keydown', e => {
    if (!document.getElementById('lightbox').classList.contains('active')) return;
    if (e.key === 'Escape') closeGallery();
    if (e.key === 'ArrowLeft') navigateGallery(-1);
    if (e.key === 'ArrowRight') navigateGallery(1);
});

document.getElementById('lightbox').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeGallery();
});

// Touch swipe in lightbox
(function () {
    let touchStartX = 0;
    const lightbox = document.getElementById('lightbox');
    lightbox.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    lightbox.addEventListener('touchend', e => {
        const diff = e.changedTouches[0].screenX - touchStartX;
        if (Math.abs(diff) > 50) navigateGallery(diff < 0 ? 1 : -1);
    }, { passive: true });
})();
