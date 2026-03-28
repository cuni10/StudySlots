const CIRCUMFERENCE = 2 * Math.PI * 88;
let totalSeconds = 0;
let isPaused = false;
let isComplete = false;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateProgress(remaining, total) {
  const progress = total > 0 ? remaining / total : 0;
  const offset = CIRCUMFERENCE * (1 - progress);

  document.querySelectorAll('.ring-progress, .ring-glow').forEach(el => {
    el.style.strokeDasharray = CIRCUMFERENCE;
    el.style.strokeDashoffset = offset;
  });
}

function updateTimeDisplay(remaining) {
  document.getElementById('time-display').textContent = formatTime(remaining);
}

// Timer events from main process
window.api.onTimerStart(({ total, remaining }) => {
  totalSeconds = total;
  updateTimeDisplay(remaining);
  updateProgress(remaining, total);
});

window.api.onTimerTick(({ remaining, total }) => {
  if (!isPaused) {
    updateTimeDisplay(remaining);
    updateProgress(remaining, total);
  }
});

window.api.onTimerPaused(() => {
  isPaused = true;
  document.getElementById('time-label').textContent = 'Pausado';
  document.getElementById('status-msg').textContent = '';
  const pauseBtn = document.getElementById('btn-pause');
  pauseBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="6,4 20,12 6,20"/>
  </svg>`;
});

window.api.onTimerResumed(() => {
  isPaused = false;
  document.getElementById('time-label').textContent = 'Enfoque';
  const pauseBtn = document.getElementById('btn-pause');
  pauseBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" rx="1"/>
    <rect x="14" y="4" width="4" height="16" rx="1"/>
  </svg>`;
});

window.api.onTimerComplete(() => {
  isComplete = true;
  document.getElementById('time-display').textContent = '00:00';
  document.getElementById('time-label').textContent = 'Completado';
  document.getElementById('status-msg').textContent = 'Preparando recompensa...';
  document.getElementById('controls').style.display = 'none';
  document.querySelector('.timer-container').classList.add('complete');
  updateProgress(0, 1);
});

window.api.onRewardDone(() => {
  isComplete = true;
  const wrapper = document.querySelector('.timer-wrapper');
  wrapper.classList.add('finalized');

  document.getElementById('time-display').textContent = 'FIN';
  document.getElementById('time-display').classList.add('final-text');
  document.getElementById('time-label').textContent = 'Sesión finalizada';
  document.getElementById('status-msg').textContent = 'Click para cerrar';

  const controls = document.getElementById('controls');
  controls.style.display = 'flex';
  controls.innerHTML = `
    <button class="ctrl-btn ctrl-done" id="btn-done" title="Cerrar">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </button>
  `;

  document.getElementById('btn-done').addEventListener('click', () => {
    window.api.cancelTimer();
  });

  updateProgress(1, 1);
  document.querySelector('.progress-ring').classList.add('finalized-ring');
});

// Controls
document.getElementById('btn-pause').addEventListener('click', () => {
  if (isPaused) {
    window.api.resumeTimer();
  } else {
    window.api.pauseTimer();
  }
});

document.getElementById('btn-cancel').addEventListener('click', () => {
  window.api.cancelTimer();
});
