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
  activeTab: 'board', // 'board' | 'stats' | 'history'
  historyPage: 1,
  historyPageSize: 10,
  historyViewMode: 'cards', // 'cards' | 'table'
  historyFilter: '',
  lastLivePrizesCount: 0,
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
  initLiveDrawMonitor();
});

function cacheDOM() {
  dom.clockTime = document.getElementById('clock-time');
  dom.clockDate = document.getElementById('clock-date');
  dom.countdownTimer = document.getElementById('countdown-timer');
  dom.themeToggleBtn = document.getElementById('theme-toggle-btn');
  dom.soundToggleBtn = document.getElementById('sound-toggle-btn');
  dom.confettiCanvas = document.getElementById('confetti-canvas');

  // Simulator Controls
  dom.btnStartSim = document.getElementById('btn-start-sim');
  dom.btnStopSim = document.getElementById('btn-stop-sim');
  dom.btnResetSim = document.getElementById('btn-reset-sim');
  dom.simStageText = document.getElementById('sim-stage-text');
  dom.simCage = document.getElementById('sim-cage');
  dom.simCageLabel = document.getElementById('sim-cage-label');
  dom.simBallsRow = document.getElementById('sim-balls-row');
  dom.simProgressFill = document.getElementById('sim-progress-fill');
  dom.simPrizeCounter = document.getElementById('sim-prize-counter');
  dom.simCurrentPrizeName = document.getElementById('sim-current-prize-name');
  dom.simSpecialDigits = document.getElementById('sim-special-digits');
  dom.simBoardTable = document.getElementById('sim-board-table');
  dom.simLotoTableBody = document.getElementById('sim-loto-table-body');
  dom.simSummaryBox = document.getElementById('sim-summary-box');
  dom.btnSyncHeader = document.getElementById('btn-sync-header');
  dom.syncIconSpin = document.getElementById('sync-icon-spin');

  // Date controls
  dom.datePicker = document.getElementById('date-picker');
  dom.btnPrevDay = document.getElementById('btn-prev-day');
  dom.btnNextDay = document.getElementById('btn-next-day');
  dom.boardDateLabel = document.getElementById('board-date-label');
  dom.quickSearchInput = document.getElementById('quick-search-input');
  dom.searchAlert = document.getElementById('search-alert');

  // Board
  dom.specialDigits = document.getElementById('special-digits');
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

  // Stats
  dom.loGanTableBody = document.getElementById('lo-gan-table-body');
  dom.loTopTableBody = document.getElementById('lo-top-table-body');
  dom.matrixGrid = document.getElementById('matrix-grid-100');
  dom.pairsContainer = document.getElementById('pairs-container');

  // History
  dom.historyTableBody = document.getElementById('history-table-body');
  dom.historyCardsContainer = document.getElementById('history-cards-container');
  dom.historyTableWrapper = document.getElementById('history-table-wrapper');
  dom.btnViewCards = document.getElementById('btn-view-cards');
  dom.btnViewTable = document.getElementById('btn-view-table');
  dom.historyFilterInput = document.getElementById('history-filter-input');
  dom.historyFilterClear = document.getElementById('history-filter-clear');
  dom.historyFilterStatus = document.getElementById('history-filter-status');
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

  renderCurrentRecord();
  renderStatistics();
  renderHistoryTable();
  initSimulator();
  if (window.betNotesManager) {
    window.betNotesManager.render();
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

  let liveBadge = '';
  if (rec.status === 'drawing') {
    const pCount = rec.prizes_count || (rec.loto ? rec.loto.length : 0);
    liveBadge = ` • <span class="live-pulse-badge">🔴 ĐANG QUAY (${pCount}/27 giải)</span>`;
  }

  if (dom.boardDateLabel) {
    dom.boardDateLabel.innerHTML = `Kỳ quay: <strong>${formattedDate}</strong> (${dayOfWeek})${liveBadge}`;
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
    if (sp && sp.length >= 5) {
      for (let i = 0; i < sp.length; i++) {
        const isLastTwo = i >= sp.length - 2;
        html += `<div class="special-digit-ball ${isLastTwo ? 'last-two' : ''}">${sp[i]}</div>`;
      }
    } else {
      for (let i = 0; i < 5; i++) {
        html += `<div class="special-digit-ball pending-digit">-</div>`;
      }
    }
    dom.specialDigits.innerHTML = html;
  }

  // Render Other Prizes (G1: 1 giải 5 số, G2: 2 giải 5 số, G3: 6 giải 5 số, G4: 4 giải 4 số, G5: 6 giải 4 số, G6: 3 giải 3 số, G7: 4 giải 2 số)
  renderPrizeRow(dom.prize1Container, rec.p1, 1, 5, 'prize-1-num');
  renderPrizeRow(dom.prize2Container, rec.p2, 2, 5, 'prize-2-num');
  renderPrizeRow(dom.prize3Container, rec.p3, 6, 5, 'prize-3-num');
  renderPrizeRow(dom.prize4Container, rec.p4, 4, 4, 'prize-4-num');
  renderPrizeRow(dom.prize5Container, rec.p5, 6, 4, 'prize-5-num');
  renderPrizeRow(dom.prize6Container, rec.p6, 3, 3, 'prize-6-num');
  renderPrizeRow(dom.prize7Container, rec.p7, 4, 2, 'prize-7-num');

  // Render Loto 2-Digits Board
  renderLotoBoard(rec);

  // Check pairs & double loto for today
  renderDailyPairs(rec);
}

function renderPrizeRow(container, numbers, expectedCount, digits, cssClass) {
  if (!container) return;
  const nums = Array.isArray(numbers) ? numbers.filter(Boolean) : (numbers ? [numbers] : []);
  let html = '';
  for (let i = 0; i < expectedCount; i++) {
    if (i < nums.length && nums[i]) {
      const n = String(nums[i]);
      html += `<span class="lottery-num ${cssClass}" data-num="${n}" data-loto="${n.slice(-2)}" onclick="highlightLotoNumber('${n.slice(-2)}')">${n}</span>`;
    } else {
      html += `<span class="lottery-num ${cssClass} pending-num">${'-'.repeat(digits)}</span>`;
    }
  }
  container.innerHTML = html;
}

function renderLotoBoard(rec) {
  if (!dom.lotoTableBody) return;
  const lotoList = rec.loto || [];
  const special2D = (rec.special && rec.special.length >= 2) ? rec.special.slice(-2) : '--';

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
  renderHistory();
}

function renderHistory() {
  if (!dom.historyTableBody && !dom.historyCardsContainer) return;

  // 1. Filter dataset by search keyword (date or 2-digit loto)
  let filtered = state.records || [];
  const filterVal = (state.historyFilter || '').trim().toLowerCase();

  if (filterVal) {
    filtered = state.records.filter(rec => {
      if (rec.date.toLowerCase().includes(filterVal)) return true;
      const vnDate = formatDateVN(rec.date).toLowerCase();
      if (vnDate.includes(filterVal)) return true;
      if (rec.special.includes(filterVal)) return true;
      if (rec.loto && rec.loto.some(n => n === filterVal)) return true;
      return false;
    });
  }

  // Update filter status alert banner
  if (dom.historyFilterStatus) {
    if (filterVal) {
      dom.historyFilterStatus.style.display = 'flex';
      dom.historyFilterStatus.innerHTML = `<span>🎯 Đang lọc theo: <strong>"${filterVal}"</strong> — Tìm thấy <strong>${filtered.length}</strong> kỳ quay phù hợp.</span><button onclick="clearHistoryFilter()" style="background:none;border:none;color:var(--gold-400);cursor:pointer;font-weight:700;margin-left:0.5rem;">✕ Xóa lọc</button>`;
    } else {
      dom.historyFilterStatus.style.display = 'none';
    }
  }

  const total = filtered.length;
  const maxPages = Math.max(1, Math.ceil(total / state.historyPageSize));
  if (state.historyPage > maxPages) state.historyPage = maxPages;
  if (state.historyPage < 1) state.historyPage = 1;

  const startIdx = (state.historyPage - 1) * state.historyPageSize;
  const pageRecords = filtered.slice(startIdx, startIdx + state.historyPageSize);

  // View Mode: Cards vs Table
  const isCards = state.historyViewMode === 'cards';
  if (dom.btnViewCards) dom.btnViewCards.classList.toggle('active', isCards);
  if (dom.btnViewTable) dom.btnViewTable.classList.toggle('active', !isCards);
  if (dom.historyCardsContainer) dom.historyCardsContainer.style.display = isCards ? 'grid' : 'none';
  if (dom.historyTableWrapper) dom.historyTableWrapper.style.display = !isCards ? 'block' : 'none';

  if (isCards && dom.historyCardsContainer) {
    if (pageRecords.length === 0) {
      dom.historyCardsContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2.5rem 1rem; color: var(--text-muted); background: var(--bg-secondary); border-radius: var(--radius-md);">Không tìm thấy kỳ quay nào khớp với từ khóa <strong>"${filterVal}"</strong>.<br><button class="date-chip" onclick="clearHistoryFilter()" style="margin-top:0.75rem;">Xóa bộ lọc</button></div>`;
    } else {
      dom.historyCardsContainer.innerHTML = pageRecords.map(rec => renderHistoryCard(rec, filterVal)).join('');
    }
  } else if (dom.historyTableBody) {
    if (pageRecords.length === 0) {
      dom.historyTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">Không tìm thấy kỳ quay nào khớp với <strong>"${filterVal}"</strong>.</td></tr>`;
    } else {
      dom.historyTableBody.innerHTML = pageRecords.map(rec => `
        <tr>
          <td><strong>${formatDateVN(rec.date)}</strong></td>
          <td><span class="lottery-num" style="color:var(--ruby-400);font-weight:800">${rec.special}</span></td>
          <td><span class="lottery-num" style="color:var(--gold-400)">${rec.p1}</span></td>
          <td><span class="lottery-num" style="background:var(--ruby-gradient);color:#fff;font-weight:900">${rec.special.slice(-2)}</span></td>
          <td>
            <div style="display:flex; flex-wrap:wrap; gap:3px; max-width:450px;">
              ${(rec.loto || []).slice(0, 14).map(n => `<span class="loto-pill ${n === rec.special.slice(-2) ? 'is-special' : (n === filterVal ? 'is-match' : '')}" onclick="highlightLotoNumber('${n}')">${n}</span>`).join('')}
              ${(rec.loto || []).length > 14 ? `<span style="font-size:0.75rem;color:var(--text-muted);align-self:center;">+${(rec.loto || []).length - 14} số</span>` : ''}
            </div>
          </td>
          <td>
            <button class="date-chip" onclick="jumpToDate('${rec.date}')">Xem bảng</button>
          </td>
        </tr>
      `).join('');
    }
  }

  // Update Pagination Controls
  if (dom.historyPageInfo) {
    dom.historyPageInfo.textContent = `Trang ${state.historyPage} / ${maxPages} (${total} kỳ quay)`;
  }
  if (dom.historyPrevPage) dom.historyPrevPage.disabled = state.historyPage <= 1;
  if (dom.historyNextPage) dom.historyNextPage.disabled = state.historyPage >= maxPages;
}

function renderHistoryCard(rec, filterVal) {
  const dObj = new Date(rec.date);
  const dayOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][dObj.getDay()];
  const formattedDate = formatDateVN(rec.date);
  const sp2D = rec.special.slice(-2);
  const lotoList = rec.loto || [];

  return `
    <div class="history-card" data-date="${rec.date}">
      <div class="history-card-header">
        <div class="history-card-date">
          <span class="history-card-day">${dayOfWeek}</span>
          <span class="history-card-date-str">${formattedDate}</span>
        </div>
        <button class="history-card-action-btn" onclick="jumpToDate('${rec.date}')" title="Mở bảng kết quả 27 giải đầy đủ">
          🎯 Mở bảng
        </button>
      </div>

      <div class="history-card-prizes">
        <div class="history-prize-item special">
          <div class="history-prize-label">Đặc Biệt</div>
          <div class="history-prize-value">${rec.special}</div>
          <div class="history-loto-tag">Lô: <strong>${sp2D}</strong></div>
        </div>
        <div class="history-prize-item p1">
          <div class="history-prize-label">Giải Nhất</div>
          <div class="history-prize-value">${rec.p1}</div>
        </div>
        <div class="history-prize-item head-tail">
          <div class="history-prize-label">Đầu / Đuôi</div>
          <div class="history-prize-value">${sp2D[0]} / ${sp2D[1]}</div>
        </div>
      </div>

      <div class="history-card-loto-section">
        <div class="history-loto-label">Lô tô 2 số (${lotoList.length} giải về):</div>
        <div class="history-loto-badges">
          ${lotoList.map(num => {
            const isSpecial = (num === sp2D);
            const isMatch = filterVal && (num === filterVal);
            const isDouble = (num[0] === num[1]);
            let badgeClass = 'loto-pill';
            if (isSpecial) badgeClass += ' is-special';
            else if (isMatch) badgeClass += ' is-match';
            else if (isDouble) badgeClass += ' is-double';
            return `<span class="${badgeClass}" onclick="highlightLotoNumber('${num}')">${num}</span>`;
          }).join('')}
        </div>
      </div>

      <div class="history-card-footer">
        <span class="history-card-hint">Chạm số lô để soi cầu</span>
        <button class="history-card-copy-btn" onclick="copySingleDateResult('${rec.date}')" title="Sao chép kết quả ngày này">📋 Sao chép</button>
      </div>
    </div>
  `;
}

