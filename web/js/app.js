/**
 * XSMB VIP - Main Application Logic
 * Comprehensive Vietnam Lottery Analyzer & Live Dashboard
 */

// Confetti Particle System
class ConfettiEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.particles = [];
    this.animationId = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  fire(count = 90) {
    if (!this.canvas || !this.ctx) return;
    this.resize();
    const colors = ['#f59e0b', '#fbbf24', '#ef4444', '#10b981', '#3b82f6', '#ec4899'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.8) * 18,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        life: 1,
        decay: Math.random() * 0.015 + 0.008,
      });
    }

    if (!this.animationId) {
      this.render();
    }
  }

  render() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.45; // gravity
      p.vx *= 0.98;
      p.rotation += p.rotationSpeed;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.render());
    } else {
      this.animationId = null;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

// Global App State
const state = {
  records: [],
  currentIndex: 0,
  lotoMode: 'head', // 'head' | 'tail'
  activeTab: 'board', // 'board' | 'checker' | 'simulator' | 'stats' | 'history'
  historyPage: 1,
  historyPageSize: 10,
  simSpeed: 150, // ms per tick in simulator
  isSimulating: false,
};

// DOM Cache
const dom = {};

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  cacheDOM();
  initTheme();
  initClockAndCountdown();
  loadData();
  bindEvents();
});

function cacheDOM() {
  dom.clockTime = document.getElementById('clock-time');
  dom.clockDate = document.getElementById('clock-date');
  dom.countdownTimer = document.getElementById('countdown-timer');
  dom.themeToggleBtn = document.getElementById('theme-toggle-btn');
  dom.soundToggleBtn = document.getElementById('sound-toggle-btn');
  dom.confettiCanvas = document.getElementById('confetti-canvas');

  // Live Stream & Sync Controls
  dom.btnSyncHeader = document.getElementById('btn-sync-header');
  dom.syncIconSpin = document.getElementById('sync-icon-spin');
  dom.liveStatusBanner = document.getElementById('live-status-banner');
  dom.liveBadge = document.getElementById('live-badge');
  dom.liveBadgeText = document.getElementById('live-badge-text');
  dom.liveBannerMessage = document.getElementById('live-banner-message');
  dom.btnToggleLiveDemo = document.getElementById('btn-toggle-live-demo');

  // Date controls
  dom.datePicker = document.getElementById('date-picker');
  dom.btnPrevDay = document.getElementById('btn-prev-day');
  dom.btnNextDay = document.getElementById('btn-next-day');
  dom.boardDateLabel = document.getElementById('board-date-label');
  dom.quickSearchInput = document.getElementById('quick-search-input');
  dom.searchAlert = document.getElementById('search-alert');

  // Board
  dom.specialDigits = document.getElementById('special-digits');
  dom.specialLotoTag = document.getElementById('special-loto-tag');
  dom.prize1Container = document.getElementById('prize-1-container');
  dom.prize2Container = document.getElementById('prize-2-container');
  dom.prize3Container = document.getElementById('prize-3-container');
  dom.prize4Container = document.getElementById('prize-4-container');
  dom.prize5Container = document.getElementById('prize-5-container');
  dom.prize6Container = document.getElementById('prize-6-container');
  dom.prize7Container = document.getElementById('prize-7-container');

  // Loto board
  dom.lotoTableBody = document.getElementById('loto-table-body');
  dom.lotoColHeadTitle = document.getElementById('loto-col-head-title');
  dom.lotoColTailTitle = document.getElementById('loto-col-tail-title');
  dom.btnLotoModeHead = document.getElementById('btn-loto-mode-head');
  dom.btnLotoModeTail = document.getElementById('btn-loto-mode-tail');

  // Checker
  dom.checkerDate = document.getElementById('checker-date');
  dom.checkerInput = document.getElementById('checker-input');
  dom.btnCheckTicket = document.getElementById('btn-check-ticket');
  dom.checkResult = document.getElementById('check-result');

  // Simulator
  dom.btnStartSim = document.getElementById('btn-start-sim');
  dom.btnStopSim = document.getElementById('btn-stop-sim');
  dom.simCage = document.getElementById('sim-cage');
  dom.simStageText = document.getElementById('sim-stage-text');
  dom.simResultDisplay = document.getElementById('sim-result-display');

  // Stats
  dom.loGanTableBody = document.getElementById('lo-gan-table-body');
  dom.loTopTableBody = document.getElementById('lo-top-table-body');
  dom.matrixGrid = document.getElementById('matrix-grid-100');
  dom.pairsContainer = document.getElementById('pairs-container');

  // History
  dom.historyTableBody = document.getElementById('history-table-body');
  dom.historyPrevPage = document.getElementById('history-prev-page');
  dom.historyNextPage = document.getElementById('history-next-page');
  dom.historyPageInfo = document.getElementById('history-page-info');

  // Engine
  if (dom.confettiCanvas) {
    window.confetti = new ConfettiEngine(dom.confettiCanvas);
  }
}

/* ===================================================================
   Data Loading & Handling
   =================================================================== */

function loadData() {
  if (window.LOTTERY_HISTORY && window.LOTTERY_HISTORY.length > 0) {
    state.records = window.LOTTERY_HISTORY;
    onDataLoaded();
  } else {
    // Fallback: try fetching data/xsmb.csv
    fetch('data/xsmb.csv')
      .then(res => res.text())
      .then(csvText => {
        parseCSVData(csvText);
        onDataLoaded();
      })
      .catch(err => {
        console.error('Failed to load CSV:', err);
        showDemoFallbackData();
      });
  }
}

function parseCSVData(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length <= 1) return;
  const records = [];
  const pad = (val, len) => String(val).trim().padStart(len, '0');

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(s => s.trim());
    if (parts.length < 28) continue;

    const d = parts[0];
    const sp = pad(parts[1], 5);
    const p1 = pad(parts[2], 5);
    const p2 = [pad(parts[3], 5), pad(parts[4], 5)];
    const p3 = [pad(parts[5], 5), pad(parts[6], 5), pad(parts[7], 5), pad(parts[8], 5), pad(parts[9], 5), pad(parts[10], 5)];
    const p4 = [pad(parts[11], 4), pad(parts[12], 4), pad(parts[13], 4), pad(parts[14], 4)];
    const p5 = [pad(parts[15], 4), pad(parts[16], 4), pad(parts[17], 4), pad(parts[18], 4), pad(parts[19], 4), pad(parts[20], 4)];
    const p6 = [pad(parts[21], 3), pad(parts[22], 3), pad(parts[23], 3)];
    const p7 = [pad(parts[24], 2), pad(parts[25], 2), pad(parts[26], 2), pad(parts[27], 2)];

    const allNums = [sp, p1, ...p2, ...p3, ...p4, ...p5, ...p6, ...p7];
    const loto = allNums.map(n => n.slice(-2));

    records.push({
      date: d,
      special: sp,
      p1, p2, p3, p4, p5, p6, p7,
      loto
    });
  }

  records.sort((a, b) => b.date.localeCompare(a.date));
  state.records = records;
}

