// ===== LANGUAGE TOGGLE =====
let currentLang = 'fr';

function applyLanguage() {
    // Update language toggle button text
    document.getElementById('langText').textContent = currentLang === 'en' ? 'EN' : 'FR';
    document.querySelectorAll('.mobile-lang-text').forEach(el => {
        el.textContent = currentLang === 'en' ? 'EN' : 'FR';
    });

    // Update html lang attribute
    document.documentElement.lang = currentLang;

    // Update page title
    document.title = currentLang === 'en' 
        ? 'Isolations J. Raymond | Thermal & Acoustic Insulation – Residential & Commercial'
        : 'Isolations J. Raymond | Isolation thermique et acoustique – Résidentiel et Commercial';

    // Update all translatable elements
    document.querySelectorAll('[data-en]').forEach(el => {
        const text = el.getAttribute(`data-${currentLang}`);
        if (text) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                // Don't change input values, only placeholders
            } else {
                el.innerHTML = text;
            }
        }
    });

    // Update placeholders
    document.querySelectorAll('[data-en-placeholder]').forEach(el => {
        const placeholder = el.getAttribute(`data-${currentLang}-placeholder`);
        if (placeholder) {
            el.placeholder = placeholder;
        }
    });

    // Update select options
    document.querySelectorAll('select option[data-en]').forEach(option => {
        const text = option.getAttribute(`data-${currentLang}`);
        if (text) {
            option.textContent = text;
        }
    });
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'fr' : 'en';
    applyLanguage();
}

// Apply French on page load
applyLanguage();

document.getElementById('langToggle').addEventListener('click', toggleLanguage);
document.querySelectorAll('.mobile-menu .lang-toggle').forEach(btn => {
    btn.addEventListener('click', toggleLanguage);
});

// ===== HEADER SCROLL =====
const header = document.getElementById('header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});

// ===== MOBILE MENU =====
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');

menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
});

// Close mobile menu when clicking a link
document.querySelectorAll('.mobile-menu .nav-link').forEach(link => {
    link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    });
});

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ===== SCROLL REVEAL =====
const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .slide-from-left, .slide-from-center, .slide-from-right');

const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    const revealPoint = 150;

    revealElements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementBottom = element.getBoundingClientRect().bottom;

        if (elementTop < windowHeight - revealPoint && elementBottom > revealPoint) {
            element.classList.add('active');
        } else {
            element.classList.remove('active');
        }
    });
};

window.addEventListener('scroll', revealOnScroll);
window.addEventListener('load', revealOnScroll);

// ===== ACTIVE NAV LINK =====
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (window.pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// ===== PARALLAX EFFECT ON HERO =====
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero-content');

    if (scrolled < window.innerHeight) {
        hero.style.transform = `translateY(${scrolled * 0.3}px)`;
        hero.style.opacity = 1 - (scrolled / window.innerHeight) * 0.5;
    }
});

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

let currentGalleryImages = [];
let currentFullscreenIndex = 0;

function openGallery(projectKey) {
    const project = projectData[projectKey];
    if (!project) return;

    const lightbox = document.getElementById('galleryLightbox');
    const title = document.getElementById('galleryTitle');
    const masonry = document.getElementById('galleryMasonry');

    title.textContent = project.title;
    masonry.innerHTML = '';
    currentGalleryImages = project.images;

    project.images.forEach((src, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-masonry-item';
        item.style.animationDelay = (index * 0.08) + 's';
        item.onclick = () => openFullscreen(index);

        const img = document.createElement('img');
        img.src = src;
        img.alt = project.title + ' - ' + (index + 1);
        img.loading = 'lazy';

        item.appendChild(img);
        masonry.appendChild(item);
    });

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeGallery() {
    const lightbox = document.getElementById('galleryLightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

function openFullscreen(index) {
    currentFullscreenIndex = index;
    const viewer = document.getElementById('fullscreenViewer');
    const img = document.getElementById('fullscreenImage');
    const counter = document.getElementById('fullscreenCounter');

    img.src = currentGalleryImages[index];
    counter.textContent = (index + 1) + ' / ' + currentGalleryImages.length;
    viewer.classList.add('active');
}

function closeFullscreen() {
    document.getElementById('fullscreenViewer').classList.remove('active');
}

function navigateFullscreen(direction) {
    currentFullscreenIndex += direction;
    if (currentFullscreenIndex < 0) currentFullscreenIndex = currentGalleryImages.length - 1;
    if (currentFullscreenIndex >= currentGalleryImages.length) currentFullscreenIndex = 0;

    const img = document.getElementById('fullscreenImage');
    const counter = document.getElementById('fullscreenCounter');
    img.src = currentGalleryImages[currentFullscreenIndex];
    counter.textContent = (currentFullscreenIndex + 1) + ' / ' + currentGalleryImages.length;
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    const viewer = document.getElementById('fullscreenViewer');
    const lightbox = document.getElementById('galleryLightbox');

    if (viewer.classList.contains('active')) {
        if (e.key === 'Escape') closeFullscreen();
        if (e.key === 'ArrowLeft') navigateFullscreen(-1);
        if (e.key === 'ArrowRight') navigateFullscreen(1);
    } else if (lightbox.classList.contains('active')) {
        if (e.key === 'Escape') closeGallery();
    }
});

// Close lightbox on background click
document.getElementById('galleryLightbox').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeGallery();
});

document.getElementById('fullscreenViewer').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeFullscreen();
});

// Touch swipe for fullscreen viewer
(function() {
    let touchStartX = 0;
    const viewer = document.getElementById('fullscreenViewer');
    viewer.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    viewer.addEventListener('touchend', (e) => {
        const diff = e.changedTouches[0].screenX - touchStartX;
        if (Math.abs(diff) > 50) {
            navigateFullscreen(diff < 0 ? 1 : -1);
        }
    }, { passive: true });
})();
