/**
 * GoGreen v2.0 - GitHub Activity & Contribution Art Studio
 * Interactive Grid Engine, Web Audio Synthesizer & Code Exporter
 */

(function () {
  'use strict';

  // Total weeks and days in standard GitHub calendar
  const WEEKS = 53;
  const DAYS_PER_WEEK = 7;
  const TOTAL_CELLS = WEEKS * DAYS_PER_WEEK;

  // State
  let currentBrush = 4;
  let isMouseDown = false;
  let audioEnabled = true;
  let currentLang = 'python';
  const gridData = new Array(TOTAL_CELLS).fill(4); // Default to full green!

  // Date anchor: 2026-09-10 (Current day)
  const today = new Date('2026-09-10T00:00:00');

  // Month names for labels
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // DOM Elements
  const gridCanvas = document.getElementById('grid-canvas');
  const monthLabels = document.getElementById('month-labels');
  const cellInfo = document.getElementById('cell-info');
  const statStreak = document.getElementById('stat-streak');
  const statRatio = document.getElementById('stat-ratio');
  const statCommits = document.getElementById('stat-commits');
  const codeSnippet = document.getElementById('code-snippet');
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const audioIcon = document.getElementById('audio-icon');

  // Web Audio Context
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(level) {
    if (!audioEnabled || level === 0) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freqs = [0, 261.63, 329.63, 392.00, 523.25]; // C, E, G, C5
      osc.frequency.value = freqs[level] || 440;
      osc.type = 'sine';

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      // Audio context might fail on restricted environments
    }
  }

  // Calculate dates for each cell
  function getCellDate(col, row) {
    const dayOffset = (WEEKS - 1 - col) * 7 + (6 - row);
    const d = new Date(today);
    d.setDate(d.getDate() - dayOffset);
    return d;
  }

  // Initialize Matrix
  function initGrid() {
    gridCanvas.innerHTML = '';
    monthLabels.innerHTML = '';

    // Month headers
    let lastMonth = -1;
    for (let w = 0; w < WEEKS; w += 4) {
      const date = getCellDate(w, 0);
      const m = date.getMonth();
      const colDiv = document.createElement('div');
      colDiv.className = 'month-col';
      colDiv.textContent = monthNames[m];
      monthLabels.appendChild(colDiv);
    }

    // Grid cells
    for (let c = 0; c < WEEKS; c++) {
      for (let r = 0; r < DAYS_PER_WEEK; r++) {
        const idx = c * DAYS_PER_WEEK + r;
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.index = idx;
        cell.dataset.level = gridData[idx];
        applyCellColor(cell, gridData[idx]);

        const date = getCellDate(c, r);
        const dateStr = date.toISOString().split('T')[0];
        cell.dataset.date = dateStr;

        // Cell interactions
        cell.addEventListener('mousedown', (e) => {
          e.preventDefault();
          isMouseDown = true;
          paintCell(cell, idx);
        });

        cell.addEventListener('mouseenter', () => {
          const count = getCommitCountForLevel(gridData[idx]);
          cellInfo.textContent = `${dateStr}: ${count} contribution${count === 1 ? '' : 's'} (Level ${gridData[idx]})`;
          if (isMouseDown) {
            paintCell(cell, idx);
          }
        });

        gridCanvas.appendChild(cell);
      }
    }

    updateStats();
    generateScript();
  }

  function getCommitCountForLevel(lvl) {
    switch (lvl) {
      case 1: return 2;
      case 2: return 4;
      case 3: return 6;
      case 4: return 8;
      default: return 0;
    }
  }

  function applyCellColor(cell, level) {
    cell.dataset.level = level;
    cell.style.backgroundColor = `var(--lvl-${level})`;
  }

  function paintCell(cell, idx) {
    gridData[idx] = currentBrush;
    applyCellColor(cell, currentBrush);
    playTone(currentBrush);
    updateStats();
  }

  // Update dynamic counters
  function updateStats() {
    let activeDays = 0;
    let totalCommits = 0;
    let currentStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < TOTAL_CELLS; i++) {
      const lvl = gridData[i];
      if (lvl > 0) {
        activeDays++;
        totalCommits += getCommitCountForLevel(lvl);
        tempStreak++;
        if (tempStreak > currentStreak) currentStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    const ratio = Math.round((activeDays / TOTAL_CELLS) * 100);
    statStreak.innerHTML = `${currentStreak} <span class="stat-unit">days</span>`;
    statRatio.textContent = `${ratio}%`;
    statCommits.textContent = `${totalCommits.toLocaleString()}+`;
  }

  // Global mouse up
  window.addEventListener('mouseup', () => {
    isMouseDown = false;
  });

  // Brush Selector
  const brushButtons = document.querySelectorAll('.brush-btn');
  brushButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      brushButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentBrush = parseInt(btn.dataset.level, 10);
    });
  });

  // Audio Toggle
  audioToggleBtn.addEventListener('click', () => {
    audioEnabled = !audioEnabled;
    audioIcon.textContent = audioEnabled ? '🔊' : '🔇';
    audioToggleBtn.style.opacity = audioEnabled ? '1' : '0.6';
  });

  // Theme Switcher
  const themeButtons = document.querySelectorAll('.theme-btn');
  themeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      themeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const theme = btn.dataset.theme;
      if (theme === 'github') {
        document.documentElement.removeAttribute('data-palette');
      } else {
        document.documentElement.setAttribute('data-palette', theme);
      }
      // Re-apply styles to cells
      document.querySelectorAll('.grid-cell').forEach((cell, idx) => {
        applyCellColor(cell, gridData[idx]);
      });
    });
  });

  // Presets
  document.getElementById('btn-full-green').addEventListener('click', () => {
    for (let i = 0; i < TOTAL_CELLS; i++) {
      gridData[i] = (i % 3 === 0) ? 3 : 4;
    }
    refreshGridUI();
  });

  document.getElementById('btn-wave').addEventListener('click', () => {
    for (let c = 0; c < WEEKS; c++) {
      const waveRow = Math.floor(3.5 + 2.5 * Math.sin((c / WEEKS) * Math.PI * 4));
      for (let r = 0; r < DAYS_PER_WEEK; r++) {
        const idx = c * DAYS_PER_WEEK + r;
        gridData[idx] = (r === waveRow || r === waveRow - 1) ? 4 : 1;
      }
    }
    refreshGridUI();
  });

  document.getElementById('btn-heart').addEventListener('click', () => {
    for (let i = 0; i < TOTAL_CELLS; i++) gridData[i] = 1;
    // Draw heart pattern in middle
    const midWeek = Math.floor(WEEKS / 2);
    const pattern = [
      [midWeek - 3, 2], [midWeek - 3, 3],
      [midWeek - 2, 1], [midWeek - 2, 4],
      [midWeek - 1, 1], [midWeek - 1, 5],
      [midWeek, 2], [midWeek, 6],
      [midWeek + 1, 1], [midWeek + 1, 5],
      [midWeek + 2, 1], [midWeek + 2, 4],
      [midWeek + 3, 2], [midWeek + 3, 3],
    ];
    pattern.forEach(([w, r]) => {
      const idx = w * DAYS_PER_WEEK + r;
      if (idx >= 0 && idx < TOTAL_CELLS) gridData[idx] = 4;
    });
    refreshGridUI();
  });

  document.getElementById('btn-rain').addEventListener('click', () => {
    for (let c = 0; c < WEEKS; c++) {
      for (let r = 0; r < DAYS_PER_WEEK; r++) {
        const idx = c * DAYS_PER_WEEK + r;
        gridData[idx] = (r + c) % 4 === 0 ? 4 : (r % 2 === 0 ? 2 : 1);
      }
    }
    refreshGridUI();
  });

  document.getElementById('btn-random').addEventListener('click', () => {
    for (let i = 0; i < TOTAL_CELLS; i++) {
      const r = Math.random();
      gridData[i] = r > 0.8 ? 4 : (r > 0.5 ? 3 : (r > 0.2 ? 2 : 1));
    }
    refreshGridUI();
  });

  document.getElementById('btn-clear').addEventListener('click', () => {
    for (let i = 0; i < TOTAL_CELLS; i++) gridData[i] = 0;
    refreshGridUI();
  });

  function refreshGridUI() {
    const cells = document.querySelectorAll('.grid-cell');
    cells.forEach((cell, idx) => {
      applyCellColor(cell, gridData[idx]);
    });
    updateStats();
    generateScript();
    playTone(4);
  }

  // Language Tabs
  const langTabs = document.querySelectorAll('.lang-tab');
  langTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      langTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentLang = tab.dataset.lang;
      generateScript();
    });
  });

  // Script Generator
  function generateScript() {
    const activeDaysList = [];
    for (let c = 0; c < WEEKS; c++) {
      for (let r = 0; r < DAYS_PER_WEEK; r++) {
        const idx = c * DAYS_PER_WEEK + r;
        const lvl = gridData[idx];
        if (lvl > 0) {
          const date = getCellDate(c, r).toISOString().split('T')[0];
          activeDaysList.push({ date, count: getCommitCountForLevel(lvl) });
        }
      }
    }

    if (currentLang === 'python') {
      codeSnippet.textContent = `# GoGreen - Automated GitHub Activity Script
import os, subprocess, datetime

author = "Bahrudin Yusup Caruban <162004752+Yantokumar@users.noreply.github.com>"
active_days = ${activeDaysList.length} # total active dates

# Fast commit stream via git fast-import
stream = []
# Generated for ${activeDaysList.length} days
print(f"Applying {len(stream)} commits to repository...")
`;
    } else if (currentLang === 'bash') {
      codeSnippet.textContent = `#!/usr/bin/env bash
# GoGreen Activity Script
export GIT_AUTHOR_NAME="Bahrudin Yusup Caruban"
export GIT_AUTHOR_EMAIL="162004752+Yantokumar@users.noreply.github.com"
export GIT_COMMITTER_NAME="$GIT_AUTHOR_NAME"
export GIT_COMMITTER_EMAIL="$GIT_AUTHOR_EMAIL"

echo "Generating green matrix commits..."
# Total active dates: ${activeDaysList.length}
`;
    } else {
      codeSnippet.textContent = JSON.stringify(
        {
          project: "GoGreen",
          user: "Yantokumar",
          totalDays: activeDaysList.length,
          sample: activeDaysList.slice(0, 5)
        },
        null,
        2
      );
    }
  }

  document.getElementById('btn-generate-script').addEventListener('click', () => {
    generateScript();
    playTone(3);
  });

  // Copy Script
  document.getElementById('btn-copy-script').addEventListener('click', () => {
    navigator.clipboard.writeText(codeSnippet.textContent).then(() => {
      const btn = document.getElementById('btn-copy-script');
      const original = btn.textContent;
      btn.textContent = '✅ Copied!';
      playTone(4);
      setTimeout(() => { btn.textContent = original; }, 2000);
    });
  });

  // Initialize
  initGrid();
})();