function showDemoFallbackData() {
  state.records = [
    {
      date: '2026-10-04',
      special: '82951',
      p1: '28235',
      p2: ['82614', '47824'],
      p3: ['33386', '23385', '09503', '43582', '60243', '04348'],
      p4: ['2251', '1053', '3431', '9308'],
      p5: ['3969', '7927', '5509', '2889', '4781', '1038'],
      p6: ['237', '580', '604'],
      p7: ['90', '89', '26', '59'],
      loto: ['51', '35', '14', '24', '86', '85', '03', '82', '43', '48', '51', '53', '31', '08', '69', '27', '09', '89', '81', '38', '37', '80', '04', '90', '89', '26', '59']
    }
  ];
  onDataLoaded();
}

function onDataLoaded() {
  if (state.records.length === 0) return;

  // Set default current record to latest
  state.currentIndex = 0;
  const latestRec = state.records[0];

  if (dom.datePicker) {
    dom.datePicker.max = latestRec.date;
    dom.datePicker.min = state.records[state.records.length - 1].date;
    dom.datePicker.value = latestRec.date;
  }

  if (dom.checkerDate) {
    dom.checkerDate.value = latestRec.date;
  }

  renderCurrentRecord();
  renderStatistics();
  renderHistoryTable();
  updateLiveBannerStatus();

  // Trigger immediate background sync check on startup
  setTimeout(() => {
    syncDataWithServer(false);
  }, 500);

  // Periodically check live status and sync every 20 seconds
  if (!window._syncInterval) {
    window._syncInterval = setInterval(() => {
      updateLiveBannerStatus();
      syncDataWithServer(false);
    }, 20000);
  }
}

/* ===================================================================
   Renderer: Main Lottery Board & Loto 2-Digits
   =================================================================== */

function renderCurrentRecord() {
  if (!state.records || state.records.length === 0) return;
  const rec = state.records[state.currentIndex];
  if (!rec) return;

  // Date label & controls
  const dObj = new Date(rec.date);
  const dayOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][dObj.getDay()];
  const formattedDate = formatDateVN(rec.date);

  if (dom.boardDateLabel) {
    dom.boardDateLabel.innerHTML = `Kỳ quay: <strong>${formattedDate}</strong> (${dayOfWeek})`;
  }
  if (dom.datePicker) {
    dom.datePicker.value = rec.date;
  }

  // Update Prev / Next buttons
  if (dom.btnNextDay) dom.btnNextDay.disabled = state.currentIndex <= 0;
  if (dom.btnPrevDay) dom.btnPrevDay.disabled = state.currentIndex >= state.records.length - 1;

  // Render Special Prize
  if (dom.specialDigits) {
    const sp = rec.special;
    let html = '';
    for (let i = 0; i < sp.length; i++) {
      const isLastTwo = i >= sp.length - 2;
      html += `<div class="special-digit-ball ${isLastTwo ? 'last-two' : ''}">${sp[i]}</div>`;
    }
    dom.specialDigits.innerHTML = html;
  }

  const special2D = rec.special.slice(-2);
  if (dom.specialLotoTag) {
    dom.specialLotoTag.innerHTML = `2 số cuối: <strong>${special2D}</strong> (Đầu ${special2D[0]} - Đuôi ${special2D[1]})`;
  }

  // Render Other Prizes
  renderPrizeRow(dom.prize1Container, [rec.p1], 'prize-1-num');
  renderPrizeRow(dom.prize2Container, rec.p2, 'prize-2-num');
  renderPrizeRow(dom.prize3Container, rec.p3, 'prize-3-num');
  renderPrizeRow(dom.prize4Container, rec.p4, 'prize-4-num');
  renderPrizeRow(dom.prize5Container, rec.p5, 'prize-5-num');
  renderPrizeRow(dom.prize6Container, rec.p6, 'prize-6-num');
  renderPrizeRow(dom.prize7Container, rec.p7, 'prize-7-num');

  // Render Loto 2-Digits Board
  renderLotoBoard(rec);

  // Check pairs & double loto for today
  renderDailyPairs(rec);
}

function renderPrizeRow(container, numbers, cssClass) {
  if (!container) return;
  container.innerHTML = numbers
    .map(n => `<span class="lottery-num ${cssClass}" data-num="${n}" data-loto="${n.slice(-2)}" onclick="highlightLotoNumber('${n.slice(-2)}')">${n}</span>`)
    .join('');
}

function renderLotoBoard(rec) {
  if (!dom.lotoTableBody) return;
  const lotoList = rec.loto || [];
  const special2D = rec.special.slice(-2);

  // Group by Head (0-9) or Tail (0-9)
  const isHead = state.lotoMode === 'head';
  if (dom.lotoColHeadTitle) dom.lotoColHeadTitle.textContent = isHead ? 'Đầu' : 'Đuôi';
  if (dom.lotoColTailTitle) dom.lotoColTailTitle.textContent = isHead ? 'Đuôi (Số về)' : 'Đầu (Số về)';

  // Count occurrences
  const freqMap = {};
  lotoList.forEach(num => {
    freqMap[num] = (freqMap[num] || 0) + 1;
  });

  let rowsHtml = '';
  for (let digit = 0; digit <= 9; digit++) {
    const digitStr = String(digit);
    const matching = [];

    lotoList.forEach(num => {
      const targetDigit = isHead ? num[0] : num[1];
      const otherDigit = isHead ? num[1] : num[0];
      if (targetDigit === digitStr) {
        matching.push({ full: num, other: otherDigit });
      }
    });

    // Deduplicate or show pills
    const isCam = matching.length === 0;

    let pillsHtml = '';
    if (isCam) {
      pillsHtml = `<span class="cam-badge">🚫 ${isHead ? 'Đầu câm' : 'Đuôi câm'}</span>`;
    } else {
      // Sort matching numbers
      matching.sort((a, b) => a.other.localeCompare(b.other));
      pillsHtml = matching.map(item => {
        const isSp = item.full === special2D;
        const count = freqMap[item.full];
        const isMulti = count > 1;
        return `<span class="loto-pill ${isSp ? 'is-special' : ''} ${isMulti ? 'multi-hit' : ''}" 
                  data-num="${item.full}" 
                  data-count="${count}"
                  onclick="highlightLotoNumber('${item.full}')">
                  ${item.other}
                </span>`;
      }).join('');
    }

    rowsHtml += `
      <tr class="loto-row">
        <td class="loto-head-col ${isCam ? 'cam' : ''}">${digit}</td>
        <td class="loto-tail-col">
          <div class="loto-tags-flex">${pillsHtml}</div>
        </td>
      </tr>
    `;
  }

  dom.lotoTableBody.innerHTML = rowsHtml;
}

