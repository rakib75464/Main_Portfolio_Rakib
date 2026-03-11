/* ======================================================
   Admin Dashboard — Dynamic config.json editor
   All data is stored in localStorage and can be exported.
   ====================================================== */

(function () {
  'use strict';

  let CONFIG = {};

  // ---------- Helpers ----------

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // ---------- Auth (Backend API) ----------

  const API_BASE = '/api';

  function getToken() {
    return sessionStorage.getItem('admin_token');
  }

  function setToken(token) {
    sessionStorage.setItem('admin_token', token);
  }

  function clearToken() {
    sessionStorage.removeItem('admin_token');
  }

  async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    let res;
    try {
      res = await fetch(API_BASE + endpoint, { ...options, headers });
    } catch (e) {
      throw new Error('Server is not running. Start it with: npm start');
    }
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Server returned invalid response. Make sure you access this page via http://localhost:3000/admin.html');
    }
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  // ---------- Show/Hide Password ----------

  function initPasswordToggle() {
    const toggle = document.getElementById('togglePassword');
    const input = document.getElementById('loginPassword');
    const eyeOpen = toggle.querySelector('.eye-open');
    const eyeClosed = toggle.querySelector('.eye-closed');

    toggle.addEventListener('click', () => {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      eyeOpen.style.display = isPassword ? 'none' : '';
      eyeClosed.style.display = isPassword ? '' : 'none';
    });
  }

  async function initLogin() {
    const overlay = document.getElementById('loginOverlay');
    const topbar = document.querySelector('.admin-topbar');
    const container = document.querySelector('.admin-container');
    const loginTitle = document.querySelector('.login-title');
    const loginSubtitle = document.querySelector('.login-subtitle');

    // Check if token is still valid
    if (getToken()) {
      try {
        await apiRequest('/auth/verify', { method: 'POST' });
        overlay.classList.add('hidden');
        return true;
      } catch (e) { clearToken(); }
    }

    // Check if first-time setup is needed
    let needsSetup = false;
    try {
      const setupRes = await apiRequest('/auth/needs-setup');
      needsSetup = setupRes.needsSetup;
    } catch (e) { /* server may be unavailable */ }

    // Hide dashboard content
    topbar.style.display = 'none';
    container.style.display = 'none';

    // If setup needed, show registration UI
    if (needsSetup) {
      loginTitle.textContent = 'Create Admin Account';
      loginSubtitle.textContent = 'First-time Setup';
      // Add username field dynamically
      const emailGroup = document.getElementById('loginEmail').closest('.form-group');
      const usernameGroup = document.createElement('div');
      usernameGroup.className = 'form-group';
      usernameGroup.id = 'usernameGroup';
      usernameGroup.innerHTML = '<label class="form-label">Username</label><input class="form-input" id="loginUsername" type="text" required autocomplete="username" />';
      emailGroup.parentNode.insertBefore(usernameGroup, emailGroup);
    }

    initPasswordToggle();

    return new Promise((resolve) => {
      document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const errorEl = document.getElementById('loginError');
        const usernameEl = document.getElementById('loginUsername');

        try {
          let result;
          if (needsSetup && usernameEl) {
            const username = usernameEl.value.trim();
            if (!username) { errorEl.textContent = 'Username is required.'; return; }
            result = await apiRequest('/auth/register', {
              method: 'POST',
              body: JSON.stringify({ username, email, password })
            });
          } else {
            result = await apiRequest('/auth/login', {
              method: 'POST',
              body: JSON.stringify({ email, password })
            });
          }

          setToken(result.token);
          overlay.classList.add('hidden');
          topbar.style.display = '';
          container.style.display = '';
          errorEl.textContent = '';
          resolve(true);
        } catch (err) {
          errorEl.textContent = err.message || 'Login failed.';
        }
      });
    });
  }

  function logout() {
    clearToken();
    location.reload();
  }

  async function changePassword() {
    const currentPass = prompt('Enter current password:');
    if (!currentPass) return;
    const newPass = prompt('Enter new password (min 6 characters):');
    if (!newPass || newPass.length < 6) {
      showToast('Password must be at least 6 characters.');
      return;
    }

    try {
      await apiRequest('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
      });
      showToast('Password changed successfully!');
    } catch (err) {
      showToast(err.message || 'Failed to change password.');
    }
  }

  // ---------- Data I/O (Backend API) ----------

  async function loadConfig() {
    try {
      return await apiRequest('/config');
    } catch (e) {
      // Fallback to direct fetch if API is unavailable
      const res = await fetch('config.json');
      return res.json();
    }
  }

  async function saveConfig() {
    collectAllData();
    try {
      await apiRequest('/config', {
        method: 'PUT',
        body: JSON.stringify(CONFIG)
      });
      showToast('Changes saved to server!');
    } catch (err) {
      showToast(err.message || 'Failed to save.');
    }
  }

  function exportConfig() {
    collectAllData();
    const blob = new Blob([JSON.stringify(CONFIG, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('config.json downloaded!');
  }

  function resetConfig() {
    if (!confirm('This will reload original config.json from server. Continue?')) return;
    location.reload();
  }

  // ---------- Tabs ----------

  function initTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
      });
    });
  }

  // ---------- Populate Forms ----------

  function populateHero() {
    document.getElementById('hero-name').value = CONFIG.hero.name || '';
    document.getElementById('hero-title').value = CONFIG.hero.title || '';
    document.getElementById('hero-subtitle').value = CONFIG.hero.subtitle || '';
    document.getElementById('hero-tagline').value = CONFIG.hero.tagline || '';
    document.getElementById('hero-resumeLink').value = CONFIG.hero.resumeLink || '';
    document.getElementById('hero-statusText').value = CONFIG.hero.statusText || '';
    document.getElementById('meta-siteTitle').value = CONFIG.meta.siteTitle || '';

    // Hero image
    const heroImgInput = document.getElementById('hero-heroImage');
    heroImgInput.value = CONFIG.hero.heroImage || '';
    updateHeroImagePreview();

    // Hero image upload
    document.getElementById('heroImageUpload').addEventListener('change', async (e) => {
      if (!e.target.files.length) return;
      try {
        const result = await uploadImages(e.target.files);
        CONFIG.hero.heroImage = result[0].filename;
        heroImgInput.value = result[0].filename;
        updateHeroImagePreview();
        showToast('Profile image uploaded!');
      } catch (err) { showToast(err.message || 'Upload failed'); }
    });

    // Resume/CV upload
    document.getElementById('heroResumeUpload').addEventListener('change', async (e) => {
      if (!e.target.files.length) return;
      try {
        const result = await uploadImages(e.target.files);
        CONFIG.hero.resumeLink = result[0].filename;
        document.getElementById('hero-resumeLink').value = result[0].filename;
        document.getElementById('heroResumeInfo').textContent = '✓ "' + result[0].filename + '" uploaded';
        showToast('CV uploaded!');
      } catch (err) { showToast(err.message || 'Upload failed'); }
    });

    // Update preview when filename is typed manually
    heroImgInput.addEventListener('input', () => {
      CONFIG.hero.heroImage = heroImgInput.value;
      updateHeroImagePreview();
    });
  }

  function updateHeroImagePreview() {
    const preview = document.getElementById('heroImagePreview');
    const filename = CONFIG.hero.heroImage;
    if (filename) {
      preview.innerHTML = '<img src="/api/images/' + encodeURIComponent(filename) + '" alt="Profile preview" style="max-width:150px;max-height:150px;border-radius:12px;object-fit:cover" onerror="this.src=\'' + filename + '\';this.onerror=null" />';
    } else {
      preview.innerHTML = '';
    }
  }

  function populateAbout() {
    document.getElementById('about-heading').value = CONFIG.about.heading || '';
    document.getElementById('about-description').value = CONFIG.about.description || '';
    renderListEditor('about-highlights-editor', CONFIG.about.highlights || []);
  }

  function populateContact() {
    document.getElementById('contact-email').value = CONFIG.contact.email || '';
    document.getElementById('contact-emailAlt').value = CONFIG.contact.emailAlt || '';
    document.getElementById('contact-location').value = CONFIG.contact.location || '';
    document.getElementById('contact-github').value = CONFIG.contact.github || '';
    document.getElementById('contact-linkedin').value = CONFIG.contact.linkedin || '';
  }

  // ---------- LIST EDITOR (simple string arrays) ----------

  function renderListEditor(containerId, items) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    items.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'list-item-row';
      row.innerHTML = `
        <input class="form-input" value="${escapeHtml(item)}" data-list-idx="${idx}" />
        <button class="list-item-remove" data-list-idx="${idx}">&times;</button>
      `;
      container.appendChild(row);
    });

    // Add button
    const addBtn = document.createElement('button');
    addBtn.className = 'list-add-btn';
    addBtn.textContent = '+ Add item';
    addBtn.addEventListener('click', () => {
      items.push('');
      renderListEditor(containerId, items);
    });
    container.appendChild(addBtn);

    // Remove handlers
    container.querySelectorAll('.list-item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        items.splice(parseInt(btn.dataset.listIdx), 1);
        renderListEditor(containerId, items);
      });
    });

    // Update on input
    container.querySelectorAll('.form-input').forEach(input => {
      input.addEventListener('input', () => {
        items[parseInt(input.dataset.listIdx)] = input.value;
      });
    });
  }

  // ---------- TAGS EDITOR ----------

  function createTagsEditor(containerId, items) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    items.forEach((item, idx) => {
      const chip = document.createElement('span');
      chip.className = 'tag-chip';
      chip.innerHTML = `${escapeHtml(item)} <button class="tag-remove" data-idx="${idx}">&times;</button>`;
      container.appendChild(chip);
    });

    const input = document.createElement('input');
    input.className = 'tag-input';
    input.placeholder = 'Type and press Enter…';
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        e.preventDefault();
        items.push(input.value.trim());
        input.value = '';
        createTagsEditor(containerId, items);
      }
    });
    container.appendChild(input);

    container.querySelectorAll('.tag-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        items.splice(parseInt(btn.dataset.idx), 1);
        createTagsEditor(containerId, items);
      });
    });
  }

  // ---------- REPEATER (Education, Projects, Research, etc.) ----------

  function renderEducationRepeater() {
    const container = document.getElementById('education-repeater');
    container.innerHTML = '';

    CONFIG.education.forEach((edu, idx) => {
      const item = document.createElement('div');
      item.className = 'repeater-item';
      item.innerHTML = `
        <div class="repeater-header">
          <span class="repeater-title">${escapeHtml(edu.degree) || 'Education #' + (idx + 1)}</span>
          <button class="repeater-remove" data-idx="${idx}">&times;</button>
        </div>
        <div class="form-group">
          <label class="form-label">Degree</label>
          <input class="form-input" data-field="degree" data-idx="${idx}" value="${escapeHtml(edu.degree)}" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Institution</label>
            <input class="form-input" data-field="institution" data-idx="${idx}" value="${escapeHtml(edu.institution)}" />
          </div>
          <div class="form-group">
            <label class="form-label">Year</label>
            <input class="form-input" data-field="year" data-idx="${idx}" value="${escapeHtml(edu.year)}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Details</label>
          <div class="list-editor" id="edu-details-${idx}"></div>
        </div>
      `;
      container.appendChild(item);
      renderListEditor(`edu-details-${idx}`, edu.details);
    });

    container.querySelectorAll('.form-input[data-field]').forEach(input => {
      input.addEventListener('input', () => {
        CONFIG.education[parseInt(input.dataset.idx)][input.dataset.field] = input.value;
      });
    });

    container.querySelectorAll('.repeater-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        CONFIG.education.splice(parseInt(btn.dataset.idx), 1);
        renderEducationRepeater();
      });
    });
  }

  function renderProjectsRepeater() {
    const container = document.getElementById('projects-repeater');
    container.innerHTML = '';

    CONFIG.projects.forEach((proj, idx) => {
      const item = document.createElement('div');
      item.className = 'repeater-item';
      item.innerHTML = `
        <div class="repeater-header">
          <span class="repeater-title">${escapeHtml(proj.title) || 'Project #' + (idx + 1)}</span>
          <button class="repeater-remove" data-idx="${idx}">&times;</button>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Title</label>
            <input class="form-input" data-field="title" data-idx="${idx}" value="${escapeHtml(proj.title)}" />
          </div>
          <div class="form-group">
            <label class="form-label">Tech Stack</label>
            <input class="form-input" data-field="tech" data-idx="${idx}" value="${escapeHtml(proj.tech)}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-textarea" data-field="description" data-idx="${idx}" rows="3">${escapeHtml(proj.description)}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Link (optional)</label>
          <input class="form-input" data-field="link" data-idx="${idx}" value="${escapeHtml(proj.link)}" />
        </div>
      `;
      container.appendChild(item);
    });

    bindRepeaterInputs(container, CONFIG.projects);

    container.querySelectorAll('.repeater-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        CONFIG.projects.splice(parseInt(btn.dataset.idx), 1);
        renderProjectsRepeater();
      });
    });
  }

  // ---------- FEATURED PROJECTS REPEATER ----------

  function renderFeaturedProjectsRepeater() {
    const container = document.getElementById('featured-repeater');
    container.innerHTML = '';

    (CONFIG.featuredProjects || []).forEach((proj, idx) => {
      const item = document.createElement('div');
      item.className = 'repeater-item';
      item.innerHTML = `
        <div class="repeater-header">
          <span class="repeater-title">${escapeHtml(proj.title) || 'Featured Project #' + (idx + 1)}</span>
          <button class="repeater-remove" data-idx="${idx}">&times;</button>
        </div>
        <div class="form-group">
          <label class="form-label">Title</label>
          <input class="form-input" data-field="title" data-idx="${idx}" value="${escapeHtml(proj.title)}" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Tech Stack</label>
            <input class="form-input" data-field="tech" data-idx="${idx}" value="${escapeHtml(proj.tech)}" />
          </div>
          <div class="form-group">
            <label class="form-label">Link (optional)</label>
            <input class="form-input" data-field="link" data-idx="${idx}" value="${escapeHtml(proj.link)}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-textarea" data-field="description" data-idx="${idx}" rows="3">${escapeHtml(proj.description)}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Thumbnail</label>
          <div style="display:flex;gap:0.5rem;align-items:center">
            <input class="form-input" data-field="thumbnail" data-idx="${idx}" value="${escapeHtml(proj.thumbnail)}" style="flex:1" />
            <label class="btn btn-secondary img-upload-btn" style="padding:0.4rem 0.8rem;font-size:0.7rem;cursor:pointer;white-space:nowrap">
              Upload
              <input type="file" accept="image/*" data-upload-target="thumbnail" data-upload-idx="${idx}" style="display:none" />
            </label>
          </div>
          ${proj.thumbnail ? `<img src="/api/images/${encodeURIComponent(proj.thumbnail)}" alt="thumbnail preview" style="max-width:120px;max-height:80px;margin-top:0.5rem;border-radius:6px;object-fit:cover" onerror="this.style.display='none'" />` : ''}
        </div>
        <div class="form-group">
          <label class="form-label">Gallery Images</label>
          <div class="list-editor" id="featured-gallery-${idx}"></div>
          <label class="btn btn-secondary img-upload-btn" style="padding:0.4rem 0.8rem;font-size:0.7rem;cursor:pointer;margin-top:0.5rem">
            + Upload Gallery Images
            <input type="file" accept="image/*" multiple data-upload-target="gallery" data-upload-idx="${idx}" style="display:none" />
          </label>
        </div>
        <div class="form-group">
          <label class="form-label">Features / Highlights</label>
          <div class="list-editor" id="featured-features-${idx}"></div>
        </div>
      `;
      container.appendChild(item);
      renderListEditor(`featured-gallery-${idx}`, proj.gallery || []);
      renderListEditor(`featured-features-${idx}`, proj.features || []);
    });

    bindRepeaterInputs(container, CONFIG.featuredProjects);

    // Bind file upload inputs for thumbnails & galleries
    container.querySelectorAll('input[data-upload-target]').forEach(input => {
      input.addEventListener('change', async (e) => {
        const files = e.target.files;
        if (!files.length) return;
        const target = input.dataset.uploadTarget;
        const idx = parseInt(input.dataset.uploadIdx);
        try {
          const uploaded = await uploadImages(files);
          if (target === 'thumbnail' && uploaded.length > 0) {
            CONFIG.featuredProjects[idx].thumbnail = uploaded[0].filename;
          } else if (target === 'gallery') {
            if (!CONFIG.featuredProjects[idx].gallery) CONFIG.featuredProjects[idx].gallery = [];
            uploaded.forEach(u => CONFIG.featuredProjects[idx].gallery.push(u.filename));
          }
          renderFeaturedProjectsRepeater();
          showToast(`${uploaded.length} image(s) uploaded!`);
        } catch (err) {
          showToast(err.message || 'Upload failed');
        }
      });
    });

    container.querySelectorAll('.repeater-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        CONFIG.featuredProjects.splice(parseInt(btn.dataset.idx), 1);
        renderFeaturedProjectsRepeater();
      });
    });
  }

  // ---------- EXPERIENCE REPEATER ----------

  function renderExperienceRepeater() {
    const container = document.getElementById('experience-repeater');
    container.innerHTML = '';

    (CONFIG.experience || []).forEach((exp, idx) => {
      const item = document.createElement('div');
      item.className = 'repeater-item';
      item.innerHTML = `
        <div class="repeater-header">
          <span class="repeater-title">${escapeHtml(exp.role) || 'Experience #' + (idx + 1)}</span>
          <button class="repeater-remove" data-idx="${idx}">&times;</button>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Role / Position</label>
            <input class="form-input" data-field="role" data-idx="${idx}" value="${escapeHtml(exp.role)}" />
          </div>
          <div class="form-group">
            <label class="form-label">Company</label>
            <input class="form-input" data-field="company" data-idx="${idx}" value="${escapeHtml(exp.company)}" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Year / Duration</label>
            <input class="form-input" data-field="year" data-idx="${idx}" value="${escapeHtml(exp.year)}" />
          </div>
          <div class="form-group">
            <label class="form-label">Company Link (optional)</label>
            <input class="form-input" data-field="link" data-idx="${idx}" value="${escapeHtml(exp.link)}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Details / Responsibilities</label>
          <div class="list-editor" id="exp-details-${idx}"></div>
        </div>
      `;
      container.appendChild(item);
      renderListEditor(`exp-details-${idx}`, exp.details || []);
    });

    bindRepeaterInputs(container, CONFIG.experience);

    container.querySelectorAll('.repeater-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        CONFIG.experience.splice(parseInt(btn.dataset.idx), 1);
        renderExperienceRepeater();
      });
    });
  }

  // ---------- EXPERTISE EDITORS ----------

  function renderExpertiseEditors() {
    // Core Services repeater
    const container = document.getElementById('expertise-services-repeater');
    container.innerHTML = '';

    if (!CONFIG.expertise) CONFIG.expertise = { coreServices: [], platforms: [], scrapingTools: [], advancedSystems: [] };
    if (!CONFIG.expertise.coreServices) CONFIG.expertise.coreServices = [];

    CONFIG.expertise.coreServices.forEach((svc, idx) => {
      const item = document.createElement('div');
      item.className = 'repeater-item';
      item.innerHTML = `
        <div class="repeater-header">
          <span class="repeater-title">${escapeHtml(svc.title) || 'Service #' + (idx + 1)}</span>
          <button class="repeater-remove" data-idx="${idx}">&times;</button>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Icon Key</label>
            <input class="form-input" data-field="icon" data-idx="${idx}" value="${escapeHtml(svc.icon)}" />
          </div>
          <div class="form-group">
            <label class="form-label">Title</label>
            <input class="form-input" data-field="title" data-idx="${idx}" value="${escapeHtml(svc.title)}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-textarea" data-field="desc" data-idx="${idx}" rows="2">${escapeHtml(svc.desc)}</textarea>
        </div>
      `;
      container.appendChild(item);
    });

    bindRepeaterInputs(container, CONFIG.expertise.coreServices);

    container.querySelectorAll('.repeater-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        CONFIG.expertise.coreServices.splice(parseInt(btn.dataset.idx), 1);
        renderExpertiseEditors();
      });
    });

    // Tags editors
    createTagsEditor('expertise-platforms', CONFIG.expertise.platforms || []);
    createTagsEditor('expertise-scraping', CONFIG.expertise.scrapingTools || []);
    createTagsEditor('expertise-advanced', CONFIG.expertise.advancedSystems || []);
  }

  // ---------- Other Repeaters ----------

  function renderResearchRepeater() {
    const container = document.getElementById('research-repeater');
    container.innerHTML = '';

    CONFIG.research.forEach((res, idx) => {
      const item = document.createElement('div');
      item.className = 'repeater-item';
      item.innerHTML = `
        <div class="repeater-header">
          <span class="repeater-title">${escapeHtml(res.title) || 'Research #' + (idx + 1)}</span>
          <button class="repeater-remove" data-idx="${idx}">&times;</button>
        </div>
        <div class="form-group">
          <label class="form-label">Title</label>
          <input class="form-input" data-field="title" data-idx="${idx}" value="${escapeHtml(res.title)}" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Dataset</label>
            <input class="form-input" data-field="dataset" data-idx="${idx}" value="${escapeHtml(res.dataset)}" />
          </div>
          <div class="form-group">
            <label class="form-label">Venue</label>
            <input class="form-input" data-field="venue" data-idx="${idx}" value="${escapeHtml(res.venue)}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-textarea" data-field="description" data-idx="${idx}" rows="3">${escapeHtml(res.description)}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <input class="form-input" data-field="status" data-idx="${idx}" value="${escapeHtml(res.status)}" />
        </div>
      `;
      container.appendChild(item);
    });

    bindRepeaterInputs(container, CONFIG.research);

    container.querySelectorAll('.repeater-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        CONFIG.research.splice(parseInt(btn.dataset.idx), 1);
        renderResearchRepeater();
      });
    });
  }

  function renderCommunityRepeater() {
    const container = document.getElementById('community-repeater');
    container.innerHTML = '';

    CONFIG.community.forEach((comm, idx) => {
      const item = document.createElement('div');
      item.className = 'repeater-item';
      item.innerHTML = `
        <div class="repeater-header">
          <span class="repeater-title">${escapeHtml(comm.organization) || 'Entry #' + (idx + 1)}</span>
          <button class="repeater-remove" data-idx="${idx}">&times;</button>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Role</label>
            <input class="form-input" data-field="role" data-idx="${idx}" value="${escapeHtml(comm.role)}" />
          </div>
          <div class="form-group">
            <label class="form-label">Organization</label>
            <input class="form-input" data-field="organization" data-idx="${idx}" value="${escapeHtml(comm.organization)}" />
          </div>
        </div>
      `;
      container.appendChild(item);
    });

    bindRepeaterInputs(container, CONFIG.community);

    container.querySelectorAll('.repeater-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        CONFIG.community.splice(parseInt(btn.dataset.idx), 1);
        renderCommunityRepeater();
      });
    });
  }

  function renderLanguagesRepeater() {
    const container = document.getElementById('languages-repeater');
    container.innerHTML = '';

    CONFIG.languages.forEach((lang, idx) => {
      const item = document.createElement('div');
      item.className = 'repeater-item';
      item.innerHTML = `
        <div class="repeater-header">
          <span class="repeater-title">${escapeHtml(lang.name) || 'Language #' + (idx + 1)}</span>
          <button class="repeater-remove" data-idx="${idx}">&times;</button>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Language</label>
            <input class="form-input" data-field="name" data-idx="${idx}" value="${escapeHtml(lang.name)}" />
          </div>
          <div class="form-group">
            <label class="form-label">Level</label>
            <input class="form-input" data-field="level" data-idx="${idx}" value="${escapeHtml(lang.level)}" />
          </div>
        </div>
      `;
      container.appendChild(item);
    });

    bindRepeaterInputs(container, CONFIG.languages);

    container.querySelectorAll('.repeater-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        CONFIG.languages.splice(parseInt(btn.dataset.idx), 1);
        renderLanguagesRepeater();
      });
    });
  }

  function bindRepeaterInputs(container, arr) {
    container.querySelectorAll('.form-input[data-field], .form-textarea[data-field]').forEach(input => {
      input.addEventListener('input', () => {
        arr[parseInt(input.dataset.idx)][input.dataset.field] = input.value;
      });
    });
  }

  // ---------- "Add" Buttons ----------

  function initAddButtons() {
    document.getElementById('education-add').addEventListener('click', () => {
      CONFIG.education.push({ degree: '', institution: '', year: '', details: [] });
      renderEducationRepeater();
    });

    document.getElementById('projects-add').addEventListener('click', () => {
      CONFIG.projects.push({ title: '', tech: '', description: '', link: '' });
      renderProjectsRepeater();
    });

    document.getElementById('featured-add').addEventListener('click', () => {
      if (!CONFIG.featuredProjects) CONFIG.featuredProjects = [];
      CONFIG.featuredProjects.push({ title: '', tech: '', description: '', features: [], thumbnail: '', gallery: [], link: '' });
      renderFeaturedProjectsRepeater();
    });

    document.getElementById('experience-add').addEventListener('click', () => {
      if (!CONFIG.experience) CONFIG.experience = [];
      CONFIG.experience.push({ role: '', company: '', year: '', link: '', details: [] });
      renderExperienceRepeater();
    });

    document.getElementById('expertise-services-add').addEventListener('click', () => {
      if (!CONFIG.expertise) CONFIG.expertise = { coreServices: [], platforms: [], scrapingTools: [], advancedSystems: [] };
      if (!CONFIG.expertise.coreServices) CONFIG.expertise.coreServices = [];
      CONFIG.expertise.coreServices.push({ icon: '', title: '', desc: '' });
      renderExpertiseEditors();
    });

    document.getElementById('research-add').addEventListener('click', () => {
      CONFIG.research.push({ title: '', dataset: '', description: '', venue: '', status: '' });
      renderResearchRepeater();
    });

    document.getElementById('community-add').addEventListener('click', () => {
      CONFIG.community.push({ role: '', organization: '' });
      renderCommunityRepeater();
    });

    document.getElementById('languages-add').addEventListener('click', () => {
      CONFIG.languages.push({ name: '', level: '' });
      renderLanguagesRepeater();
    });
  }

  // ---------- Collect All Data ----------

  function collectAllData() {
    // Hero & Meta
    CONFIG.hero.name = document.getElementById('hero-name').value;
    CONFIG.hero.title = document.getElementById('hero-title').value;
    CONFIG.hero.subtitle = document.getElementById('hero-subtitle').value;
    CONFIG.hero.tagline = document.getElementById('hero-tagline').value;
    CONFIG.hero.resumeLink = document.getElementById('hero-resumeLink').value;
    CONFIG.hero.heroImage = document.getElementById('hero-heroImage').value;
    CONFIG.hero.statusText = document.getElementById('hero-statusText').value;
    CONFIG.meta.siteTitle = document.getElementById('meta-siteTitle').value;

    // About
    CONFIG.about.heading = document.getElementById('about-heading').value;
    CONFIG.about.description = document.getElementById('about-description').value;

    // Contact
    CONFIG.contact.email = document.getElementById('contact-email').value;
    CONFIG.contact.emailAlt = document.getElementById('contact-emailAlt').value;
    CONFIG.contact.location = document.getElementById('contact-location').value;
    CONFIG.contact.github = document.getElementById('contact-github').value;
    CONFIG.contact.linkedin = document.getElementById('contact-linkedin').value;
  }

  // ---------- IMAGE MANAGEMENT ----------

  async function uploadImages(files) {
    const formData = new FormData();
    for (const file of files) {
      formData.append('images', file);
    }
    const token = getToken();
    const res = await fetch(API_BASE + '/images/upload', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: formData
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { throw new Error('Upload failed — invalid response'); }
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.images;
  }

  async function loadImageGallery() {
    const grid = document.getElementById('imageGalleryGrid');
    if (!grid) return;
    try {
      const data = await apiRequest('/images');
      if (!data.images || data.images.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted);">No images uploaded yet.</p>';
        return;
      }
      grid.innerHTML = data.images.map(img => `
        <div class="image-gallery-card">
          <div class="image-gallery-preview">
            <img src="/api/images/${encodeURIComponent(img.filename)}" alt="${escapeHtml(img.filename)}" loading="lazy" />
          </div>
          <div class="image-gallery-info">
            <span class="image-gallery-name" title="${escapeHtml(img.filename)}">${escapeHtml(img.filename)}</span>
            <span class="image-gallery-size">${(img.size / 1024).toFixed(1)} KB</span>
          </div>
          <div class="image-gallery-actions">
            <button class="btn btn-secondary image-copy-btn" data-filename="${escapeHtml(img.filename)}" style="padding:0.3rem 0.6rem;font-size:0.65rem;">Copy Name</button>
            <button class="btn btn-secondary image-delete-btn" data-filename="${escapeHtml(img.filename)}" style="padding:0.3rem 0.6rem;font-size:0.65rem;color:#e74c3c;">Delete</button>
          </div>
        </div>
      `).join('');

      grid.querySelectorAll('.image-copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          navigator.clipboard.writeText(btn.dataset.filename);
          showToast('Filename copied!');
        });
      });

      grid.querySelectorAll('.image-delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete "' + btn.dataset.filename + '"?')) return;
          try {
            await apiRequest('/images/' + encodeURIComponent(btn.dataset.filename), { method: 'DELETE' });
            showToast('Image deleted');
            loadImageGallery();
          } catch (err) { showToast(err.message || 'Delete failed'); }
        });
      });
    } catch (err) {
      grid.innerHTML = '<p style="color:#e74c3c;">Failed to load images.</p>';
    }
  }

  function initImageUploadZone() {
    const dropZone = document.getElementById('imageDropZone');
    const fileInput = document.getElementById('imageFileInput');
    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      if (files.length) await handleImageUpload(files);
    });

    fileInput.addEventListener('change', async (e) => {
      if (e.target.files.length) await handleImageUpload(e.target.files);
      fileInput.value = '';
    });
  }

  async function handleImageUpload(files) {
    const progress = document.getElementById('imageUploadProgress');
    progress.textContent = 'Uploading ' + files.length + ' image(s)...';
    try {
      const result = await uploadImages(files);
      progress.textContent = result.length + ' image(s) uploaded successfully!';
      setTimeout(() => { progress.textContent = ''; }, 3000);
      loadImageGallery();
    } catch (err) {
      progress.textContent = 'Upload failed: ' + (err.message || 'Unknown error');
    }
  }

  // ---------- Init ----------

  async function init() {
    await initLogin();

    CONFIG = await loadConfig();

    initTabs();
    initAddButtons();

    populateHero();
    populateAbout();
    populateContact();

    renderEducationRepeater();
    renderProjectsRepeater();
    renderFeaturedProjectsRepeater();
    renderExperienceRepeater();
    renderExpertiseEditors();
    renderResearchRepeater();
    renderCommunityRepeater();
    renderLanguagesRepeater();

    // Skills tags
    createTagsEditor('skills-languages', CONFIG.skills.languages);
    createTagsEditor('skills-web', CONFIG.skills.web);
    createTagsEditor('skills-tools', CONFIG.skills.tools);
    createTagsEditor('skills-concepts', CONFIG.skills.concepts);

    // Interests tags
    createTagsEditor('interests-tags', CONFIG.interests);

    // Image management
    initImageUploadZone();
    loadImageGallery();

    // Top bar buttons
    document.getElementById('btnSave').addEventListener('click', saveConfig);
    document.getElementById('btnExport').addEventListener('click', exportConfig);
    document.getElementById('btnReset').addEventListener('click', resetConfig);
    document.getElementById('btnLogout').addEventListener('click', logout);
    document.getElementById('btnChangePass').addEventListener('click', changePassword);
  }

  init();

})();