function copySingleDateResult(dateStr) {
  const rec = state.records.find(r => r.date === dateStr);
  if (!rec) return;
  const sp2D = rec.special.slice(-2);
  const text = `🎯 KẾT QUẢ XSMB - ${formatDateVN(rec.date)}\n👑 Giải Đặc Biệt: ${rec.special} (Lô 2 số: ${sp2D})\n🥇 Giải Nhất: ${rec.p1}\n⭐ Lô tô về: ${(rec.loto || []).join(', ')}\nXem chi tiết tại Hội đam mê số học DK!`;
  navigator.clipboard.writeText(text).then(() => {
    alert(`📋 Đã sao chép kết quả kỳ quay ngày ${formatDateVN(rec.date)}!`);
  }).catch(() => {
    alert(`Kỳ quay ${formatDateVN(rec.date)}: GĐB ${rec.special}`);
  });
}

function clearHistoryFilter() {
  state.historyFilter = '';
  if (dom.historyFilterInput) dom.historyFilterInput.value = '';
  if (dom.historyFilterClear) dom.historyFilterClear.style.display = 'none';
  state.historyPage = 1;
  renderHistory();
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
  document.querySelectorAll('.nav-tab-btn, .mobile-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  document.querySelectorAll('.tab-content-panel').forEach(panel => {
    panel.style.display = panel.id === `tab-${tabId}` ? 'block' : 'none';
  });

  if (window.soundManager) window.soundManager.playTick();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (tabId === 'notes' && window.betNotesManager) {
    window.betNotesManager.render();
  }
}