function renderDailyPairs(rec) {
  if (!dom.pairsContainer) return;
  const lotoList = rec.loto || [];
  const set = new Set(lotoList);

  // Kép bằng (00, 11, 22...)
  const kepBang = [];
  for (let i = 0; i <= 9; i++) {
    const s = `${i}${i}`;
    if (set.has(s)) kepBang.push(s);
  }

  // Cặp lộn (ví dụ 14 - 41)
  const capLon = [];
  const checked = new Set();
  set.forEach(num => {
    const rev = num[1] + num[0];
    if (num !== rev && set.has(rev) && !checked.has(num) && !checked.has(rev)) {
      capLon.push(`${num} - ${rev}`);
      checked.add(num);
      checked.add(rev);
    }
  });

  dom.pairsContainer.innerHTML = `
    <div style="display:flex; flex-wrap:wrap; gap:1.25rem; font-size:0.85rem;">
      <div>
        <strong style="color:var(--gold-400);">⭐ Lô Kép bằng:</strong> 
        ${kepBang.length > 0 ? kepBang.map(n => `<span class="loto-pill" style="margin:0 2px" onclick="highlightLotoNumber('${n}')">${n}</span>`).join(' ') : '<em style="color:var(--text-muted)">Không có</em>'}
      </div>
      <div>
        <strong style="color:var(--cyan-400);">🔄 Cặp Lộn về cả đôi:</strong> 
        ${capLon.length > 0 ? capLon.map(p => `<span class="loto-pill" style="margin:0 2px">${p}</span>`).join(' ') : '<em style="color:var(--text-muted)">Không có</em>'}
      </div>
    </div>
  `;
}

/* ===================================================================
   Interactive Highlight & Search
   =================================================================== */

function highlightLotoNumber(num) {
  if (!num) return;
  const clean = num.trim().padStart(2, '0').slice(-2);

  // Play sound
  window.soundEngine.playTick();

  // Highlight all matching elements
  const allLotteryNums = document.querySelectorAll('.lottery-num');
  let matchCount = 0;
  const matchPrizes = [];

  allLotteryNums.forEach(el => {
    const loto = el.getAttribute('data-loto');
    if (loto === clean) {
      el.classList.add('highlighted');
      matchCount++;
      const parentRow = el.closest('.board-row');
      if (parentRow) {
        const prizeName = parentRow.querySelector('.prize-name-col')?.textContent.trim();
        if (prizeName && !matchPrizes.includes(prizeName)) {
          matchPrizes.push(prizeName);
        }
      }
    } else {
      el.classList.remove('highlighted');
    }
  });

  // Highlight loto pills
  document.querySelectorAll('.loto-pill').forEach(el => {
    if (el.getAttribute('data-num') === clean) {
      el.style.borderColor = 'var(--gold-400)';
      el.style.transform = 'scale(1.15)';
    } else {
      el.style.borderColor = '';
      el.style.transform = '';
    }
  });

  // Show Alert
  if (dom.searchAlert) {
    if (matchCount > 0) {
      dom.searchAlert.style.display = 'flex';
      dom.searchAlert.style.background = 'rgba(16, 185, 129, 0.15)';
      dom.searchAlert.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      dom.searchAlert.style.color = 'var(--emerald-400)';
      dom.searchAlert.innerHTML = `
        <div>🎯 Số <strong>${clean}</strong> về <strong>${matchCount} nháy</strong> tại: ${matchPrizes.join(', ')}</div>
        <button onclick="clearHighlight()" style="background:none;border:none;color:inherit;cursor:pointer;font-weight:700">✕ Đóng</button>
      `;
    } else {
      dom.searchAlert.style.display = 'flex';
      dom.searchAlert.style.background = 'rgba(239, 68, 68, 0.12)';
      dom.searchAlert.style.borderColor = 'rgba(239, 68, 68, 0.3)';
      dom.searchAlert.style.color = 'var(--ruby-400)';
      dom.searchAlert.innerHTML = `
        <div>❌ Số <strong>${clean}</strong> không xuất hiện trong kỳ quay này.</div>
        <button onclick="clearHighlight()" style="background:none;border:none;color:inherit;cursor:pointer;font-weight:700">✕ Đóng</button>
      `;
    }
  }
}

function clearHighlight() {
  document.querySelectorAll('.lottery-num').forEach(el => el.classList.remove('highlighted'));
  document.querySelectorAll('.loto-pill').forEach(el => {
    el.style.borderColor = '';
    el.style.transform = '';
  });
  if (dom.searchAlert) dom.searchAlert.style.display = 'none';
  if (dom.quickSearchInput) dom.quickSearchInput.value = '';
}

/* ===================================================================
   Ticket Checker (Dò Vé Số Thông Minh)
   =================================================================== */

function checkTicket() {
  const ticket = dom.checkerInput ? dom.checkerInput.value.trim() : '';
  const chosenDate = dom.checkerDate ? dom.checkerDate.value : '';

  if (!ticket || ticket.length < 2) {
    alert('Vui lòng nhập tối thiểu 2 chữ số vé (hoặc đủ 5 chữ số để so giải Đặc Biệt)!');
    return;
  }

  // Find record for that date
  const rec = state.records.find(r => r.date === chosenDate) || state.records[state.currentIndex];
  if (!rec) {
    alert('Không tìm thấy dữ liệu kết quả cho ngày đã chọn!');
    return;
  }

  const paddedTicket = ticket.padStart(5, '0');
  const last2 = paddedTicket.slice(-2);
  const last3 = paddedTicket.slice(-3);
  const last4 = paddedTicket.slice(-4);

  const wins = [];

  // 1. Check GĐB (5 digits)
  if (ticket.length === 5 && paddedTicket === rec.special) {
    wins.push({ name: 'GIẢI ĐẶC BIỆT 🏆', prize: '1.000.000.000 đ' });
  }

  // 2. Check G1 (5 digits)
  if (ticket.length === 5 && paddedTicket === rec.p1) {
    wins.push({ name: 'GIẢI NHẤT 🥇', prize: '10.000.000 đ' });
  }

  // 3. Check G2 (5 digits)
  if (ticket.length === 5 && rec.p2.includes(paddedTicket)) {
    wins.push({ name: 'GIẢI NHÌ 🥈', prize: '5.000.000 đ' });
  }

  // 4. Check G3 (5 digits)
  if (ticket.length === 5 && rec.p3.includes(paddedTicket)) {
    wins.push({ name: 'GIẢI BA 🥉', prize: '1.000.000 đ' });
  }

  // 5. Check G4 (4 digits)
  if (rec.p4.includes(last4)) {
    wins.push({ name: 'GIẢI TƯ 🎖️', prize: '400.000 đ' });
  }

  // 6. Check G5 (4 digits)
  if (rec.p5.includes(last4)) {
    wins.push({ name: 'GIẢI NĂM 🎖️', prize: '200.000 đ' });
  }

  // 7. Check G6 (3 digits)
  if (rec.p6.includes(last3)) {
    wins.push({ name: 'GIẢI SÁU 🎯', prize: '100.000 đ' });
  }

  // 8. Check G7 (2 digits)
  if (rec.p7.includes(last2)) {
    wins.push({ name: 'GIẢI BẢY 🍀', prize: '40.000 đ' });
  }

  // 9. Check Lô tô 2 số
  const lotoHits = (rec.loto || []).filter(n => n === last2).length;
  if (lotoHits > 0) {
    wins.push({ name: `LÔ TÔ 2 SỐ (${last2})`, prize: `${lotoHits} nháy` });
  }

  // Display Result
  if (dom.checkResult) {
    dom.checkResult.style.display = 'block';
    if (wins.length > 0) {
      window.soundEngine.playJackpot();
      if (window.confetti) window.confetti.fire(120);

      dom.checkResult.className = 'check-result-container win';
      dom.checkResult.innerHTML = `
        <div style="font-size:1.15rem; font-weight:800; color:var(--emerald-400); margin-bottom:0.75rem;">
          🎉 CHÚC MỪNG BẠN ĐÃ TRÚNG THƯỞNG KỲ QUAY ${formatDateVN(rec.date)}!
        </div>
        <div style="display:flex; flex-direction:column; gap:0.5rem;">
          ${wins.map(w => `
            <div style="display:flex; justify-content:space-between; padding:0.5rem 0.85rem; background:rgba(0,0,0,0.2); border-radius:var(--radius-sm)">
              <span style="font-weight:700;">${w.name}</span>
              <span style="color:var(--gold-400); font-weight:800; font-family:var(--font-mono);">${w.prize}</span>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      window.soundEngine.playTick();
      dom.checkResult.className = 'check-result-container lose';
      dom.checkResult.innerHTML = `
        <div style="font-weight:700; color:var(--ruby-400); font-size:1.05rem;">
          😢 RẤT TIẾC, VÉ CỦA BẠN CHƯA TRÚNG THƯỞNG KỲ QUAY ${formatDateVN(rec.date)}!
        </div>
        <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.35rem;">
          Vé số: <strong>${ticket}</strong> | 2 số cuối: <strong>${last2}</strong> không trùng với các giải thưởng. Chúc bạn may mắn lần sau!
        </p>
      `;
    }
  }
}

