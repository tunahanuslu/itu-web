(function() {
    let hud = null;
    let isOpen = false;
    let rafId = null;
    let lastTime = performance.now();
    let frames = 0;

    function createHUD() {
        if (hud) return;
        hud = document.createElement('aside');
        hud.id = 'telemetry-hud';
        hud.className = 'hud';
        hud.setAttribute('role', 'dialog');
        hud.setAttribute('aria-label', 'Donanım ve Ağ Telemetrisi');
        hud.innerHTML = `
            <div class="hud-header">
                <span class="hud-title"><span class="hud-dot">●</span> CANLI TELEMETRİ</span>
                <button type="button" class="hud-close" id="hud-close-btn" aria-label="Kapat">[ESC]</button>
            </div>
            <div class="hud-grid">
                <div class="hud-col">
                    <div class="hud-label">AĞ & İTÜ OMURGASI</div>
                    <div class="hud-metric"><span>DNS</span><strong id="m-dns">--</strong></div>
                    <div class="hud-metric"><span>TCP</span><strong id="m-tcp">--</strong></div>
                    <div class="hud-metric"><span>TLS 1.3</span><strong id="m-tls">--</strong></div>
                    <div class="hud-metric"><span>Canlı TTFB</span><strong id="m-ttfb" class="hud-accent">--</strong></div>
                    <div class="hud-metric"><span>Transfer</span><strong id="m-load">--</strong></div>
                </div>
                <div class="hud-col">
                    <div class="hud-label">DONANIM & EKRAN</div>
                    <div class="hud-metric"><span>Ekran Hızı</span><strong id="m-fps" class="hud-accent">--</strong></div>
                    <div class="hud-metric"><span>İşlemci</span><strong id="m-cpu">--</strong></div>
                    <div class="hud-metric"><span>Bellek</span><strong id="m-ram">--</strong></div>
                    <div class="hud-metric"><span>Gamut</span><strong id="m-gamut">--</strong></div>
                    <div class="hud-metric"><span>Protokol</span><strong>HTTP/1.1</strong></div>
                </div>
            </div>
            <div class="hud-footer">W3C PerformanceTiming • [d] veya [~] ile aç/kapa</div>
        `;
        document.body.appendChild(hud);
        document.getElementById('hud-close-btn').addEventListener('click', toggleHUD);
    }

    function readMetrics() {
        const nav = performance.getEntriesByType('navigation')[0];
        if (nav) {
            const dns = Math.max(0, nav.domainLookupEnd - nav.domainLookupStart);
            const tcp = Math.max(0, nav.connectEnd - nav.connectStart);
            const tls = nav.secureConnectionStart > 0 ? Math.max(0, nav.connectEnd - nav.secureConnectionStart) : 0;
            const ttfb = Math.max(0, nav.responseStart - nav.requestStart);
            const load = Math.max(0, nav.responseEnd - nav.responseStart);

            document.getElementById('m-dns').textContent = `${dns.toFixed(0)} ms`;
            document.getElementById('m-tcp').textContent = `${tcp.toFixed(0)} ms`;
            document.getElementById('m-tls').textContent = tls > 0 ? `${tls.toFixed(0)} ms` : 'Aktif';
            document.getElementById('m-ttfb').textContent = `${ttfb.toFixed(0)} ms`;
            document.getElementById('m-load').textContent = `${load.toFixed(0)} ms`;
        }

        document.getElementById('m-cpu').textContent = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Çekirdek` : 'Standart';
        document.getElementById('m-ram').textContent = navigator.deviceMemory ? `~${navigator.deviceMemory} GB` : 'Standart';
        document.getElementById('m-gamut').textContent = window.matchMedia('(color-gamut: p3)').matches ? 'Display P3' : 'sRGB';
    }

    function updateFPS(now) {
        frames++;
        if (now >= lastTime + 500) {
            const fps = Math.round((frames * 1000) / (now - lastTime));
            frames = 0;
            lastTime = now;
            const el = document.getElementById('m-fps');
            if (el) el.textContent = `${fps} FPS`;
        }
        if (isOpen) rafId = requestAnimationFrame(updateFPS);
    }

    function toggleHUD() {
        if (!hud) createHUD();
        isOpen = !isOpen;
        if (isOpen) {
            hud.classList.add('open');
            readMetrics();
            frames = 0;
            lastTime = performance.now();
            rafId = requestAnimationFrame(updateFPS);
        } else {
            hud.classList.remove('open');
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        }
    }

    document.addEventListener('keydown', (e) => {
        if ((e.key === 'd' || e.key === 'D' || e.key === '~' || e.key === '`') && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            toggleHUD();
        } else if (e.key === 'Escape' && isOpen) {
            toggleHUD();
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        const trigger = document.getElementById('hud-toggle');
        if (trigger) trigger.addEventListener('click', toggleHUD);
    });
})();

// Permacomputing PWA: Service Worker Kaydı
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
    });
}