function initTheme() {
  const saved = localStorage.getItem('xsmb-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
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
  if (!dom.clockTime && !dom.countdownTimer) return;
  function updateTime() {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const vnTime = new Date(utc + 7 * 3600000);

    const timeStr = vnTime.toLocaleTimeString('vi-VN', { hour12: false });
    const dateStr = vnTime.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });

    if (dom.clockTime) dom.clockTime.textContent = timeStr;
    if (dom.clockDate) dom.clockDate.textContent = dateStr;
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



  // Simulator Controls
  if (dom.btnStartSim) dom.btnStartSim.addEventListener('click', startSimulator);
  if (dom.btnStopSim) dom.btnStopSim.addEventListener('click', stopSimulator);
  if (dom.btnResetSim) dom.btnResetSim.addEventListener('click', resetSimulatorUI);

  document.querySelectorAll('.sim-speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setSimSpeed(btn.getAttribute('data-speed'));
    });
  });

  // Sync Button
  if (dom.btnSyncHeader) {
    dom.btnSyncHeader.addEventListener('click', () => syncDataWithServer(true));
  }

  // History view mode toggle (Cards vs Table)
  if (dom.btnViewCards) {
    dom.btnViewCards.addEventListener('click', () => {
      state.historyViewMode = 'cards';
      if (window.soundManager) window.soundManager.playTick();
      renderHistory();
    });
  }

  if (dom.btnViewTable) {
    dom.btnViewTable.addEventListener('click', () => {
      state.historyViewMode = 'table';
      if (window.soundManager) window.soundManager.playTick();
      renderHistory();
    });
  }

  // History search & filter input
  if (dom.historyFilterInput) {
    dom.historyFilterInput.addEventListener('input', e => {
      state.historyFilter = e.target.value.trim();
      state.historyPage = 1;
      if (dom.historyFilterClear) {
        dom.historyFilterClear.style.display = state.historyFilter ? 'inline-block' : 'none';
      }
      renderHistory();
    });
  }

  if (dom.historyFilterClear) {
    dom.historyFilterClear.addEventListener('click', clearHistoryFilter);
  }

  // History pagination
  if (dom.historyPrevPage) {
    dom.historyPrevPage.addEventListener('click', () => {
      if (state.historyPage > 1) {
        state.historyPage--;
        if (window.soundManager) window.soundManager.playTick();
        renderHistory();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  if (dom.historyNextPage) {
    dom.historyNextPage.addEventListener('click', () => {
      const filteredCount = state.historyFilter ? (state.records || []).filter(rec => {
        const f = state.historyFilter.toLowerCase();
        return rec.date.includes(f) || rec.special.includes(f) || (rec.loto && rec.loto.some(n => n === f));
      }).length : state.records.length;
      const maxPages = Math.ceil(filteredCount / state.historyPageSize);
      if (state.historyPage < maxPages) {
        state.historyPage++;
        if (window.soundManager) window.soundManager.playTick();
        renderHistory();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}

/* ===================================================================
   XSMB VIP DRAW SIMULATOR ENGINE (QUAY MÔ PHỎNG XSMB CHUẨN)
   Thứ tự quay thưởng chuẩn:
   Giải Nhất ➔ Giải Nhì ➔ Giải Ba ➔ Giải Tư ➔ Giải Năm ➔ Giải Sáu ➔ Giải Bảy ➔ Giải Đặc Biệt
   =================================================================== */

// Định nghĩa chuẩn thứ tự 27 lượt quay mở thưởng XSMB (G1 -> G7 -> GĐB)
const SIM_XSMB_SEQUENCE = [
  // 1. Giải Nhất (Quay đầu tiên - 1 giải × 5 chữ số)
  { step: 1, name: 'Giải Nhất', count: 1, index: 0, digits: 5, key: 'p1', slotId: 'sim-slot-p1-0' },

  // 2. Giải Nhì (Quay thứ hai - 2 giải × 5 chữ số)
  { step: 2, name: 'Giải Nhì (1/2)', count: 2, index: 0, digits: 5, key: 'p2', slotId: 'sim-slot-p2-0' },
  { step: 3, name: 'Giải Nhì (2/2)', count: 2, index: 1, digits: 5, key: 'p2', slotId: 'sim-slot-p2-1' },

  // 3. Giải Ba (Quay thứ ba - 6 giải × 5 chữ số)
  { step: 4, name: 'Giải Ba (1/6)', count: 6, index: 0, digits: 5, key: 'p3', slotId: 'sim-slot-p3-0' },
  { step: 5, name: 'Giải Ba (2/6)', count: 6, index: 1, digits: 5, key: 'p3', slotId: 'sim-slot-p3-1' },
  { step: 6, name: 'Giải Ba (3/6)', count: 6, index: 2, digits: 5, key: 'p3', slotId: 'sim-slot-p3-2' },
  { step: 7, name: 'Giải Ba (4/6)', count: 6, index: 3, digits: 5, key: 'p3', slotId: 'sim-slot-p3-3' },
  { step: 8, name: 'Giải Ba (5/6)', count: 6, index: 4, digits: 5, key: 'p3', slotId: 'sim-slot-p3-4' },
  { step: 9, name: 'Giải Ba (6/6)', count: 6, index: 5, digits: 5, key: 'p3', slotId: 'sim-slot-p3-5' },

  // 4. Giải Tư (Quay thứ tư - 4 giải × 4 chữ số)
  { step: 10, name: 'Giải Tư (1/4)', count: 4, index: 0, digits: 4, key: 'p4', slotId: 'sim-slot-p4-0' },
  { step: 11, name: 'Giải Tư (2/4)', count: 4, index: 1, digits: 4, key: 'p4', slotId: 'sim-slot-p4-1' },
  { step: 12, name: 'Giải Tư (3/4)', count: 4, index: 2, digits: 4, key: 'p4', slotId: 'sim-slot-p4-2' },
  { step: 13, name: 'Giải Tư (4/4)', count: 4, index: 3, digits: 4, key: 'p4', slotId: 'sim-slot-p4-3' },

  // 5. Giải Năm (Quay thứ năm - 6 giải × 4 chữ số)
  { step: 14, name: 'Giải Năm (1/6)', count: 6, index: 0, digits: 4, key: 'p5', slotId: 'sim-slot-p5-0' },
  { step: 15, name: 'Giải Năm (2/6)', count: 6, index: 1, digits: 4, key: 'p5', slotId: 'sim-slot-p5-1' },
  { step: 16, name: 'Giải Năm (3/6)', count: 6, index: 2, digits: 4, key: 'p5', slotId: 'sim-slot-p5-2' },
  { step: 17, name: 'Giải Năm (4/6)', count: 6, index: 3, digits: 4, key: 'p5', slotId: 'sim-slot-p5-3' },
  { step: 18, name: 'Giải Năm (5/6)', count: 6, index: 4, digits: 4, key: 'p5', slotId: 'sim-slot-p5-4' },
  { step: 19, name: 'Giải Năm (6/6)', count: 6, index: 5, digits: 4, key: 'p5', slotId: 'sim-slot-p5-5' },

  // 6. Giải Sáu (Quay thứ sáu - 3 giải × 3 chữ số)
  { step: 20, name: 'Giải Sáu (1/3)', count: 3, index: 0, digits: 3, key: 'p6', slotId: 'sim-slot-p6-0' },
  { step: 21, name: 'Giải Sáu (2/3)', count: 3, index: 1, digits: 3, key: 'p6', slotId: 'sim-slot-p6-1' },
  { step: 22, name: 'Giải Sáu (3/3)', count: 3, index: 2, digits: 3, key: 'p6', slotId: 'sim-slot-p6-2' },

  // 7. Giải Bảy (Quay thứ bảy - 4 giải × 2 chữ số)
  { step: 23, name: 'Giải Bảy (1/4)', count: 4, index: 0, digits: 2, key: 'p7', slotId: 'sim-slot-p7-0' },
  { step: 24, name: 'Giải Bảy (2/4)', count: 4, index: 1, digits: 2, key: 'p7', slotId: 'sim-slot-p7-1' },
  { step: 25, name: 'Giải Bảy (3/4)', count: 4, index: 2, digits: 2, key: 'p7', slotId: 'sim-slot-p7-2' },
  { step: 26, name: 'Giải Bảy (4/4)', count: 4, index: 3, digits: 2, key: 'p7', slotId: 'sim-slot-p7-3' },

  // 8. Giải Đặc Biệt (Quay cuối cùng sau Giải Bảy - 1 giải × 5 chữ số 👑)
  { step: 27, name: 'GIẢI ĐẶC BIỆT 👑', count: 1, index: 0, digits: 5, key: 'special', isSpecial: true }
];

const simState = {
  isRunning: false,
  speed: 'normal', // 'normal' | 'fast' | 'instant'
  stepIndex: 0,
  drawData: null,
  timerId: null,
  rollIntervalId: null,
  revealedLoto: [],
};

// Sinh chuỗi ngẫu nhiên có độ dài len
function generateRandomDigits(len) {
  let s = '';
  for (let i = 0; i < len; i++) {
    s += Math.floor(Math.random() * 10).toString();
  }
  return s;
}

// Sinh kết quả XSMB đầy đủ ngẫu nhiên 27 giải
function generateFullSimRecord() {
  return {
    p1: generateRandomDigits(5),
    p2: [generateRandomDigits(5), generateRandomDigits(5)],
    p3: [generateRandomDigits(5), generateRandomDigits(5), generateRandomDigits(5), generateRandomDigits(5), generateRandomDigits(5), generateRandomDigits(5)],
    p4: [generateRandomDigits(4), generateRandomDigits(4), generateRandomDigits(4), generateRandomDigits(4)],
    p5: [generateRandomDigits(4), generateRandomDigits(4), generateRandomDigits(4), generateRandomDigits(4), generateRandomDigits(4), generateRandomDigits(4)],
    p6: [generateRandomDigits(3), generateRandomDigits(3), generateRandomDigits(3)],
    p7: [generateRandomDigits(2), generateRandomDigits(2), generateRandomDigits(2), generateRandomDigits(2)],
    special: generateRandomDigits(5)
  };
}

function initSimulator() {
  resetSimulatorUI();
  renderSimLotoBoard();
}

function resetSimulatorUI() {
  stopSimulator();
  simState.stepIndex = 0;
  simState.drawData = null;
  simState.revealedLoto = [];

  if (dom.btnStartSim) {
    dom.btnStartSim.style.display = 'inline-flex';
    dom.btnStartSim.innerHTML = '▶ Bắt Đầu Quay';
  }
  if (dom.btnStopSim) dom.btnStopSim.style.display = 'none';

  if (dom.simStageText) dom.simStageText.textContent = 'Sẵn sàng quay mô phỏng';
  if (dom.simCageLabel) dom.simCageLabel.textContent = 'LỒNG CẦU QUAY SỐ XSMB';
  if (dom.simProgressFill) dom.simProgressFill.style.width = '0%';
  if (dom.simPrizeCounter) dom.simPrizeCounter.textContent = 'Tiến độ: 0/27 giải (0%)';
  if (dom.simCurrentPrizeName) dom.simCurrentPrizeName.textContent = 'Chưa bắt đầu';

  // Khởi tạo lại 5 quả bóng trên lồng cầu
  if (dom.simBallsRow) {
    dom.simBallsRow.innerHTML = `
      <div class="sim-ball">-</div>
      <div class="sim-ball">-</div>
      <div class="sim-ball">-</div>
      <div class="sim-ball">-</div>
      <div class="sim-ball">-</div>
    `;
  }

  // Khởi tạo lại các ô trên bảng giải mô phỏng
  SIM_XSMB_SEQUENCE.forEach(item => {
    if (item.isSpecial) {
      if (dom.simSpecialDigits) {
        dom.simSpecialDigits.innerHTML = `
          <div class="special-digit-ball">-</div>
          <div class="special-digit-ball">-</div>
          <div class="special-digit-ball">-</div>
          <div class="special-digit-ball last-two">-</div>
          <div class="special-digit-ball last-two">-</div>
        `;
      }
    } else {
      const el = document.getElementById(item.slotId);
      if (el) {
        el.textContent = '-'.repeat(item.digits);
        el.className = 'lottery-num sim-slot';
      }
    }
  });

  if (dom.simSummaryBox) {
    dom.simSummaryBox.style.display = 'none';
    dom.simSummaryBox.innerHTML = '';
  }

  renderSimLotoBoard();
}

function startSimulator() {
  if (simState.isRunning) return;
  if (window.soundEngine) window.soundEngine.init();

  if (!simState.drawData || simState.stepIndex >= SIM_XSMB_SEQUENCE.length) {
    simState.drawData = generateFullSimRecord();
    simState.stepIndex = 0;
    simState.revealedLoto = [];
    resetSimulatorUI();
    simState.drawData = generateFullSimRecord();
  }

  simState.isRunning = true;
  if (dom.btnStartSim) dom.btnStartSim.style.display = 'none';
  if (dom.btnStopSim) dom.btnStopSim.style.display = 'inline-flex';

  runNextSimStep();
}

function stopSimulator() {
  simState.isRunning = false;
  if (simState.timerId) {
    clearTimeout(simState.timerId);
    simState.timerId = null;
  }
  if (simState.rollIntervalId) {
    clearInterval(simState.rollIntervalId);
    simState.rollIntervalId = null;
  }
  if (dom.btnStartSim) {
    dom.btnStartSim.style.display = 'inline-flex';
    dom.btnStartSim.innerHTML = '▶ Tiếp Tục';
  }
  if (dom.btnStopSim) dom.btnStopSim.style.display = 'none';
  if (dom.simStageText && simState.stepIndex < SIM_XSMB_SEQUENCE.length) {
    dom.simStageText.textContent = `Đã tạm dừng (${simState.stepIndex}/27 giải)`;
  }
}

function setSimSpeed(speed) {
  simState.speed = speed;
  document.querySelectorAll('.sim-speed-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-speed') === speed);
  });
}

function runNextSimStep() {
  if (!simState.isRunning) return;

  if (simState.stepIndex >= SIM_XSMB_SEQUENCE.length) {
    finishSimulator();
    return;
  }

  const stepItem = SIM_XSMB_SEQUENCE[simState.stepIndex];
  const stepNum = simState.stepIndex + 1;
  const pct = Math.round((stepNum / 27) * 100);

  // Lấy giá trị trúng thưởng định sẵn cho giải hiện tại
  let finalVal = '';
  if (stepItem.isSpecial) {
    finalVal = simState.drawData.special;
  } else if (stepItem.count === 1) {
    finalVal = simState.drawData[stepItem.key];
  } else {
    finalVal = simState.drawData[stepItem.key][stepItem.index];
  }

  // Cập nhật trạng thái
  if (dom.simStageText) {
    dom.simStageText.innerHTML = stepItem.isSpecial ?
      '👑 <strong>ĐANG QUAY: GIẢI ĐẶC BIỆT!</strong>' :
      `Đang quay: <strong>${stepItem.name}</strong> (${stepNum}/27)`;
  }
  if (dom.simProgressFill) dom.simProgressFill.style.width = `${pct}%`;
  if (dom.simPrizeCounter) dom.simPrizeCounter.textContent = `Tiến độ: ${stepNum}/27 giải (${pct}%)`;
  if (dom.simCurrentPrizeName) dom.simCurrentPrizeName.textContent = `Lượt: ${stepItem.name}`;
  if (dom.simCageLabel) {
    dom.simCageLabel.textContent = `LỒNG CẦU QUAY SỐ: ${stepItem.name.toUpperCase()} (${stepItem.digits} CHỮ SỐ)`;
  }

  // Chế độ Siêu Tốc (Instant)
  if (simState.speed === 'instant') {
    revealSimStepResult(stepItem, finalVal);
    simState.stepIndex++;
    if (simState.stepIndex < SIM_XSMB_SEQUENCE.length) {
      runNextSimStep();
    } else {
      finishSimulator();
    }
    return;
  }

  // Chế độ Chuẩn (normal) hoặc Nhanh (fast)
  const isFast = simState.speed === 'fast';
  const totalTicks = isFast ? 5 : 8;
  const tickInterval = isFast ? 40 : 60;
  const delayAfterReveal = isFast ? 180 : 450;

  let ticks = 0;
  const targetSlot = stepItem.isSpecial ? null : document.getElementById(stepItem.slotId);
  if (targetSlot) targetSlot.classList.add('rolling-now');

  simState.rollIntervalId = setInterval(() => {
    ticks++;
    if (window.soundEngine) window.soundEngine.playTick();

    const dummyStr = generateRandomDigits(stepItem.digits);

    // Cập nhật bóng lồng cầu
    if (dom.simBallsRow) {
      let ballsHtml = '';
      for (let i = 0; i < 5; i++) {
        if (i < 5 - stepItem.digits) {
          ballsHtml += `<div class="sim-ball" style="opacity:0.25">-</div>`;
        } else {
          const char = dummyStr[i - (5 - stepItem.digits)] || '0';
          ballsHtml += `<div class="sim-ball rolling ${stepItem.isSpecial ? 'special' : ''}">${char}</div>`;
        }
      }
      dom.simBallsRow.innerHTML = ballsHtml;
    }

    // Cập nhật ô số trên bảng
    if (targetSlot) targetSlot.textContent = dummyStr;

    if (ticks >= totalTicks) {
      clearInterval(simState.rollIntervalId);
      simState.rollIntervalId = null;

      revealSimStepResult(stepItem, finalVal);
      simState.stepIndex++;

      simState.timerId = setTimeout(() => {
        runNextSimStep();
      }, delayAfterReveal);
    }
  }, tickInterval);
}

function revealSimStepResult(stepItem, finalVal) {
  if (stepItem.isSpecial) {
    if (window.soundEngine) window.soundEngine.playJackpot();
  } else {
    if (window.soundEngine) window.soundEngine.playReveal();
  }

  // 1. Cập nhật lồng cầu
  if (dom.simBallsRow) {
    let ballsHtml = '';
    for (let i = 0; i < 5; i++) {
      if (i < 5 - stepItem.digits) {
        ballsHtml += `<div class="sim-ball" style="opacity:0.2">-</div>`;
      } else {
        const char = finalVal[i - (5 - stepItem.digits)] || '0';
        ballsHtml += `<div class="sim-ball revealed ${stepItem.isSpecial ? 'special' : ''}">${char}</div>`;
      }
    }
    dom.simBallsRow.innerHTML = ballsHtml;
  }

  // 2. Cập nhật bảng kết quả mô phỏng
  if (stepItem.isSpecial) {
    if (dom.simSpecialDigits) {
      let html = '';
      for (let i = 0; i < finalVal.length; i++) {
        const isLastTwo = i >= finalVal.length - 2;
        html += `<div class="special-digit-ball ${isLastTwo ? 'last-two' : ''} reveal-bounce newly-revealed">${finalVal[i]}</div>`;
      }
      dom.simSpecialDigits.innerHTML = html;
    }
  } else {
    const el = document.getElementById(stepItem.slotId);
    if (el) {
      el.textContent = finalVal;
      el.className = 'lottery-num sim-slot newly-revealed';
    }
  }

  // 3. Cập nhật 2 số cuối vào bảng Đầu - Đuôi Lô tô mô phỏng
  const loto2D = finalVal.slice(-2);
  simState.revealedLoto.push(loto2D);
  renderSimLotoBoard(loto2D);
}

function renderSimLotoBoard(justAddedNumber = null) {
  if (!dom.simLotoTableBody) return;

  const heads = Array.from({ length: 10 }, () => []);
  simState.revealedLoto.forEach(num => {
    const headDigit = parseInt(num[0], 10);
    if (!isNaN(headDigit) && headDigit >= 0 && headDigit <= 9) {
      heads[headDigit].push(num);
    }
  });

  let html = '';
  for (let d = 0; d < 10; d++) {
    const list = heads[d].sort();
    const tagsHtml = list.length > 0 ?
      list.map(n => {
        const isNew = n === justAddedNumber;
        return `<span class="loto-tail-badge ${isNew ? 'reveal-bounce' : ''}" style="${isNew ? 'background:var(--gold-gradient);color:#000;font-weight:800;' : ''}">${n}</span>`;
      }).join(' ') :
      '<span style="color:var(--text-muted);font-size:0.8rem;">-</span>';

    html += `
      <tr class="loto-row">
        <td class="loto-head-cell" style="width:50px; text-align:center; font-weight:800; color:var(--gold-400);">${d}</td>
        <td class="loto-tail-cell" style="padding:0.4rem 0.75rem;">${tagsHtml}</td>
      </tr>
    `;
  }

  dom.simLotoTableBody.innerHTML = html;
}

function finishSimulator() {
  stopSimulator();
  if (window.soundEngine) window.soundEngine.playJackpot();
  if (window.confetti) window.confetti.fire(180);

  if (dom.btnStartSim) {
    dom.btnStartSim.style.display = 'inline-flex';
    dom.btnStartSim.innerHTML = '🔄 Quay Lại Từ Đầu';
  }
  if (dom.btnStopSim) dom.btnStopSim.style.display = 'none';

  if (dom.simStageText) {
    dom.simStageText.innerHTML = '🎉 <strong>HOÀN TẤT KỲ QUAY MÔ PHỎNG XSMB!</strong>';
  }
  if (dom.simProgressFill) dom.simProgressFill.style.width = '100%';
  if (dom.simPrizeCounter) dom.simPrizeCounter.textContent = '27/27 giải (100% Hoàn tất)';

  // Render tổng kết kết quả
  if (dom.simSummaryBox && simState.drawData) {
    const specialVal = simState.drawData.special;
    const deVal = specialVal.slice(-2);

    // Tính tần suất xuất hiện lô tô
    const freq = {};
    simState.revealedLoto.forEach(n => freq[n] = (freq[n] || 0) + 1);

    const multiHits = Object.entries(freq).filter(([n, c]) => c >= 2).map(([n, c]) => `<strong>${n}</strong> (${c} nháy)`);
    const doubles = simState.revealedLoto.filter(n => n[0] === n[1]);
    const uniqueDoubles = [...new Set(doubles)];

    dom.simSummaryBox.style.display = 'block';
    dom.simSummaryBox.innerHTML = `
      <div style="font-weight:800; font-size:0.95rem; color:var(--gold-400); margin-bottom:0.4rem;">
        📊 Tổng Kết Kỳ Quay Mô Phỏng
      </div>
      <div style="line-height:1.6;">
        👑 Giải Đặc Biệt: <strong style="color:var(--ruby-400); font-size:1.05rem;">${specialVal}</strong> | Đề về: <strong style="color:var(--gold-400); font-size:1.05rem;">${deVal}</strong><br>
        🍀 Lô về 2 nháy trở lên: ${multiHits.length > 0 ? multiHits.join(', ') : 'Không có'}<br>
        💎 Lô kép xuất hiện: ${uniqueDoubles.length > 0 ? uniqueDoubles.map(d => `<strong style="color:var(--cyan-400)">${d}</strong>`).join(', ') : 'Không có'}
      </div>
    `;
  }
}

// ===================================================================
// Live Draw Realtime Engine (Tự Động Cập Nhật Từng Giải 18h14 - 18h36)
// ===================================================================

let liveMonitorInterval = null;
let livePollInterval = null;

function getVietnamNow() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 7 * 3600000);
}

function isLiveDrawTime() {
  const vn = getVietnamNow();
  const mins = vn.getHours() * 60 + vn.getMinutes();
  return mins >= 18 * 60 + 13 && mins <= 18 * 60 + 36;
}

function initLiveDrawMonitor() {
  checkLiveDrawStatus();
  if (!liveMonitorInterval) {
    liveMonitorInterval = setInterval(checkLiveDrawStatus, 15000);
  }
}

function checkLiveDrawStatus() {
  const isTime = isLiveDrawTime();
  const latestRec = state.records && state.records.length > 0 ? state.records[0] : null;
  const isDrawing = latestRec && latestRec.status === 'drawing';

  if (isTime || isDrawing) {
    if (!livePollInterval) {
      console.log('[Live XSMB] Đang trong khung giờ quay thưởng, kích hoạt cập nhật từng giải...');
      pollLiveResults();
      livePollInterval = setInterval(pollLiveResults, 4000);
    }
  } else {
    if (livePollInterval) {
      console.log('[Live XSMB] Kết thúc khung giờ mở thưởng.');
      clearInterval(livePollInterval);
      livePollInterval = null;
    }
  }
}

async function pollLiveResults(isManual = false) {
  const endpoints = [
    '/api/live?t=' + Date.now(),
    'https://api.danhlo.xyz/api/live?t=' + Date.now(),
    'data/latest.json?t=' + Date.now()
  ];

  let liveData = null;
  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        liveData = await res.json();
        if (liveData && (liveData.prizes_count !== undefined || liveData.status)) {
          break;
        }
      }
    } catch (e) {
      // Bỏ qua thử endpoint tiếp theo
    }
  }

  if (!liveData || !liveData.date) return false;

  // Tính lô tô 2 số cuối nếu chưa có
  if (!liveData.loto) {
    const nums = [];
    if (liveData.special) nums.push(liveData.special);
    if (liveData.p1) nums.push(liveData.p1);
    [liveData.p2, liveData.p3, liveData.p4, liveData.p5, liveData.p6, liveData.p7].forEach(sub => {
      if (Array.isArray(sub)) {
        sub.forEach(n => { if (n) nums.push(n); });
      }
    });
    liveData.loto = nums.map(n => n.slice(-2));
  }

  let didUpdate = false;
  if (!state.records || state.records.length === 0) {
    state.records = [liveData];
    didUpdate = true;
  } else if (state.records[0].date === liveData.date) {
    const oldPrizes = state.records[0].prizes_count || (state.records[0].loto ? state.records[0].loto.length : 0);
    const newPrizes = liveData.prizes_count || (liveData.loto ? liveData.loto.length : 0);
    
    // Nếu có giải mới mở thưởng
    if (newPrizes > oldPrizes || liveData.status !== state.records[0].status || liveData.special !== state.records[0].special) {
      state.records[0] = { ...state.records[0], ...liveData };
      didUpdate = true;
      if (newPrizes > oldPrizes && state.currentIndex === 0) {
        if (window.soundEngine) window.soundEngine.playReveal();
      }
    }
  } else if (liveData.date > state.records[0].date) {
    state.records.unshift(liveData);
    state.currentIndex = 0;
    didUpdate = true;
  }

  if (didUpdate && state.currentIndex === 0) {
    renderCurrentRecord();
    renderStatistics();
  }

  // Khi đã quay xong toàn bộ 27 giải
  if (liveData.status === 'completed' && livePollInterval) {
    clearInterval(livePollInterval);
    livePollInterval = null;
    if (window.soundEngine) window.soundEngine.playJackpot();
    if (window.confetti) window.confetti.fire(90);
  }

  return didUpdate;
}

