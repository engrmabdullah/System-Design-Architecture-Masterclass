/* ============================================================
   DECK ENGINE — محرك العرض التقديمي
   تنقّل + فهرس + نطق صوتي إنجليزي + قاموس عربي + حفظ التقدّم
   ============================================================ */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  /* ══════════════════════════════════════════════════
     1. SPEECH — النطق الصوتي بالإنجليزية
     ══════════════════════════════════════════════════ */
  const Speech = (function () {
    const supported = 'speechSynthesis' in window;
    let voice = null, enabled = true, lastNode = null;

    /* نفضّل صوت رجّالي إنجليزي واضح */
    const MALE   = /\b(david|mark|guy|george|ryan|christopher|eric|brian|james|william|thomas|daniel|alex|fred|oliver|arthur|male)\b/i;
    const FEMALE = /\b(zira|hazel|susan|aria|jenny|michelle|ana|samantha|karen|moira|tessa|fiona|catherine|linda|heather|victoria|serena|amelie|female|woman)\b/i;

    function score(v) {
      let s = 0;
      if (MALE.test(v.name)) s += 100;
      if (v.voiceURI && MALE.test(v.voiceURI)) s += 40;
      if (FEMALE.test(v.name)) s -= 120;
      if (/natural|neural|premium|enhanced/i.test(v.name)) s += 30;
      if (/^en-US/i.test(v.lang)) s += 20;
      if (/^en-GB/i.test(v.lang)) s += 12;
      if (v.localService) s += 6;
      return s;
    }

    function pickVoice() {
      if (!supported) return;
      const all = speechSynthesis.getVoices();
      if (!all.length) return;
      const en = all.filter(v => /^en(-|_)/i.test(v.lang));
      if (!en.length) return;
      voice = en.slice().sort((a, b) => score(b) - score(a))[0];
    }
    if (supported) {
      pickVoice();
      speechSynthesis.onvoiceschanged = pickVoice;
    }

    /* ينظّف النص: يشيل العربي والرموز الزخرفية ويفك الاختصارات الشائعة */
    function clean(raw) {
      let t = String(raw)
        .replace(/[؀-ۿݐ-ݿ]+/g, ' ')   // حروف عربية
        .replace(/[«»„""'']/g, ' ')
        .replace(/[·•→←↓↑⇒✔✘◆⛶☰🔊]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return t;
    }

    function say(text, node, rate) {
      if (!supported || !enabled) return false;
      const t = clean(text);
      if (!t) return false;

      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t);
      if (voice) u.voice = voice;
      u.lang = (voice && voice.lang) || 'en-US';
      u.rate  = rate || 0.68;   // بطيء وواضح
      u.pitch = 0.85;           // نبرة أعمق (رجّالي)
      u.volume = 1;

      if (lastNode) lastNode.classList.remove('is-speaking');
      if (node) { node.classList.add('is-speaking'); lastNode = node; }

      const done = () => { if (lastNode) lastNode.classList.remove('is-speaking'); lastNode = null; Toast.hide(); };
      u.onend = done;
      u.onerror = done;

      Toast.show(t);
      speechSynthesis.speak(u);
      return true;
    }

    return {
      say,
      supported,
      isOn: () => enabled,
      toggle() {
        enabled = !enabled;
        if (!enabled) { speechSynthesis.cancel(); Toast.hide(); }
        return enabled;
      }
    };
  })();

  /* ── toast صغير بيبيّن الكلمة اللي بتتنطق ── */
  const Toast = (function () {
    let box = null, timer = null;
    function ensure() {
      if (box) return box;
      box = el('div', 'tts-toast',
        '<div class="tts-toast__wave"><i></i><i></i><i></i><i></i></div>' +
        '<div class="tts-toast__word"></div>' +
        '<div class="tts-toast__hint">دوس تاني للإعادة ببطء</div>');
      document.body.appendChild(box);
      return box;
    }
    return {
      show(word) {
        ensure();
        $('.tts-toast__word', box).textContent = word;
        box.classList.add('is-on');
        clearTimeout(timer);
        timer = setTimeout(() => box.classList.remove('is-on'), 4000);
      },
      hide() { if (box) { clearTimeout(timer); timer = setTimeout(() => box.classList.remove('is-on'), 350); } }
    };
  })();

  /* ══════════════════════════════════════════════════
     2. GLOSSARY POPUP — بطاقة معنى المصطلح
     ══════════════════════════════════════════════════ */
  const Gloss = (function () {
    let box = null, currentKey = null;

    function ensure() {
      if (box) return box;
      box = el('div', 'gloss',
        '<div class="gloss__head">' +
          '<button class="gloss__say" title="اسمع النطق">🔊</button>' +
          '<div class="gloss__en"></div>' +
          '<button class="gloss__close" title="إغلاق">✕</button>' +
        '</div>' +
        '<div class="gloss__body"></div>');
      document.body.appendChild(box);
      $('.gloss__close', box).addEventListener('click', hide);
      $('.gloss__say', box).addEventListener('click', () => {
        const entry = lookup(currentKey);
        Speech.say((entry && entry.say) || currentKey, null, 0.5);
      });
      return box;
    }

    function norm(s) {
      return String(s).toLowerCase()
        .replace(/[؀-ۿ]+/g, '')
        .replace(/[()[\]{}.,;:!?"'`]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function lookup(term) {
      const G = window.GLOSSARY || {};
      const k = norm(term);
      if (G[k]) return G[k];
      // جرّب بدون كلمات وصفية شائعة
      const stripped = k.replace(/\b(the|a|an|pattern|architecture|database|service)\b/g, '').replace(/\s+/g, ' ').trim();
      if (G[stripped]) return G[stripped];
      // جرّب أول كلمة (للاختصارات داخل جملة)
      const first = k.split(' ')[0];
      if (first.length > 2 && G[first]) return G[first];
      return null;
    }

    function show(term, anchor) {
      ensure();
      currentKey = term;
      const e = lookup(term);

      $('.gloss__en', box).textContent = term;
      const body = $('.gloss__body', box);

      if (e) {
        body.innerHTML =
          '<p class="gloss__ar">' + e.ar + '</p>' +
          (e.full && e.full.toLowerCase() !== norm(term) ? '<p class="gloss__full">' + e.full + '</p>' : '') +
          '<p class="gloss__desc">' + e.desc + '</p>' +
          (e.eg ? '<div class="gloss__eg">' + e.eg + '</div>' : '');
      } else {
        body.innerHTML = '<p class="gloss__miss">المصطلح ده لسه مش في القاموس — بس تقدر تسمع نطقه من زرار 🔊 فوق.</p>';
      }

      // ضع البطاقة قرب العنصر المضغوط
      box.classList.add('is-on');
      const r = anchor.getBoundingClientRect();
      const bw = box.offsetWidth, bh = box.offsetHeight;
      let left = r.left + r.width / 2 - bw / 2;
      left = Math.max(12, Math.min(window.innerWidth - bw - 12, left));
      let top = r.bottom + 10;
      if (top + bh > window.innerHeight - 12) top = Math.max(12, r.top - bh - 10);
      box.style.left = left + 'px';
      box.style.top = top + 'px';
    }

    function hide() { if (box) box.classList.remove('is-on'); currentKey = null; }
    return { show, hide, isOpen: () => box && box.classList.contains('is-on') };
  })();

  /* ── الضغط على أي مصطلح: انطقه + اعرض معناه ── */
  let lastSpoken = { text: '', at: 0 };
  document.addEventListener('click', (e) => {
    const t = e.target.closest('.term, .termcard__en, .say, .decode__tok');
    if (!t) {
      if (!e.target.closest('.gloss')) Gloss.hide();
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const text = (t.dataset.say || t.textContent).trim();
    const now = Date.now();
    const repeat = text === lastSpoken.text && now - lastSpoken.at < 2500;
    lastSpoken = { text, at: now };

    const entry = (window.GLOSSARY || {})[text.toLowerCase().replace(/\s+/g, ' ').trim()];
    Speech.say((entry && entry.say) || text, t, repeat ? 0.45 : 0.68);

    if (!t.classList.contains('decode__tok')) Gloss.show(text, t);
  });

  window.addEventListener('resize', Gloss.hide);

  /* ══════════════════════════════════════════════════
     3. DECK NAVIGATION
     ══════════════════════════════════════════════════ */
  const deck = $('.deck');

  /* عدّادات متحركة (تشتغل على الصفحة الرئيسية كمان) */
  document.querySelectorAll('[data-count]').forEach((n) => {
    const target = parseFloat(n.dataset.count);
    const suffix = n.dataset.suffix || '';
    let cur = 0;
    const step = target / 42;
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { cur = target; clearInterval(t); }
      n.textContent = (target % 1 === 0 ? Math.round(cur) : cur.toFixed(1)) + suffix;
    }, 24);
  });

  if (!deck) return;   // الصفحة الرئيسية — مفيش سلايدات

  const slides = Array.from(deck.querySelectorAll('.slide'));
  const total = slides.length;
  const deckId = 'sd:' + (document.body.dataset.deck || location.pathname.split('/').pop());

  let index = 0, fragIndex = 0;

  /* ---------- الهيكل ---------- */
  const progress = el('div', 'progress');

  const topbar = el('div', 'topbar',
    '<div class="topbar__brand"><span class="topbar__dot"></span>' +
    '<b>' + (document.body.dataset.moduleTitle || 'System Design') + '</b></div>' +
    '<div class="topbar__slidetitle"></div>');

  const navbar = el('div', 'navbar',
    '<div class="navbar__pill">' +
      '<button class="btn" data-act="home" title="كل الموديولات"><span class="btn__ico">⌂</span></button>' +
      '<button class="btn" data-act="toc"  title="فهرس السلايدات (T)"><span class="btn__ico">☰</span><span class="btn__lbl">الفهرس</span></button>' +
      '<div class="navbar__sep"></div>' +
      '<button class="btn" data-act="prev" title="السابق"><span class="btn__ico">▶</span><span class="btn__lbl">السابق</span></button>' +
      '<div class="counter"><b class="js-cur">1</b><span>/</span><span class="js-tot">' + total + '</span></div>' +
      '<button class="btn btn--primary" data-act="next" title="التالي"><span class="btn__lbl">التالي</span><span class="btn__ico">◀</span></button>' +
      '<div class="navbar__sep"></div>' +
      '<button class="btn btn--on" data-act="tts" title="تشغيل/إيقاف النطق (S)"><span class="btn__ico">🔊</span></button>' +
      '<button class="btn" data-act="full" title="ملء الشاشة (F)"><span class="btn__ico">⛶</span></button>' +
      '<button class="btn" data-act="help" title="اختصارات (؟)"><span class="btn__ico">؟</span></button>' +
    '</div>');

  const toc = el('div', 'toc',
    '<div class="toc__head"><h3>فهرس السلايدات</h3>' +
    '<button class="btn btn--solo" data-act="toc-close">✕ إغلاق</button></div>' +
    '<div class="toc__list"></div>');

  const rowHtml = (k, v) => '<div class="help__row"><span>' + v + '</span><kbd>' + k + '</kbd></div>';
  const help = el('div', 'help',
    '<div class="help__box"><h3 style="margin-top:0">إزاي تستخدم العرض</h3>' +
    rowHtml('← أو Space', 'السلايد التالي') +
    rowHtml('→', 'السلايد السابق') +
    rowHtml('Home / End', 'أول / آخر سلايد') +
    rowHtml('T', 'فتح الفهرس') +
    rowHtml('S', 'تشغيل/إيقاف النطق') +
    rowHtml('F', 'ملء الشاشة') +
    rowHtml('Esc', 'إغلاق النوافذ') +
    '<div class="callout callout--tip" style="margin-top:16px"><div class="callout__icon">🔊</div>' +
    '<div class="callout__body">اضغط على أي <span class="term">Technical Term</span> بالإنجليزي في أي سلايد ' +
    'عشان تسمع نطقه الصحيح وتشوف معناه بالعربي. اضغط تاني بسرعة ينطقه <b>ببطء أكتر</b>.</div></div>' +
    '<button class="btn btn--primary btn--solo" data-act="help-close" style="width:100%;margin-top:16px">تمام، فهمت</button></div>');

  document.body.append(progress, topbar, navbar, toc, help);

  /* ---------- بناء الفهرس ---------- */
  const tocList = $('.toc__list', toc);
  slides.forEach((s, i) => {
    const b = el('button', 'toc__item',
      '<i>' + String(i + 1).padStart(2, '0') + '</i><span>' + (s.dataset.title || 'سلايد ' + (i + 1)) + '</span>');
    if (s.dataset.divider !== undefined) b.classList.add('is-divider');
    b.addEventListener('click', () => { go(i); closeAll(); });
    tocList.appendChild(b);
  });
  const tocItems = Array.from(tocList.children);

  /* ---------- التنقّل ---------- */
  const frags = i => Array.from(slides[i].querySelectorAll('.fragment'));

  function render() {
    slides.forEach((s, i) => s.classList.toggle('is-active', i === index));

    const f = frags(index);
    f.forEach((n, i) => n.classList.toggle('is-shown', i < fragIndex));

    progress.style.width = (total > 1 ? (index / (total - 1)) * 100 : 100) + '%';
    $('.js-cur', navbar).textContent = index + 1;
    $('.topbar__slidetitle', topbar).textContent = slides[index].dataset.title || '';

    $('[data-act="prev"]', navbar).disabled = index === 0 && fragIndex === 0;
    $('[data-act="next"]', navbar).disabled = index === total - 1 && fragIndex >= f.length;

    tocItems.forEach((t, i) => t.classList.toggle('is-current', i === index));
    if (tocItems[index]) tocItems[index].scrollIntoView({ block: 'nearest' });

    slides[index].scrollTop = 0;
    Gloss.hide();
    try { localStorage.setItem(deckId, index); } catch (e) { /* private mode */ }
    if (history.replaceState) history.replaceState(null, '', '#' + (index + 1));
  }

  function go(i, dir) {
    i = Math.max(0, Math.min(total - 1, i));
    if (i === index) return;
    deck.classList.toggle('is-reverse', dir === -1);
    index = i;
    fragIndex = (dir === -1) ? frags(i).length : 0;
    render();
  }

  function next() {
    const f = frags(index);
    if (fragIndex < f.length) { fragIndex++; render(); return; }
    if (index < total - 1) go(index + 1, 1);
  }
  function prev() {
    if (fragIndex > 0) { fragIndex--; render(); return; }
    if (index > 0) go(index - 1, -1);
  }
  function closeAll() { toc.classList.remove('is-open'); help.classList.remove('is-open'); Gloss.hide(); }

  const actions = {
    next, prev,
    home: () => { location.href = '../index.html'; },
    toc:  () => toc.classList.toggle('is-open'),
    help: () => help.classList.toggle('is-open'),
    'toc-close': closeAll,
    'help-close': closeAll,
    tts: () => {
      const on = Speech.toggle();
      $('[data-act="tts"]', navbar).classList.toggle('btn--on', on);
      $('[data-act="tts"] .btn__ico', navbar).textContent = on ? '🔊' : '🔇';
    },
    full: () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    }
  };

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (b && actions[b.dataset.act]) { e.preventDefault(); actions[b.dataset.act](); return; }
    if (e.target === toc || e.target === help) closeAll();
  });

  /* ---------- لوحة المفاتيح (RTL: ← = للأمام) ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    switch (e.key) {
      case 'ArrowLeft': case 'PageDown': case ' ': case 'Enter':
        e.preventDefault(); next(); break;
      case 'ArrowRight': case 'PageUp': case 'Backspace':
        e.preventDefault(); prev(); break;
      case 'ArrowDown': e.preventDefault(); next(); break;
      case 'ArrowUp':   e.preventDefault(); prev(); break;
      case 'Home': e.preventDefault(); go(0, -1); break;
      case 'End':  e.preventDefault(); go(total - 1, 1); break;
      case 'Escape': closeAll(); break;
      case 't': case 'T': case 'ف': actions.toc(); break;
      case 'f': case 'F': case 'ب': actions.full(); break;
      case 's': case 'S': case 'س': actions.tts(); break;
      case '?': case '/': case '؟': actions.help(); break;
    }
  });

  /* ---------- اللمس ---------- */
  let tx = 0, ty = 0;
  deck.addEventListener('touchstart', e => { tx = e.changedTouches[0].clientX; ty = e.changedTouches[0].clientY; }, { passive: true });
  deck.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx;
    const dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { dx > 0 ? prev() : next(); }
  }, { passive: true });

  /* ---------- نقطة البداية ---------- */
  const hash = parseInt(location.hash.replace('#', ''), 10);
  if (hash >= 1 && hash <= total) index = hash - 1;
  else {
    try {
      const saved = parseInt(localStorage.getItem(deckId), 10);
      if (saved > 0 && saved < total) index = saved;
    } catch (e) { /* noop */ }
  }
  render();
})();