/* ===================================================================
   Live Draw Simulator (Quay Thử XSMB)
   =================================================================== */

let simInterval = null;
let simStep = 0;

function startSimulator() {
  if (state.isSimulating) return;
  state.isSimulating = true;
  window.soundEngine.init();

  if (dom.btnStartSim) dom.btnStartSim.style.display = 'none';
  if (dom.btnStopSim) dom.btnStopSim.style.display = 'inline-flex';

  const orderOfDraws = [
    { name: 'Giải Bảy (G7)', count: 4, digits: 2, key: 'p7' },
    { name: 'Giải Sáu (G6)', count: 3, digits: 3, key: 'p6' },
    { name: 'Giải Năm (G5)', count: 6, digits: 4, key: 'p5' },
    { name: 'Giải Tư (G4)', count: 4, digits: 4, key: 'p4' },
    { name: 'Giải Ba (G3)', count: 6, digits: 5, key: 'p3' },
    { name: 'Giải Nhì (G2)', count: 2, digits: 5, key: 'p2' },
    { name: 'Giải Nhất (G1)', count: 1, digits: 5, key: 'p1' },
    { name: 'GIẢI ĐẶC BIỆT 👑', count: 1, digits: 5, key: 'special' },
  ];

  let currentPrizeIndex = 0;
  let currentSubIndex = 0;

  function runNextBall() {
    if (!state.isSimulating) return;
    if (currentPrizeIndex >= orderOfDraws.length) {
      finishSimulator();
      return;
    }

    const currentPrize = orderOfDraws[currentPrizeIndex];
    if (dom.simStageText) {
      dom.simStageText.textContent = `Đang quay: ${currentPrize.name} (Lần ${currentSubIndex + 1}/${currentPrize.count})`;
    }

    // Rolling animation for 1.2 seconds
    let rollTicks = 0;
    const maxTicks = 8;
    const rollTimer = setInterval(() => {
      rollTicks++;
      window.soundEngine.playTick();
      if (dom.simCage) {
        const dummyNum = String(Math.floor(Math.random() * Math.pow(10, currentPrize.digits))).padStart(currentPrize.digits, '0');
        dom.simCage.innerHTML = dummyNum.split('').map(d => `<div class="sim-ball rolling">${d}</div>`).join('');
      }

      if (rollTicks >= maxTicks) {
        clearInterval(rollTimer);
        // Reveal final number
        const finalNum = String(Math.floor(Math.random() * Math.pow(10, currentPrize.digits))).padStart(currentPrize.digits, '0');
        window.soundEngine.playReveal();

        if (dom.simCage) {
          dom.simCage.innerHTML = finalNum.split('').map(d => `<div class="sim-ball">${d}</div>`).join('');
        }

        // Add to history log
        if (dom.simResultDisplay) {
          const item = document.createElement('div');
          item.style.padding = '0.3rem 0.6rem';
          item.style.background = 'var(--bg-tertiary)';
          item.style.borderRadius = 'var(--radius-sm)';
          item.style.fontSize = '0.85rem';
          item.innerHTML = `<strong>${currentPrize.name}:</strong> <span style="font-family:var(--font-mono);color:var(--gold-400);font-weight:700">${finalNum}</span>`;
          dom.simResultDisplay.prepend(item);
        }

        currentSubIndex++;
        if (currentSubIndex >= currentPrize.count) {
          currentSubIndex = 0;
          currentPrizeIndex++;
        }

        setTimeout(runNextBall, 400);
      }
    }, 90);
  }

  if (dom.simResultDisplay) dom.simResultDisplay.innerHTML = '';
  runNextBall();
}

function stopSimulator() {
  state.isSimulating = false;
  if (dom.btnStartSim) dom.btnStartSim.style.display = 'inline-flex';
  if (dom.btnStopSim) dom.btnStopSim.style.display = 'none';
  if (dom.simStageText) dom.simStageText.textContent = 'Đã dừng quay thử';
}

function finishSimulator() {
  stopSimulator();
  window.soundEngine.playJackpot();
  if (window.confetti) window.confetti.fire(150);
  if (dom.simStageText) dom.simStageText.textContent = '🎉 HOÀN TẤT KỲ QUAY THỬ!';
}

/* ===================================================================
   Statistics & Deep Analytics (Lô Gan & Ma Trận 100 Số)
   =================================================================== */