/* ---------- tsParticles Links ---------- */
(function () {
  'use strict';
  if (typeof tsParticles === 'undefined') return;

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  var dark = isDark();

  function getConfig() {
    var d = isDark();
    return {
      fullScreen: false,
      background: { color: 'transparent' },
      particles: {
        number: { value: 120, density: { enable: true, area: 800 } },
        color: { value: d ? '#e1e5eb' : '#ff4757' },
        shape: { type: 'circle' },
        opacity: {
          value: d ? 0.5 : 0.38,
          animation: { enable: true, speed: 0.6, minimumValue: 0.15, sync: false }
        },
        size: {
          value: { min: 1.5, max: 3 },
          animation: { enable: true, speed: 1.5, minimumValue: 0.8, sync: false }
        },
        links: {
          enable: true,
          distance: 140,
          color: d ? '#e1e5eb' : '#ff4757',
          opacity: d ? 0.32 : 0.25,
          width: 1,
          triangles: { enable: false }
        },
        move: {
          enable: true,
          speed: 1.4,
          direction: 'none',
          random: true,
          straight: false,
          outModes: { default: 'bounce' },
          attract: { enable: false }
        }
      },
      interactivity: {
        detectsOn: 'window',
        events: {
          onHover: { enable: true, mode: ['grab', 'bubble'] },
          onClick: { enable: true, mode: 'push' },
          resize: true
        },
        modes: {
          grab: {
            distance: 220,
            links: { opacity: d ? 0.9 : 0.8, color: d ? '#e1e5eb' : '#ff4757' }
          },
          bubble: {
            distance: 220,
            size: 7,
            duration: 1.5,
            opacity: 1,
            speed: 4
          },
          push: { quantity: 4 },
          repulse: { distance: 80, duration: 0.4 }
        }
      },
      detectRetina: true
    };
  }

  (async function () {
    if (typeof loadLinksPreset === 'function') {
      await loadLinksPreset(tsParticles);
    }
    await tsParticles.load('tsparticles', getConfig());
  })();

  var obs = new MutationObserver(function () {
    var nowDark = isDark();
    if (nowDark !== dark) {
      dark = nowDark;
      tsParticles.load('tsparticles', getConfig());
    }
  });
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
