(function() {
    const WEAVES = {
        plain: (r, c) => (r + c) % 2 === 0 ? 1 : 0,
        twill: (r, c) => ((r + c) % 4 < 2) ? 1 : 0,
        herringbone: (r, c) => c < 4 ? (((r + c) % 4 < 2) ? 1 : 0) : (((r - c + 8) % 4 < 2) ? 1 : 0),
        carbon: (r, c) => ((r + c) % 4 < 2) ? 1 : 0,
        satin: (r, c) => (c === (r * 3) % 8) ? 1 : 0
    };

    let currentPattern = 'plain';
    let matrix = [];
    let isWeaving = false;
    let activeRow = 0;

    function initMatrix(pattern) {
        currentPattern = pattern;
        matrix = [];
        for (let r = 0; r < 8; r++) {
            matrix[r] = [];
            for (let c = 0; c < 8; c++) {
                matrix[r][c] = WEAVES[pattern] ? WEAVES[pattern](r, c) : 0;
            }
        }
    }

    function injectStyles() {
        if (document.getElementById('loom-master-styles')) return;
        const style = document.createElement('style');
        style.id = 'loom-master-styles';
        style.textContent = `
            .loom-app { margin-top: 1.25rem; padding: 1.2rem; background: light-dark(oklch(0.97 0.006 85 / 0.8), oklch(0.19 0.012 260 / 0.8)); border: 1px solid var(--border); border-radius: 8px; display: flex; flex-direction: column; gap: 0.9rem; font-family: var(--font-mono); backdrop-filter: blur(12px); }
            .loom-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
            .loom-title { font-size: 0.75rem; font-weight: 700; color: var(--text); letter-spacing: 0.05em; display: inline-flex; align-items: center; gap: 0.4rem; }
            .loom-controls { display: flex; gap: 0.35rem; flex-wrap: wrap; }
            .loom-btn { background: none; border: 1px solid var(--border); color: var(--text-muted); font-family: var(--font-mono); font-size: 0.68rem; padding: 0.12rem 0.45rem; border-radius: 4px; cursor: pointer; transition: all 0.15s; }
            .loom-btn:hover, .loom-btn.active { color: var(--accent); border-color: var(--accent); background: var(--accent-subtle); }
            .loom-btn-play { color: oklch(0.65 0.20 145) !important; border-color: oklch(0.65 0.20 145 / 0.4) !important; }
            .loom-btn-play:hover, .loom-btn-play.active { background: oklch(0.65 0.20 145 / 0.15) !important; border-color: oklch(0.65 0.20 145) !important; }
            
            /* Delikli Kart Vizörü */
            .loom-card-visor { background: light-dark(oklch(0.92 0.02 75), oklch(0.24 0.015 75)); border: 1px solid light-dark(oklch(0.82 0.03 75), oklch(0.34 0.02 75)); border-radius: 4px; padding: 0.45rem 0.75rem; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
            .loom-card-meta { font-size: 0.62rem; color: light-dark(oklch(0.40 0.03 75), oklch(0.72 0.03 75)); letter-spacing: 0.04em; white-space: nowrap; font-weight: 600; }
            .loom-card-track { display: flex; gap: 5px; align-items: center; }
            .loom-hole { width: 14px; height: 14px; border-radius: 2px; border: 1px solid light-dark(oklch(0.75 0.03 75), oklch(0.38 0.03 75)); transition: all 0.15s ease; }
            .loom-hole[data-p="1"] { background: light-dark(oklch(0.25 0.01 260), oklch(0.12 0.01 260)); box-shadow: inset 0 2px 4px rgba(0,0,0,0.7); border-color: transparent; transform: scale(0.92); }
            .loom-hole[data-p="0"] { background: light-dark(oklch(0.90 0.015 75), oklch(0.28 0.02 75)); box-shadow: 0 1px 2px rgba(0,0,0,0.1); }

            /* 3D Kumaş Dokuma Matrisi & Mekik */
            .loom-stage { position: relative; max-width: 250px; width: 100%; margin: 0.25rem auto; aspect-ratio: 1/1; }
            .loom-beam { position: absolute; left: 0; width: 100%; height: 12.5%; background: linear-gradient(90deg, transparent, oklch(0.65 0.20 145 / 0.35), transparent); border-bottom: 2px solid oklch(0.65 0.20 145); pointer-events: none; opacity: 0; transition: top 0.12s linear, opacity 0.15s ease; z-index: 10; }
            .loom-beam.active { opacity: 1; }
            .loom-grid { display: grid; grid-template-columns: repeat(8, 1fr); grid-template-rows: repeat(8, 1fr); gap: 2.5px; width: 100%; height: 100%; padding: 4px; background: light-dark(oklch(0.88 0.01 85), oklch(0.13 0.014 260)); border-radius: 6px; border: 1px solid var(--border); box-shadow: inset 0 2px 6px rgba(0,0,0,0.3); }

            /* 3D İplik Rölyefi */
            .loom-cell { position: relative; cursor: pointer; border-radius: 3px; transition: transform 0.15s; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
            .loom-cell:hover { transform: scale(1.18); z-index: 5; }
            .loom-cell[data-state="1"] {
                background: linear-gradient(to right, light-dark(oklch(0.42 0.16 230), oklch(0.65 0.16 230)) 0%, light-dark(oklch(0.55 0.18 230), oklch(0.82 0.18 230)) 50%, light-dark(oklch(0.38 0.16 230), oklch(0.60 0.16 230)) 100%);
                box-shadow: 0 2px 4px rgba(0,0,0,0.5);
            }
            .loom-cell[data-state="0"] {
                background: linear-gradient(to bottom, light-dark(oklch(0.86 0.01 85), oklch(0.24 0.012 260)) 0%, light-dark(oklch(0.94 0.008 85), oklch(0.34 0.014 260)) 50%, light-dark(oklch(0.82 0.01 85), oklch(0.20 0.01 260)) 100%);
                box-shadow: 2px 0 4px rgba(0,0,0,0.4);
            }

            /* Canlı Pipeline & İkili Akış */
            .loom-footer { display: flex; flex-direction: column; gap: 0.25rem; background: light-dark(oklch(0.95 0.006 85), oklch(0.16 0.012 260)); padding: 0.45rem 0.7rem; border-radius: 4px; font-size: 0.65rem; border: 1px solid var(--border); }
            .loom-pipeline { display: flex; justify-content: space-between; color: var(--text-muted); font-size: 0.62rem; }
            .loom-pipeline strong { color: var(--accent); }
            .loom-code { color: var(--accent); font-family: var(--font-mono); word-break: break-all; letter-spacing: 0.06em; }
        `;
        document.head.appendChild(style);
    }

    function renderLoom() {
        const container = document.getElementById('loom-app');
        if (!container) return;
        injectStyles();

        container.className = 'loom-app';
        container.innerHTML = `
            <div class="loom-header">
                <span class="loom-title"><span style="color:var(--accent);">◈</span> JAKAR TEZGÂHI // İKİLİ MATRİS</span>
                <div class="loom-controls">
                    <button type="button" class="loom-btn ${currentPattern==='plain'?'active':''}" data-w="plain">1/1 Bezayağı</button>
                    <button type="button" class="loom-btn ${currentPattern==='twill'?'active':''}" data-w="twill">2/2 Dimi</button>
                    <button type="button" class="loom-btn ${currentPattern==='herringbone'?'active':''}" data-w="herringbone">Balıksırtı</button>
                    <button type="button" class="loom-btn ${currentPattern==='carbon'?'active':''}" data-w="carbon">2x2 Karbon</button>
                    <button type="button" class="loom-btn ${currentPattern==='satin'?'active':''}" data-w="satin">5/1 Saten</button>
                    <button type="button" class="loom-btn loom-btn-play" id="loom-play">▶ Canlı Doku</button>
                </div>
            </div>

            <!-- Delikli Kart Vizörü -->
            <div class="loom-card-visor">
                <span class="loom-card-meta" id="loom-card-title">DELİKLİ KART // SATIR 0x00</span>
                <div class="loom-card-track" id="loom-card-holes"></div>
            </div>

            <div class="loom-stage">
                <div class="loom-beam" id="loom-beam"></div>
                <div class="loom-grid" id="loom-grid" role="grid" aria-label="8x8 Kumaş Dokuma Matrisi"></div>
            </div>

            <div class="loom-footer">
                <div class="loom-pipeline">
                    <span>Mekik Durumu: <strong id="loom-pipe-status">Hazır</strong></span>
                    <span>Aktif Hat: <strong id="loom-pipe-row">Satır 0x00</strong></span>
                </div>
                <code class="loom-code" id="loom-code"></code>
            </div>
        `;

        renderGrid();
        renderCard(activeRow);
        updateCode();
        bindEvents();
    }

    function renderGrid() {
        const grid = document.getElementById('loom-grid');
        if (!grid) return;
        grid.innerHTML = '';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = document.createElement('div');
                cell.className = 'loom-cell';
                cell.dataset.r = r;
                cell.dataset.c = c;
                cell.dataset.state = matrix[r][c];
                cell.title = `Kesişim [${r},${c}]: ${matrix[r][c] ? 'Çözgü Üstte (1)' : 'Atkı Üstte (0)'}`;
                cell.addEventListener('click', () => toggleCell(r, c));
                cell.addEventListener('mouseenter', () => { if (!isWeaving) renderCard(r); });
                grid.appendChild(cell);
            }
        }
    }

    function renderCard(rowIdx) {
        activeRow = rowIdx;
        const track = document.getElementById('loom-card-holes');
        const title = document.getElementById('loom-card-title');
        const pipeRow = document.getElementById('loom-pipe-row');
        if (!track) return;

        if (title) title.textContent = `DELİKLİ KART // SATIR 0x0${rowIdx}`;
        if (pipeRow) pipeRow.textContent = `Satır 0x0${rowIdx}`;
        track.innerHTML = '';

        for (let c = 0; c < 8; c++) {
            const hole = document.createElement('div');
            hole.className = 'loom-hole';
            hole.dataset.p = matrix[rowIdx][c];
            hole.title = `Bit [${c}]: ${matrix[rowIdx][c] ? 'Delik Var (1)' : 'Delik Yok (0)'}`;
            hole.addEventListener('click', () => toggleCell(rowIdx, c));
            track.appendChild(hole);
        }
    }

    function toggleCell(r, c) {
        if (isWeaving) return;
        matrix[r][c] = matrix[r][c] === 1 ? 0 : 1;
        currentPattern = 'custom';
        const cell = document.querySelector(`.loom-cell[data-r="${r}"][data-c="${c}"]`);
        if (cell) cell.dataset.state = matrix[r][c];
        renderCard(r);
        updateCode();
        document.querySelectorAll('.loom-controls [data-w]').forEach(b => b.classList.remove('active'));
    }

    function updateCode() {
        const codeEl = document.getElementById('loom-code');
        if (!codeEl) return;
        const stream = matrix.map(row => row.join('')).join(' ');
        codeEl.textContent = `[ ${stream} ]`;
    }

    function playSimulation() {
        if (isWeaving) return;
        isWeaving = true;
        const beam = document.getElementById('loom-beam');
        const pipeStatus = document.getElementById('loom-pipe-status');
        const playBtn = document.getElementById('loom-play');
        if (playBtn) playBtn.classList.add('active');
        if (pipeStatus) pipeStatus.textContent = 'Mekik Çalışıyor...';
        if (beam) beam.classList.add('active');

        // Geçici olarak temizle ve satır satır doku
        const targetMatrix = JSON.parse(JSON.stringify(matrix));
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) matrix[r][c] = 0;
        }
        renderGrid();

        let r = 0;
        function stepWeft() {
            if (r < 8) {
                if (beam) beam.style.top = `${r * 12.5}%`;
                renderCard(r);
                for (let c = 0; c < 8; c++) {
                    matrix[r][c] = targetMatrix[r][c];
                    const cell = document.querySelector(`.loom-cell[data-r="${r}"][data-c="${c}"]`);
                    if (cell) cell.dataset.state = matrix[r][c];
                }
                updateCode();
                r++;
                setTimeout(stepWeft, 140);
            } else {
                isWeaving = false;
                if (beam) beam.classList.remove('active');
                if (playBtn) playBtn.classList.remove('active');
                if (pipeStatus) pipeStatus.textContent = 'Dokuma Tamamlandı';
            }
        }
        stepWeft();
    }

    function bindEvents() {
        document.querySelectorAll('.loom-controls [data-w]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (isWeaving) return;
                initMatrix(e.target.dataset.w);
                renderLoom();
            });
        });

        const playBtn = document.getElementById('loom-play');
        if (playBtn) playBtn.addEventListener('click', playSimulation);
    }

    function startLoom() {
        initMatrix('plain');
        renderLoom();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startLoom);
    } else {
        startLoom();
    }
})();