function renderStatistics() {
  if (!state.records || state.records.length === 0) return;
  const currentRec = state.records[state.currentIndex];
  if (!currentRec) return;

  // 1. Calculate Lô Gan (Delta days from chosen record backwards)
  const pastRecords = state.records.slice(state.currentIndex);
  const deltaMap = {};

  for (let num = 0; num < 100; num++) {
    const s = String(num).padStart(2, '0');
    deltaMap[s] = pastRecords.length; // default if not appeared
  }

  for (let i = 0; i < pastRecords.length; i++) {
    const rec = pastRecords[i];
    (rec.loto || []).forEach(n => {
      if (deltaMap[n] === pastRecords.length) {
        deltaMap[n] = i; // days elapsed
      }
    });
  }

  // Sort Top 10 Lô Gan (highest delta)
  const loGanList = Object.keys(deltaMap)
    .map(num => ({ num, delta: deltaMap[num] }))
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 10);

  if (dom.loGanTableBody) {
    const maxDelta = Math.max(...loGanList.map(item => item.delta), 1);
    dom.loGanTableBody.innerHTML = loGanList.map((item, idx) => `
      <tr>
        <td style="font-weight:700; color:var(--text-muted)">#${idx + 1}</td>
        <td><strong class="lottery-num" style="padding:0.2rem 0.5rem;font-size:1rem;color:var(--ruby-400)">${item.num}</strong></td>
        <td><span style="font-weight:800; font-family:var(--font-mono); color:var(--ruby-500)">${item.delta}</span> ngày</td>
        <td style="width:40%">
          <div class="progress-bar-container">
            <div class="progress-bar-fill fill-ruby" style="width: ${(item.delta / maxDelta) * 100}%"></div>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // 2. Calculate Top Lô Về Nhiều (Tần Suất 30 ngày)
  const window30 = state.records.slice(state.currentIndex, state.currentIndex + 30);
  const freqMap30 = {};
  for (let num = 0; num < 100; num++) {
    freqMap30[String(num).padStart(2, '0')] = 0;
  }

  window30.forEach(rec => {
    (rec.loto || []).forEach(n => {
      freqMap30[n] = (freqMap30[n] || 0) + 1;
    });
  });

  const loTopList = Object.keys(freqMap30)
    .map(num => ({ num, count: freqMap30[num] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  if (dom.loTopTableBody) {
    const maxCount = Math.max(...loTopList.map(item => item.count), 1);
    dom.loTopTableBody.innerHTML = loTopList.map((item, idx) => `
      <tr>
        <td style="font-weight:700; color:var(--text-muted)">#${idx + 1}</td>
        <td><strong class="lottery-num" style="padding:0.2rem 0.5rem;font-size:1rem;color:var(--gold-400)">${item.num}</strong></td>
        <td><span style="font-weight:800; font-family:var(--font-mono); color:var(--gold-400)">${item.count}</span> lần</td>
        <td style="width:40%">
          <div class="progress-bar-container">
            <div class="progress-bar-fill fill-gold" style="width: ${(item.count / maxCount) * 100}%"></div>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // 3. Render 10x10 Matrix Heatmap Grid (00 - 99)
  if (dom.matrixGrid) {
    const todayHits = new Set(currentRec.loto || []);
    const special2D = currentRec.special.slice(-2);
    let matrixHtml = '';

    for (let i = 0; i < 100; i++) {
      const s = String(i).padStart(2, '0');
      const count = freqMap30[s] || 0;
      const isToday = todayHits.has(s);
      const isSpecial = s === special2D;

      matrixHtml += `
        <div class="matrix-cell ${isSpecial ? 'special-today' : isToday ? 'hit-today' : ''}" 
             title="Số ${s}: Về ${count} lần trong 30 kỳ gần nhất"
             onclick="highlightLotoNumber('${s}')">
          <span class="cell-num">${s}</span>
          <span class="cell-hits">${count} lần</span>
        </div>
      `;
    }
    dom.matrixGrid.innerHTML = matrixHtml;
  }
}

/* ===================================================================
   History Table & Pagination
   =================================================================== */

function renderHistoryTable() {
  if (!dom.historyTableBody) return;
  const total = state.records.length;
  const startIdx = (state.historyPage - 1) * state.historyPageSize;
  const pageRecords = state.records.slice(startIdx, startIdx + state.historyPageSize);

  dom.historyTableBody.innerHTML = pageRecords.map(rec => `
    <tr>
      <td><strong>${formatDateVN(rec.date)}</strong></td>
      <td><span class="lottery-num" style="color:var(--ruby-400);font-weight:800">${rec.special}</span></td>
      <td><span class="lottery-num" style="color:var(--gold-400)">${rec.p1}</span></td>
      <td><span class="lottery-num" style="background:var(--ruby-gradient);color:#fff;font-weight:900">${rec.special.slice(-2)}</span></td>
      <td>
        <div style="display:flex; flex-wrap:wrap; gap:3px; max-width:450px;">
          ${(rec.loto || []).slice(0, 14).map(n => `<span style="font-size:0.75rem;padding:1px 4px;background:var(--bg-tertiary);border-radius:3px">${n}</span>`).join('')}
          <span style="font-size:0.75rem;color:var(--text-muted)">+${(rec.loto || []).length - 14} số</span>
        </div>
      </td>
      <td>
        <button class="date-chip" onclick="jumpToDate('${rec.date}')">Xem bảng</button>
      </td>
    </tr>
  `).join('');

  const maxPages = Math.ceil(total / state.historyPageSize);
  if (dom.historyPageInfo) {
    dom.historyPageInfo.textContent = `Trang ${state.historyPage} / ${maxPages} (${total} kỳ quay)`;
  }
  if (dom.historyPrevPage) dom.historyPrevPage.disabled = state.historyPage <= 1;
  if (dom.historyNextPage) dom.historyNextPage.disabled = state.historyPage >= maxPages;
}

function jumpToDate(dateStr) {
  const idx = state.records.findIndex(r => r.date === dateStr);
  if (idx !== -1) {
    state.currentIndex = idx;
    renderCurrentRecord();
    renderStatistics();
    switchTab('board');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/* ===================================================================
   Tab Navigation & UI Helpers
   =================================================================== */

function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  document.querySelectorAll('.tab-content-panel').forEach(panel => {
    panel.style.display = panel.id === `tab-${tabId}` ? 'block' : 'none';
  });
}

function initTheme() {
  const saved = localStorage.getItem('xsmb-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('xsmb-theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  if (dom.themeToggleBtn) {
    dom.themeToggleBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
  }
}

function initClockAndCountdown() {
  function updateTime() {
    const now = new Date();
    // UTC+7 (Hanoi)
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const vnTime = new Date(utc + 7 * 3600000);

    const timeStr = vnTime.toLocaleTimeString('vi-VN', { hour12: false });
    const dateStr = vnTime.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });

    if (dom.clockTime) dom.clockTime.textContent = timeStr;
    if (dom.clockDate) dom.clockDate.textContent = dateStr;

    // Draw time status
    const hour = vnTime.getHours();
    const min = vnTime.getMinutes();
    const isDrawingNow = (hour === 18 && min >= 14 && min <= 35);

    // Target 18:15
    const target = new Date(vnTime);
    target.setHours(18, 15, 0, 0);

    if (vnTime.getTime() > target.getTime()) {
      target.setDate(target.getDate() + 1); // Next day's draw
    }

    const diff = target.getTime() - vnTime.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    if (dom.countdownTimer) {
      if (isDrawingNow) {
        dom.countdownTimer.textContent = '🔴 ĐANG MỞ THƯỞNG!';
      } else {
        dom.countdownTimer.textContent = `${padZero(h)}:${padZero(m)}:${padZero(s)}`;
      }
    }
  }

  updateTime();
  setInterval(updateTime, 1000);
}

function copyResultFormatted() {
  if (!state.records || state.records.length === 0) return;
  const rec = state.records[state.currentIndex];
  if (!rec) return;

  const text = `
🎯 KẾT QUẢ XỔ SỐ MIỀN BẮC (XSMB) - ${formatDateVN(rec.date)}
👑 Giải Đặc Biệt: ${rec.special}
🥇 Giải Nhất: ${rec.p1}
🥈 Giải Nhì: ${rec.p2.join(' - ')}
🥉 Giải Ba: ${rec.p3.slice(0, 3).join(' - ')} | ${rec.p3.slice(3).join(' - ')}
🎖️ Giải Tư: ${rec.p4.join(' - ')}
🎖️ Giải Năm: ${rec.p5.slice(0, 3).join(' - ')} | ${rec.p5.slice(3).join(' - ')}
🎯 Giải Sáu: ${rec.p6.join(' - ')}
🍀 Giải Bảy: ${rec.p7.join(' - ')}
---------------------------
⭐ Lô tô 2 số cuối ĐB: ${rec.special.slice(-2)}
Xem chi tiết tại Hội đam mê số học DK!
  `.trim();

  navigator.clipboard.writeText(text).then(() => {
    alert('Đã sao chép kết quả vào clipboard! Bạn có thể dán vào Zalo/Telegram/Facebook.');
  }).catch(() => {
    alert('Không thể sao chép kết quả.');
  });
}

function formatDateVN(iso) {
  const parts = iso.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function padZero(num) {
  return String(num).padStart(2, '0');
}

/* ===================================================================
   Event Listeners
   =================================================================== */

function bindEvents() {
  // Theme & sound
  if (dom.themeToggleBtn) dom.themeToggleBtn.addEventListener('click', toggleTheme);
  if (dom.soundToggleBtn) {
    dom.soundToggleBtn.addEventListener('click', () => {
      const isMuted = window.soundEngine.toggleMute();
      dom.soundToggleBtn.innerHTML = isMuted ? '🔇' : '🔔';
    });
  }

  // Navigation tabs
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-tab'));
    });
  });

  // Date controls
  if (dom.datePicker) {
    dom.datePicker.addEventListener('change', e => {
      jumpToDate(e.target.value);
    });
  }

  if (dom.btnPrevDay) {
    dom.btnPrevDay.addEventListener('click', () => {
      if (state.currentIndex < state.records.length - 1) {
        state.currentIndex++;
        renderCurrentRecord();
        renderStatistics();
      }
    });
  }

  if (dom.btnNextDay) {
    dom.btnNextDay.addEventListener('click', () => {
      if (state.currentIndex > 0) {
        state.currentIndex--;
        renderCurrentRecord();
        renderStatistics();
      }
    });
  }

  // Quick chips
  document.querySelectorAll('.date-chip[data-jump]').forEach(chip => {
    chip.addEventListener('click', () => {
      const jump = chip.getAttribute('data-jump');
      if (jump === 'latest') {
        state.currentIndex = 0;
      } else if (jump === 'yesterday' && state.records.length > 1) {
        state.currentIndex = 1;
      } else if (jump === '7days' && state.records.length > 7) {
        state.currentIndex = 7;
      } else if (jump === '30days' && state.records.length > 30) {
        state.currentIndex = 30;
      }
      renderCurrentRecord();
      renderStatistics();
    });
  });

  // Quick search
  if (dom.quickSearchInput) {
    dom.quickSearchInput.addEventListener('input', e => {
      const val = e.target.value.trim();
      if (val.length === 2) {
        highlightLotoNumber(val);
      } else if (val.length === 0) {
        clearHighlight();
      }
    });
  }

  // Loto Head / Tail toggle
  if (dom.btnLotoModeHead) {
    dom.btnLotoModeHead.addEventListener('click', () => {
      state.lotoMode = 'head';
      dom.btnLotoModeHead.classList.add('active');
      dom.btnLotoModeTail.classList.remove('active');
      renderLotoBoard(state.records[state.currentIndex]);
    });
  }

  if (dom.btnLotoModeTail) {
    dom.btnLotoModeTail.addEventListener('click', () => {
      state.lotoMode = 'tail';
      dom.btnLotoModeTail.classList.add('active');
      dom.btnLotoModeHead.classList.remove('active');
      renderLotoBoard(state.records[state.currentIndex]);
    });
  }

  // Ticket checker
  if (dom.btnCheckTicket) {
    dom.btnCheckTicket.addEventListener('click', checkTicket);
  }
  if (dom.checkerInput) {
    dom.checkerInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') checkTicket();
    });
  }

  // Simulator
  if (dom.btnStartSim) dom.btnStartSim.addEventListener('click', startSimulator);
  if (dom.btnStopSim) dom.btnStopSim.addEventListener('click', stopSimulator);

  // Sync & Live Stream Demo Buttons
  if (dom.btnSyncHeader) {
    dom.btnSyncHeader.addEventListener('click', () => syncDataWithServer(true));
  }
  if (dom.btnToggleLiveDemo) {
    dom.btnToggleLiveDemo.addEventListener('click', toggleLiveDemo);
  }

  // History pagination
  if (dom.historyPrevPage) {
    dom.historyPrevPage.addEventListener('click', () => {
      if (state.historyPage > 1) {
        state.historyPage--;
        renderHistoryTable();
      }
    });
  }

  if (dom.historyNextPage) {
    dom.historyNextPage.addEventListener('click', () => {
      const maxPages = Math.ceil(state.records.length / state.historyPageSize);
      if (state.historyPage < maxPages) {
        state.historyPage++;
        renderHistoryTable();
      }
    });
  }
}