async function syncDataWithServer(isManual = false) {
  if (dom.syncIconSpin) dom.syncIconSpin.classList.add('rotating');
  try {
    // 1. Thử lấy dữ liệu live trước (đang quay hoặc vừa quay xong)
    const liveUpdated = await pollLiveResults(isManual);

    let data = null;
    // 2. Thử gọi API sync
    try {
      const res = await fetch('/api/sync?t=' + Date.now());
      if (res.ok) data = await res.json();
    } catch (apiErr) {
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

      if (serverDate && (!currentLatestDate || serverDate > currentLatestDate)) {
        if (serverRecord) {
          state.records.unshift(serverRecord);
          didUpdate = true;
        }
      } else if (serverDate && serverDate === currentLatestDate && serverRecord) {
        if (state.records[0].special !== serverRecord.special) {
          state.records[0] = serverRecord;
          didUpdate = true;
        }
      }

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

      if (didUpdate || liveUpdated) {
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
          alert(`🎉 Cập nhật thành công! Đã có kết quả mới nhất ngày ${formatDateVN(state.records[0].date)}.`);
        }
      } else {
        if (isManual) {
          const curDateStr = state.records[0] ? formatDateVN(state.records[0].date) : 'hôm nay';
          const curStatus = state.records[0] && state.records[0].status === 'drawing' ? ' (Đang mở thưởng)' : '';
          alert(`✅ Dữ liệu trên bảng đã đồng bộ mới nhất: Kỳ quay ngày ${curDateStr}${curStatus}.`);
        }
      }
    } else {
      if (liveUpdated) {
        if (isManual) alert('🎉 Đã cập nhật thành công kết quả mới nhất!');
      } else if (isManual) {
        alert('ℹ️ Dữ liệu trên bảng đã là kết quả mới nhất.');
      }
    }
  } catch (err) {
    console.warn('Sync check error:', err);
    if (isManual) {
      alert('Không thể kết nối đến máy chủ cập nhật. Vui lòng kiểm tra lại mạng.');
    }
  } finally {
    if (dom.syncIconSpin) {
      setTimeout(() => dom.syncIconSpin.classList.remove('rotating'), 600);
    }
  }
}




