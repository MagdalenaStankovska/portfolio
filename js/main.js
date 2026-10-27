(function(){
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pointerFine = window.matchMedia('(pointer: fine)').matches;
  var PALETTE = ['#7b96ff', '#ff86bb', '#ffd84d', '#5ad7a0', '#ffa25c', '#bba4ff'];

  document.getElementById('year').textContent = new Date().getFullYear();

  // ---- theme toggle (manual override on top of prefers-color-scheme) ----
  var themeBtn = document.getElementById('themeToggle');
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  var onThemeChange = function(){};

  function currentTheme(){
    return root.getAttribute('data-theme') || (darkQuery.matches ? 'dark' : 'light');
  }
  function syncThemeButton(){
    var label = 'Switch to ' + (currentTheme() === 'dark' ? 'light' : 'dark') + ' theme';
    themeBtn.setAttribute('aria-label', label);
    themeBtn.setAttribute('title', label);
    onThemeChange();
  }
  themeBtn.addEventListener('click', function(){
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncThemeButton();
  });
  if (darkQuery.addEventListener) darkQuery.addEventListener('change', syncThemeButton);

  // ---- nav: mobile menu ----
  var nav = document.querySelector('.site-nav');
  var menuBtn = document.getElementById('menuToggle');
  var navLinks = document.getElementById('navLinks');

  function setMenu(open){
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('menu-open', open);
  }
  menuBtn.addEventListener('click', function(){
    setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
  });
  navLinks.addEventListener('click', function(e){
    if (e.target.closest('a')) setMenu(false);
  });

  // ---- highlight the nav link of the section in view ----
  var linkById = {};
  navLinks.querySelectorAll('a[href^="#"]').forEach(function(a){
    linkById[a.getAttribute('href').slice(1)] = a;
  });
  if ('IntersectionObserver' in window){
    var sectionIO = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        var link = linkById[entry.target.id];
        if (!link || !entry.isIntersecting) return;
        Object.keys(linkById).forEach(function(id){
          linkById[id].classList.remove('is-active');
          linkById[id].removeAttribute('aria-current');
        });
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(linkById).forEach(function(id){
      var section = document.getElementById(id);
      if (section) sectionIO.observe(section);
    });
  }

  // ---- scroll-linked: progress bar + timeline line ----
  var progressBar = document.getElementById('progressBar');
  var timeline = document.getElementById('timeline');
  var scrollTicking = false;

  function onScrollFrame(){
    scrollTicking = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
    if (timeline && !reduceMotion){
      var r = timeline.getBoundingClientRect();
      var p = (window.innerHeight * 0.65 - r.top) / r.height;
      timeline.style.setProperty('--p', Math.max(0, Math.min(1, p)).toFixed(3));
    }
  }
  window.addEventListener('scroll', function(){
    if (!scrollTicking){ scrollTicking = true; requestAnimationFrame(onScrollFrame); }
  }, { passive: true });
  onScrollFrame();

  // ---- scroll reveal ----
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion){
    var revealIO = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add('in-view');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function(el){ revealIO.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('in-view'); });
  }

  // ---- rotating last word of the headline ----
  var rotWord = document.getElementById('rotWord');
  if (rotWord && !reduceMotion){
    var words = ['think.', 'learn.', 'help.'];
    var wordIdx = 0;
    setInterval(function(){
      if (document.hidden) return;
      rotWord.classList.add('swap-out');
      setTimeout(function(){
        wordIdx = (wordIdx + 1) % words.length;
        rotWord.textContent = words[wordIdx];
        rotWord.classList.remove('swap-out');
        rotWord.classList.add('swap-in');
        void rotWord.offsetWidth; // restart the transition from below
        rotWord.classList.remove('swap-in');
      }, 300);
    }, 2600);
  }

  // ---- hero dot grid that reacts to the cursor ----
  (function heroCanvas(){
    var canvas = document.getElementById('heroCanvas');
    if (!canvas || !canvas.getContext) return;
    var hero = canvas.parentElement;
    var ctx = canvas.getContext('2d');
    var GAP = 30, RADIUS = 160;
    var w = 0, h = 0, baseColor = '';
    var mouse = { x: -9999, y: -9999 }, cur = { x: -9999, y: -9999 };
    var raf = null;

    function draw(){
      ctx.clearRect(0, 0, w, h);
      for (var y = GAP / 2, j = 0; y < h; y += GAP, j++){
        for (var x = GAP / 2, i = 0; x < w; x += GAP, i++){
          var dx = x - cur.x, dy = y - cur.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          var f = d < RADIUS ? 1 - d / RADIUS : 0;
          var push = d > 0 ? f * 12 / d : 0;
          ctx.fillStyle = f > 0.18 ? PALETTE[(i + j) % PALETTE.length] : baseColor;
          ctx.beginPath();
          ctx.arc(x + dx * push, y + dy * push, 1.4 + f * 3.6, 0, 6.2832);
          ctx.fill();
        }
      }
    }
    function resize(){
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
    function tick(){
      cur.x += (mouse.x - cur.x) * 0.18;
      cur.y += (mouse.y - cur.y) * 0.18;
      draw();
      raf = (Math.abs(mouse.x - cur.x) + Math.abs(mouse.y - cur.y) > 0.5) ? requestAnimationFrame(tick) : null;
    }

    onThemeChange = function(){
      baseColor = getComputedStyle(root).getPropertyValue('--grid-dot').trim();
      draw();
    };
    baseColor = getComputedStyle(root).getPropertyValue('--grid-dot').trim();

    var resizeTimer;
    window.addEventListener('resize', function(){ clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 120); });
    resize();

    if (!pointerFine || reduceMotion) return;
    hero.addEventListener('mousemove', function(e){
      var r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      if (cur.x < -1000){ cur.x = mouse.x; cur.y = mouse.y; }
      if (!raf) raf = requestAnimationFrame(tick);
    });
    hero.addEventListener('mouseleave', function(){
      mouse.x = mouse.y = cur.x = cur.y = -9999;
      if (raf){ cancelAnimationFrame(raf); raf = null; }
      draw();
    });
  })();
  syncThemeButton();

  // ---- tilt cards toward the cursor ----
  if (pointerFine && !reduceMotion){
    document.querySelectorAll('.tilt').forEach(function(card){
      card.addEventListener('mousemove', function(e){
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--rx', (py * -5).toFixed(2) + 'deg');
        card.style.setProperty('--ry', (px * 6).toFixed(2) + 'deg');
      });
      card.addEventListener('mouseleave', function(){
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  // ---- confetti ----
  function confetti(x, y, count){
    if (reduceMotion || !document.body.animate) return;
    for (var n = 0; n < (count || 36); n++){
      var p = document.createElement('span');
      p.className = 'confetti';
      p.style.background = PALETTE[n % PALETTE.length];
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      document.body.appendChild(p);
      var angle = Math.random() * Math.PI * 2;
      var v = 70 + Math.random() * 150;
      var dx = Math.cos(angle) * v;
      var dy = Math.sin(angle) * v - 90;
      var anim = p.animate([
        { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + dx + 'px, ' + (dy + 180) + 'px) rotate(' + (Math.random() * 720 - 360) + 'deg)', opacity: 0 }
      ], { duration: 1000 + Math.random() * 600, easing: 'cubic-bezier(.2,.7,.3,1)' });
      anim.onfinish = (function(el){ return function(){ el.remove(); }; })(p);
    }
  }
  function burstFrom(el, e){
    var r = el.getBoundingClientRect();
    var useCenter = !e || e.detail === 0; // keyboard activation has no pointer position
    confetti(useCenter ? r.left + r.width / 2 : e.clientX, useCenter ? r.top + r.height / 2 : e.clientY);
  }
  document.addEventListener('click', function(e){
    var el = e.target.closest('[data-confetti]');
    if (el) burstFrom(el, e);
  });

  // a small celebration the first time the paper scrolls into view
  var newSticker = document.querySelector('.new-sticker');
  if (newSticker && 'IntersectionObserver' in window && !reduceMotion){
    var stickerIO = new IntersectionObserver(function(entries){
      if (entries[0].isIntersecting){
        setTimeout(function(){ burstFrom(newSticker); }, 450);
        stickerIO.disconnect();
      }
    }, { threshold: 1 });
    stickerIO.observe(newSticker);
  }

  // ---- copy email ----
  var copyBtn = document.getElementById('copyEmail');
  var copyLabel = document.getElementById('copyLabel');
  copyBtn.addEventListener('click', function(e){
    var email = copyBtn.getAttribute('data-email');
    function fallback(){ window.location.href = 'mailto:' + email; }
    if (!navigator.clipboard){ fallback(); return; }
    navigator.clipboard.writeText(email).then(function(){
      copyBtn.classList.add('copied');
      copyLabel.textContent = 'Copied! ✓';
      burstFrom(copyBtn, e);
      setTimeout(function(){
        copyBtn.classList.remove('copied');
        copyLabel.textContent = 'Copy';
      }, 1800);
    }, fallback);
  });

  // ---- project terminal preview ----
  var PROJECTS = {
    vitacoach: {
      path: 'vitacoach/about.md',
      color: 'var(--green)',
      segments: [
        { t: 'VitaCoach pairs a ' },
        { t: 'Gemini-powered RAG chatbot', c: 'acc' },
        { t: ' with a full workout and nutrition engine. Tell it your goal (strength, fat loss, endurance) and it searches a ' },
        { t: 'ChromaDB vector index', c: 'acc' },
        { t: ' of exercises and coaching notes to build a real weekly plan, suggest nearby gyms, and book sessions straight onto your ' },
        { t: 'Google Calendar', c: 'acc' },
        { t: ' via OAuth. React front-end, Python backend.' }
      ]
    },
    examschedule: {
      path: 'exam-schedule/about.md',
      color: 'var(--purple)',
      segments: [
        { t: 'Exam Schedule replaces a manual, error-prone process at FINKI. It pulls real course and room data, feeds it to a ' },
        { t: 'Gemini model', c: 'acc' },
        { t: ', and generates a full conflict-free exam timetable, hitting ' },
        { t: '85–90% accuracy', c: 'acc' },
        { t: ' against a human scheduler, in a fraction of the time. Built with Java and Spring Boot.' }
      ]
    },
    signsense: {
      path: 'signsense/about.md',
      color: 'var(--blue)',
      segments: [
        { t: 'SignSense turns a webcam feed into text. It tracks hand landmarks in real time with ' },
        { t: 'MediaPipe', c: 'acc' },
        { t: ', feeds them through a ' },
        { t: 'TensorFlow model', c: 'acc' },
        { t: ' trained on finger-spelled letters, and reconstructs full words as you sign. No gloves, no sensors, just a camera.' }
      ]
    },
    parksmart: {
      path: 'parksmart/about.md',
      color: 'var(--orange)',
      segments: [
        { t: 'ParkSmart lets you pay for street parking in North Macedonia by SMS. It detects your ' },
        { t: 'parking zone from GPS', c: 'acc' },
        { t: ', builds the message (' },
        { t: '<zone> <plate> <hours>', c: 'acc' },
        { t: '), and opens your phone\'s Messages app pre-filled, so you only tap Send. The mobile app is built with ' },
        { t: 'Expo / React Native and TypeScript', c: 'acc' },
        { t: ', the backend with ' },
        { t: 'Spring Boot, PostgreSQL and JWT auth', c: 'acc' },
        { t: ', with backend and mobile tests running in CI on every push. It launches in Skopje and is designed to add more cities later.' }
      ]
    },
    beautyqueen: {
      path: 'beautyqueen/about.md',
      color: 'var(--pink)',
      segments: [
        { t: 'BeautyQueen is a booking system built for beauty salons. Clients pick a ' },
        { t: 'service, stylist and time slot', c: 'acc' },
        { t: ' and get instant confirmation. Behind the scenes, admins run the whole calendar from a ' },
        { t: 'drag-and-drop dashboard', c: 'acc' },
        { t: ' to reschedule, block time off, and track daily bookings, all without touching a spreadsheet.' }
      ]
    }
  };

  var overlay = document.getElementById('modalOverlay');
  var modalPanel = document.getElementById('modalPanel');
  var modalPath = document.getElementById('modalPath');
  var modalBody = document.getElementById('modalBody');
  var modalClose = document.getElementById('modalClose');
  var returnFocus = null;
  var typeTimer = null;

  function el(tag, className, text){
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function openProject(key, fallbackFocus){
    var data = PROJECTS[key];
    if (!data) return;

    clearTimeout(typeTimer);
    modalPanel.style.setProperty('--accent', data.color);
    modalPath.innerHTML = '~/<span class="sep">projects/</span>' + data.path;
    modalBody.innerHTML = '';

    var promptLine = el('div', 'modal-promptline');
    var cmdSpan = el('span', 't-cmd');
    var cmdCursor = el('span', 'type-cursor');
    promptLine.appendChild(el('span', 't-prompt', '$ '));
    promptLine.appendChild(cmdSpan);
    promptLine.appendChild(cmdCursor);
    modalBody.appendChild(promptLine);

    var typedWrap = el('div', 't-out');
    modalBody.appendChild(typedWrap);
    var spans = data.segments.map(function(seg){
      return typedWrap.appendChild(el('span', seg.c === 'acc' ? 't-acc' : 't-out'));
    });
    var bodyCursor = typedWrap.appendChild(el('span', 'type-cursor'));

    var active = document.activeElement;
    returnFocus = (active && active !== document.body) ? active : fallbackFocus;
    overlay.style.display = 'flex';
    requestAnimationFrame(function(){ overlay.classList.add('open'); });
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    modalClose.focus();

    var cmdText = 'cat ' + data.path;

    // reduced motion: show the full text immediately instead of typing it out
    if (reduceMotion){
      cmdSpan.textContent = cmdText;
      cmdCursor.classList.add('done');
      bodyCursor.classList.add('done');
      data.segments.forEach(function(seg, i){ spans[i].textContent = seg.t; });
      return;
    }

    function typeCommand(i){
      if (i >= cmdText.length){
        cmdCursor.classList.add('done');
        typeTimer = setTimeout(function(){ typeParagraph(0); }, 350);
        return;
      }
      cmdSpan.textContent += cmdText[i];
      typeTimer = setTimeout(function(){ typeCommand(i + 1); }, 16 + Math.random() * 12);
    }

    var flat = [];
    data.segments.forEach(function(seg, i){
      for (var c = 0; c < seg.t.length; c++) flat.push({ i: i, ch: seg.t[c] });
    });
    function typeParagraph(idx){
      if (idx >= flat.length){ bodyCursor.classList.add('done'); return; }
      spans[flat[idx].i].textContent += flat[idx].ch;
      modalBody.scrollTop = modalBody.scrollHeight;
      typeTimer = setTimeout(function(){ typeParagraph(idx + 1); }, 12 + Math.random() * 14);
    }

    typeCommand(0);
  }

  function closeModal(){
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    clearTimeout(typeTimer);
    setTimeout(function(){
      if (!overlay.classList.contains('open')) overlay.style.display = 'none';
    }, 300);
    if (returnFocus && returnFocus.focus) returnFocus.focus();
  }

  // whole card is a mouse target; the "Preview" button is the keyboard target.
  // links inside the card (GitHub, paper badge) keep their own behaviour.
  document.querySelectorAll('.proj-card[data-project]').forEach(function(card){
    card.addEventListener('click', function(e){
      if (e.target.closest('a')) return;
      openProject(card.getAttribute('data-project'), card.querySelector('.proj-preview'));
    });
  });

  modalClose.addEventListener('click', closeModal);
  overlay.addEventListener('click', function(e){
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', function(e){
    if (overlay.classList.contains('open')){
      if (e.key === 'Escape') closeModal();
      // the close button is the only focusable element in the dialog
      if (e.key === 'Tab'){ e.preventDefault(); modalClose.focus(); }
    } else if (e.key === 'Escape' && nav.classList.contains('menu-open')){
      setMenu(false);
      menuBtn.focus();
    }
  });
})();