/* ===================================================================
   Auto-Sync & Real-time Live Draw Engine
   =================================================================== */

async function syncDataWithServer(isManual = false) {
  if (dom.syncIconSpin) dom.syncIconSpin.classList.add('rotating');
  try {
    let data = null;
    // 1. Try local server API
    try {
      const res = await fetch('/api/sync?t=' + Date.now());
      if (res.ok) {
        data = await res.json();
      }
    } catch (apiErr) {
      // 2. Fallback to latest.json
      try {
        const fbRes = await fetch('data/latest.json?t=' + Date.now());
        if (fbRes.ok) data = await fbRes.json();
      } catch (fbErr) {}
    }

    if (data && (data.success || data.latest_record)) {
      const serverRecord = data.latest_record;
      const serverDate = data.latest_date || (serverRecord && serverRecord.date);
      const currentLatestDate = (state.records && state.records.length > 0) ? state.records[0].date : '';

      let didUpdate = false;

      // Check if server date is newer than client's latest date
      if (serverDate && (!currentLatestDate || serverDate > currentLatestDate)) {
        if (serverRecord) {
          state.records.unshift(serverRecord);
          didUpdate = true;
        }
      } else if (serverDate && serverDate === currentLatestDate && serverRecord) {
        // Compare and update if special prize differs
        if (state.records[0].special !== serverRecord.special) {
          state.records[0] = serverRecord;
          didUpdate = true;
        }
      }

      // If server explicitly added rows or we need fresh CSV
      if (data.added && data.added.length > 0) {
        try {
          const csvRes = await fetch('data/xsmb.csv?t=' + Date.now());
          if (csvRes.ok) {
            const csvText = await csvRes.text();
            parseCSVData(csvText);
            didUpdate = true;
          }
        } catch (csvErr) {
          console.warn('Could not fetch updated CSV:', csvErr);
        }
      }

      if (didUpdate) {
        state.currentIndex = 0;
        if (dom.datePicker) {
          dom.datePicker.max = state.records[0].date;
          dom.datePicker.value = state.records[0].date;
        }
        renderCurrentRecord();
        renderStatistics();
        renderHistoryTable();
        if (window.soundManager) window.soundManager.playFanfare();
        if (window.confetti) window.confetti.fire(60);

        if (isManual) {
          alert(`🎉 Cập nhật thành công! Đã có kết quả mới nhất ngày ${formatDateVN(state.records[0].date)} (Giải Đặc Biệt: ${state.records[0].special}).`);
        }
      } else {
        if (isManual) {
          const curDateStr = state.records[0] ? formatDateVN(state.records[0].date) : 'hôm nay';
          const curSpecial = state.records[0] ? state.records[0].special : '--';
          alert(`✅ Dữ liệu hiện tại đã là mới nhất: Kỳ quay ngày ${curDateStr} (Giải Đặc Biệt: ${curSpecial}). Hệ thống luôn tự động kiểm tra mỗi 20 giây!`);
        }
      }
    } else {
      if (isManual) {
        alert('ℹ️ Đang hoạt động ở chế độ trực tuyến. Dữ liệu trên bảng đã là kết quả gần nhất.');
      }
    }
  } catch (err) {
    console.warn('Auto-sync check (local/offline):', err);
    if (isManual) {
      alert('Không thể kết nối đến máy chủ cập nhật. Vui lòng kiểm tra lại kết nối mạng hoặc máy chủ.');
    }
  } finally {
    if (dom.syncIconSpin) {
      setTimeout(() => dom.syncIconSpin.classList.remove('rotating'), 600);
    }
    updateLiveBannerStatus();
  }
}

