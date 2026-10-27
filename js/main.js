(function(){
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.getElementById('year').textContent = new Date().getFullYear();

  // ---- theme toggle (manual override on top of prefers-color-scheme) ----
  var themeBtn = document.getElementById('themeToggle');
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function currentTheme(){
    return root.getAttribute('data-theme') || (darkQuery.matches ? 'dark' : 'light');
  }
  function syncThemeButton(){
    var label = 'Switch to ' + (currentTheme() === 'dark' ? 'light' : 'dark') + ' theme';
    themeBtn.setAttribute('aria-label', label);
    themeBtn.setAttribute('title', label);
  }
  themeBtn.addEventListener('click', function(){
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncThemeButton();
  });
  if (darkQuery.addEventListener) darkQuery.addEventListener('change', syncThemeButton);
  syncThemeButton();

  // ---- nav: scrolled state + mobile menu ----
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

  window.addEventListener('scroll', function(){
    nav.classList.toggle('scrolled', window.scrollY > 8);
  }, { passive: true });

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

  // ---- project terminal preview ----
  var PROJECTS = {
    vitacoach: {
      path: 'vitacoach/about.md',
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
