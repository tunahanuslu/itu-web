(function() {
    const WEAVES = {
        plain: (r, c) => (r + c) % 2 === 0 ? 1 : 0,
        twill: (r, c) => ((r + c) % 4 < 2) ? 1 : 0,
        satin: (r, c) => (c === (r * 3) % 8) ? 1 : 0
    };

    let currentPattern = 'plain';
    let matrix = [];

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

    function renderLoom() {
        const container = document.getElementById('loom-app');
        if (!container) return;

        container.className = 'loom-app';
        container.innerHTML = `
            <div class="loom-header">
                <span class="loom-title">JAKAR TEZGÂHI // 8x8 İKİLİ MATRİS</span>
                <div class="loom-controls">
                    <button type="button" class="loom-btn ${currentPattern==='plain'?'active':''}" data-w="plain">1/1 Bezayağı</button>
                    <button type="button" class="loom-btn ${currentPattern==='twill'?'active':''}" data-w="twill">2/2 Dimi</button>
                    <button type="button" class="loom-btn ${currentPattern==='satin'?'active':''}" data-w="satin">4/1 Saten</button>
                    <button type="button" class="loom-btn" id="loom-invert">Tersyüz Et</button>
                </div>
            </div>
            <div class="loom-body">
                <div class="loom-grid" id="loom-grid" role="grid" aria-label="8x8 Dokuma Tezgâhı Matrisi"></div>
            </div>
            <div class="loom-footer">
                <span class="loom-meta">Jacquard Binary Stream (Çözgü/Atkı İkili Kodu):</span>
                <code class="loom-code" id="loom-code"></code>
            </div>
        `;

        const grid = document.getElementById('loom-grid');
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
                grid.appendChild(cell);
            }
        }

        updateCode();
        bindEvents();
    }

    function toggleCell(r, c) {
        matrix[r][c] = matrix[r][c] === 1 ? 0 : 1;
        currentPattern = 'custom';
        const cell = document.querySelector(`.loom-cell[data-r="${r}"][data-c="${c}"]`);
        if (cell) cell.dataset.state = matrix[r][c];
        updateCode();
        document.querySelectorAll('.loom-controls .loom-btn').forEach(b => b.classList.remove('active'));
    }

    function updateCode() {
        const codeEl = document.getElementById('loom-code');
        if (!codeEl) return;
        const stream = matrix.map(row => row.join('')).join(' ');
        codeEl.textContent = `[ ${stream} ]`;
    }

    function bindEvents() {
        document.querySelectorAll('.loom-controls [data-w]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const w = e.target.dataset.w;
                initMatrix(w);
                renderLoom();
            });
        });

        const invBtn = document.getElementById('loom-invert');
        if (invBtn) {
            invBtn.addEventListener('click', () => {
                for (let r = 0; r < 8; r++) {
                    for (let c = 0; c < 8; c++) {
                        matrix[r][c] = matrix[r][c] === 1 ? 0 : 1;
                    }
                }
                currentPattern = 'custom';
                renderLoom();
            });
        }
    }

    function startLoom() {
        initMatrix('plain');
        renderLoom();
    }

    // Hem ilk yüklemede hem önbellekten anında açılışta güvenli başlatma
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startLoom);
    } else {
        startLoom();
    }
})();
