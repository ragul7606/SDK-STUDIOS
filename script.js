// ═══════════════════════════════════════════════
//  ADMIN PORTAL — AUTH SYSTEM
// ═══════════════════════════════════════════════

const ADMIN_CREDS = { username: 'sdk_edits', password: 'SDKSTUDIOS001' };
let MOCK_OTP = '0000'; // generated fresh each sendOTP call // last 4 of phone for demo
let adminLoggedIn = false;
let currentAdminPanel = null; // 'videos' | 'photos'
let adminPassword = 'SDKSTUDIOS001'; // can be changed
let otpSent = false;

// ── Open portal (called by Admin buttons) ──────
function openAdminPortal(panel) {
  currentAdminPanel = panel;
  const portal = document.getElementById('adminPortal');
  portal.style.display = 'flex';
  portal.classList.add('open');
  document.body.style.overflow = 'hidden';

  if (adminLoggedIn) {
    showDashboard();
    switchDashTab(panel, document.querySelector(`.dash-tab:${panel === 'photos' ? 'last-child' : 'first-child'}`));
  } else {
    showLoginCard();
    goToLogin();
  }
}

function closeAdminPortal() {
  const _p = document.getElementById('adminPortal');
  _p.classList.remove('open');
  _p.style.display = 'none';
  document.body.style.overflow = '';
}

function adminLogout() {
  adminLoggedIn = false;
  closeAdminPortal();
  showToast('Logged out successfully.');
}

// ── Card / Step switchers ──────────────────────
function showLoginCard() {
  document.getElementById('apLoginCard').style.display = 'block';
  document.getElementById('apDashboard').style.display = 'none';
}

function showDashboard() {
  document.getElementById('apLoginCard').style.display = 'none';
  document.getElementById('apDashboard').style.display = 'block';
  renderDashVideos();
  renderDashPhotos();
}

function showStep(id) {
  document.querySelectorAll('.ap-step').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  // Update progress dots
  const stepMap = { apStepLogin:0, apStepForgot:1, apStepOtp:2, apStepNewPass:3 };
  const cur = stepMap[id] ?? 0;
  [0,1,2,3].forEach(i => {
    const dot = document.getElementById('dot'+i);
    if (!dot) return;
    dot.className = 'ap-dot' + (i === cur ? ' active' : i < cur ? ' done' : '');
  });
  // Hide dots on login step
  const dotsEl = document.getElementById('apDots');
  if (dotsEl) dotsEl.style.display = id === 'apStepLogin' ? 'none' : 'flex';
}

function goToLogin() {
  showStep('apStepLogin');
  document.getElementById('apLoginError').classList.remove('show');
  document.getElementById('apForgotLink').classList.remove('show');
  document.getElementById('apUsername').value = '';
  document.getElementById('apPassword').value = '';
}

function goToForgot() { showStep('apStepForgot'); }

// ── Toggle password visibility ─────────────────
function togglePassVis() {
  const f = document.getElementById('apPassword');
  f.type = f.type === 'password' ? 'text' : 'password';
  document.getElementById('apEye').textContent = f.type === 'password' ? '👁' : '🙈';
}

// ── LOGIN ──────────────────────────────────────
let loginAttempts = 0;

function doLogin() {
  const u = document.getElementById('apUsername').value.trim();
  const p = document.getElementById('apPassword').value;
  const err = document.getElementById('apLoginError');
  const forgot = document.getElementById('apForgotLink');

  if (u === ADMIN_CREDS.username && p === adminPassword) {
    err.classList.remove('show');
    forgot.classList.remove('show');
    adminLoggedIn = true;
    loginAttempts = 0;
    showDashboard();
    if (currentAdminPanel) {
      const tabs = document.querySelectorAll('.dash-tab');
      if (currentAdminPanel === 'photos') switchDashTab('photos', tabs[1]);
      else switchDashTab('videos', tabs[0]);
    }
  } else {
    loginAttempts++;
    err.textContent = loginAttempts >= 2
      ? 'Incorrect credentials. Use Forgot Password to reset.'
      : 'Incorrect username or password.';
    err.classList.add('show');
    if (loginAttempts >= 2) forgot.classList.add('show');
    // shake animation
    const card = document.getElementById('apLoginCard');
    card.style.animation = 'none';
    card.offsetHeight;
    card.style.animation = 'shake 0.4s ease';
    setTimeout(() => card.style.animation = '', 500);
  }
}

