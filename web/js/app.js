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
});

function cacheDOM() {
  dom.clockTime = document.getElementById('clock-time');
  dom.clockDate = document.getElementById('clock-date');
  dom.countdownTimer = document.getElementById('countdown-timer');
  dom.themeToggleBtn = document.getElementById('theme-toggle-btn');
  dom.soundToggleBtn = document.getElementById('sound-toggle-btn');
  dom.confettiCanvas = document.getElementById('confetti-canvas');

  // Live Stream & Realtime Controls
  dom.btnSyncHeader = document.getElementById('btn-sync-header');
  dom.syncIconSpin = document.getElementById('sync-icon-spin');
  dom.liveStatusBanner = document.getElementById('live-status-banner');
  dom.liveBadge = document.getElementById('live-badge');
  dom.liveBadgeText = document.getElementById('live-badge-text');
  dom.liveBannerMessage = document.getElementById('live-banner-message');
  dom.liveProgressWrap = document.getElementById('live-progress-wrap');
  dom.liveProgressFill = document.getElementById('live-progress-fill');
  dom.livePrizeCounter = document.getElementById('live-prize-counter');
  dom.liveStatusClock = document.getElementById('live-status-clock');

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
  updateLiveBannerStatus();

  // Chỉ quét NẾU ĐANG TRONG KHUNG GIỜ QUAY THƯỞNG (18:14 - 18:35) và chưa có kết quả hôm nay
  // Ngoài khung giờ: KHÔNG QUÉT (Zero network traffic)
  const todayStr = getTodayVnStr();
  const isTodayCompleted = latestRec && latestRec.date === todayStr;
  if (isLiveDrawTimeWindow() && !isTodayCompleted) {
    startLivePolling();
  } else {
    stopLivePolling();
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

    // Tự động kích hoạt quét đúng lúc 18:14 và dừng hẳn khi hết giờ hoặc đã có kết quả
    const inDrawWindow = isLiveDrawTimeWindow();
    const todayStr = getTodayVnStr();
    const latestRec = state.records && state.records.length > 0 ? state.records[0] : null;
    const isTodayCompleted = latestRec && latestRec.date === todayStr;

    if (inDrawWindow && !isTodayCompleted) {
      if (!isLivePollingRunning) {
        startLivePolling();
      }
    } else {
      if (isLivePollingRunning) {
        stopLivePolling();
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
   Auto-Sync & Real-time Live Draw Engine (Thời Gian Thực)
   =================================================================== */

let livePollTimeoutId = null;
let isLivePollingRunning = false;

// Vietnam Timezone Helper (UTC+7)
function getVnNow() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 7 * 3600000);
}

function getTodayVnStr() {
  const vnTime = getVnNow();
  const y = vnTime.getFullYear();
  const m = String(vnTime.getMonth() + 1).padStart(2, '0');
  const d = String(vnTime.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Khung giờ quay thưởng trực tiếp: 18:14 đến 18:35 hàng ngày (giờ Việt Nam)
function isLiveDrawTimeWindow() {
  const vnTime = getVnNow();
  const hour = vnTime.getHours();
  const min = vnTime.getMinutes();
  return (hour === 18 && min >= 14 && min <= 35);
}

// Bắt đầu quét trực tiếp (CHỈ KÍCH HOẠT TRONG KHUNG GIỜ 18:14 - 18:35)
function startLivePolling() {
  if (isLivePollingRunning) return;
  isLivePollingRunning = true;
  console.log('🔴 [Live Engine] Khung giờ quay thưởng (18:14 - 18:35). Bắt đầu quét kết quả trực tiếp!');
  runLivePollStep();
}

// Dừng quét hoàn toàn (Ngoài khung giờ hoặc khi đã có đủ 27/27 giải)
function stopLivePolling() {
  isLivePollingRunning = false;
  if (livePollTimeoutId) {
    clearTimeout(livePollTimeoutId);
    livePollTimeoutId = null;
  }
}

// Vòng lặp quét thời gian thực: chỉ chạy khi isLivePollingRunning = true và trong khung giờ 18:14 - 18:35
async function runLivePollStep() {
  if (!isLivePollingRunning) return;

  // Nếu đã ngoài khung giờ quay (sau 18:35 hoặc trước 18:14): dừng quét ngay lập tức
  if (!isLiveDrawTimeWindow()) {
    stopLivePolling();
    updateLiveBannerStatus();
    return;
  }

  try {
    const isStillDrawing = await checkAndUpdateLiveDraw();
    // Nếu kết quả đã đủ 27/27 giải hoặc đã hoàn tất: DỪNG QUÉT NGAY!
    if (!isStillDrawing) {
      stopLivePolling();
      return;
    }
  } catch (err) {
    console.warn('[Live Engine] Lỗi khi quét:', err);
  }

  // Nếu vẫn đang quay dở trong khung giờ 18:14 - 18:35: tiếp tục quét sau 2.5s
  if (isLivePollingRunning && isLiveDrawTimeWindow()) {
    livePollTimeoutId = setTimeout(runLivePollStep, 2500);
  } else {
    stopLivePolling();
  }
}

// Hàm lấy dữ liệu trực tiếp và cập nhật bảng giải (CHỈ GỌI KHI ĐANG TRONG KHUNG GIỜ QUAY)
async function checkAndUpdateLiveDraw() {
  let liveApi = null;
  try {
    const res = await fetch('/api/live?t=' + Date.now());
    if (res.ok) liveApi = await res.json();
  } catch (e) {
    try {
      const fbRes = await fetch('data/latest.json?t=' + Date.now());
      if (fbRes.ok) liveApi = await fbRes.json();
    } catch (fbErr) {}
  }

  if (!liveApi) return true;

  const count = liveApi.prizes_count || 0;
  const isCompleted = (liveApi.status === 'completed' || count >= 27);
  const todayVnStr = getTodayVnStr();

  // 1. KỲ QUAY ĐÃ HOÀN TẤT ĐỦ 27 GIẢI
  if (isCompleted) {
    if (state.lastLivePrizesCount > 0 && state.lastLivePrizesCount < 27) {
      if (window.soundEngine) window.soundEngine.playJackpot();
      if (window.confetti) window.confetti.fire(150);
    }
    state.lastLivePrizesCount = 27;

    const latestRec = state.records && state.records.length > 0 ? state.records[0] : null;
    if (!latestRec || latestRec.date !== liveApi.date) {
      state.records.unshift(liveApi);
      state.currentIndex = 0;
      renderCurrentRecord();
      renderStatistics();
      renderHistoryTable();
    }

    renderCompletedBanner(liveApi, todayVnStr);
    return false; // Báo hiệu đã xong -> dừng quét
  }

  // 2. ĐANG QUAY DỞ TRỰC TIẾP (0 < count < 27)
  dom.liveStatusBanner.className = 'live-banner';
  dom.liveStatusBanner.style.background = '';
  dom.liveStatusBanner.style.borderColor = '';

  if (dom.liveBadgeText) dom.liveBadgeText.textContent = '🔴 ĐANG QUAY TRỰC TIẾP';

  const pct = Math.min(100, Math.round((count / 27) * 100));

  if (dom.liveProgressFill) dom.liveProgressFill.style.width = `${pct}%`;
  if (dom.livePrizeCounter) dom.livePrizeCounter.textContent = `Tiến độ: ${count}/27 giải (${pct}%)`;
  if (dom.liveStatusClock) {
    dom.liveStatusClock.textContent = `Trực tiếp lúc ${getVnNow().toLocaleTimeString('vi-VN')} (Tự động 2.5s/lần)`;
  }

  if (dom.liveBannerMessage) {
    dom.liveBannerMessage.innerHTML = `Đang mở thưởng trực tiếp XSMB hôm nay <strong>${formatDateVN(todayVnStr)}</strong>! Đã mở <strong style="color:var(--gold-400)">${count}/27</strong> giải. Các giải đang tiếp tục quay số thời gian thực...`;
  }

  if (state.activeTab === 'board' && (state.currentIndex === 0 || dom.datePicker?.value === todayVnStr)) {
    const isNewArrival = count > state.lastLivePrizesCount;
    renderLiveDrawingBoard(liveApi, isNewArrival);
    if (isNewArrival) {
      if (window.soundEngine) window.soundEngine.playReveal();
      state.lastLivePrizesCount = count;
    }
  }

  return true; // Vẫn đang quay tiếp
}

// Cập nhật trạng thái Banner giao diện (KHÔNG GỌI QUÉT NGẦM NGOÀI GIỜ)
function updateLiveBannerStatus() {
  if (!dom.liveStatusBanner) return;

  const vnTime = getVnNow();
  const todayVnStr = getTodayVnStr();
  const latestRec = state.records && state.records.length > 0 ? state.records[0] : null;
  const isTodayDrawn = latestRec && latestRec.date === todayVnStr;

  // Trường hợp 1: Đã có kết quả ngày hôm nay
  if (isTodayDrawn) {
    stopLivePolling();
    renderCompletedBanner(latestRec, todayVnStr);
    return;
  }

  // Trường hợp 2: Đang đúng khung giờ quay trực tiếp (18:14 - 18:35)
  if (isLiveDrawTimeWindow()) {
    if (!isLivePollingRunning) {
      startLivePolling();
    }
    return;
  }

  // Trường hợp 3: Ngoài khung giờ trực tiếp -> KHÔNG QUÉT, hiển thị giao diện chờ
  stopLivePolling();

  dom.liveStatusBanner.className = 'live-banner idle';
  dom.liveStatusBanner.style.background = '';
  dom.liveStatusBanner.style.borderColor = '';

  if (dom.liveBadgeText) dom.liveBadgeText.textContent = '⏰ CHỜ QUAY (18:15)';
  if (dom.liveProgressFill) dom.liveProgressFill.style.width = '0%';
  if (dom.livePrizeCounter) dom.livePrizeCounter.textContent = 'Chờ mở thưởng: 0/27 giải';
  if (dom.liveStatusClock) dom.liveStatusClock.textContent = 'Mở thưởng lúc 18h15 hàng ngày';

  if (dom.liveBannerMessage) {
    dom.liveBannerMessage.innerHTML = `Hôm nay là <strong>${formatDateVN(todayVnStr)}</strong> (mở thưởng lúc <strong>18h15</strong>). Kết quả gần nhất là ngày <strong>${latestRec ? formatDateVN(latestRec.date) : '--'}</strong> (GĐB: <strong style="color:var(--ruby-400)">${latestRec ? latestRec.special : '--'}</strong>).`;
  }
}

// Render banner hoàn tất khi đã có đủ kết quả
function renderCompletedBanner(record, todayVnStr) {
  if (!dom.liveStatusBanner) return;
  dom.liveStatusBanner.className = 'live-banner';
  dom.liveStatusBanner.style.background = 'linear-gradient(90deg, rgba(16, 185, 129, 0.18) 0%, rgba(245, 158, 11, 0.15) 100%)';
  dom.liveStatusBanner.style.borderColor = 'rgba(16, 185, 129, 0.5)';

  if (dom.liveBadgeText) dom.liveBadgeText.textContent = '✅ ĐÃ CÓ KẾT QUẢ';
  if (dom.liveProgressFill) dom.liveProgressFill.style.width = '100%';
  if (dom.livePrizeCounter) dom.livePrizeCounter.textContent = '27/27 giải (100% Hoàn tất)';
  if (dom.liveStatusClock) dom.liveStatusClock.textContent = 'Kỳ quay hôm nay đã kết thúc';

  const specialNum = record ? record.special : '--';
  const loto2D = (specialNum && specialNum !== '--') ? specialNum.slice(-2) : '--';

  if (dom.liveBannerMessage) {
    dom.liveBannerMessage.innerHTML = `Đã có đầy đủ kết quả kỳ quay hôm nay <strong>${formatDateVN(todayVnStr)}</strong>. Giải Đặc Biệt: <strong style="color:var(--ruby-400)">${specialNum}</strong> (Lô 2 số: <strong style="color:var(--amber-400)">${loto2D}</strong>). Chúc anh em số học đại thắng!`;
  }
}

async function syncDataWithServer(isManual = false) {
  if (dom.syncIconSpin) dom.syncIconSpin.classList.add('rotating');
  try {
    let data = null;
    // 1. Try local server API
    try {
      const res = await fetch('/api/sync?t=' + Date.now());
      if (res.ok) data = await res.json();
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
          alert(`✅ Dữ liệu hiện tại đã là mới nhất: Kỳ quay ngày ${curDateStr} (Giải Đặc Biệt: ${curSpecial}). Hệ thống tự động đồng bộ theo thời gian thực!`);
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

// Render progressive draw state directly onto the main lottery board
function renderLiveDrawingBoard(liveData, isNewArrival = false) {
  if (!liveData) return;

  const dObj = new Date(liveData.date);
  const dayOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][dObj.getDay()];
  const formattedDate = formatDateVN(liveData.date);

  if (dom.boardDateLabel) {
    dom.boardDateLabel.innerHTML = `Kỳ quay: <strong>${formattedDate}</strong> (${dayOfWeek}) <span class="live-radar-badge" style="font-size:0.7rem;padding:0.15rem 0.5rem;margin-left:0.4rem">ĐANG QUAY</span>`;
  }
  if (dom.datePicker) dom.datePicker.value = liveData.date;

  // Render Special Prize
  if (dom.specialDigits) {
    if (liveData.special && liveData.special.length === 5) {
      let html = '';
      for (let i = 0; i < liveData.special.length; i++) {
        const isLastTwo = i >= liveData.special.length - 2;
        html += `<div class="special-digit-ball ${isLastTwo ? 'last-two' : ''} ${isNewArrival ? 'reveal-bounce newly-revealed' : ''}">${liveData.special[i]}</div>`;
      }
      dom.specialDigits.innerHTML = html;
      if (dom.specialLotoTag) {
        const s2d = liveData.special.slice(-2);
        dom.specialLotoTag.innerHTML = `2 số cuối: <strong>${s2d}</strong> (Đầu ${s2d[0]} - Đuôi ${s2d[1]})`;
      }
    } else {
      dom.specialDigits.innerHTML = `
        <div class="special-digit-ball">-</div>
        <div class="special-digit-ball">-</div>
        <div class="special-digit-ball">-</div>
        <div class="special-digit-ball last-two">-</div>
        <div class="special-digit-ball last-two">-</div>
      `;
      if (dom.specialLotoTag) dom.specialLotoTag.innerHTML = '2 số cuối: -- <span style="opacity:0.75">(Đang chờ mở thưởng)</span>';
    }
  }

  // Render Helper for other prize rows
  function renderPartialSlot(container, drawnList, expectedCount, digits, cssClass) {
    if (!container) return;
    const nums = drawnList || [];
    let html = '';
    for (let i = 0; i < expectedCount; i++) {
      if (i < nums.length && nums[i]) {
        const n = nums[i];
        html += `<span class="lottery-num ${cssClass} ${isNewArrival ? 'reveal-bounce newly-revealed' : ''}" data-num="${n}" data-loto="${n.slice(-2)}" onclick="highlightLotoNumber('${n.slice(-2)}')">${n}</span>`;
      } else {
        html += `<span class="lottery-num ${cssClass}" style="opacity:0.35;letter-spacing:2px;user-select:none;">${'•'.repeat(digits)}</span>`;
      }
    }
    container.innerHTML = html;
  }

  renderPartialSlot(dom.prize1Container, liveData.p1 ? [liveData.p1] : [], 1, 5, 'prize-1-num');
  renderPartialSlot(dom.prize2Container, liveData.p2, 2, 5, 'prize-2-num');
  renderPartialSlot(dom.prize3Container, liveData.p3, 6, 5, 'prize-3-num');
  renderPartialSlot(dom.prize4Container, liveData.p4, 4, 4, 'prize-4-num');
  renderPartialSlot(dom.prize5Container, liveData.p5, 6, 4, 'prize-5-num');
  renderPartialSlot(dom.prize6Container, liveData.p6, 3, 3, 'prize-6-num');
  renderPartialSlot(dom.prize7Container, liveData.p7, 4, 2, 'prize-7-num');

  // Real-time Loto 2-Digits Board update
  renderLotoBoard({
    special: liveData.special || '00000',
    loto: liveData.loto || []
  });

  // Daily pairs & kép update
  renderDailyPairs({
    special: liveData.special || '00000',
    loto: liveData.loto || []
  });
}




