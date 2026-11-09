/* ============================================================================
   Jingran Design — member sign-in (TEMPORARY LOCAL VERSION)
   ----------------------------------------------------------------------------
   ⚠️  THIS IS A FRONT-END-ONLY PLACEHOLDER, NOT REAL SECURITY.
       Accounts live in this browser's localStorage. Anyone who opens DevTools
       can read or fake a session. It exists so the UI and the gating flow are
       finished and testable before the real backend is available.

   WHEN THE CLOUD SERVICE IS BACK, replace ONLY the block marked
   "AUTH ADAPTER" below with the SDK calls. Everything else — the button,
   the modal, the gating — reads the same five methods, so nothing else changes:

       JDAuth.signUp(email, password)  -> Promise<{ email }>
       JDAuth.signIn(email, password)  -> Promise<{ email }>
       JDAuth.signOut()                -> void
       JDAuth.getUser()                -> { email } | null
       JDAuth.onChange(fn)             -> void

   Pages opt in with attributes only:
       <script src="assets/auth.js" defer></script>
       <div class="project-grid" data-gate="portfolio">   ← blur + intercept
       <main data-gate="case">                            ← replace with lock panel
       <a data-gate="link" data-name="LUNAMODA">          ← padlock + intercept
   ========================================================================== */
(function () {
  'use strict';

  var USERS_KEY = 'jd_users';
  var SESSION_KEY = 'jd_session';

  /* ---------------------------------------------------------------------
     AUTH ADAPTER — swap this block for the cloud SDK later.
     --------------------------------------------------------------------- */

  // Not a real hash. Only stops casual shoulder-surfing of localStorage.
  function weakHash(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return 'h' + (h >>> 0).toString(36) + '_' + str.length;
  }

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* storage blocked (private mode) — session stays in memory only */
    }
  }

  var listeners = [];
  var session = readJSON(SESSION_KEY, null);

  function emit() {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](session); } catch (e) {}
    }
  }

  function normaliseEmail(value) {
    return String(value || '').trim().toLowerCase();
  }

  var JDAuth = {
    signUp: function (email, password) {
      email = normaliseEmail(email);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return Promise.reject(new Error('Please enter a valid email address.'));
      }
      if (!password || password.length < 6) {
        return Promise.reject(new Error('Password must be at least 6 characters.'));
      }
      var users = readJSON(USERS_KEY, {});
      if (users[email]) {
        return Promise.reject(new Error('That email is already registered — try signing in.'));
      }
      users[email] = { email: email, pass: weakHash(password), createdAt: Date.now() };
      writeJSON(USERS_KEY, users);
      session = { email: email, at: Date.now() };
      writeJSON(SESSION_KEY, session);
      emit();
      return Promise.resolve({ email: email });
    },

    signIn: function (email, password) {
      email = normaliseEmail(email);
      var users = readJSON(USERS_KEY, {});
      var user = users[email];
      if (!user || user.pass !== weakHash(password || '')) {
        return Promise.reject(new Error('Email or password is incorrect.'));
      }
      session = { email: email, at: Date.now() };
      writeJSON(SESSION_KEY, session);
      emit();
      return Promise.resolve({ email: email });
    },

    signOut: function () {
      session = null;
      try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
      emit();
    },

    getUser: function () {
      return session ? { email: session.email } : null;
    },

    onChange: function (fn) {
      listeners.push(fn);
      return function () {
        var i = listeners.indexOf(fn);
        if (i > -1) listeners.splice(i, 1);
      };
    }
  };

  window.JDAuth = JDAuth;

  /* ---------------------------------------------------------------------
     STYLES — injected so every page looks identical without touching
     eight separate <style> blocks.
     --------------------------------------------------------------------- */
  var CSS = ''
    + '.jd-btn{display:inline-flex;align-items:center;gap:7px;height:40px;padding:0 15px;'
    + 'border-radius:10px;border:1px solid #dcd8ff;background:#fff;color:#4b41e8;'
    + 'font:600 14px/1 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;'
    + 'cursor:pointer;white-space:nowrap;transition:background .2s,border-color .2s,color .2s}'
    + '.jd-btn:hover{background:#f6f5ff;border-color:#c3bcff}'
    + '.jd-btn:active{background:#efedff}'
    + '.jd-btn .jd-av{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;'
    + 'background:linear-gradient(135deg,#6359ff,#8554ff);color:#fff;font-size:11px;font-weight:700}'
    + '@media (max-width:860px){'
    + '.jd-btn[data-jd="header"]{height:38px;padding:0 11px;font-size:13px}'
    + '.jd-btn[data-jd="header"] .jd-av{width:20px;height:20px;font-size:10px}}'

    + '.jd-modal{position:fixed;inset:0;z-index:300;display:none;place-items:center;padding:20px;'
    + 'background:rgba(9,11,18,.55);backdrop-filter:blur(3px)}'
    + '.jd-modal.open{display:grid}'
    + '.jd-card{width:100%;max-width:412px;background:#fff;border-radius:18px;padding:28px 26px 24px;'
    + 'box-shadow:0 30px 70px -20px rgba(9,11,18,.55);font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;'
    + 'animation:jdIn .22s ease-out}'
    + '@keyframes jdIn{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}'
    + '.jd-x{position:absolute;top:16px;right:16px;width:34px;height:34px;border-radius:50%;border:0;'
    + 'background:#f1f2f6;color:#475569;font-size:19px;line-height:1;cursor:pointer}'
    + '.jd-x:hover{background:#e6e8ef}'
    + '.jd-card h2{margin:0 0 4px;font-size:21px;letter-spacing:-.01em;color:#0f172a}'
    + '.jd-card .jd-sub{margin:0 0 20px;font-size:13.5px;color:#64748b;line-height:1.5}'
    + '.jd-tabs{display:flex;gap:4px;background:#f4f5f9;border-radius:10px;padding:4px;margin-bottom:18px}'
    + '.jd-tab{flex:1;height:34px;border:0;border-radius:7px;background:transparent;color:#64748b;'
    + 'font:600 13.5px system-ui,sans-serif;cursor:pointer;transition:background .2s,color .2s}'
    + '.jd-tab[aria-selected="true"]{background:#fff;color:#0f172a;box-shadow:0 1px 3px rgba(15,23,42,.12)}'
    + '.jd-field{margin-bottom:13px}'
    + '.jd-field label{display:block;font-size:12.5px;font-weight:600;color:#334155;margin-bottom:6px}'
    + '.jd-field input{width:100%;height:44px;padding:0 13px;border-radius:10px;border:1px solid #dfe3ea;'
    + 'background:#fff;color:#0f172a;font:15px system-ui,sans-serif;transition:border-color .2s,box-shadow .2s}'
    + '.jd-field input:focus{outline:0;border-color:#6359ff;box-shadow:0 0 0 3px rgba(99,89,255,.16)}'
    + '.jd-err{display:none;margin:0 0 13px;padding:9px 12px;border-radius:9px;background:#fef2f2;'
    + 'color:#b42318;font-size:13px;line-height:1.45}'
    + '.jd-err.on{display:block}'
    + '.jd-submit{width:100%;height:46px;border:0;border-radius:11px;cursor:pointer;color:#fff;'
    + 'background:linear-gradient(135deg,#6359ff,#8554ff);font:600 15px system-ui,sans-serif;'
    + 'transition:filter .2s,opacity .2s}'
    + '.jd-submit:hover{filter:brightness(1.06)}'
    + '.jd-submit:disabled{opacity:.6;cursor:default;filter:none}'
    + '.jd-foot{margin:14px 0 0;font-size:11.5px;color:#94a3b8;text-align:center;line-height:1.5}'

    + '.jd-gated .project .ph-img{filter:blur(13px) saturate(.55);transform:scale(1.04)}'
    + '.jd-gated .project .project-body{opacity:.45}'
    + '.jd-gated .project{cursor:pointer}'
    + '.jd-gate-note{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:0 0 20px;'
    + 'padding:13px 16px;border-radius:12px;background:#f5f4ff;border:1px solid #e4e0ff;'
    + 'font:14px/1.5 system-ui,sans-serif;color:#3f3a7a}'
    + '.jd-gate-note b{color:#4b41e8}'
    + '.jd-gate-note .jd-btn{margin-left:auto}'

    + '.jd-lock{display:none;max-width:560px;margin:80px auto 120px;padding:0 24px;text-align:center;'
    + 'font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}'
    + '.jd-locked > *:not(.jd-lock){display:none}'
    + '.jd-locked > .jd-lock{display:block}'
    + '.jd-lock .jd-ico{width:54px;height:54px;margin:0 auto 18px;border-radius:16px;display:grid;'
    + 'place-items:center;background:#f1efff;color:#6359ff}'
    + '.jd-lock h2{margin:0 0 10px;font-size:23px;letter-spacing:-.01em;color:#0f172a}'
    + '.jd-lock p{margin:0 0 22px;color:#64748b;font-size:15px;line-height:1.6}';

  /* ---------------------------------------------------------------------
     MARKUP
     --------------------------------------------------------------------- */
  function iconLock() {
    return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
      + 'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
      + '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/>'
      + '<path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>';
  }

  var styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  var modal = document.createElement('div');
  modal.className = 'jd-modal';
  modal.id = 'jdAuthModal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'jdAuthTitle');
  modal.innerHTML = ''
    + '<div class="jd-card" style="position:relative">'
    + '  <button class="jd-x" type="button" aria-label="Close">&times;</button>'
    + '  <h2 id="jdAuthTitle">Sign in</h2>'
    + '  <p class="jd-sub">Members can open every case study and download the full portfolio.</p>'
    + '  <div class="jd-tabs" role="tablist">'
    + '    <button class="jd-tab" type="button" role="tab" data-mode="signin" aria-selected="true">Sign in</button>'
    + '    <button class="jd-tab" type="button" role="tab" data-mode="signup" aria-selected="false">Create account</button>'
    + '  </div>'
    + '  <form novalidate>'
    + '    <div class="jd-field"><label for="jdEmail">Email</label>'
    + '      <input id="jdEmail" name="email" type="email" autocomplete="email" placeholder="you@company.com" required></div>'
    + '    <div class="jd-field"><label for="jdPass">Password</label>'
    + '      <input id="jdPass" name="password" type="password" autocomplete="current-password" placeholder="At least 6 characters" required></div>'
    + '    <p class="jd-err" role="alert"></p>'
    + '    <button class="jd-submit" type="submit">Sign in</button>'
    + '  </form>'
    + '  <p class="jd-foot">Demo mode — accounts are stored on this device only.</p>'
    + '</div>';
  document.body.appendChild(modal);

  var card = modal.querySelector('.jd-card');
  var title = modal.querySelector('#jdAuthTitle');
  var sub = modal.querySelector('.jd-sub');
  var form = modal.querySelector('form');
  var emailEl = modal.querySelector('#jdEmail');
  var passEl = modal.querySelector('#jdPass');
  var errEl = modal.querySelector('.jd-err');
  var submitEl = modal.querySelector('.jd-submit');
  var tabs = modal.querySelectorAll('.jd-tab');
  var mode = 'signin';
  var lastFocus = null;

  function setMode(next) {
    mode = next;
    var signup = next === 'signup';
    title.textContent = signup ? 'Create your account' : 'Sign in';
    sub.textContent = signup
      ? 'Free to join — you get every case study and the full portfolio.'
      : 'Members can open every case study and download the full portfolio.';
    submitEl.textContent = signup ? 'Create account' : 'Sign in';
    passEl.setAttribute('autocomplete', signup ? 'new-password' : 'current-password');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].setAttribute('aria-selected', tabs[i].dataset.mode === next ? 'true' : 'false');
    }
    hideError();
  }

  function showError(msg) {
    errEl.textContent = msg;
    errEl.classList.add('on');
  }

  function hideError() {
    errEl.textContent = '';
    errEl.classList.remove('on');
  }

  function openModal(which) {
    lastFocus = document.activeElement;
    setMode(which || 'signin');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { emailEl.focus(); }, 30);
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  window.JDAuthUI = { open: openModal, close: closeModal };

  modal.querySelector('.jd-x').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    // basic focus trap
    if (e.key === 'Tab' && modal.classList.contains('open')) {
      var f = card.querySelectorAll('button, input, [href]');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  for (var t = 0; t < tabs.length; t++) {
    tabs[t].addEventListener('click', function () { setMode(this.dataset.mode); });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideError();
    submitEl.disabled = true;
    var fn = mode === 'signup' ? JDAuth.signUp : JDAuth.signIn;
    fn(emailEl.value, passEl.value).then(function () {
      submitEl.disabled = false;
      form.reset();
      closeModal();
    }).catch(function (err) {
      submitEl.disabled = false;
      showError(err && err.message ? err.message : 'Something went wrong. Please try again.');
    });
  });

  /* ---------------------------------------------------------------------
     HEADER BUTTON
     --------------------------------------------------------------------- */
  var headerBtn = document.createElement('button');
  headerBtn.type = 'button';
  headerBtn.className = 'jd-btn';
  headerBtn.setAttribute('data-jd', 'header');

  function paintButton() {
    var user = JDAuth.getUser();
    if (user) {
      var initial = user.email.charAt(0).toUpperCase();
      headerBtn.innerHTML = '<span class="jd-av">' + initial + '</span>Sign out';
      headerBtn.setAttribute('aria-label', 'Signed in as ' + user.email + ' — sign out');
    } else {
      headerBtn.textContent = 'Sign in';
      headerBtn.setAttribute('aria-label', 'Sign in or create an account');
    }
  }

  headerBtn.addEventListener('click', function () {
    if (JDAuth.getUser()) JDAuth.signOut();
    else openModal('signin');
  });

  function mountButton() {
    var cta = document.querySelector('.nav-cta');
    if (cta) {
      cta.insertBefore(headerBtn, cta.firstChild);
      return;
    }
    var nav = document.querySelector('.nav');
    if (nav) nav.appendChild(headerBtn);
  }

  /* ---------------------------------------------------------------------
     GATING
     --------------------------------------------------------------------- */
  function applyGating() {
    var signedIn = !!JDAuth.getUser();

    // Portfolio grid: blur the work and intercept the links
    var grids = document.querySelectorAll('[data-gate="portfolio"]');
    for (var i = 0; i < grids.length; i++) {
      var grid = grids[i];
      grid.classList.toggle('jd-gated', !signedIn);

      var note = grid.previousElementSibling;
      var hasNote = note && note.classList && note.classList.contains('jd-gate-note');
      if (!signedIn && !hasNote) {
        var strip = document.createElement('div');
        strip.className = 'jd-gate-note';
        strip.innerHTML = '<span><b>Members only.</b> Sign in to open the three case studies.</span>';
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'jd-btn';
        b.textContent = 'Sign in to view';
        b.addEventListener('click', function () { openModal('signin'); });
        strip.appendChild(b);
        grid.parentNode.insertBefore(strip, grid);
      } else if (signedIn && hasNote) {
        note.parentNode.removeChild(note);
      }
    }

    // Inline links (the "LUNAMODA" caption): swap the arrow for a padlock
    // and explain why it won't open yet.
    var links = document.querySelectorAll('[data-gate="link"]');
    for (var k = 0; k < links.length; k++) {
      var lk = links[k];
      lk.setAttribute('data-locked', signedIn ? '0' : '1');
      lk.setAttribute('aria-disabled', signedIn ? 'false' : 'true');
      if (signedIn) {
        lk.removeAttribute('title');
      } else {
        lk.setAttribute('title', 'Sign in to visit ' + (lk.getAttribute('data-name') || 'this site'));
      }
    }

    // Case pages: swap the article for a lock panel
    var mains = document.querySelectorAll('[data-gate="case"]');
    for (var j = 0; j < mains.length; j++) {
      var main = mains[j];
      main.classList.toggle('jd-locked', !signedIn);
      var lock = main.querySelector('.jd-lock');
      if (!signedIn && !lock) {
        lock = document.createElement('div');
        lock.className = 'jd-lock';
        lock.innerHTML = '<div class="jd-ico">' + iconLock() + '</div>'
          + '<h2>This case study is for members</h2>'
          + '<p>Create a free account to read the full write-up, see the process and download the assets.</p>'
          + '<button class="jd-btn" type="button" style="height:44px;padding:0 20px">Sign in or create an account</button>';
        lock.querySelector('button').addEventListener('click', function () { openModal('signin'); });
        main.insertBefore(lock, main.firstChild);
      }
    }
  }

  JDAuth.onChange(applyGating);
  JDAuth.onChange(paintButton);

  function boot() {
    mountButton();
    paintButton();
    applyGating();

    // Intercept clicks on gated portfolio cards and gated inline links
    document.addEventListener('click', function (e) {
      if (JDAuth.getUser()) return;
      if (!e.target.closest) return;
      var card = e.target.closest('[data-gate="portfolio"] .project');
      var gatedLink = e.target.closest('[data-gate="link"]');
      if (!card && !gatedLink) return;
      e.preventDefault();
      openModal('signin');
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