// Allow Enter key
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const portal = document.getElementById('adminPortal');
    if (!portal.classList.contains('open')) return;
    const step = document.querySelector('.ap-step.active');
    if (!step) return;
    if (step.id === 'apStepLogin') doLogin();
    else if (step.id === 'apStepOtp') verifyOTP();
    else if (step.id === 'apStepNewPass') saveNewPassword();
  }
});

// ── OTP FLOW ───────────────────────────────────
function sendOTP() {
  otpSent = true;
  // Fresh random 4-digit OTP
  MOCK_OTP = String(Math.floor(1000 + Math.random() * 9000));

  const msg = document.getElementById('apOtpSendMsg');
  msg.style.color = 'var(--gold)';

  // ── Send as SMS via tel: sms: link (works on mobile) ──────────────────
  // The OTP text is encoded into an SMS body directed to the admin number
  const smsBody = encodeURIComponent('SDK Edits OTP: ' + MOCK_OTP + '. Use this code to reset your admin password. Valid 5 mins.');
  const smsLink = 'sms:+917708509295?body=' + smsBody;

  // Try to open SMS app; on desktop this silently fails — clipboard fallback
  try {
    window.location.href = smsLink;
  } catch(e) {}

  // Also copy OTP to clipboard so desktop admin can note it
  if (navigator.clipboard) {
    navigator.clipboard.writeText('SDK Edits OTP: ' + MOCK_OTP).catch(() => {});
  }

  msg.innerHTML = '✅ OTP <strong style="color:var(--gold);font-size:1.4rem;letter-spacing:0.3em">' + MOCK_OTP + '</strong> sent to <strong>+91 7708509295</strong><br><span style="font-size:0.65rem;opacity:0.7">Also copied to clipboard. Enter on next screen.</span>';
  msg.classList.add('show');

  setTimeout(() => showStep('apStepOtp'), 2200);
}

function otpMove(i) {
  const v = document.getElementById('otp' + i).value;
  if (v && i < 3) document.getElementById('otp' + (i+1)).focus();
}

function otpBack(e, i) {
  if (e.key === 'Backspace' && !document.getElementById('otp'+i).value && i > 0) {
    document.getElementById('otp'+(i-1)).focus();
  }
}

function verifyOTP() {
  const entered = [0,1,2,3].map(i => document.getElementById('otp'+i).value).join('');
  const err = document.getElementById('apOtpError');
  if (entered === MOCK_OTP) {
    err.classList.remove('show');
    showStep('apStepNewPass');
  } else {
    err.classList.add('show');
    [0,1,2,3].forEach(i => { document.getElementById('otp'+i).value = ''; });
    document.getElementById('otp0').focus();
  }
}

// ── NEW PASSWORD ───────────────────────────────
function saveNewPassword() {
  const np = document.getElementById('apNewPass').value;
  const cp = document.getElementById('apConfirmPass').value;
  const err = document.getElementById('apNewPassError');
  if (!np || np !== cp) {
    err.textContent = np ? 'Passwords do not match.' : 'Please enter a password.';
    err.classList.add('show');
    return;
  }
  if (np.length < 6) {
    err.textContent = 'Password must be at least 6 characters.';
    err.classList.add('show');
    return;
  }
  adminPassword = np;
  ADMIN_CREDS.password = np;
  err.classList.remove('show');
  showToast('✅ Password updated! Please log in with new password.');
  goToLogin();
}

// ── DASH TABS ──────────────────────────────────
function switchDashTab(name, btn) {
  document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.dash-panel').forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('dash' + name.charAt(0).toUpperCase() + name.slice(1)).classList.add('active');
}

// ═══════════════════════════════════════════════
//  DASHBOARD — VIDEO MANAGEMENT
// ═══════════════════════════════════════════════
function dashHandleVideoDrop(e) {
  e.preventDefault();
  document.getElementById('dashVideoDrop').classList.remove('drag-over');
  dashHandleVideoFiles(e.dataTransfer.files);
}

function dashHandleVideoFiles(files) {
  const cat = document.getElementById('dashVCategory').value.trim() || 'General';
  const customTitle = document.getElementById('dashVTitle').value.trim();
  let added = 0;
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('video/')) return;
    const url = URL.createObjectURL(file);
    const title = customTitle || file.name.replace(/\.[^/.]+$/, '');
    videos.push({ id: videoIdCounter++, title, category: cat, type: 'real', src: url });
    added++;
  });
  if (added > 0) {
    renderVideos();
    renderDashVideos();
    setTimeout(initVideoScrollStop, 200);
    showToast(added + ' video(s) added to site!');
    document.getElementById('dashVTitle').value = '';
    document.getElementById('dashVCategory').value = '';
  }
}

