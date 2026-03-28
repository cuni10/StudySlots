const STORAGE_KEY = 'studyslots_data';

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { sessions: [], stats: { totalSessions: 0, totalMinutes: 0, streak: 0 } };
  } catch { return { sessions: [], stats: { totalSessions: 0, totalMinutes: 0, streak: 0 } }; }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Window controls
document.getElementById('btn-minimize').addEventListener('click', () => window.api.minimize());
document.getElementById('btn-close').addEventListener('click', () => window.api.close());

// Stepper controls
function setupStepper(inputId, minusId, plusId, min, max) {
  const input = document.getElementById(inputId);
  document.getElementById(minusId).addEventListener('click', () => {
    const v = Math.max(min, parseInt(input.value || 0) - 1);
    input.value = v;
  });
  document.getElementById(plusId).addEventListener('click', () => {
    const v = Math.min(max, parseInt(input.value || 0) + 1);
    input.value = v;
  });
  input.addEventListener('change', () => {
    let v = parseInt(input.value) || min;
    input.value = Math.max(min, Math.min(max, v));
  });
}

setupStepper('study-duration', 'study-minus', 'study-plus', 1, 120);
setupStepper('break-duration', 'break-minus', 'break-plus', 1, 30);

// Start study
document.getElementById('btn-start').addEventListener('click', () => {
  const duration = parseInt(document.getElementById('study-duration').value) || 15;
  window.api.startStudy(duration);
});

// Save session
document.getElementById('btn-save').addEventListener('click', () => {
  const study = parseInt(document.getElementById('study-duration').value) || 15;
  const brk = parseInt(document.getElementById('break-duration').value) || 3;
  const data = loadData();
  data.sessions.push({
    id: Date.now(),
    name: `Sesion ${data.sessions.length + 1}`,
    study,
    break: brk
  });
  saveData(data);
  renderSessions();
});

// Render sessions
function renderSessions() {
  const data = loadData();
  const container = document.getElementById('sessions-list');

  if (data.sessions.length === 0) {
    container.innerHTML = '<div class="empty-state">No hay sesiones guardadas</div>';
    return;
  }

  container.innerHTML = data.sessions.map(s => `
    <div class="session-item" data-id="${s.id}">
      <div class="session-info">
        <span class="session-name">${s.name}</span>
        <span class="session-detail">${s.study} min estudio / ${s.break} min descanso</span>
      </div>
      <div class="session-actions">
        <button class="session-btn load" title="Cargar">&#9654;</button>
        <button class="session-btn del" title="Eliminar">&times;</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.session-btn.load').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.closest('.session-item').dataset.id);
      const session = data.sessions.find(s => s.id === id);
      if (session) {
        document.getElementById('study-duration').value = session.study;
        document.getElementById('break-duration').value = session.break;
      }
    });
  });

  container.querySelectorAll('.session-btn.del').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.closest('.session-item').dataset.id);
      data.sessions = data.sessions.filter(s => s.id !== id);
      saveData(data);
      renderSessions();
    });
  });
}

// Render stats
function renderStats() {
  const data = loadData();
  document.getElementById('total-sessions').textContent = data.stats.totalSessions;
  document.getElementById('total-minutes').textContent = data.stats.totalMinutes;
  document.getElementById('streak').textContent = data.stats.streak;
}

// Session complete callback
window.api.onSessionComplete(() => {
  const data = loadData();
  const study = parseInt(document.getElementById('study-duration').value) || 15;
  data.stats.totalSessions++;
  data.stats.totalMinutes += study;
  data.stats.streak++;
  saveData(data);
  renderStats();
});

// Init
renderSessions();
renderStats();