async function updateLiveBannerStatus() {
  if (!dom.liveStatusBanner) return;
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const vnTime = new Date(utc + 7 * 3600000);
  const hour = vnTime.getHours();
  const min = vnTime.getMinutes();

  const y = vnTime.getFullYear();
  const m = String(vnTime.getMonth() + 1).padStart(2, '0');
  const d = String(vnTime.getDate()).padStart(2, '0');
  const todayVnStr = `${y}-${m}-${d}`;

  let liveApi = null;
  try {
    const res = await fetch('/api/live?t=' + Date.now());
    if (res.ok) liveApi = await res.json();
  } catch (e) {}

  const latestRec = state.records && state.records.length > 0 ? state.records[0] : null;
  const isTodayDrawn = latestRec && latestRec.date === todayVnStr;
  const isDrawingTime = (hour === 18 && min >= 14 && min <= 35);

  if (isDrawingTime || (liveApi && liveApi.status === 'drawing')) {
    dom.liveStatusBanner.className = 'live-banner';
    dom.liveStatusBanner.style.background = '';
    dom.liveStatusBanner.style.borderColor = '';
    if (dom.liveBadgeText) dom.liveBadgeText.textContent = '🔴 ĐANG TRỰC TIẾP';
    if (dom.liveBannerMessage) {
      const count = liveApi ? liveApi.prizes_count : 0;
      dom.liveBannerMessage.innerHTML = `Đang mở thưởng trực tiếp XSMB hôm nay! Đã mở <strong>${count}/27</strong> giải. Các giải đang tự động quay số...`;
    }
  } else if (isTodayDrawn || (liveApi && liveApi.status === 'completed')) {
    dom.liveStatusBanner.className = 'live-banner';
    dom.liveStatusBanner.style.background = 'linear-gradient(90deg, rgba(16, 185, 129, 0.18) 0%, rgba(245, 158, 11, 0.15) 100%)';
    dom.liveStatusBanner.style.borderColor = 'rgba(16, 185, 129, 0.5)';
    if (dom.liveBadgeText) dom.liveBadgeText.textContent = '✅ ĐÃ CÓ KẾT QUẢ HÔM NAY';
    if (dom.liveBannerMessage) {
      const specialNum = latestRec ? latestRec.special : (liveApi && liveApi.special ? liveApi.special : '--');
      const loto2D = specialNum !== '--' ? specialNum.slice(-2) : '--';
      dom.liveBannerMessage.innerHTML = `Đã có đầy đủ kết quả kỳ quay hôm nay <strong>${formatDateVN(todayVnStr)}</strong>. Giải Đặc Biệt: <strong style="color:var(--ruby-400)">${specialNum}</strong> (Lô 2 số: <strong style="color:var(--amber-400)">${loto2D}</strong>). Chúc anh em đại thắng!`;
    }
  } else {
    // Before 18:15 or waiting
    dom.liveStatusBanner.className = 'live-banner idle';
    dom.liveStatusBanner.style.background = '';
    dom.liveStatusBanner.style.borderColor = '';
    if (dom.liveBadgeText) dom.liveBadgeText.textContent = '⏰ CHỜ QUAY (18:15)';
    if (dom.liveBannerMessage) {
      dom.liveBannerMessage.innerHTML = `Hôm nay là <strong>${formatDateVN(todayVnStr)}</strong> (mở thưởng lúc <strong>18h15</strong>). Kết quả gần nhất là ngày <strong>${latestRec ? formatDateVN(latestRec.date) : '--'}</strong> (GĐB: <strong style="color:var(--ruby-400)">${latestRec ? latestRec.special : '--'}</strong>).`;
    }
  }
}

// Live Stream Demo Runner
let isLiveDemoRunning = false;
let liveDemoTimer = null;

function toggleLiveDemo() {
  if (isLiveDemoRunning) {
    stopLiveDemo();
  } else {
    startLiveDemo();
  }
}

function stopLiveDemo() {
  isLiveDemoRunning = false;
  if (liveDemoTimer) clearTimeout(liveDemoTimer);
  if (dom.btnToggleLiveDemo) {
    dom.btnToggleLiveDemo.innerHTML = '<span>🔴 Xem Thử Quay Trực Tiếp</span>';
    dom.btnToggleLiveDemo.style.background = 'var(--ruby-gradient)';
  }
  renderCurrentRecord();
  updateLiveBannerStatus();
}

function clearBoardForLive() {
  if (dom.specialDigits) {
    dom.specialDigits.innerHTML = `
      <div class="special-digit-ball">-</div>
      <div class="special-digit-ball">-</div>
      <div class="special-digit-ball">-</div>
      <div class="special-digit-ball last-two">-</div>
      <div class="special-digit-ball last-two">-</div>
    `;
  }
  if (dom.specialLotoTag) dom.specialLotoTag.innerHTML = '2 số cuối: --';

  const emptyPlaceholders = (count, len) => Array(count).fill('•'.repeat(len));
  renderPrizeRow(dom.prize1Container, emptyPlaceholders(1, 5), 'prize-1-num');
  renderPrizeRow(dom.prize2Container, emptyPlaceholders(2, 5), 'prize-2-num');
  renderPrizeRow(dom.prize3Container, emptyPlaceholders(6, 5), 'prize-3-num');
  renderPrizeRow(dom.prize4Container, emptyPlaceholders(4, 4), 'prize-4-num');
  renderPrizeRow(dom.prize5Container, emptyPlaceholders(6, 4), 'prize-5-num');
  renderPrizeRow(dom.prize6Container, emptyPlaceholders(3, 3), 'prize-6-num');
  renderPrizeRow(dom.prize7Container, emptyPlaceholders(4, 2), 'prize-7-num');

  // Clear Loto board
  if (dom.lotoTableBody) {
    renderLotoBoard({ special: '00000', loto: [] });
  }
}

