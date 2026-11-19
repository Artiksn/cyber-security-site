'use strict';

/* ================== Фон: сеть частиц ================== */
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const NODE_COLORS = ['0,230,140', '46,230,255', '139,123,255'];
let nodes = [];

function initNodes() {
  const count = Math.min(90, Math.floor((canvas.width * canvas.height) / 22000));
  nodes = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    r: Math.random() * 1.6 + 0.6,
    c: NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)],
  }));
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    n.x += n.vx;
    n.y += n.vy;
    if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
    if (n.y < 0 || n.y > canvas.height) n.vy *= -1;

    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${n.c}, .5)`;
    ctx.fill();

    for (let j = i + 1; j < nodes.length; j++) {
      const m = nodes[j];
      const dx = n.x - m.x;
      const dy = n.y - m.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 130) {
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(m.x, m.y);
        ctx.strokeStyle = `rgba(${n.c}, ${(1 - dist / 130) * 0.13})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }
  requestAnimationFrame(draw);
}

if (reducedMotion) {
  canvas.style.display = 'none';
} else {
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initNodes();
  };
  resize();
  window.addEventListener('resize', resize);
  draw();
}

/* ================== Печатающийся заголовок ================== */
const typedEl = document.getElementById('typed');
const WORDS = ['безопасность', 'гигиена', 'анонимность', 'независимость'];
let wordIndex = 0;
let charIndex = 0;
let deleting = false;

function typeLoop() {
  const word = WORDS[wordIndex];
  typedEl.textContent = word.slice(0, charIndex);
  if (!deleting) {
    charIndex++;
    if (charIndex > word.length) {
      deleting = true;
      return setTimeout(typeLoop, 2000);
    }
    return setTimeout(typeLoop, 85);
  }
  charIndex--;
  if (charIndex === 0) {
    deleting = false;
    wordIndex = (wordIndex + 1) % WORDS.length;
    return setTimeout(typeLoop, 400);
  }
  setTimeout(typeLoop, 40);
}

if (reducedMotion) typedEl.textContent = WORDS[0];
else typeLoop();

/* ================== Шапка и меню ================== */
const header = document.querySelector('.header');
window.addEventListener('scroll', () => {
  header.classList.toggle('header--scrolled', window.scrollY > 10);
}, { passive: true });

const burger = document.getElementById('burger');
const nav = document.getElementById('nav');

function closeMenu() {
  nav.classList.remove('open');
  burger.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('nav-open');
}

burger.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  burger.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('nav-open', open);
});

nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));

/* ================== Появление при прокрутке ================== */
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

/* ================== Чек-лист ================== */
const checklistEl = document.getElementById('checklist-list');
const boxes = Array.from(checklistEl.querySelectorAll('input[type="checkbox"]'));
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const STORAGE_KEY = 'cybershield-checklist-v1';

function loadChecks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveChecks() {
  const data = Object.fromEntries(boxes.map((b) => [b.dataset.key, b.checked]));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* приватный режим браузера */
  }
}

function updateProgress() {
  const done = boxes.filter((b) => b.checked).length;
  const pct = Math.round((done / boxes.length) * 100);
  progressBar.style.width = pct + '%';
  progressText.textContent = `${done} из ${boxes.length} · ${pct}%`;
}

const saved = loadChecks();
boxes.forEach((b) => {
  b.checked = Boolean(saved[b.dataset.key]);
  b.addEventListener('change', () => {
    saveChecks();
    updateProgress();
  });
});
updateProgress();

document.getElementById('resetChecklist').addEventListener('click', () => {
  boxes.forEach((b) => { b.checked = false; });
  saveChecks();
  updateProgress();
});

/* ================== Генератор паролей ================== */
const lengthInput = document.getElementById('length');
const lengthValue = document.getElementById('lengthValue');
const optUpper = document.getElementById('optUpper');
const optLower = document.getElementById('optLower');
const optDigits = document.getElementById('optDigits');
const optSymbols = document.getElementById('optSymbols');
const passwordField = document.getElementById('password');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const strengthFill = document.getElementById('strengthFill');
const strengthLabel = document.getElementById('strengthLabel');

const CHARSETS = {
  upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  lower: 'abcdefghijkmnpqrstuvwxyz',
  digits: '23456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>?',
};

function randInt(max) {
  const arr = new Uint32Array(1);
  window.crypto.getRandomValues(arr);
  return arr[0] % max;
}

function pickFrom(str) {
  return str[randInt(str.length)];
}

function generatePassword() {
  const sets = [];
  if (optUpper.checked) sets.push(CHARSETS.upper);
  if (optLower.checked) sets.push(CHARSETS.lower);
  if (optDigits.checked) sets.push(CHARSETS.digits);
  if (optSymbols.checked) sets.push(CHARSETS.symbols);

  const length = Math.max(8, parseInt(lengthInput.value, 10) || 16);
  passwordField.value = '';
  setStrength(0);

  if (!sets.length) return;

  const chars = sets.map(pickFrom);
  while (chars.length < length) chars.push(pickFrom(sets[randInt(sets.length)]));

  for (let i = chars.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  const password = chars.join('');
  passwordField.value = password;
  setStrength(calcStrength(password, sets.length));
}

function calcStrength(password, variety) {
  let score = variety; // 1..4
  if (password.length >= 16) score += 3;
  else if (password.length >= 12) score += 2;
  else if (password.length >= 8) score += 1;
  if (score >= 7) return 5;
  if (score >= 6) return 4;
  if (score >= 4) return 3;
  if (score >= 3) return 2;
  return 1;
}

const STRENGTH_LEVELS = {
  0: { label: '—', color: 'transparent', width: 0 },
  1: { label: 'Очень слабый', color: 'var(--red)', width: 25 },
  2: { label: 'Слабый', color: 'var(--orange)', width: 40 },
  3: { label: 'Средний', color: 'var(--yellow)', width: 60 },
  4: { label: 'Надёжный', color: 'var(--green)', width: 80 },
  5: { label: 'Очень надёжный', color: 'var(--green)', width: 100 },
};

function setStrength(level) {
  const s = STRENGTH_LEVELS[level];
  strengthLabel.textContent = s.label;
  strengthLabel.style.color = s.color;
  strengthFill.style.width = s.width + '%';
  strengthFill.style.background = s.color;
  strengthFill.style.boxShadow = level >= 4 ? `0 0 14px ${s.color}` : 'none';
}

lengthInput.addEventListener('input', () => {
  lengthValue.textContent = lengthInput.value;
  generatePassword();
});
generateBtn.addEventListener('click', generatePassword);

copyBtn.addEventListener('click', async () => {
  const value = passwordField.value;
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    passwordField.select();
    document.execCommand('copy');
    passwordField.setSelectionRange(0, 0);
  }
  copyBtn.textContent = 'Скопировано ✓';
  setTimeout(() => { copyBtn.textContent = 'Скопировать'; }, 1600);
});

generatePassword();

/* ================== FAQ (аккордеон) ================== */
document.querySelectorAll('.faq__item').forEach((item) => {
  item.querySelector('.faq__question').addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq__item.open').forEach((openItem) => {
      openItem.classList.remove('open');
      openItem.querySelector('.faq__answer').style.maxHeight = null;
    });
    if (!wasOpen) {
      item.classList.add('open');
      const answer = item.querySelector('.faq__answer');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});

/* ================== Год в подвале ================== */
document.getElementById('year').textContent = new Date().getFullYear();
