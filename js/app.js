/* ======================================================
   Portfolio App — Reads config.json (or localStorage override)
   and renders all sections dynamically
   ====================================================== */

(function () {
  'use strict';

  // SVG icon map (inline Lucide-style icons)
  const ICONS = {
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
    mapPin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>',
    code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
    wrench: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z"/></svg>',
    brain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/></svg>',
    database: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    languages: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
    flask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16.5h10"/></svg>',
    folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>',
    externalLink: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
    zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    bot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>',
    scrape: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>',
    crm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="3" x2="21" y1="15" y2="15"/><line x1="9" x2="9" y1="9" y2="21"/><line x1="15" x2="15" y1="9" y2="21"/></svg>',
    funnel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>',
    api: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91"/></svg>',
    bpa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="6" height="6" rx="1"/><rect x="16" y="6" width="6" height="6" rx="1"/><rect x="9" y="14" width="6" height="6" rx="1"/><path d="M5 12v2a2 2 0 0 0 2 2h2"/><path d="M19 12v2a2 2 0 0 1-2 2h-2"/></svg>',
    saas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>',
    chevLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    chevRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>',
  };

  const projectIcons = ['code', 'database', 'brain', 'wrench', 'flask', 'folder'];

  // ---------- Data Loading ----------

  async function loadConfig() {
    // Primary: fetch from API (MongoDB)
    try {
      const res = await fetch('/api/config');
      if (res.ok) return await res.json();
    } catch (e) { /* API unavailable, fall through */ }
    // Fallback: direct file (for static hosting without backend)
    const res = await fetch('config.json');
    return res.json();
  }

  // ---------- Rendering ----------

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderHero(data) {
    const { hero, contact } = data;
    document.title = data.meta.siteTitle;

    const nameEl = document.getElementById('hero-name');
    const nameParts = hero.name.split(' ');
    nameEl.innerHTML = nameParts.map(w => w.toLowerCase() === 'rakib' ? '<span class="accent">' + escapeHtml(w) + '</span>' : escapeHtml(w)).join(' ');

    document.getElementById('nav-name').textContent = hero.name.split(' ').map(w => w[0]).join('');
    // Rotating subtitle animation
    (function initRotatingSubtitle() {
      const subtitleEl = document.querySelector('.hero-subtitle-text');
      if (!subtitleEl) return;
      const items = hero.subtitle.split('·').map(s => s.trim()).filter(Boolean);
      if (items.length <= 1) { subtitleEl.textContent = hero.subtitle; return; }
      let current = 0;
      const typingSpeed = 50;
      const erasingSpeed = 30;
      const holdDelay = 1500;

      function typeText(text, cb) {
        let i = 0;
        function tick() {
          subtitleEl.textContent = text.slice(0, i + 1);
          i++;
          if (i < text.length) setTimeout(tick, typingSpeed);
          else setTimeout(cb, holdDelay);
        }
        tick();
      }
      function eraseText(cb) {
        let len = subtitleEl.textContent.length;
        function tick() {
          subtitleEl.textContent = subtitleEl.textContent.slice(0, len - 1);
          len--;
          if (len > 0) setTimeout(tick, erasingSpeed);
          else setTimeout(cb, 300);
        }
        tick();
      }
      function loop() {
        typeText(items[current], function() {
          eraseText(function() {
            current = (current + 1) % items.length;
            loop();
          });
        });
      }
      loop();
    })();
    document.getElementById('hero-tagline').textContent = hero.tagline;
    document.getElementById('hero-status').textContent = hero.statusText;

    // Profile image
    if (hero.heroImage) {
      const photoImg = document.querySelector('.photo-img');
      if (photoImg) {
        photoImg.src = imgSrc(hero.heroImage);
        photoImg.onerror = function() { this.src = hero.heroImage; };
      }
    }

    if (hero.resumeLink) {
      const resumeBtn = document.getElementById('hero-resume');
      resumeBtn.href = imgSrc(hero.resumeLink);
      resumeBtn.onerror = function() { this.href = hero.resumeLink; };
      resumeBtn.setAttribute('download', '');
    }
  }

  function renderMarquee() {
    const track = document.getElementById('marquee-track');
    const items = [
      'Automation Expert',
      'AI Solutions',
      'Web Scraping',
      'CRM Development',
      'Voice AI',
      'API Integration',
      'Data Analytics',
      'Python & JavaScript',
      'Cloud Deployment',
      'Machine Learning',
    ];
    const html = items.map(t => `<span class="marquee-item">${t}</span><span class="marquee-dot">✦</span>`).join('');
    track.innerHTML = html + html;
  }

  function renderAbout(data) {
    document.getElementById('about-text').textContent = data.about.description;
    const hl = document.getElementById('about-highlights');
    hl.innerHTML = data.about.highlights.map(h =>
      `<div class="highlight-item fade-in">
        <span class="highlight-dot"></span>
        <span class="highlight-text">${escapeHtml(h)}</span>
      </div>`
    ).join('');
  }

  function renderExpertise(data) {
    if (!data.expertise) return;

    // Core services grid
    const coreGrid = document.getElementById('expertise-core-grid');
    if (coreGrid && data.expertise.coreServices) {
      coreGrid.innerHTML = data.expertise.coreServices.map(item => {
        const iconSvg = ICONS[item.icon] || ICONS.zap;
        return `<div class="expertise-card fade-in">
          <span class="trophy-badge">\uD83C\uDFC6</span>
          <div class="expertise-card-icon">${iconSvg}</div>
          <h4>${escapeHtml(item.title)}</h4>
          <p>${escapeHtml(item.desc)}</p>
        </div>`;
      }).join('');
    }

    // Platforms
    const platformsWrap = document.getElementById('expertise-platforms');
    if (platformsWrap && data.expertise.platforms) {
      platformsWrap.innerHTML = data.expertise.platforms.map(p =>
        `<span class="platform-chip">${escapeHtml(p)}</span>`
      ).join('');
    }

    // Scraping tools
    const scrapingWrap = document.getElementById('expertise-scraping');
    if (scrapingWrap && data.expertise.scrapingTools) {
      scrapingWrap.innerHTML = data.expertise.scrapingTools.map(s =>
        `<span class="expertise-chip">${escapeHtml(s)}</span>`
      ).join('');
    }

    // Advanced systems
    const advancedWrap = document.getElementById('expertise-advanced');
    if (advancedWrap && data.expertise.advancedSystems) {
      advancedWrap.innerHTML = data.expertise.advancedSystems.map(a =>
        `<span class="expertise-chip">${escapeHtml(a)}</span>`
      ).join('');
    }
  }

  function renderEducation(data) {
    const tl = document.getElementById('education-timeline');

    // Experience entries first
    const expHtml = (data.experience || []).map(ex => {
      const linkHtml = ex.link
        ? `<a href="${escapeHtml(ex.link)}" target="_blank" rel="noopener noreferrer" class="timeline-institution" style="color:var(--accent);">${escapeHtml(ex.company)}</a>`
        : `<div class="timeline-institution">${escapeHtml(ex.company)}</div>`;
      return `<div class="timeline-item fade-in">
        <div class="timeline-dot" style="border-color:#22c55e;"></div>
        <div class="timeline-card">
          <div class="timeline-year">${escapeHtml(ex.year)}</div>
          <div class="timeline-degree">${escapeHtml(ex.role)}</div>
          ${linkHtml}
          <ul class="timeline-details">
            ${ex.details.map(d => `<li>${escapeHtml(d)}</li>`).join('')}
          </ul>
        </div>
      </div>`;
    }).join('');

    // Education entries
    const eduHtml = data.education.map(e =>
      `<div class="timeline-item fade-in">
        <div class="timeline-dot"></div>
        <div class="timeline-card">
          <div class="timeline-year">${escapeHtml(e.year)}</div>
          <div class="timeline-degree">${escapeHtml(e.degree)}</div>
          <div class="timeline-institution">${escapeHtml(e.institution)}</div>
          <ul class="timeline-details">
            ${e.details.map(d => `<li>${escapeHtml(d)}</li>`).join('')}
          </ul>
        </div>
      </div>`
    ).join('');

    tl.innerHTML = expHtml + eduHtml;
  }

  // Resolve image src: try API first, local file as fallback
  function imgSrc(filename) {
    if (!filename) return '';
    return '/api/images/' + encodeURIComponent(filename);
  }

  function renderFeaturedProjects(data) {
    const grid = document.getElementById('featured-projects-grid');
    if (!grid || !data.featuredProjects) return;
    grid.innerHTML = data.featuredProjects.map((p, i) => {
      // Combine thumbnail + gallery into one images array
      const allImages = [];
      if (p.thumbnail) allImages.push(p.thumbnail);
      if (p.gallery) p.gallery.forEach(g => allImages.push(g));

      const galleryHtml = allImages.length > 0 ? `<div class="fp-gallery" data-index="0">
        <div class="fp-gallery-track">
          ${allImages.map((img, idx) => `<div class="fp-gallery-slide${idx === 0 ? ' active' : ''}"><img src="${escapeHtml(imgSrc(img))}" alt="${escapeHtml(p.title)} - Image ${idx + 1}" loading="lazy" onerror="this.src='${escapeHtml(img)}'" /></div>`).join('')}
        </div>
        ${allImages.length > 1 ? `<button class="fp-gallery-btn fp-prev" aria-label="Previous image">${ICONS.chevLeft}</button><button class="fp-gallery-btn fp-next" aria-label="Next image">${ICONS.chevRight}</button><div class="fp-gallery-dots">${allImages.map((_, idx) => `<span class="fp-dot${idx === 0 ? ' active' : ''}" data-dot="${idx}"></span>`).join('')}</div>` : ''}
      </div>` : '';

      const featuresHtml = (p.features || []).map(f => `<li>${escapeHtml(f)}</li>`).join('');

      return `<div class="fp-card fade-in">
        <div class="fp-card-inner">
          ${galleryHtml}
          <div class="fp-body">
            <div class="fp-number">${String(i + 1).padStart(2, '0')}</div>
            <h3 class="fp-title">${escapeHtml(p.title)}</h3>
            <div class="fp-tags">
              ${p.tech.split(',').map(t => `<span class="fp-tag">${escapeHtml(t.trim())}</span>`).join('')}
            </div>
            <p class="fp-desc">${escapeHtml(p.description)}</p>
            <ul class="fp-features">${featuresHtml}</ul>
          </div>
        </div>
      </div>`;
    }).join('');

    // Gallery navigation logic
    grid.querySelectorAll('.fp-gallery').forEach(gallery => {
      const slides = gallery.querySelectorAll('.fp-gallery-slide');
      const dots = gallery.querySelectorAll('.fp-dot');
      if (slides.length <= 1) return;
      function goTo(idx) {
        slides.forEach((s, j) => s.classList.toggle('active', j === idx));
        dots.forEach((d, j) => d.classList.toggle('active', j === idx));
        gallery.dataset.index = idx;
      }
      gallery.querySelector('.fp-prev').addEventListener('click', () => {
        let cur = parseInt(gallery.dataset.index);
        goTo(cur <= 0 ? slides.length - 1 : cur - 1);
      });
      gallery.querySelector('.fp-next').addEventListener('click', () => {
        let cur = parseInt(gallery.dataset.index);
        goTo(cur >= slides.length - 1 ? 0 : cur + 1);
      });
      dots.forEach(dot => dot.addEventListener('click', () => goTo(parseInt(dot.dataset.dot))));
    });
  }

  function renderProjects(data) {
    const grid = document.getElementById('projects-grid');
    grid.innerHTML = data.projects.map((p, i) => {
      const iconKey = projectIcons[i % projectIcons.length];
      const linkHtml = p.link ? `<a href="${escapeHtml(p.link)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="margin-top:0.75rem;padding:0.5rem 1rem;font-size:0.7rem;">View Project ${ICONS.externalLink}</a>` : '';
      return `<div class="card project-card fade-in">
        <div class="card-vents"><span></span><span></span><span></span></div>
        <div class="project-header">
          <div class="icon-housing">${ICONS[iconKey]}</div>
          <div>
            <h3>${escapeHtml(p.title)}</h3>
            <div class="project-tech">
              ${p.tech.split(',').map(t => `<span class="tech-tag">${escapeHtml(t.trim())}</span>`).join('')}
            </div>
          </div>
        </div>
        <p class="project-desc">${escapeHtml(p.description)}</p>
        ${linkHtml}
      </div>`;
    }).join('');
  }

  function renderResearch(data) {
    const grid = document.getElementById('research-grid');
    grid.innerHTML = data.research.map(r =>
      `<div class="card research-card fade-in">
        <div class="card-vents"><span></span><span></span><span></span></div>
        <div class="card-body">
          <div class="research-status"><span class="status-dot"></span>${escapeHtml(r.status)}</div>
          <h3 style="font-size:1.05rem;font-weight:700;margin-bottom:0.5rem;">${escapeHtml(r.title)}</h3>
          <p class="label-stamp" style="margin-bottom:0.75rem;">${escapeHtml(r.dataset)}</p>
          <p class="project-desc">${escapeHtml(r.description)}</p>
        </div>
        <div class="venue-strip">${escapeHtml(r.venue)}</div>
      </div>`
    ).join('');
  }

  function renderSkills(data) {
    const categories = [
      { key: 'languages', title: 'Languages', icon: ICONS.code },
      { key: 'web', title: 'Web & Database', icon: ICONS.globe },
      { key: 'tools', title: 'Tools & Platforms', icon: ICONS.wrench },
      { key: 'concepts', title: 'Concepts', icon: ICONS.brain },
    ];
    const grid = document.getElementById('skills-grid');
    grid.innerHTML = categories.map(c =>
      `<div class="card skill-category fade-in" style="padding:1.5rem;">
        <h3>${c.icon} ${escapeHtml(c.title)}</h3>
        <div class="skill-list">
          ${(data.skills[c.key] || []).map(s => `<span class="skill-chip">${escapeHtml(s)}</span>`).join('')}
        </div>
      </div>`
    ).join('');
  }

  function renderExtras(data) {
    const grid = document.getElementById('extras-grid');

    // Community
    const communityHtml = `<div class="card extra-card fade-in" style="padding:1.5rem;">
      <h3>Community</h3>
      <ul class="extra-list">
        ${data.community.map(c => `<li><div><strong>${escapeHtml(c.role)}</strong><br/><span style="font-size:0.8rem;color:var(--text-muted);">${escapeHtml(c.organization)}</span></div></li>`).join('')}
      </ul>
    </div>`;

    // Languages
    const languagesHtml = `<div class="card extra-card fade-in" style="padding:1.5rem;">
      <h3>Languages</h3>
      <ul class="extra-list">
        ${data.languages.map(l => `<li><span>${escapeHtml(l.name)} — <em>${escapeHtml(l.level)}</em></span></li>`).join('')}
      </ul>
    </div>`;

    // Interests
    const interestsHtml = `<div class="card extra-card fade-in" style="padding:1.5rem;">
      <h3>Interests</h3>
      <div class="interests-wrap">
        ${data.interests.map(i => `<span class="interest-chip">${escapeHtml(i)}</span>`).join('')}
      </div>
    </div>`;

    grid.innerHTML = communityHtml + languagesHtml + interestsHtml;
  }

  function renderContact(data) {
    const grid = document.getElementById('contact-grid');
    const items = [];

    if (data.contact.email) {
      items.push({ icon: ICONS.mail, label: 'Work Email', value: data.contact.email, href: 'mailto:' + data.contact.email });
    }
    if (data.contact.emailAlt) {
      items.push({ icon: ICONS.mail, label: 'Personal Email', value: data.contact.emailAlt, href: 'mailto:' + data.contact.emailAlt });
    }
    if (data.contact.emailAlt2) {
      items.push({ icon: ICONS.mail, label: 'Personal Email', value: data.contact.emailAlt2, href: 'mailto:' + data.contact.emailAlt2 });
    }
    if (data.contact.location) {
      items.push({ icon: ICONS.mapPin, label: 'Location', value: data.contact.location });
    }
    if (data.contact.github) {
      items.push({ icon: ICONS.github, label: 'GitHub', value: data.contact.github, href: data.contact.github });
    }
    if (data.contact.linkedin) {
      items.push({ icon: ICONS.linkedin, label: 'LinkedIn', value: data.contact.linkedin, href: data.contact.linkedin });
    }
    if (data.contact.calendarLink) {
      items.push({ icon: ICONS.calendar, label: 'Book a Meeting', value: 'Schedule a quick call to discuss your project, goals, or any automation needs.', href: data.contact.calendarLink, isMeeting: true });
    }

    // Separate meeting card from the rest
    const meetingItem = items.find(it => it.isMeeting);
    const otherItems = items.filter(it => !it.isMeeting);

    const meetingHtml = meetingItem ? `
      <div class="contact-meeting-card fade-in">
        <div class="contact-meeting-label">Schedule</div>
        <div class="contact-meeting-icon">${meetingItem.icon}</div>
        <div class="contact-meeting-title">${escapeHtml(meetingItem.label)}</div>
        <div class="contact-meeting-desc">${escapeHtml(meetingItem.value)}</div>
        <a href="${escapeHtml(meetingItem.href)}" target="_blank" rel="noopener noreferrer" class="contact-meeting-btn">Schedule Now →</a>
      </div>` : '';

    const cardsHtml = `<div class="contact-cards">${otherItems.map(it => {
      const inner = it.href
        ? `<a href="${escapeHtml(it.href)}" target="_blank" rel="noopener noreferrer" class="contact-value" style="color:var(--accent);">${escapeHtml(it.value)}</a>`
        : `<span class="contact-value">${escapeHtml(it.value)}</span>`;
      return `<div class="contact-item fade-in">
        <div class="contact-icon">${it.icon}</div>
        <div class="contact-info">
          <div class="contact-label">${escapeHtml(it.label)}</div>
          ${inner}
        </div>
      </div>`;
    }).join('')}</div>`;

    grid.innerHTML = meetingHtml + cardsHtml;

    document.getElementById('footer-text').textContent = `© ${new Date().getFullYear()} ${data.hero.name} — Built with precision.`;
  }

  // ---------- Scroll Animations ----------

  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
  }

  // ---------- Mobile Menu ----------

  window.closeMobile = function () {
    document.getElementById('mobileMenu').classList.remove('open');
  };

  document.getElementById('menuBtn').addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.toggle('open');
  });

  // ---------- Scroll to Top ----------

  const scrollBtn = document.getElementById('scrollTop');
  window.addEventListener('scroll', () => {
    scrollBtn.classList.toggle('visible', window.scrollY > 400);
  });
  scrollBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ---------- Theme Toggle ----------

  const themeToggle = document.getElementById('themeToggle');
  const root = document.documentElement;

  // Apply saved theme on load
  const savedTheme = localStorage.getItem('portfolio_theme');
  if (savedTheme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  }

  themeToggle.addEventListener('click', () => {
    const isDark = root.getAttribute('data-theme') === 'dark';
    if (isDark) {
      root.removeAttribute('data-theme');
      localStorage.setItem('portfolio_theme', 'light');
    } else {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('portfolio_theme', 'dark');
    }
  });

  // ---------- Init ----------

  loadConfig().then(data => {
    renderHero(data);
    renderMarquee();
    renderAbout(data);
    renderExpertise(data);
    renderEducation(data);
    renderFeaturedProjects(data);
    renderProjects(data);
    renderResearch(data);
    renderSkills(data);
    renderExtras(data);
    renderContact(data);
    // Kick off scroll animations after DOM populated
    requestAnimationFrame(initScrollAnimations);
  });

})();

