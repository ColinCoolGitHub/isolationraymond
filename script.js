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

// ===== PROJECT GALLERY =====
const projectData = {
    saintbruno: {
        title: 'Quartier des Promenades — Saint-Bruno',
        images: ['projetSaint-bruno.jpg']
    },
    carredelagare: {
        title: 'Carré de la Gare',
        images: ['projetCarreDeLaGare.jpg']
    },
    epiphanie: {
        title: "L'Épiphanie — 32 logements",
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
