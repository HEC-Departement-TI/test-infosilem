  const MOCK = {
    "roomId": "C.610",
    "bookings": [
        {
            "description": "* BUREAU SUR RESERVATION",
            "date": "2026-07-21",
            "startTime": "09:45",
            "endTime": "16:45"
        }
    ],
    "version": "0.1",
    "stale": false,
    "error": false
};
  
  const roomId = document.querySelector('.room-id').textContent.trim();
  const bookingsEl = document.getElementById('bookings');
  const gutterEl   = document.getElementById('hour-gutter');
  const statusEl = document.getElementById('status');
  const lastUpdatedEl = document.getElementById('last-updated');
  const roomDateEl = document.getElementById('room-date');
  const loadingEl = document.querySelector('.loading');

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

      const desc = b.description
        ? b.description.toLowerCase().replace(/^[\s*]+/, '').replace(/^./, c => c.toUpperCase())
        : '–';

      const block = document.createElement('div');
      block.className = 'booking-block' + (active ? ' active' : '');
      block.style.top    = top + '%';
      block.style.height = height + '%';
      block.innerHTML = `
        <div class="booking-time">${b.startTime} – ${b.endTime}</div>
        <div class="booking-title">${desc}</div>
      `;
      bookingsEl.appendChild(block);
    });
  }

  function setStatus(ok, message) {
    statusEl.textContent = message;
    statusEl.className = 'status ' + (ok ? 'ok' : 'error');
  }

  async function refresh(showLoading) {
    const rawDate = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    roomDateEl.textContent = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);
    if (showLoading) loadingEl.classList.add('visible');
    try {
      /*const response = await fetch(`${config.contextPath}api/v1/room-bookings/${roomId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);*/
      const data = MOCK;
      if (data.version && sessionStorage.getItem('appVersion') !== data.version) {
        sessionStorage.setItem('appVersion', data.version);
        location.reload();
        return;
      }
      render(data);
      if (data.stale) {
        setStatus(false, 'L\'API Infosilem ne répond pas');
      } else {
        setStatus(true, 'À jour');
        lastUpdatedEl.textContent = 'Dernière mise à jour ' + new Date().toLocaleTimeString();
      }
    } catch (e) {
      setStatus(false, 'La mise à jour a échoué: ' + e.message);
    } finally {
      if (showLoading) loadingEl.classList.remove('visible');
    }
  }

refresh(true);
setInterval(() => refresh(false), (config.refreshTimeout + config.refreshJitter) * 60 * 1000);
