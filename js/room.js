const MOCK = {
    "roomId": "C.610",
    "bookings": [
        {
            "description": "* BUREAU SUR RESERVATION",
            "date": "2026-07-14",
            "startTime": "14:00",
            "endTime": "18:00"
        }
    ],
    "version": "0.1",
    "stale": false
};

const roomId = document.querySelector('.room-id').textContent.trim();
const bookingsEl = document.getElementById('bookings');
const gutterEl   = document.getElementById('hour-gutter');
const statusEl = document.getElementById('status');
const lastUpdatedEl = document.getElementById('last-updated');
const roomDateEl = document.getElementById('room-date');

roomDateEl.textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

function isNow(startTime, endTime) {
  const now = new Date();
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur >= start && cur < end;
}

const DAY_START = 7;   // 07:00
const DAY_END   = 22;  // 22:00
const TOTAL_MIN = (DAY_END - DAY_START) * 60;

function toMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function render(data) {
  if (!bookingsEl || !gutterEl) return;
  bookingsEl.innerHTML = '';
  gutterEl.innerHTML = '';

  // Hour lines + gutter labels
  for (let h = DAY_START; h <= DAY_END; h++) {
    const pct = ((h - DAY_START) * 60) / TOTAL_MIN * 100;

    const line = document.createElement('div');
    line.className = 'hour-line';
    line.style.top = pct + '%';
    bookingsEl.appendChild(line);

    const label = document.createElement('span');
    label.className = 'hour-label';
    label.style.top = pct + '%';
    label.textContent = String(h).padStart(2, '0') + ':00';
    gutterEl.appendChild(label);
  }

  // Current time indicator
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes() - DAY_START * 60;
  if (nowMin >= 0 && nowMin <= TOTAL_MIN) {
    const indicator = document.createElement('div');
    indicator.className = 'now-indicator';
    indicator.style.top = (nowMin / TOTAL_MIN * 100) + '%';
    bookingsEl.appendChild(indicator);
  }

  if (!data.bookings || data.bookings.length === 0) return;

  data.bookings.forEach(b => {
    const startMin = toMinutes(b.startTime) - DAY_START * 60;
    const endMin   = toMinutes(b.endTime)   - DAY_START * 60;
    const top      = Math.max(0, startMin) / TOTAL_MIN * 100;
    const height   = Math.max(0, endMin - startMin) / TOTAL_MIN * 100;
    const active   = isNow(b.startTime, b.endTime);

    const block = document.createElement('div');
    block.className = 'booking-block' + (active ? ' active' : '');
    block.style.top    = top + '%';
    block.style.height = height + '%';
    block.innerHTML = `
      <div class="booking-time">${b.startTime} – ${b.endTime}</div>
      <div class="booking-title">${b.description || '–'}</div>
    `;
    bookingsEl.appendChild(block);
  });
}

function setStatus(ok, message) {
  statusEl.textContent = message;
  statusEl.className = 'status ' + (ok ? 'ok' : 'error');
}

async function refresh() {
  try {
    /*const response = await fetch(`/api/v1/room-bookings/${roomId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);*/
    const data = MOCK;
    if (data.version && sessionStorage.getItem('appVersion') !== data.version) {
      sessionStorage.setItem('appVersion', data.version);
      location.reload();
      return;
    }
    render(data);
    if (data.stale) {
      setStatus(false, 'Stale data – Infosilem unavailable');
    } else {
      setStatus(true, 'Live');
      lastUpdatedEl.textContent = 'Updated ' + new Date().toLocaleTimeString();
    }
  } catch (e) {
    console.error('Refresh failed:', e);
    setStatus(false, 'Update failed: ' + e.message);
  }
}

// Initial load with random jitter (0–5 min), then poll every 30 min
const jitter = Math.random() * 5 * 60 * 1000;
setTimeout(() => {
  refresh();
  setInterval(refresh, 30 * 60 * 1000);
}, jitter);

// First immediate load with no jitter so the screen isn't blank on startup
refresh();
