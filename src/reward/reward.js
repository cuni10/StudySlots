const SYMBOLS = ['📚', '⭐', '🎯', '🔥', '💎', '🏆', '🧠', '⚡'];
const COINS = ['🪙', '💰', '💵', '🥇', '🪙'];
const REEL_ITEMS = 20;

let spinning = false;

function createReelStrip(stripId) {
  const strip = document.getElementById(stripId);
  const symbols = [];
  for (let i = 0; i < REEL_ITEMS; i++) {
    symbols.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
  }
  strip.innerHTML = symbols.map(s =>
    `<div class="reel-symbol">${s}</div>`
  ).join('');
}

function initReels() {
  createReelStrip('strip-1');
  createReelStrip('strip-2');
  createReelStrip('strip-3');
}

function playSlotSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    function playTick(freq, time) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'square';
      gain.gain.setValueAtTime(0.06, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      osc.start(time);
      osc.stop(time + 0.05);
    }

    for (let i = 0; i < 30; i++) {
      playTick(800 + Math.random() * 400, ctx.currentTime + i * 0.08);
    }

    // Win sound
    setTimeout(() => {
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.4);
      });
    }, 2500);

  } catch (e) {
    // Audio not available
  }
}

function spawnCoins() {
  const container = document.getElementById('coins');
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2 + 20;

  for (let i = 0; i < 50; i++) {
    const coin = document.createElement('div');
    coin.className = 'coin';
    coin.textContent = COINS[Math.floor(Math.random() * COINS.length)];

    const angle = (Math.random() * 360) * (Math.PI / 180);
    const spread = 80 + Math.random() * 200;
    const tx = Math.cos(angle) * spread;
    const tyInitial = -(50 + Math.random() * 120);
    const duration = 2 + Math.random() * 2;
    const delay = Math.random() * 1.5;
    const size = 20 + Math.random() * 20;

    coin.style.left = centerX + 'px';
    coin.style.top = centerY + 'px';
    coin.style.fontSize = size + 'px';
    coin.style.setProperty('--tx', tx + 'px');
    coin.style.setProperty('--ty-initial', tyInitial + 'px');
    coin.style.setProperty('--duration', duration + 's');
    coin.style.setProperty('--delay', delay + 's');

    container.appendChild(coin);

    requestAnimationFrame(() => {
      coin.classList.add('active');
    });
  }
}

function spinReels() {
  if (spinning) return;
  spinning = true;

  playSlotSound();

  const winSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  const strips = ['strip-1', 'strip-2', 'strip-3'];

  strips.forEach((stripId) => {
    const strip = document.getElementById(stripId);
    strip.classList.add('spinning');
    const symbols = strip.querySelectorAll('.reel-symbol');
    symbols[symbols.length - 1].textContent = winSymbol;
  });

  const stopTimes = [1500, 2000, 2500];

  strips.forEach((stripId, index) => {
    setTimeout(() => {
      const strip = document.getElementById(stripId);
      strip.classList.remove('spinning');

      const stripHeight = strip.parentElement.offsetHeight;
      const offset = -(strip.offsetHeight - stripHeight);
      strip.style.transform = `translateY(${offset}px)`;
      strip.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

      if (index === 2) {
        onAllReelsStopped();
      }
    }, stopTimes[index]);
  });
}

function onAllReelsStopped() {
  const frame = document.querySelector('.slot-frame');
  frame.classList.add('winner');

  const winMsg = document.getElementById('win-message');
  winMsg.textContent = '🏆 ¡JACKPOT! 🏆';
  winMsg.classList.add('show');

  spawnConfetti();
  spawnCoins();

  setTimeout(() => {
    window.api.closeReward();
  }, 5000);
}

function spawnConfetti() {
  const container = document.getElementById('confetti');
  const colors = ['#39FF14', '#FFD700', '#FF006E', '#00D4FF', '#FF6B35', '#A855F7'];

  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.top = '-10px';
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = (Math.random() * 10 + 4) + 'px';
    piece.style.height = (Math.random() * 10 + 4) + 'px';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.animationDelay = (Math.random() * 1.5) + 's';
    piece.style.animationDuration = (Math.random() * 1.5 + 2) + 's';

    container.appendChild(piece);

    requestAnimationFrame(() => {
      piece.classList.add('active');
    });
  }
}

// Initialize
initReels();
setTimeout(spinReels, 600);