function startLiveDemo() {
  if (!state.records || state.records.length === 0) return;
  isLiveDemoRunning = true;
  window.soundEngine.init();

  if (dom.btnToggleLiveDemo) {
    dom.btnToggleLiveDemo.innerHTML = '<span>⏹ Dừng Trực Tiếp</span>';
    dom.btnToggleLiveDemo.style.background = 'var(--bg-tertiary)';
  }

  if (dom.liveStatusBanner) dom.liveStatusBanner.className = 'live-banner';
  if (dom.liveBadgeText) dom.liveBadgeText.textContent = '🔴 TRỰC TIẾP DEMO';

  const sampleRec = state.records[0];
  clearBoardForLive();

  // Full order of XSMB drawing
  const drawSequence = [
    { containerId: 'prize-7-container', index: 0, digits: 2, value: sampleRec.p7[0], name: 'Giải Bảy (1)' },
    { containerId: 'prize-7-container', index: 1, digits: 2, value: sampleRec.p7[1], name: 'Giải Bảy (2)' },
    { containerId: 'prize-7-container', index: 2, digits: 2, value: sampleRec.p7[2], name: 'Giải Bảy (3)' },
    { containerId: 'prize-7-container', index: 3, digits: 2, value: sampleRec.p7[3], name: 'Giải Bảy (4)' },

    { containerId: 'prize-6-container', index: 0, digits: 3, value: sampleRec.p6[0], name: 'Giải Sáu (1)' },
    { containerId: 'prize-6-container', index: 1, digits: 3, value: sampleRec.p6[1], name: 'Giải Sáu (2)' },
    { containerId: 'prize-6-container', index: 2, digits: 3, value: sampleRec.p6[2], name: 'Giải Sáu (3)' },

    { containerId: 'prize-5-container', index: 0, digits: 4, value: sampleRec.p5[0], name: 'Giải Năm (1)' },
    { containerId: 'prize-5-container', index: 1, digits: 4, value: sampleRec.p5[1], name: 'Giải Năm (2)' },
    { containerId: 'prize-5-container', index: 2, digits: 4, value: sampleRec.p5[2], name: 'Giải Năm (3)' },
    { containerId: 'prize-5-container', index: 3, digits: 4, value: sampleRec.p5[3], name: 'Giải Năm (4)' },
    { containerId: 'prize-5-container', index: 4, digits: 4, value: sampleRec.p5[4], name: 'Giải Năm (5)' },
    { containerId: 'prize-5-container', index: 5, digits: 4, value: sampleRec.p5[5], name: 'Giải Năm (6)' },

    { containerId: 'prize-4-container', index: 0, digits: 4, value: sampleRec.p4[0], name: 'Giải Tư (1)' },
    { containerId: 'prize-4-container', index: 1, digits: 4, value: sampleRec.p4[1], name: 'Giải Tư (2)' },
    { containerId: 'prize-4-container', index: 2, digits: 4, value: sampleRec.p4[2], name: 'Giải Tư (3)' },
    { containerId: 'prize-4-container', index: 3, digits: 4, value: sampleRec.p4[3], name: 'Giải Tư (4)' },

    { containerId: 'prize-3-container', index: 0, digits: 5, value: sampleRec.p3[0], name: 'Giải Ba (1)' },
    { containerId: 'prize-3-container', index: 1, digits: 5, value: sampleRec.p3[1], name: 'Giải Ba (2)' },
    { containerId: 'prize-3-container', index: 2, digits: 5, value: sampleRec.p3[2], name: 'Giải Ba (3)' },
    { containerId: 'prize-3-container', index: 3, digits: 5, value: sampleRec.p3[3], name: 'Giải Ba (4)' },
    { containerId: 'prize-3-container', index: 4, digits: 5, value: sampleRec.p3[4], name: 'Giải Ba (5)' },
    { containerId: 'prize-3-container', index: 5, digits: 5, value: sampleRec.p3[5], name: 'Giải Ba (6)' },

    { containerId: 'prize-2-container', index: 0, digits: 5, value: sampleRec.p2[0], name: 'Giải Nhì (1)' },
    { containerId: 'prize-2-container', index: 1, digits: 5, value: sampleRec.p2[1], name: 'Giải Nhì (2)' },

    { containerId: 'prize-1-container', index: 0, digits: 5, value: sampleRec.p1, name: 'Giải Nhất' },

    { isSpecial: true, digits: 5, value: sampleRec.special, name: 'GIẢI ĐẶC BIỆT 👑' },
  ];

  let seqIdx = 0;
  const currentLotoList = [];

  function runSequenceStep() {
    if (!isLiveDemoRunning) return;
    if (seqIdx >= drawSequence.length) {
      window.soundEngine.playJackpot();
      if (window.confetti) window.confetti.fire(180);
      if (dom.liveBannerMessage) {
        dom.liveBannerMessage.innerHTML = `🎉 ĐÃ HOÀN TẤT KỲ QUAY TRỰC TIẾP! Giải Đặc Biệt: <strong style="color:var(--ruby-400);font-size:1.1rem">${sampleRec.special}</strong>`;
      }
      return;
    }

    const item = drawSequence[seqIdx];
    if (dom.liveBannerMessage) {
      dom.liveBannerMessage.innerHTML = `Đang mở thưởng trực tiếp: <strong>${item.name}</strong> (${seqIdx + 1}/27)...`;
    }

    // Spin animation on target slot
    let ticks = 0;
    const maxTicks = 6;
    const rollInterval = setInterval(() => {
      ticks++;
      window.soundEngine.playTick();
      const randStr = String(Math.floor(Math.random() * Math.pow(10, item.digits))).padStart(item.digits, '0');

      if (item.isSpecial) {
        if (dom.specialDigits) {
          const balls = dom.specialDigits.querySelectorAll('.special-digit-ball');
          balls.forEach((b, i) => {
            b.textContent = randStr[i] || '-';
            b.classList.add('rolling-now');
          });
        }
      } else {
        const parent = document.getElementById(item.containerId);
        if (parent) {
          const els = parent.querySelectorAll('.lottery-num');
          if (els[item.index]) {
            els[item.index].textContent = randStr;
            els[item.index].classList.add('rolling-now');
          }
        }
      }

      if (ticks >= maxTicks) {
        clearInterval(rollInterval);
        window.soundEngine.playReveal();

        // Lock final value
        if (item.isSpecial) {
          if (dom.specialDigits) {
            const balls = dom.specialDigits.querySelectorAll('.special-digit-ball');
            balls.forEach((b, i) => {
              b.textContent = item.value[i];
              b.classList.remove('rolling-now');
            });
          }
          if (dom.specialLotoTag) {
            const s2d = item.value.slice(-2);
            dom.specialLotoTag.innerHTML = `2 số cuối: <strong>${s2d}</strong> (Đầu ${s2d[0]} - Đuôi ${s2d[1]})`;
          }
        } else {
          const parent = document.getElementById(item.containerId);
          if (parent) {
            const els = parent.querySelectorAll('.lottery-num');
            if (els[item.index]) {
              els[item.index].textContent = item.value;
              els[item.index].setAttribute('data-num', item.value);
              els[item.index].setAttribute('data-loto', item.value.slice(-2));
              els[item.index].classList.remove('rolling-now');
            }
          }
        }

        // Add to Loto Head/Tail table
        currentLotoList.push(item.value.slice(-2));
        renderLotoBoard({
          special: item.isSpecial ? item.value : '00000',
          loto: currentLotoList
        });

        seqIdx++;
        liveDemoTimer = setTimeout(runSequenceStep, 400);
      }
    }, 70);
  }

  runSequenceStep();
}

