/**
 * XSMB VIP - Sổ Ghi Số & Vào Tiền Hàng Ngày (Bet & Expense Notebook)
 * Tự động đối chiếu kết quả xổ số miền Bắc theo từng ngày, tính toán thắng/thua,
 * sao lưu, chia sẻ Zalo/Telegram.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'xsmb_bet_notes_v2';
  const SETTINGS_KEY = 'xsmb_bet_settings_v2';

  // Default Odds Settings
  const DEFAULT_SETTINGS = {
    loCostPerPoint: 23000,    // 1 điểm lô giá 23.000 VNĐ
    loWinPerPoint: 80000,     // 1 điểm lô trúng ăn 80.000 VNĐ
    deMultiplier: 70,         // Đề 1 ăn 70
    cang3Multiplier: 400,     // 3 càng 1 ăn 400
    xien2Multiplier: 10,      // Xiên 2: 1 ăn 10
    xien3Multiplier: 40,      // Xiên 3: 1 ăn 40
    xien4Multiplier: 100,     // Xiên 4: 1 ăn 100
  };

  class BetNotesManager {
    constructor() {
      this.notes = [];
      this.settings = { ...DEFAULT_SETTINGS };
      this.activeUnit = 'vnd'; // 'vnd' | 'diem'
      this.editingId = null;

      // Filters
      this.filterDate = 'all';
      this.filterType = 'all';
      this.filterResult = 'all';
      this.searchKeyword = '';

      this.init();
    }

    init() {
      this.loadSettings();
      this.loadNotes();
      this.cacheDOM();
      this.bindEvents();
      this.setDefaultDate();
      this.renderQuickAmountChips();
      this.render();
    }

    loadSettings() {
      try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
          this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        }
      } catch (e) {
        console.error('Error loading settings', e);
      }
    }

    saveSettings() {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
      } catch (e) {
        console.error('Error saving settings', e);
      }
    }

    loadNotes() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          this.notes = JSON.parse(saved);
        } else {
          // Pre-populate with sample note if empty
          this.notes = [
            {
              id: 'note_' + Date.now(),
              date: this.getTodayDateStr(),
              type: 'lo',
              numbers: ['68', '86'],
              numbersRaw: '68, 86',
              amount: 20,
              unit: 'diem',
              note: 'Cặp lô kết hôm nay',
              createdAt: Date.now()
            }
          ];
          this.saveNotes();
        }
      } catch (e) {
        console.error('Error loading notes', e);
        this.notes = [];
      }
    }

    saveNotes() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notes));
      } catch (e) {
        console.error('Error saving notes', e);
      }
    }

    getTodayDateStr() {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const vnTime = new Date(utc + 7 * 3600000);
      const y = vnTime.getFullYear();
      const m = String(vnTime.getMonth() + 1).padStart(2, '0');
      const d = String(vnTime.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    getYesterdayDateStr() {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const vnTime = new Date(utc + 7 * 3600000 - 86400000);
      const y = vnTime.getFullYear();
      const m = String(vnTime.getMonth() + 1).padStart(2, '0');
      const d = String(vnTime.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    getTomorrowDateStr() {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const vnTime = new Date(utc + 7 * 3600000 + 86400000);
      const y = vnTime.getFullYear();
      const m = String(vnTime.getMonth() + 1).padStart(2, '0');
      const d = String(vnTime.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    formatDateVN(dateStr) {
      if (!dateStr || !dateStr.includes('-')) return dateStr;
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    }

    formatCurrency(num) {
      return Number(num || 0).toLocaleString('vi-VN') + ' đ';
    }

    cacheDOM() {
      // Form elements
      this.dom = {
        formCardTitle: document.getElementById('form-card-title'),
        formModeBadge: document.getElementById('form-mode-badge'),
        noteEditId: document.getElementById('note-edit-id'),
        inputDate: document.getElementById('note-input-date'),
        inputNumbers: document.getElementById('note-input-numbers'),
        inputAmount: document.getElementById('note-input-amount'),
        inputDesc: document.getElementById('note-input-desc'),
        amountUnitSuffix: document.getElementById('amount-unit-suffix'),
        amountVerbalText: document.getElementById('amount-verbal-text'),
        numbersTagsPreview: document.getElementById('numbers-tags-preview'),
        numbersFormatHint: document.getElementById('numbers-format-hint'),
        quickAmountChips: document.getElementById('quick-amount-chips'),
        btnSaveNote: document.getElementById('btn-save-note'),
        btnCancelEdit: document.getElementById('btn-cancel-edit'),
        
        // Helper buttons
        btnHelperReverse: document.getElementById('btn-helper-reverse'),
        btnHelperKep: document.getElementById('btn-helper-kep'),
        btnHelperClear: document.getElementById('btn-helper-clear'),

        // Metrics
        metricTotalCost: document.getElementById('metric-total-cost'),
        metricTotalPoints: document.getElementById('metric-total-points'),
        metricPotentialWin: document.getElementById('metric-potential-win'),
        metricTotalWin: document.getElementById('metric-total-win'),
        metricWinHits: document.getElementById('metric-win-hits'),
        metricPnl: document.getElementById('metric-pnl'),
        metricWinRate: document.getElementById('metric-win-rate'),
        metricTotalEntries: document.getElementById('metric-total-entries'),
        metricPendingCount: document.getElementById('metric-pending-count'),

        // Table
        notesTableBody: document.getElementById('notes-table-body'),
        notesEmptyState: document.getElementById('notes-empty-state'),

        // Filters & Toolbar
        filterDateSelect: document.getElementById('filter-date-select'),
        filterCustomDate: document.getElementById('filter-custom-date'),
        filterTypeSelect: document.getElementById('filter-type-select'),
        filterResultSelect: document.getElementById('filter-result-select'),
        notesSearchInput: document.getElementById('notes-search-input'),

        // Top actions
        btnAutoCheck: document.getElementById('btn-notes-auto-check'),
        btnCopyReport: document.getElementById('btn-notes-copy-report'),
        btnSettingsToggle: document.getElementById('btn-notes-settings-toggle'),
        settingsPanel: document.getElementById('notes-settings-panel'),
        btnNotesMore: document.getElementById('btn-notes-more'),
        dropdownMenu: document.getElementById('notes-dropdown-menu'),

        // Settings inputs
        cfgLoCost: document.getElementById('cfg-lo-cost'),
        cfgLoWin: document.getElementById('cfg-lo-win'),
        cfgDeMulti: document.getElementById('cfg-de-multi'),
        cfgCang3Multi: document.getElementById('cfg-cang3-multi'),
        cfgXien2Multi: document.getElementById('cfg-xien2-multi'),
        cfgXien3Multi: document.getElementById('cfg-xien3-multi'),
        cfgXien4Multi: document.getElementById('cfg-xien4-multi'),
        btnSaveSettings: document.getElementById('btn-save-settings'),
        btnResetSettings: document.getElementById('btn-reset-settings'),

        // Export/Import
        btnExportJson: document.getElementById('btn-export-json'),
        btnImportJson: document.getElementById('btn-import-json'),
        btnExportCsv: document.getElementById('btn-export-csv'),
        btnClearAllNotes: document.getElementById('btn-clear-all-notes'),
        fileImportInput: document.getElementById('file-import-input')
      };
    }

    setDefaultDate() {
      if (this.dom.inputDate) {
        this.dom.inputDate.value = this.getTodayDateStr();
      }
    }

    bindEvents() {
      // Quick date chips
      document.querySelectorAll('[data-date-chip]').forEach(chip => {
        chip.addEventListener('click', () => {
          document.querySelectorAll('[data-date-chip]').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          const type = chip.getAttribute('data-date-chip');
          if (type === 'today') this.dom.inputDate.value = this.getTodayDateStr();
          else if (type === 'yesterday') this.dom.inputDate.value = this.getYesterdayDateStr();
          else if (type === 'tomorrow') this.dom.inputDate.value = this.getTomorrowDateStr();
          else if (type === 'current-board') {
            if (window.state && window.state.records && window.state.records[window.state.currentIndex]) {
              this.dom.inputDate.value = window.state.records[window.state.currentIndex].date;
            }
          }
        });
      });

      // Type radio changes
      document.querySelectorAll('input[name="bet-type"]').forEach(radio => {
        radio.addEventListener('change', () => {
          this.onBetTypeChange(radio.value);
        });
      });

      // Unit toggle (VNĐ / Điểm)
      document.querySelectorAll('.unit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.activeUnit = btn.getAttribute('data-unit');
          this.onUnitChange(this.activeUnit);
        });
      });

      // Numbers input live typing
      if (this.dom.inputNumbers) {
        this.dom.inputNumbers.addEventListener('input', () => {
          this.updateNumbersPreview();
        });
      }

      // Amount input live change
      if (this.dom.inputAmount) {
        this.dom.inputAmount.addEventListener('input', () => {
          this.updateAmountVerbal();
        });
      }

      // Helper buttons
      if (this.dom.btnHelperReverse) {
        this.dom.btnHelperReverse.addEventListener('click', () => this.helperReverse());
      }
      if (this.dom.btnHelperKep) {
        this.dom.btnHelperKep.addEventListener('click', () => this.helperKep());
      }
      if (this.dom.btnHelperClear) {
        this.dom.btnHelperClear.addEventListener('click', () => {
          this.dom.inputNumbers.value = '';
          this.updateNumbersPreview();
        });
      }

      // Save / Edit Submit
      if (this.dom.btnSaveNote) {
        this.dom.btnSaveNote.addEventListener('click', () => this.handleSubmitNote());
      }
      if (this.dom.btnCancelEdit) {
        this.dom.btnCancelEdit.addEventListener('click', () => this.resetForm());
      }

      // Filter events
      if (this.dom.filterDateSelect) {
        this.dom.filterDateSelect.addEventListener('change', e => {
          this.filterDate = e.target.value;
          if (this.dom.filterCustomDate) {
            this.dom.filterCustomDate.style.display = this.filterDate === 'custom' ? 'inline-block' : 'none';
          }
          this.render();
        });
      }

      if (this.dom.filterCustomDate) {
        this.dom.filterCustomDate.addEventListener('change', () => {
          this.render();
        });
      }

      if (this.dom.filterTypeSelect) {
        this.dom.filterTypeSelect.addEventListener('change', e => {
          this.filterType = e.target.value;
          this.render();
        });
      }

      if (this.dom.filterResultSelect) {
        this.dom.filterResultSelect.addEventListener('change', e => {
          this.filterResult = e.target.value;
          this.render();
        });
      }

      if (this.dom.notesSearchInput) {
        this.dom.notesSearchInput.addEventListener('input', e => {
          this.searchKeyword = e.target.value.trim().toLowerCase();
          this.render();
        });
      }

      // Top Actions
      if (this.dom.btnAutoCheck) {
        this.dom.btnAutoCheck.addEventListener('click', () => {
          this.render();
          this.showToast('✅ Đã cập nhật và đối chiếu kết quả mới nhất!', 'success');
        });
      }

      if (this.dom.btnCopyReport) {
        this.dom.btnCopyReport.addEventListener('click', () => this.copyReportZalo());
      }

      if (this.dom.btnSettingsToggle) {
        this.dom.btnSettingsToggle.addEventListener('click', () => {
          const isShown = this.dom.settingsPanel.style.display === 'block';
          this.dom.settingsPanel.style.display = isShown ? 'none' : 'block';
          if (!isShown) this.fillSettingsInputs();
        });
      }

      if (this.dom.btnNotesMore) {
        this.dom.btnNotesMore.addEventListener('click', e => {
          e.stopPropagation();
          const isVisible = this.dom.dropdownMenu.classList.contains('show');
          if (isVisible) this.dom.dropdownMenu.classList.remove('show');
          else this.dom.dropdownMenu.classList.add('show');
        });

        document.addEventListener('click', () => {
          if (this.dom.dropdownMenu) this.dom.dropdownMenu.classList.remove('show');
        });
      }

      // Settings Save/Reset
      if (this.dom.btnSaveSettings) {
        this.dom.btnSaveSettings.addEventListener('click', () => this.handleSaveSettings());
      }
      if (this.dom.btnResetSettings) {
        this.dom.btnResetSettings.addEventListener('click', () => {
          this.settings = { ...DEFAULT_SETTINGS };
          this.saveSettings();
          this.fillSettingsInputs();
          this.render();
          this.showToast('Đã khôi phục tỷ lệ cược mặc định!', 'info');
        });
      }

      // Backup & Restore
      if (this.dom.btnExportJson) {
        this.dom.btnExportJson.addEventListener('click', () => this.exportJson());
      }
      if (this.dom.btnExportCsv) {
        this.dom.btnExportCsv.addEventListener('click', () => this.exportCsv());
      }
      if (this.dom.btnImportJson) {
        this.dom.btnImportJson.addEventListener('click', () => {
          if (this.dom.fileImportInput) this.dom.fileImportInput.click();
        });
      }
      if (this.dom.fileImportInput) {
        this.dom.fileImportInput.addEventListener('change', e => this.handleFileImport(e));
      }
      if (this.dom.btnClearAllNotes) {
        this.dom.btnClearAllNotes.addEventListener('click', () => this.clearAllNotes());
      }
    }

    onBetTypeChange(type) {
      if (type === 'lo') {
        this.dom.numbersFormatHint.textContent = 'Gõ các số 2 chữ số (vd: 68, 86 hoặc 52)';
        this.setUnit('diem');
      } else if (type === 'de') {
        this.dom.numbersFormatHint.textContent = 'Gõ 2 số cuối giải Đặc Biệt (vd: 51, 68, 99)';
        this.setUnit('vnd');
      } else if (type === 'xien2') {
        this.dom.numbersFormatHint.textContent = 'Nhập đúng 2 con số (vd: 68, 86)';
        this.setUnit('vnd');
      } else if (type === 'xien3') {
        this.dom.numbersFormatHint.textContent = 'Nhập đúng 3 con số (vd: 12, 34, 56)';
        this.setUnit('vnd');
      } else if (type === 'cang3') {
        this.dom.numbersFormatHint.textContent = 'Gõ các số 3 chữ số (vd: 951, 789)';
        this.setUnit('vnd');
      } else {
        this.dom.numbersFormatHint.textContent = 'Gõ các con số muốn ghi nhớ';
        this.setUnit('vnd');
      }
      this.updateNumbersPreview();
    }

    setUnit(unit) {
      this.activeUnit = unit;
      document.querySelectorAll('.unit-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-unit') === unit);
      });
      this.onUnitChange(unit);
    }

    onUnitChange(unit) {
      if (this.dom.amountUnitSuffix) {
        this.dom.amountUnitSuffix.textContent = unit === 'vnd' ? 'VNĐ' : 'Điểm';
      }
      if (unit === 'diem') {
        if (!this.dom.inputAmount.value || Number(this.dom.inputAmount.value) > 1000) {
          this.dom.inputAmount.value = '10';
        }
      } else {
        if (!this.dom.inputAmount.value || Number(this.dom.inputAmount.value) < 1000) {
          this.dom.inputAmount.value = '50000';
        }
      }
      this.renderQuickAmountChips();
      this.updateAmountVerbal();
    }

    renderQuickAmountChips() {
      if (!this.dom.quickAmountChips) return;
      let chipsHtml = '';
      if (this.activeUnit === 'diem') {
        const diemValues = [5, 10, 20, 50, 100];
        chipsHtml = diemValues.map(v => 
          `<button type="button" class="quick-chip" onclick="window.betNotesManager.addAmount(${v})">+${v}đ</button>`
        ).join('');
      } else {
        const vndValues = [
          { label: '+20k', val: 20000 },
          { label: '+50k', val: 50000 },
          { label: '+100k', val: 100000 },
          { label: '+200k', val: 200000 },
          { label: '+500k', val: 500000 },
          { label: '+1M', val: 1000000 },
        ];
        chipsHtml = vndValues.map(v => 
          `<button type="button" class="quick-chip" onclick="window.betNotesManager.addAmount(${v.val})">${v.label}</button>`
        ).join('');
      }
      chipsHtml += `<button type="button" class="quick-chip" onclick="window.betNotesManager.resetAmount()" style="color:var(--brand-red);">Xóa</button>`;
      this.dom.quickAmountChips.innerHTML = chipsHtml;
    }

    addAmount(val) {
      const current = Number(this.dom.inputAmount.value) || 0;
      this.dom.inputAmount.value = current + val;
      this.updateAmountVerbal();
    }

    resetAmount() {
      this.dom.inputAmount.value = '';
      this.updateAmountVerbal();
    }

    updateAmountVerbal() {
      if (!this.dom.amountVerbalText) return;
      const val = Number(this.dom.inputAmount.value) || 0;
      if (val <= 0) {
        this.dom.amountVerbalText.textContent = '';
        return;
      }
      if (this.activeUnit === 'diem') {
        const costVnd = val * (this.settings.loCostPerPoint || 23000);
        this.dom.amountVerbalText.textContent = `${val} điểm (khoảng ${this.formatCurrency(costVnd)})`;
      } else {
        this.dom.amountVerbalText.textContent = this.formatCurrency(val);
      }
    }

    parseNumbers(rawStr, type) {
      if (!rawStr) return [];
      // Clean string: split by comma, space, dash, semicolon
      const tokens = rawStr.split(/[\s,;\-]+/).map(s => s.trim()).filter(s => s.length > 0);
      const isCang3 = type === 'cang3';
      
      const res = [];
      tokens.forEach(tok => {
        // Remove non-digit
        const digits = tok.replace(/\D/g, '');
        if (!digits) return;
        if (isCang3) {
          // pad to 3 digits if length <= 3
          const formatted = digits.slice(-3).padStart(3, '0');
          if (!res.includes(formatted)) res.push(formatted);
        } else {
          // 2 digits
          const formatted = digits.slice(-2).padStart(2, '0');
          if (!res.includes(formatted)) res.push(formatted);
        }
      });
      return res;
    }

    updateNumbersPreview() {
      if (!this.dom.numbersTagsPreview) return;
      const type = document.querySelector('input[name="bet-type"]:checked')?.value || 'lo';
      const nums = this.parseNumbers(this.dom.inputNumbers.value, type);
      if (nums.length === 0) {
        this.dom.numbersTagsPreview.innerHTML = '';
        return;
      }

      this.dom.numbersTagsPreview.innerHTML = `
        <span class="preview-count">Đã nhập ${nums.length} số:</span>
        ${nums.map(n => `<span class="number-tag">${n}</span>`).join('')}
      `;
    }

    helperReverse() {
      const type = document.querySelector('input[name="bet-type"]:checked')?.value || 'lo';
      const nums = this.parseNumbers(this.dom.inputNumbers.value, type);
      if (nums.length === 0) return;

      const newNums = [...nums];
      nums.forEach(n => {
        if (n.length === 2) {
          const rev = n[1] + n[0];
          if (!newNums.includes(rev)) newNums.push(rev);
        }
      });
      this.dom.inputNumbers.value = newNums.join(', ');
      this.updateNumbersPreview();
    }

    helperKep() {
      const kep = ['00', '11', '22', '33', '44', '55', '66', '77', '88', '99'];
      this.dom.inputNumbers.value = kep.join(', ');
      this.updateNumbersPreview();
    }

    openForDate(dateStr) {
      if (window.switchTab) window.switchTab('notes');
      if (this.dom.inputDate) this.dom.inputDate.value = dateStr;
      if (this.dom.filterDateSelect) {
        this.dom.filterDateSelect.value = 'all';
      }
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    handleSubmitNote() {
      const date = this.dom.inputDate.value;
      if (!date) {
        alert('Vui lòng chọn ngày!');
        return;
      }

      const type = document.querySelector('input[name="bet-type"]:checked')?.value || 'lo';
      const rawNumbers = this.dom.inputNumbers.value.trim();
      const numbers = this.parseNumbers(rawNumbers, type);

      if (numbers.length === 0) {
        alert('Vui lòng nhập ít nhất 1 con số hợp lệ!');
        this.dom.inputNumbers.focus();
        return;
      }

      // Check xiên conditions
      if (type === 'xien2' && numbers.length < 2) {
        alert('Xiên 2 cần nhập đủ ít nhất 2 con số!');
        return;
      }
      if (type === 'xien3' && numbers.length < 3) {
        alert('Xiên 3 cần nhập đủ ít nhất 3 con số!');
        return;
      }

      const amount = Number(this.dom.inputAmount.value);
      if (!amount || amount <= 0) {
        alert('Vui lòng nhập số tiền hoặc điểm cược hợp lệ!');
        this.dom.inputAmount.focus();
        return;
      }

      const noteDesc = this.dom.inputDesc.value.trim();

      if (this.editingId) {
        // Update existing note
        const idx = this.notes.findIndex(n => n.id === this.editingId);
        if (idx !== -1) {
          this.notes[idx] = {
            ...this.notes[idx],
            date,
            type,
            numbers,
            numbersRaw: numbers.join(', '),
            amount,
            unit: this.activeUnit,
            note: noteDesc,
            updatedAt: Date.now()
          };
          this.showToast('✅ Đã cập nhật ghi chú thành công!', 'success');
        }
      } else {
        // Create new note
        const newNote = {
          id: 'bet_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          date,
          type,
          numbers,
          numbersRaw: numbers.join(', '),
          amount,
          unit: this.activeUnit,
          note: noteDesc,
          createdAt: Date.now()
        };
        this.notes.unshift(newNote);
        this.showToast('🎉 Đã thêm vào sổ ghi thành công!', 'success');
      }

      this.saveNotes();
      this.resetForm();
      this.render();
    }

    resetForm() {
      this.editingId = null;
      if (this.dom.noteEditId) this.dom.noteEditId.value = '';
      if (this.dom.formCardTitle) this.dom.formCardTitle.textContent = '➕ Ghi Số & Vào Tiền';
      if (this.dom.formModeBadge) {
        this.dom.formModeBadge.textContent = 'Thêm mới';
        this.dom.formModeBadge.className = 'header-badge';
      }
      if (this.dom.btnSaveNote) this.dom.btnSaveNote.textContent = '💾 Lưu Vào Sổ Ghi';
      if (this.dom.btnCancelEdit) this.dom.btnCancelEdit.style.display = 'none';

      if (this.dom.inputNumbers) this.dom.inputNumbers.value = '';
      if (this.dom.inputDesc) this.dom.inputDesc.value = '';
      this.updateNumbersPreview();
      this.updateAmountVerbal();
    }

    editNote(id) {
      const note = this.notes.find(n => n.id === id);
      if (!note) return;

      this.editingId = id;
      this.dom.noteEditId.value = id;
      this.dom.inputDate.value = note.date;

      // Select type radio
      const radio = document.querySelector(`input[name="bet-type"][value="${note.type}"]`);
      if (radio) {
        radio.checked = true;
        this.onBetTypeChange(note.type);
      }

      // Unit
      this.setUnit(note.unit || 'vnd');
      this.dom.inputAmount.value = note.amount;
      this.dom.inputNumbers.value = (note.numbers || []).join(', ');
      this.dom.inputDesc.value = note.note || '';

      this.updateNumbersPreview();
      this.updateAmountVerbal();

      if (this.dom.formCardTitle) this.dom.formCardTitle.textContent = '✏️ Chỉnh Sửa Ghi Chú';
      if (this.dom.formModeBadge) {
        this.dom.formModeBadge.textContent = 'Đang sửa';
        this.dom.formModeBadge.className = 'header-badge badge-warning';
      }
      if (this.dom.btnSaveNote) this.dom.btnSaveNote.textContent = '💾 Cập Nhật Ghi Chú';
      if (this.dom.btnCancelEdit) this.dom.btnCancelEdit.style.display = 'inline-flex';

      window.scrollTo({ top: 120, behavior: 'smooth' });
    }

    deleteNote(id) {
      if (!confirm('Bạn có chắc chắn muốn xóa ghi chú này không?')) return;
      this.notes = this.notes.filter(n => n.id !== id);
      this.saveNotes();
      if (this.editingId === id) this.resetForm();
      this.render();
      this.showToast('🗑️ Đã xóa ghi chú!', 'info');
    }

    clearAllNotes() {
      if (!confirm('CẢNH BÁO: Thao tác này sẽ xóa toàn bộ danh sách ghi chú!\nBạn có chắc chắn muốn xóa không?')) return;
      this.notes = [];
      this.saveNotes();
      this.resetForm();
      this.render();
      this.showToast('Đã xóa sạch toàn bộ sổ ghi!', 'info');
    }

    /* ===================================================================
       Core Verification Engine: Check Bet vs Lottery Results
       =================================================================== */
    checkNoteResult(note) {
      const result = {
        status: 'pending',      // 'win' | 'lose' | 'pending' | 'no_data'
        statusLabel: 'Chờ quay',
        badgeClass: 'badge-pending',
        hitsCount: 0,
        winNumbers: [],
        details: '',
        totalCost: 0,
        potentialWin: 0,
        potentialWinPerNum: 0,
        totalWin: 0,
        pnl: 0,
        recordFound: false,
        specialNumber: ''
      };

      // 1. Calculate Cost
      const countNums = (note.numbers && note.numbers.length > 0) ? note.numbers.length : 1;
      if (note.unit === 'diem') {
        const costPerPoint = this.settings.loCostPerPoint || 23000;
        result.totalCost = note.amount * costPerPoint * countNums;
      } else {
        // Xiên: Bet amount is for the whole combination
        if (note.type.startsWith('xien')) {
          result.totalCost = note.amount;
        } else {
          result.totalCost = note.amount * countNums;
        }
      }

      // Calculate Potential Win (Số tiền tạm tính theo kết quả trúng)
      if (note.type === 'lo') {
        if (note.unit === 'diem') {
          result.potentialWinPerNum = note.amount * (this.settings.loWinPerPoint || 80000);
        } else {
          const pointEquiv = note.amount / (this.settings.loCostPerPoint || 23000);
          result.potentialWinPerNum = Math.round(pointEquiv * (this.settings.loWinPerPoint || 80000));
        }
        result.potentialWin = result.potentialWinPerNum * countNums;
      } else if (note.type === 'de') {
        const multi = this.settings.deMultiplier || 70;
        result.potentialWin = note.amount * multi;
        result.potentialWinPerNum = result.potentialWin;
      } else if (note.type === 'cang3') {
        const multi = this.settings.cang3Multiplier || 400;
        result.potentialWin = note.amount * multi;
        result.potentialWinPerNum = result.potentialWin;
      } else if (note.type.startsWith('xien')) {
        let multi = this.settings.xien2Multiplier || 10;
        if (note.numbers.length === 3) multi = this.settings.xien3Multiplier || 40;
        if (note.numbers.length >= 4) multi = this.settings.xien4Multiplier || 100;
        result.potentialWin = note.amount * multi;
        result.potentialWinPerNum = result.potentialWin;
      } else {
        result.potentialWin = note.amount;
        result.potentialWinPerNum = result.potentialWin;
      }

      // 2. Find Lottery Record for Note's Date
      const records = (window.state && window.state.records) ? window.state.records : [];
      const rec = records.find(r => r.date === note.date);

      if (!rec || !rec.loto || rec.loto.length === 0) {
        // Check if date is today/future or past without data
        const today = this.getTodayDateStr();
        if (note.date > today) {
          result.status = 'pending';
          result.statusLabel = 'Kỳ quay tương lai';
          result.badgeClass = 'badge-pending';
          result.details = 'Chưa mở thưởng';
        } else if (note.date === today) {
          // Check live status if available
          if (rec && rec.status === 'drawing') {
            result.status = 'pending';
            result.statusLabel = 'Đang quay 🔴';
            result.badgeClass = 'badge-live';
            result.details = 'Đang mở thưởng 18h15';
          } else {
            result.status = 'pending';
            result.statusLabel = 'Chờ 18h15 ⏳';
            result.badgeClass = 'badge-pending';
            result.details = 'Mở thưởng lúc 18h15';
          }
        } else {
          result.status = 'no_data';
          result.statusLabel = 'Chưa có KQ';
          result.badgeClass = 'badge-muted';
          result.details = 'Không tìm thấy KQ ngày này';
        }
        result.pnl = -result.totalCost;
        return result;
      }

      result.recordFound = true;
      result.specialNumber = rec.special || '';
      const special2D = rec.special ? rec.special.slice(-2) : '';
      const special3D = rec.special ? rec.special.slice(-3) : '';
      const lotoList = rec.loto || [];

      // 3. Process by Bet Type
      if (note.type === 'lo') {
        // Bao Lô: Count hits across all 27 prizes
        let totalHits = 0;
        const hitDetails = [];

        note.numbers.forEach(num => {
          const hits = lotoList.filter(x => x === num).length;
          if (hits > 0) {
            totalHits += hits;
            result.winNumbers.push(num);
            hitDetails.push(`${num} (${hits} nháy)`);
          }
        });

        result.hitsCount = totalHits;
        if (totalHits > 0) {
          result.status = 'win';
          result.statusLabel = `Trúng ${totalHits} nháy! 🌟`;
          result.badgeClass = 'badge-win';
          result.details = `Về: ${hitDetails.join(', ')}`;

          if (note.unit === 'diem') {
            result.totalWin = totalHits * note.amount * (this.settings.loWinPerPoint || 80000);
          } else {
            // Proportional VND
            const pointEquiv = note.amount / (this.settings.loCostPerPoint || 23000);
            result.totalWin = totalHits * pointEquiv * (this.settings.loWinPerPoint || 80000);
          }
        } else {
          result.status = 'lose';
          result.statusLabel = 'Không về ❌';
          result.badgeClass = 'badge-lose';
          result.details = '0 / ' + note.numbers.length + ' con';
          result.totalWin = 0;
        }

      } else if (note.type === 'de') {
        // Đề: Matches last 2 digits of Đặc Biệt
        const isMatched = note.numbers.includes(special2D);
        if (isMatched) {
          result.status = 'win';
          result.statusLabel = `Trúng Đề ${special2D}! 🎯`;
          result.badgeClass = 'badge-win-special';
          result.hitsCount = 1;
          result.winNumbers.push(special2D);
          result.details = `Khớp giải ĐB: ${rec.special}`;

          const multiplier = this.settings.deMultiplier || 70;
          result.totalWin = note.amount * multiplier;
        } else {
          result.status = 'lose';
          result.statusLabel = `Về ĐB: ${special2D} ❌`;
          result.badgeClass = 'badge-lose';
          result.details = `Giải ĐB: ${rec.special}`;
          result.totalWin = 0;
        }

      } else if (note.type === 'cang3') {
        // 3 Càng: Matches last 3 digits of Đặc Biệt
        const isMatched = note.numbers.includes(special3D);
        if (isMatched) {
          result.status = 'win';
          result.statusLabel = `Trúng 3 Càng ${special3D}! 🔥`;
          result.badgeClass = 'badge-win-special';
          result.hitsCount = 1;
          result.winNumbers.push(special3D);
          result.details = `Khớp 3 số cuối ĐB: ${rec.special}`;

          const multiplier = this.settings.cang3Multiplier || 400;
          result.totalWin = note.amount * multiplier;
        } else {
          result.status = 'lose';
          result.statusLabel = `Về ${special3D} ❌`;
          result.badgeClass = 'badge-lose';
          result.details = `Giải ĐB: ${rec.special}`;
          result.totalWin = 0;
        }

      } else if (note.type.startsWith('xien')) {
        // Xiên 2, 3, 4: All numbers must appear in lotoList
        const matched = note.numbers.filter(num => lotoList.includes(num));
        const totalNeeded = note.numbers.length;

        if (matched.length === totalNeeded && totalNeeded >= 2) {
          result.status = 'win';
          result.statusLabel = `Trúng Xiên ${totalNeeded}! 🎉`;
          result.badgeClass = 'badge-win';
          result.hitsCount = 1;
          result.winNumbers = [...matched];
          result.details = `Về đủ cả ${totalNeeded} số: ${matched.join(', ')}`;

          let multi = this.settings.xien2Multiplier || 10;
          if (totalNeeded === 3) multi = this.settings.xien3Multiplier || 40;
          if (totalNeeded >= 4) multi = this.settings.xien4Multiplier || 100;

          result.totalWin = note.amount * multi;
        } else {
          result.status = 'lose';
          result.statusLabel = `Trượt Xiên (${matched.length}/${totalNeeded}) ❌`;
          result.badgeClass = 'badge-lose';
          result.details = matched.length > 0 ? `Chỉ về: ${matched.join(', ')}` : 'Không về số nào';
          result.totalWin = 0;
        }

      } else {
        // Khác / Tự do
        const matched = note.numbers.filter(num => lotoList.includes(num));
        if (matched.length > 0) {
          result.status = 'win';
          result.statusLabel = `Khớp ${matched.length} số 🌟`;
          result.badgeClass = 'badge-win';
          result.winNumbers = matched;
          result.details = `Về: ${matched.join(', ')}`;
        } else {
          result.status = 'lose';
          result.statusLabel = 'Không về ❌';
          result.badgeClass = 'badge-lose';
          result.details = 'Không khớp số nào';
        }
      }

      result.pnl = result.totalWin - result.totalCost;
      return result;
    }

    /* ===================================================================
       Render Engine
       =================================================================== */
    render() {
      if (!this.dom.notesTableBody) return;

      const filtered = this.getFilteredNotes();

      // Compute aggregates
      let totalCost = 0;
      let totalPotentialWin = 0;
      let totalWin = 0;
      let totalHits = 0;
      let winCount = 0;
      let pendingCount = 0;
      let totalPoints = 0;

      const tableRowsHtml = filtered.map(note => {
        const check = this.checkNoteResult(note);

        totalCost += check.totalCost;
        totalPotentialWin += check.potentialWin;
        totalWin += check.totalWin;
        if (check.status === 'win') {
          winCount++;
          totalHits += check.hitsCount;
        } else if (check.status === 'pending') {
          pendingCount++;
        }

        if (note.unit === 'diem') {
          totalPoints += (note.amount * (note.numbers ? note.numbers.length : 1));
        }

        return this.renderNoteRow(note, check);
      }).join('');

      this.dom.notesTableBody.innerHTML = tableRowsHtml;

      // Toggle empty state
      if (filtered.length === 0) {
        if (this.dom.notesEmptyState) this.dom.notesEmptyState.style.display = 'block';
        if (this.dom.notesTableBody) this.dom.notesTableBody.style.display = 'none';
      } else {
        if (this.dom.notesEmptyState) this.dom.notesEmptyState.style.display = 'none';
        if (this.dom.notesTableBody) this.dom.notesTableBody.style.display = '';
      }

      // Update Dashboard Metrics
      const netPnl = totalWin - totalCost;
      if (this.dom.metricTotalCost) this.dom.metricTotalCost.textContent = this.formatCurrency(totalCost);
      if (this.dom.metricTotalPoints) this.dom.metricTotalPoints.textContent = totalPoints > 0 ? `${totalPoints} điểm lô` : '0 điểm';
      if (this.dom.metricPotentialWin) this.dom.metricPotentialWin.textContent = this.formatCurrency(totalPotentialWin);
      if (this.dom.metricTotalWin) this.dom.metricTotalWin.textContent = this.formatCurrency(totalWin);
      if (this.dom.metricWinHits) this.dom.metricWinHits.textContent = `${totalHits} nháy / ${winCount} mục trúng`;

      if (this.dom.metricPnl) {
        const sign = netPnl > 0 ? '+' : '';
        this.dom.metricPnl.textContent = `${sign}${this.formatCurrency(netPnl)}`;
        this.dom.metricPnl.className = 'metric-value ' + (netPnl > 0 ? 'text-success' : (netPnl < 0 ? 'text-danger' : ''));
      }

      if (this.dom.metricWinRate) {
        const decidedCount = filtered.length - pendingCount;
        const rate = decidedCount > 0 ? Math.round((winCount / decidedCount) * 100) : 0;
        this.dom.metricWinRate.textContent = `Tỷ lệ thắng: ${rate}% (${winCount}/${decidedCount})`;
      }

      if (this.dom.metricTotalEntries) this.dom.metricTotalEntries.textContent = `${filtered.length} mục`;
      if (this.dom.metricPendingCount) this.dom.metricPendingCount.textContent = `${pendingCount} mục chờ quay`;
    }

    renderNoteRow(note, check) {
      const typeLabels = {
        lo: { label: 'Bao Lô', class: 'type-badge-lo' },
        de: { label: 'Đề ĐB', class: 'type-badge-de' },
        xien2: { label: 'Xiên 2', class: 'type-badge-xien' },
        xien3: { label: 'Xiên 3', class: 'type-badge-xien' },
        cang3: { label: '3 Càng', class: 'type-badge-cang' },
        khac: { label: 'Khác', class: 'type-badge-khac' }
      };

      const typeMeta = typeLabels[note.type] || typeLabels.khac;

      // Render numbers with highlight for winners
      const numbersHtml = (note.numbers || []).map(num => {
        const isWin = (check.winNumbers || []).includes(num);
        return `<span class="note-num-ball ${isWin ? 'num-ball-winner' : ''}">${num}</span>`;
      }).join(' ');

      // Format Amount Display
      let amountDisplay = '';
      if (note.unit === 'diem') {
        amountDisplay = `<strong class="amount-val">${note.amount}</strong> <span class="unit-tag">điểm</span>`;
        amountDisplay += `<div class="sub-cost">${this.formatCurrency(check.totalCost)}</div>`;
      } else {
        amountDisplay = `<strong class="amount-val">${this.formatCurrency(note.amount)}</strong>`;
        if (note.numbers && note.numbers.length > 1 && !note.type.startsWith('xien')) {
          amountDisplay += `<div class="sub-cost">x${note.numbers.length} = ${this.formatCurrency(check.totalCost)}</div>`;
        }
      }

      // Format Tạm Tính Display (Tiền trúng theo tỷ lệ nếu các con số đều về)
      let potentialDisplay = `<strong class="potential-win-val">${this.formatCurrency(check.potentialWin)}</strong>`;
      if (note.type === 'lo' && note.numbers && note.numbers.length > 1) {
        potentialDisplay += `<div class="sub-cost">${this.formatCurrency(check.potentialWinPerNum)}/con</div>`;
      }

      // Format Thực Tế Display (Số tiền thực nhận hoặc mất sau khi có kết quả)
      let actualDisplay = '';
      if (check.status === 'win') {
        actualDisplay = `
          <span class="pnl-win">+${this.formatCurrency(check.totalWin)}</span>
          <div class="pnl-net text-success">Lãi: +${this.formatCurrency(check.pnl)}</div>
        `;
      } else if (check.status === 'lose') {
        actualDisplay = `
          <span class="pnl-lose">-${this.formatCurrency(check.totalCost)}</span>
          <div class="pnl-net text-danger">Thua</div>
        `;
      } else if (check.status === 'pending') {
        actualDisplay = `<span class="pnl-pending">Chờ KQ ⏳</span>`;
      } else {
        actualDisplay = `<span class="pnl-pending" style="color:var(--text-muted);">Chưa có KQ</span>`;
      }

      return `
        <tr class="note-table-row status-${check.status}">
          <td>
            <a href="javascript:void(0)" onclick="window.betNotesManager.jumpToBoardDate('${note.date}')" class="date-link" title="Bấm để xem Bảng kết quả 27 giải ngày này">
              📅 ${this.formatDateVN(note.date)}
            </a>
          </td>
          <td>
            <span class="type-badge ${typeMeta.class}">${typeMeta.label}</span>
          </td>
          <td>
            <div class="note-numbers-list">${numbersHtml}</div>
          </td>
          <td style="text-align: right;">
            ${amountDisplay}
          </td>
          <td>
            <div class="result-cell-flex">
              <span class="result-badge ${check.badgeClass}">${check.statusLabel}</span>
              ${check.details ? `<span class="result-detail-text">${check.details}</span>` : ''}
            </div>
          </td>
          <td style="text-align: right;">
            ${potentialDisplay}
          </td>
          <td style="text-align: right;">
            ${actualDisplay}
          </td>
          <td>
            <span class="note-desc-text" title="${note.note || ''}">${note.note || '—'}</span>
          </td>
          <td style="text-align: center;">
            <div class="action-btn-group">
              <button class="btn-action-icon" onclick="window.betNotesManager.editNote('${note.id}')" title="Sửa ghi chú">✏️</button>
              <button class="btn-action-icon btn-action-delete" onclick="window.betNotesManager.deleteNote('${note.id}')" title="Xóa ghi chú">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }

    jumpToBoardDate(dateStr) {
      if (window.jumpToDate) {
        window.jumpToDate(dateStr);
        if (window.switchTab) window.switchTab('board');
      }
    }

    getFilteredNotes() {
      const today = this.getTodayDateStr();
      const yesterday = this.getYesterdayDateStr();

      return this.notes.filter(note => {
        // Date filter
        if (this.filterDate === 'today' && note.date !== today) return false;
        if (this.filterDate === 'yesterday' && note.date !== yesterday) return false;
        if (this.filterDate === 'this-week') {
          const noteTime = new Date(note.date).getTime();
          const sevenDaysAgo = Date.now() - 7 * 86400000;
          if (noteTime < sevenDaysAgo) return false;
        }
        if (this.filterDate === 'this-month') {
          const currentMonth = today.substring(0, 7);
          if (!note.date.startsWith(currentMonth)) return false;
        }
        if (this.filterDate === 'custom') {
          const customVal = this.dom.filterCustomDate?.value;
          if (customVal && note.date !== customVal) return false;
        }

        // Type filter
        if (this.filterType !== 'all') {
          if (this.filterType === 'xien') {
            if (!note.type.startsWith('xien')) return false;
          } else if (note.type !== this.filterType) {
            return false;
          }
        }

        // Result filter
        if (this.filterResult !== 'all') {
          const check = this.checkNoteResult(note);
          if (this.filterResult === 'win' && check.status !== 'win') return false;
          if (this.filterResult === 'lose' && check.status !== 'lose') return false;
          if (this.filterResult === 'pending' && check.status !== 'pending') return false;
        }

        // Keyword search
        if (this.searchKeyword) {
          const matchNum = (note.numbers || []).some(n => n.includes(this.searchKeyword));
          const matchNote = (note.note || '').toLowerCase().includes(this.searchKeyword);
          const matchDate = note.date.includes(this.searchKeyword);
          if (!matchNum && !matchNote && !matchDate) return false;
        }

        return true;
      });
    }

    /* ===================================================================
       Export, Import & Share to Zalo
       =================================================================== */
    copyReportZalo() {
      const filtered = this.getFilteredNotes();
      if (filtered.length === 0) {
        alert('Không có dữ liệu ghi chú để sao chép báo cáo!');
        return;
      }

      let totalCost = 0;
      let totalPotentialWin = 0;
      let totalWin = 0;
      let text = `📝 SỔ GHI SỐ & KẾT QUẢ XSMB\n`;
      text += `📅 Ngày xuất: ${this.formatDateVN(this.getTodayDateStr())}\n`;
      text += `------------------------------------\n`;

      filtered.forEach((n, idx) => {
        const check = this.checkNoteResult(n);
        totalCost += check.totalCost;
        totalPotentialWin += check.potentialWin;
        totalWin += check.totalWin;

        const typeMap = { lo: 'Lô', de: 'Đề', xien2: 'Xiên 2', xien3: 'Xiên 3', cang3: '3 Càng', khac: 'Khác' };
        const typeStr = typeMap[n.type] || 'Cược';
        const numStr = (n.numbers || []).join(', ');
        const amtStr = n.unit === 'diem' ? `${n.amount}đ` : this.formatCurrency(n.amount);

        let resStr = '';
        if (check.status === 'win') {
          resStr = `🏆 ${check.statusLabel} (+${this.formatCurrency(check.totalWin)} | Lãi: +${this.formatCurrency(check.pnl)})`;
        } else if (check.status === 'lose') {
          resStr = `❌ ${check.statusLabel} (-${this.formatCurrency(check.totalCost)})`;
        } else {
          resStr = `⏳ ${check.statusLabel}`;
        }

        text += `${idx + 1}. [${this.formatDateVN(n.date)}] ${typeStr}: ${numStr} (${amtStr})\n   ➔ Tạm tính nếu trúng: ${this.formatCurrency(check.potentialWin)}\n   ➔ Thực tế: ${resStr}\n`;
      });

      const netPnl = totalWin - totalCost;
      const sign = netPnl >= 0 ? '+' : '';
      text += `------------------------------------\n`;
      text += `💳 Tổng tiền vào: ${this.formatCurrency(totalCost)}\n`;
      text += `🎯 Tổng tạm tính (nếu trúng hết): ${this.formatCurrency(totalPotentialWin)}\n`;
      text += `🏆 Tổng thực tế thu về: ${this.formatCurrency(totalWin)}\n`;
      text += `💰 Lợi nhuận thực tế: ${sign}${this.formatCurrency(netPnl)}\n`;
      text += `Hội Đam Mê Số Học DK - Chúc Bạn May Mắn! 🍀`;

      navigator.clipboard.writeText(text).then(() => {
        this.showToast('📋 Đã sao chép báo cáo Zalo vào Clipboard!', 'success');
      }).catch(() => {
        prompt('Sao chép nội dung báo cáo dưới đây:', text);
      });
    }

    exportJson() {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.notes, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `xsmb_so_ghi_${this.getTodayDateStr()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      this.showToast('💾 Đã xuất file JSON thành công!', 'success');
    }

    exportCsv() {
      if (this.notes.length === 0) {
        alert('Chưa có ghi chú nào để xuất file!');
        return;
      }
      let csv = '\uFEFFNgày,Thể loại,Con số,Tiền/Điểm,Đơn vị,Tiền vào,Tạm tính trúng,Kết quả đối chiếu,Thực tế thu về,Lãi/Lỗ thực tế,Ghi chú\n';
      this.notes.forEach(n => {
        const check = this.checkNoteResult(n);
        const row = [
          n.date,
          n.type,
          `"${(n.numbers || []).join(' ')}"`,
          n.amount,
          n.unit,
          check.totalCost,
          check.potentialWin,
          `"${check.statusLabel}"`,
          check.totalWin,
          check.pnl,
          `"${(n.note || '').replace(/"/g, '""')}"`
        ];
        csv += row.join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', url);
      downloadAnchor.setAttribute('download', `xsmb_so_ghi_${this.getTodayDateStr()}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      this.showToast('📊 Đã xuất file CSV (Excel) thành công!', 'success');
    }

    handleFileImport(e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = event => {
        try {
          const imported = JSON.parse(event.target.result);
          if (!Array.isArray(imported)) {
            alert('File JSON không đúng cấu trúc danh sách ghi chú!');
            return;
          }
          if (confirm(`Tìm thấy ${imported.length} mục ghi chú trong file. Bạn muốn GỘP THÊM hay GHI ĐÈ toàn bộ?`)) {
            // Merge
            const existingIds = new Set(this.notes.map(n => n.id));
            let added = 0;
            imported.forEach(item => {
              if (item && item.date && item.numbers) {
                if (!item.id || existingIds.has(item.id)) {
                  item.id = 'bet_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
                }
                this.notes.unshift(item);
                added++;
              }
            });
            this.saveNotes();
            this.render();
            this.showToast(`📥 Đã nhập thêm ${added} mục thành công!`, 'success');
          }
        } catch (err) {
          alert('Lỗi khi đọc file JSON: ' + err.message);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    }

    /* ===================================================================
       Settings Panel Handlers
       =================================================================== */
    fillSettingsInputs() {
      if (this.dom.cfgLoCost) this.dom.cfgLoCost.value = this.settings.loCostPerPoint || 23000;
      if (this.dom.cfgLoWin) this.dom.cfgLoWin.value = this.settings.loWinPerPoint || 80000;
      if (this.dom.cfgDeMulti) this.dom.cfgDeMulti.value = this.settings.deMultiplier || 70;
      if (this.dom.cfgCang3Multi) this.dom.cfgCang3Multi.value = this.settings.cang3Multiplier || 400;
      if (this.dom.cfgXien2Multi) this.dom.cfgXien2Multi.value = this.settings.xien2Multiplier || 10;
      if (this.dom.cfgXien3Multi) this.dom.cfgXien3Multi.value = this.settings.xien3Multiplier || 40;
      if (this.dom.cfgXien4Multi) this.dom.cfgXien4Multi.value = this.settings.xien4Multiplier || 100;
    }

    handleSaveSettings() {
      this.settings.loCostPerPoint = Number(this.dom.cfgLoCost?.value) || 23000;
      this.settings.loWinPerPoint = Number(this.dom.cfgLoWin?.value) || 80000;
      this.settings.deMultiplier = Number(this.dom.cfgDeMulti?.value) || 70;
      this.settings.cang3Multiplier = Number(this.dom.cfgCang3Multi?.value) || 400;
      this.settings.xien2Multiplier = Number(this.dom.cfgXien2Multi?.value) || 10;
      this.settings.xien3Multiplier = Number(this.dom.cfgXien3Multi?.value) || 40;
      this.settings.xien4Multiplier = Number(this.dom.cfgXien4Multi?.value) || 100;

      this.saveSettings();
      this.render();
      if (this.dom.settingsPanel) this.dom.settingsPanel.style.display = 'none';
      this.showToast('⚙️ Đã lưu cài đặt tỷ lệ cược thành công!', 'success');
    }

    showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `notes-toast-msg toast-${type}`;
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('show');
      }, 10);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  }

  // Global helper to open notes for date
  window.jumpToNotesForDate = function () {
    if (window.betNotesManager) {
      const curRec = window.state && window.state.records ? window.state.records[window.state.currentIndex] : null;
      const targetDate = curRec ? curRec.date : window.betNotesManager.getTodayDateStr();
      window.betNotesManager.openForDate(targetDate);
    }
  };

  // Expose instance on window
  document.addEventListener('DOMContentLoaded', () => {
    window.betNotesManager = new BetNotesManager();
  });

})();