/* ========== CHAT ASSISTANT WIDGET ========== */
(function () {
  'use strict';

  const WEBHOOK_URL = 'https://n8n.srv1349163.hstgr.cloud/webhook/a95d3f87-094a-42ea-93a1-8a6d12d3dc88';

  const widget = document.getElementById('chatWidget');
  const fab = document.getElementById('chatFab');
  const closeBtn = document.getElementById('chatCloseBtn');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const messages = document.getElementById('chatMessages');
  const sendBtn = document.getElementById('chatSendBtn');

  if (!widget || !fab) return;

  // Toggle chat open/close
  fab.addEventListener('click', () => {
    widget.classList.toggle('open');
    if (widget.classList.contains('open')) input.focus();
  });

  closeBtn.addEventListener('click', () => {
    widget.classList.remove('open');
  });

  // Generate a simple session ID
  let sessionId = sessionStorage.getItem('chat_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem('chat_session_id', sessionId);
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function addMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg ' + sender;
    msg.innerHTML = '<div class="chat-bubble">' + escapeHTML(text) + '</div>';
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'chat-msg bot';
    typing.id = 'chatTyping';
    typing.innerHTML = '<div class="chat-bubble chat-typing"><span></span><span></span><span></span></div>';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeTyping() {
    const t = document.getElementById('chatTyping');
    if (t) t.remove();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    input.value = '';
    sendBtn.disabled = true;
    showTyping();

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: sessionId })
      });

      removeTyping();

      if (!res.ok) throw new Error('Request failed');

      const data = await res.json();
      const reply = data.output || data.response || data.text || data.message || data.reply || JSON.stringify(data);
      addMessage(reply, 'bot');
    } catch (err) {
      removeTyping();
      addMessage('Sorry, something went wrong. Please try again later.', 'bot');
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  });
})();

/* ---------- tsParticles Firefly (async, non-blocking) ---------- */
(function () {
  function initFirefly() {
    if (typeof tsParticles === 'undefined' || typeof loadFireflyPreset !== 'function') return;
    (async function () {
      await loadFireflyPreset(tsParticles);
      await tsParticles.load({
        id: 'tsparticles',
        options: {
          fullScreen: false,
          background: { color: 'transparent' },
          particles: { color: { value: '#eb565e' } },
          preset: 'firefly'
        }
      });
    })();
  }

  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@tsparticles/preset-firefly@3/tsparticles.preset.firefly.bundle.min.js';
  s.onload = initFirefly;
  document.head.appendChild(s);
})();