function dashDeleteVideo(id) {
  const v = videos.find(x => x.id === id);
  if (v && v.src && v.src.startsWith('blob:')) URL.revokeObjectURL(v.src);
  videos = videos.filter(x => x.id !== id);
  renderVideos();
  renderDashVideos();
  showToast('Video deleted.');
}

function renderDashVideos() {
  const grid = document.getElementById('dashVideoGrid');
  if (!grid) return;
  if (videos.length === 0) {
    grid.innerHTML = '<div class="dash-empty">No videos yet. Upload some above.</div>';
    return;
  }
  grid.innerHTML = videos.map(v => {
    const thumb = v.type === 'real'
      ? `<video class="dash-media-thumb-vid" src="${v.src}" muted preload="metadata"></video>`
      : `<div class="dash-media-placeholder">${v.color ? '🎬' : '🎬'}</div>`;
    return `<div class="dash-media-item">
      ${thumb}
      <button class="dash-delete-btn" onclick="dashDeleteVideo(${v.id})" title="Delete">✕</button>
      <div class="dash-media-info">
        <div class="dash-media-name">${v.title}</div>
        <div class="dash-media-cat">${v.category}</div>
      </div>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════
//  DASHBOARD — PHOTO MANAGEMENT
// ═══════════════════════════════════════════════
function dashHandlePhotoDrop(e) {
  e.preventDefault();
  document.getElementById('dashPhotoDrop').classList.remove('drag-over');
  dashHandlePhotoFiles(e.dataTransfer.files);
}

function dashHandlePhotoFiles(files) {
  const cat = document.getElementById('dashPCategory').value || 'Portrait';
  const customTitle = document.getElementById('dashPTitle').value.trim();
  let count = 0;
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        let aspect = ratio < 0.7 ? '3/4' : ratio > 1.5 ? '16/9' : '4/3';
        const title = customTitle || file.name.replace(/\.[^/.]+$/, '');
        photos.push({ id: photoIdCounter++, title, category: cat, type: 'real', src: e.target.result, aspect });
        count++;
        renderPhotos();
        renderDashPhotos();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
  setTimeout(() => {
    if (files.length > 0) {
      showToast(files.length + ' photo(s) added to site!');
      document.getElementById('dashPTitle').value = '';
    }
  }, 600);
}

function dashDeletePhoto(id) {
  photos = photos.filter(p => p.id !== id);
  renderPhotos();
  renderDashPhotos();
  showToast('Photo deleted.');
}

function renderDashPhotos() {
  const grid = document.getElementById('dashPhotoGrid');
  if (!grid) return;
  if (photos.length === 0) {
    grid.innerHTML = '<div class="dash-empty">No photos yet. Upload some above.</div>';
    return;
  }
  grid.innerHTML = photos.map(p => {
    const thumb = p.type === 'real'
      ? `<img class="dash-media-thumb" src="${p.src}" alt="${p.title}">`
      : `<div class="dash-media-placeholder">🖼</div>`;
    return `<div class="dash-media-item">
      ${thumb}
      <button class="dash-delete-btn" onclick="dashDeletePhoto(${p.id})" title="Delete">✕</button>
      <div class="dash-media-info">
        <div class="dash-media-name">${p.title}</div>
        <div class="dash-media-cat">${p.category}</div>
      </div>
    </div>`;
  }).join('');
}

// ── Keep old toggleAdmin working but redirect to portal ───────────────────
function toggleAdmin(panelId) {
  const panel = panelId.includes('video') ? 'videos' : 'photos';
  openAdminPortal(panel);
}

// Shake keyframe (inject dynamically)
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `@keyframes shake {
  0%,100%{transform:translateX(0)} 20%{transform:translateX(-10px)} 40%{transform:translateX(10px)} 60%{transform:translateX(-8px)} 80%{transform:translateX(8px)}
}`;
document.head.appendChild(shakeStyle);


// ── STATE ──────────────────────────────────────
let videos = [
  { id:1, title:'Cinematic Wedding Film', category:'Wedding', color:'#1C1C2E', type:'placeholder' },
  { id:2, title:'Fashion Reel Edit', category:'Reels', color:'#1A1A0A', type:'placeholder' },
  { id:3, title:'Product Promo Cut', category:'Promotional', color:'#1A0A1A', type:'placeholder' },
  { id:4, title:'Nature Documentary', category:'Cinematic', color:'#0A1A0A', type:'placeholder' },
  { id:5, title:'YouTube Vlog Edit', category:'YouTube', color:'#1C1A10', type:'placeholder' },
  { id:6, title:'Event Highlights', category:'Event', color:'#1A1018', type:'placeholder' },
];

let photos = [
  { id:1, title:'Golden Hour Portrait', category:'Portrait', color:'#1C1408', aspect:'3/4', type:'placeholder' },
  { id:2, title:'Wedding Ceremony', category:'Wedding', color:'#1C1820', aspect:'16/9', type:'placeholder' },
  { id:3, title:'Misty Mountain', category:'Nature', color:'#0A1018', aspect:'4/3', type:'placeholder' },
  { id:4, title:'Urban Cinematic', category:'Cinematic', color:'#141414', aspect:'2/3', type:'placeholder' },
  { id:5, title:'Event Coverage', category:'Event', color:'#1A0A14', aspect:'16/9', type:'placeholder' },
  { id:6, title:'Social Content', category:'Social Media', color:'#10101C', aspect:'1/1', type:'placeholder' },
  { id:7, title:'Bridal Portrait', category:'Wedding', color:'#201820', aspect:'3/4', type:'placeholder' },
  { id:8, title:'Forest Walk', category:'Nature', color:'#081208', aspect:'4/5', type:'placeholder' },
];

let reviews = [
  { name:'Priya Sharma', rating:5, text:'Dinesh\'s wedding video exceeded all our expectations. The cinematic quality and emotional storytelling left us in tears of joy!', date:'2025-05-10' },
  { name:'Arjun Reddy', rating:5, text:'My YouTube channel\'s engagement tripled after SDK edited my content. Absolutely professional work and lightning fast delivery.', date:'2025-04-22' },
  { name:'Meena Krishnan', rating:4, text:'Brilliant color grading and transitions. My reels look absolutely stunning. Will definitely book again!', date:'2025-03-15' },
];

let currentRating = 0;
let videoIdCounter = 7;
let photoIdCounter = 9;
let filterActive = 'all';

// ── PRELOADER ──────────────────────────────────
window.addEventListener('load', () => {
  renderVideos();
  renderPhotos();
  renderReviews();
  setTimeout(initVideoScrollStop, 100);
  setTimeout(() => {
    const pl = document.getElementById('preloader');
    pl.classList.add('hidden');
    document.body.classList.remove('loading');
  }, 2800);
});

// ── SCROLL ────────────────────────────────────
window.addEventListener('scroll', () => {
  const header = document.getElementById('siteHeader');
  if (header) header.classList.toggle('scrolled', window.scrollY > 60);
  document.querySelectorAll('.fade-in').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 80) el.classList.add('visible');
  });
});

// ── NAV ───────────────────────────────────────
function toggleMobile() {
  const hb = document.getElementById('hamburger');
  const mm = document.getElementById('mobileMenu');
  hb.classList.toggle('open');
  mm.classList.toggle('open');
}

function closeMobile() {
  document.getElementById('hamburger').classList.remove('open');
  document.getElementById('mobileMenu').classList.remove('open');
}

// ── ADMIN handled by portal above ──────────────

// ── TOAST ─────────────────────────────────────
function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'upload-toast';
  t.innerHTML = '✅ ' + msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ══════════════════════════════════════════════
//  VIDEO UPLOAD HANDLING
// ══════════════════════════════════════════════
function handleVideoDrop(e) {
  e.preventDefault();
  document.getElementById('videoDrop').classList.remove('drag-over');
  handleVideoFiles(e.dataTransfer.files);
}

function handleVideoFiles(files) {
  const cat = document.getElementById('vCategory').value.trim() || 'General';
  const customTitle = document.getElementById('vTitle').value.trim();

  Array.from(files).forEach(file => {
    if (!file.type.startsWith('video/')) return;
    const url = URL.createObjectURL(file);
    const title = customTitle || file.name.replace(/\.[^/.]+$/, '');
    videos.push({ id: videoIdCounter++, title, category: cat, type: 'real', src: url });
  });

  renderVideos();
  document.getElementById('vTitle').value = '';
  showToast(files.length + ' video(s) added!');
}

// ── VIDEOS RENDER ─────────────────────────────
function renderVideos() {
  const slider = document.getElementById('videoSlider');
  slider.innerHTML = videos.map(v => {
    const mediaHtml = v.type === 'real'
      ? `<div class="real-video-wrap">
           <video id="vid_${v.id}" src="${v.src}" preload="metadata" playsinline loop></video>
           <div class="video-controls" id="ctrl_${v.id}" onclick="toggleVideo(${v.id}, event)">
             <div class="play-icon"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
           </div>
         </div>`
      : `<div class="video-thumb">
           <div class="video-thumb-bg" style="background:${v.color}">
             <div class="play-icon"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
           </div>
           <div class="video-overlay"></div>
         </div>`;

    return `<div class="video-card" id="vc${v.id}">
      ${mediaHtml}
      <div class="video-info">
        <div class="video-category">${v.category}</div>
        <div class="video-title">${v.title}</div>
      </div>

    </div>`;
  }).join('');
}

function toggleVideo(id, e) {
  e.stopPropagation();
  const vid = document.getElementById('vid_' + id);
  const ctrl = document.getElementById('ctrl_' + id);
  if (!vid) return;
  // Pause all other videos first
  document.querySelectorAll('.real-video-wrap video').forEach(v => {
    if (v !== vid) { v.pause(); }
  });
  document.querySelectorAll('.video-controls').forEach(c => {
    if (c !== ctrl) c.classList.remove('hidden');
  });
  if (vid.paused) {
    vid.play();
    ctrl.classList.add('hidden');
    // Auto-stop when video ends
    vid.onended = () => { ctrl.classList.remove('hidden'); };
  } else {
    vid.pause();
    ctrl.classList.remove('hidden');
  }
}

// ── Stop videos when scrolled out of view ─────
function initVideoScrollStop() {
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) {
        const vid = entry.target.querySelector('video');
        if (vid && !vid.paused) {
          vid.pause();
          const wrap = entry.target;
          const ctrl = wrap.querySelector('.video-controls');
          if (ctrl) ctrl.classList.remove('hidden');
        }
      }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.real-video-wrap').forEach(wrap => observer.observe(wrap));
}

function slideVideos(dir) {
  document.getElementById('videoSlider').scrollBy({ left: dir * 260, behavior: 'smooth' });
}

function deleteVideo(id) {
  if (!adminLoggedIn) { openAdminPortal('videos'); return; }
  if (!confirm('Delete this video?')) return;
  const v = videos.find(x => x.id === id);
  if (v && v.src) URL.revokeObjectURL(v.src);
  videos = videos.filter(v => v.id !== id);
  renderVideos();
}

// ══════════════════════════════════════════════
//  PHOTO UPLOAD HANDLING
// ══════════════════════════════════════════════
function handlePhotoDrop(e) {
  e.preventDefault();
  document.getElementById('photoDrop').classList.remove('drag-over');
  handlePhotoFiles(e.dataTransfer.files);
}

function handlePhotoFiles(files) {
  const cat = document.getElementById('pCategory').value || 'Portrait';
  const customTitle = document.getElementById('pTitle').value.trim();

  let count = 0;
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        let aspect = '4/3';
        if (ratio < 0.6) aspect = '3/5';
        else if (ratio < 0.85) aspect = '3/4';
        else if (ratio > 1.6) aspect = '16/9';
        else if (ratio > 1.2) aspect = '4/3';
        else aspect = '1/1';

        const title = customTitle || file.name.replace(/\.[^/.]+$/, '');
        photos.push({ id: photoIdCounter++, title, category: cat, type: 'real', src: e.target.result, aspect });
        count++;
        renderPhotos();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  setTimeout(() => { if (count > 0 || files.length > 0) showToast(files.length + ' photo(s) added!'); }, 500);
  document.getElementById('pTitle').value = '';
}

// ── PHOTOS RENDER ─────────────────────────────
function renderPhotos() {
  const grid = document.getElementById('photoGrid');
  const list = filterActive === 'all' ? photos : photos.filter(p => p.category === filterActive);

  grid.innerHTML = list.map(p => {
    const mediaHtml = p.type === 'real'
      ? `<img src="${p.src}" alt="${p.title}" loading="lazy">`
      : `<div class="photo-placeholder" style="aspect-ratio:${p.aspect};background:${p.color}">
           <div class="photo-placeholder-inner">
             <div class="photo-icon">🖼</div>
             <div class="photo-label">${p.category}</div>
           </div>
         </div>`;

    return `<div class="photo-item" onclick="openLightbox('${p.title}', '${p.src || p.color}', ${p.type === 'real'})">
      ${mediaHtml}
      <div class="photo-overlay">
        <div class="photo-meta">
          <div class="photo-cat">${p.category}</div>
          <div>${p.title}</div>
        </div>
      </div>

    </div>`;
  }).join('');


}

function filterPhotos(cat, btn) {
  filterActive = cat;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderPhotos();
}

function deletePhoto(id) {
  if (!adminLoggedIn) { openAdminPortal('photos'); return; }
  photos = photos.filter(p => p.id !== id);
  renderPhotos();
}

// ── LIGHTBOX ──────────────────────────────────
function openLightbox(title, srcOrColor, isReal) {
  const lb = document.getElementById('lightbox');
  const box = document.getElementById('lightboxImg');
  if (isReal) {
    box.innerHTML = `<img src="${srcOrColor}" alt="${title}" style="max-width:90vw;max-height:85vh;object-fit:contain;display:block;border:1px solid rgba(201,168,76,0.2)">`;
    box.style.background = 'transparent';
    box.style.width = 'auto';
    box.style.height = 'auto';
  } else {
    box.style.width = '60vw'; box.style.height = '70vh';
    box.style.background = srcOrColor;
    box.innerHTML = `<div style="text-align:center">
      <div style="font-size:3rem;margin-bottom:12px">🖼</div>
      <div style="font-family:var(--font-display);font-size:1.4rem;color:var(--gold)">${title}</div>
      <div style="font-family:var(--font-ui);font-size:0.6rem;letter-spacing:0.3em;color:var(--white-dim);margin-top:8px;text-transform:uppercase">Photo Preview</div>
    </div>`;
  }
  lb.classList.add('open');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
}

document.getElementById('lightbox').addEventListener('click', e => {
  if (e.target === document.getElementById('lightbox')) closeLightbox();
});

// ── BOOKING ───────────────────────────────────
function openBooking(pkg) {
  document.getElementById('bPackage').value = pkg;
  document.getElementById('modalPkgLabel').textContent = pkg;
  document.getElementById('booking-overlay').classList.add('open');
}

function closeBooking() {
  document.getElementById('booking-overlay').classList.remove('open');
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('booking-overlay')) closeBooking();
}

function submitBooking() {
  const name = document.getElementById('bName').value.trim();
  const phone = document.getElementById('bPhone').value.trim();
  const service = document.getElementById('bService').value;
  const pkg = document.getElementById('bPackage').value;
  if (!name || !phone || !service) { alert('Please fill in all required fields.'); return; }
  const msg = encodeURIComponent(
    `Hi Dinesh,

I want to book the ${pkg}.

Name: ${name}
Phone: ${phone}
Service Needed: ${service}

Please contact me regarding the project.`
  );
  window.open(`https://wa.me/917708509295?text=${msg}`, '_blank');
  closeBooking();
}

// ── REVIEWS ───────────────────────────────────
function setRating(n) {
  currentRating = n;
  document.querySelectorAll('.star-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i < n);
  });
}

function renderReviews() {
  const list = document.getElementById('reviewsList');
  list.innerHTML = reviews.map(r => `
    <div class="review-card">
      <div class="review-header">
        <div class="reviewer-name">${r.name}</div>
        <div class="review-date">${r.date}</div>
      </div>
      <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
      <div class="review-text">"${r.text}"</div>
    </div>
  `).join('');
}

function submitReview() {
  const name = document.getElementById('rName').value.trim();
  const text = document.getElementById('rText').value.trim();
  if (!name || !text || !currentRating) { alert('Please enter your name, select a rating, and write your feedback.'); return; }
  const today = new Date().toISOString().slice(0,10);
  reviews.unshift({ name, rating: currentRating, text, date: today });
  renderReviews();
  document.getElementById('rName').value = '';
  document.getElementById('rText').value = '';
  setRating(0);
  currentRating = 0;
}

// Initial fade-in check
setTimeout(() => {
  document.querySelectorAll('.fade-in').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 80) el.classList.add('visible');
  });
}, 3000);