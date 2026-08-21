// --- YOUR ASSET URLS ---
const GNMATH_API = "https://cdn.jsdelivr.net/gh/freebuisness/assets@main/zones.json";
const GNMATH_COVER = "https://cdn.jsdelivr.net/gh/freebuisness/covers@main";
const GNMATH_HTML = "https://cdn.jsdelivr.net/gh/freebuisness/html@main";

const UGS_API = "https://cdn.jsdelivr.net/gh/Sea-Math/ugs-json@main/games.json";
const UGS_HTML_URL1 = "https://cdn.jsdelivr.net/gh/Sea-Math/ugs-1@main";
const UGS_HTML_URL2 = "https://cdn.jsdelivr.net/gh/Sea-Math/ugs-2@main";
const UGS_HTML_URL3 = "https://cdn.jsdelivr.net/gh/Sea-Math/ugs-3@main";

const DAKNUX_API_URLS = [
    "https://cdn.jsdelivr.net/gh/daknux/assets@latest/zones.json",
    "https://cdn.jsdelivr.net/gh/daknux/assets@master/zones.json"
];
let DAKNUX_API = DAKNUX_API_URLS[Math.floor(Math.random() * DAKNUX_API_URLS.length)];
const DAKNUX_COVER = "https://cdn.jsdelivr.net/gh/daknux/covers@main";
const DAKNUX_HTML = "https://cdn.jsdelivr.net/gh/daknux/html@main";

const FALLBACK_IMAGE = "https://s3.envato.com/files/fed15e2f-5abf-4758-a1a2-3e3d68013f0d/inline_image_preview.jpg";
// -----------------------

class VantaSDK {
    constructor() {
        this.games = [];
        this.filteredGames = [];
        this.currentPage = 1;
        this.currentSearch = "";
        this.currentSource = "All";
        this.currentGameUrl = "";
        this.currentGameHtml = "";
        this.isClearMode = false; // Tracks if Clear Mode is active
        
        // Default Config (fully customizable via init options)
        this.config = {
            container: '#games',
            theme: '#5c6bc0',
            columns: 8,
            rows: 4,
            gamesPerPage: 32,
            borderRadius: '16px',
            fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            defaultClearMode: false
        };
    }

    async init(options) {
        this.config = { ...this.config, ...options };
        this.isClearMode = this.config.defaultClearMode;
        this.container = document.querySelector(this.config.container);
        
        if (!this.container) {
            console.error("Vanta SDK: Container not found!");
            return;
        }

        this.injectStyles();
        this.buildUI();
        await this.loadGames();
        this.applyFilters();
    }

    hexToRgb(hex) {
        let cleanHex = hex.replace('#', '');
        if (cleanHex.length === 3) cleanHex = cleanHex.split('').map(c => c + c).join('');
        if (cleanHex.length !== 6) return { r: 92, g: 107, b: 192 }; // Fallback
        let num = parseInt(cleanHex, 16);
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    }

    hexToDarker(hex, percent) {
        const rgb = this.hexToRgb(hex);
        const r = Math.max(0, Math.floor(rgb.r * (1 - percent)));
        const g = Math.max(0, Math.floor(rgb.g * (1 - percent)));
        const b = Math.max(0, Math.floor(rgb.b * (1 - percent)));
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    hexToLighter(hex, percent) {
        const rgb = this.hexToRgb(hex);
        const r = Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * percent));
        const g = Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * percent));
        const b = Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * percent));
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    injectStyles() {
        if (document.getElementById('vanta-dynamic-styles')) {
            document.getElementById('vanta-dynamic-styles').remove();
        }

        const style = document.createElement('style');
        style.id = 'vanta-dynamic-styles';
        
        const primary = this.config.theme.startsWith('#') ? this.config.theme : '#5c6bc0';
        const primaryRgb = this.hexToRgb(primary);
        const darkerShade = this.hexToDarker(primary, 0.25);
        const inputBg = this.hexToLighter(primary, 0.15);
        const color = '#ffffff';
        
        style.innerHTML = `
            :root {
                --vanta-primary: ${primary};
                --vanta-darker: ${darkerShade};
                --vanta-input: ${inputBg};
                --vanta-text: ${color};
                --vanta-radius: ${this.config.borderRadius};
            }

            /* BASE STYLES */
            .vanta-wrapper {
                font-family: ${this.config.fontFamily};
                background: var(--vanta-primary);
                color: var(--vanta-text);
                padding: 24px;
                border-radius: var(--vanta-radius);
                box-shadow: 0 12px 35px rgba(0,0,0,0.3);
                box-sizing: border-box;
                transition: all 0.4s ease;
                border: 1px solid transparent;
            }
            .vanta-wrapper *, .vanta-wrapper *::before, .vanta-wrapper *::after {
                box-sizing: border-box;
            }

            /* CLEAR MODE (GLASSMORPHISM) */
            .vanta-wrapper.clear-mode {
                background: rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.25);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            }
            .vanta-wrapper.clear-mode .vanta-search, 
            .vanta-wrapper.clear-mode .vanta-source-select,
            .vanta-wrapper.clear-mode .vanta-page-btn {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(255, 255, 255, 0.2);
                backdrop-filter: blur(10px);
            }
            .vanta-wrapper.clear-mode .vanta-btn,
            .vanta-wrapper.clear-mode .vanta-action-btn {
                background: rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.6);
                border: 1px solid rgba(255,255,255,0.3);
            }
            .vanta-wrapper.clear-mode .vanta-btn:hover,
            .vanta-wrapper.clear-mode .vanta-action-btn:hover {
                background: rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.8);
            }

            /* HEADER & INPUTS */
            .vanta-header { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; align-items: center; }
            .vanta-search {
                flex-grow: 1; padding: 14px 18px; border: 1px solid rgba(255,255,255,0.15); border-radius: 10px;
                background: var(--vanta-input); color: var(--vanta-text); font-size: 15px; outline: none; transition: all 0.3s ease;
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
            }
            .vanta-search:focus { border-color: rgba(255,255,255,0.6); box-shadow: 0 0 0 4px rgba(255,255,255,0.15), inset 0 2px 4px rgba(0,0,0,0.1); }
            .vanta-search::placeholder { color: rgba(255, 255, 255, 0.7); }
            
            .vanta-source-select {
                padding: 14px 18px; border: 1px solid rgba(255,255,255,0.15); border-radius: 10px;
                background: var(--vanta-input); color: var(--vanta-text); font-size: 15px; outline: none; cursor: pointer;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: all 0.3s ease;
            }
            .vanta-source-select:hover { border-color: rgba(255,255,255,0.4); }
            
            .vanta-btn {
                background: var(--vanta-darker); color: white; border: 1px solid transparent; padding: 14px 26px;
                border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: 600; transition: all 0.2s ease;
                box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            }
            .vanta-btn:hover { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 6px 16px rgba(0,0,0,0.3); }
            .vanta-btn:active { transform: translateY(1px); }

            /* TOGGLE CLEAR MODE BUTTON */
            .vanta-toggle-btn { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); }
            .vanta-toggle-btn:hover { background: rgba(255,255,255,0.25); }

            /* GRID & CARDS */
            .vanta-grid {
                display: grid; grid-template-columns: repeat(${this.config.columns}, 1fr); gap: 16px;
            }
            .vanta-game-card {
                background: #111; border-radius: 12px; overflow: hidden; position: relative;
                box-shadow: 0 6px 12px rgba(0,0,0,0.3); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                cursor: pointer; aspect-ratio: 1; border: 1px solid rgba(255,255,255,0.05);
            }
            .vanta-game-card:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 16px 30px rgba(0,0,0,0.5); border-color: rgba(255,255,255,0.3); }
            .vanta-game-img { width: 100%; height: 100%; object-fit: cover; transition: filter 0.3s ease, transform 0.3s ease; }
            .vanta-game-card:hover .vanta-game-img { filter: brightness(0.8); transform: scale(1.05); }
            
            .vanta-badge {
                position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.6); backdrop-filter: blur(6px);
                color: white; font-size: 10px; font-weight: 600; padding: 4px 8px; border-radius: 6px; z-index: 2;
                border: 1px solid rgba(255,255,255,0.1); letter-spacing: 0.5px;
            }
            .vanta-game-title-overlay {
                position: absolute; bottom: 0; left: 0; width: 100%;
                background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 50%, transparent 100%);
                color: #fff; padding: 24px 10px 12px 10px; font-size: 13px; font-weight: 600;
                text-align: center; opacity: 0; transition: opacity 0.3s ease-in-out; pointer-events: none;
                z-index: 2; text-shadow: 0 2px 4px rgba(0,0,0,0.9);
            }
            .vanta-game-card:hover .vanta-game-title-overlay { opacity: 1; }

            /* PAGINATION */
            .vanta-pagination { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; margin-top: 28px; }
            .vanta-page-btn {
                padding: 10px 16px; border: 1px solid rgba(255,255,255,0.15); background: var(--vanta-input);
                color: var(--vanta-text); border-radius: 8px; cursor: pointer; transition: all 0.2s ease; font-weight: 500;
            }
            .vanta-page-btn:hover { background: var(--vanta-darker); border-color: rgba(255,255,255,0.4); }
            .vanta-page-btn.active { background: var(--vanta-darker); border-color: rgba(255,255,255,0.6); font-weight: 700; }

            /* GAME VIEW (IFRAME) */
            .vanta-game-view {
                display: none; position: relative; width: 100%; height: 80vh;
                background: #050505; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                border: 1px solid rgba(255,255,255,0.1);
            }
            .vanta-iframe { width: 100%; height: 100%; border: none; background: #fff; }
            .vanta-toolbar {
                position: absolute; top: 16px; left: 16px; display: flex; gap: 10px; z-index: 10;
            }
            .vanta-action-btn {
                background: var(--vanta-darker); color: #fff; border: 1px solid rgba(255,255,255,0.15); padding: 10px 18px;
                border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                transition: all 0.2s ease; backdrop-filter: blur(4px);
            }
            .vanta-action-btn:hover { filter: brightness(1.15); transform: translateY(-2px); }
            .vanta-back-btn { background: rgba(229, 57, 53, 0.9); }
            .vanta-back-btn:hover { background: #d32f2f; }
            
            /* RESPONSIVE DESIGN */
            @media (max-width: 1200px) { .vanta-grid { grid-template-columns: repeat(6, 1fr); } }
            @media (max-width: 800px) { .vanta-grid { grid-template-columns: repeat(4, 1fr); } }
            @media (max-width: 500px) { .vanta-grid { grid-template-columns: repeat(2, 1fr); } }
        `;
        document.head.appendChild(style);
    }

    buildUI() {
        this.container.innerHTML = `
            <div class="vanta-wrapper ${this.isClearMode ? 'clear-mode' : ''}" id="vanta-main-wrapper">
                <div class="vanta-menu-view">
                    <div class="vanta-header">
                        <select class="vanta-source-select">
                            <option value="All">All Sources</option>
                            <option value="GNMath">GNMath</option>
                            <option value="UGS">UGS</option>
                            <option value="Daknux">Daknux</option>
                        </select>
                        <input type="text" class="vanta-search" placeholder="Search games...">
                        <button class="vanta-btn vanta-random-btn">Random</button>
                        <button class="vanta-btn vanta-toggle-btn">âœ¨ Clear Mode</button>
                    </div>
                    <div class="vanta-grid"></div>
                    <div class="vanta-pagination"></div>
                </div>
                <div class="vanta-game-view">
                    <div class="vanta-toolbar">
                        <button class="vanta-action-btn vanta-back-btn">â† Back</button>
                        <button class="vanta-action-btn vanta-aboutblank-btn">Open in about:blank</button>
                        <button class="vanta-action-btn vanta-fullscreen-btn">Fullscreen</button>
                    </div>
                    <iframe class="vanta-iframe" src="" sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms" allowfullscreen></iframe>
                </div>
            </div>
        `;

        this.wrapper = this.container.querySelector('#vanta-main-wrapper');
        this.menuView = this.container.querySelector('.vanta-menu-view');
        this.grid = this.container.querySelector('.vanta-grid');
        this.pagination = this.container.querySelector('.vanta-pagination');
        this.searchInput = this.container.querySelector('.vanta-search');
        this.sourceSelect = this.container.querySelector('.vanta-source-select');
        
        this.randomBtn = this.container.querySelector('.vanta-random-btn');
        this.toggleClearBtn = this.container.querySelector('.vanta-toggle-btn');

        this.gameView = this.container.querySelector('.vanta-game-view');
        this.iframe = this.container.querySelector('.vanta-iframe');
        this.backBtn = this.container.querySelector('.vanta-back-btn');
        this.aboutBlankBtn = this.container.querySelector('.vanta-aboutblank-btn');
        this.fullscreenBtn = this.container.querySelector('.vanta-fullscreen-btn');

        // Event Listeners
        this.searchInput.addEventListener('input', (e) => {
            this.currentSearch = e.target.value;
            this.applyFilters();
        });
        
        this.sourceSelect.addEventListener('change', (e) => {
            this.currentSource = e.target.value;
            this.applyFilters();
        });

        this.toggleClearBtn.addEventListener('click', () => {
            this.isClearMode = !this.isClearMode;
            if (this.isClearMode) {
                this.wrapper.classList.add('clear-mode');
            } else {
                this.wrapper.classList.remove('clear-mode');
            }
        });

        this.randomBtn.addEventListener('click', () => this.playRandom());
        this.backBtn.addEventListener('click', () => this.closeGame());
        
        this.aboutBlankBtn.addEventListener('click', () => {
            const win = window.open('about:blank', '_blank');
            if (win) {
                win.document.write(`<!DOCTYPE html><html><head><title>Game</title><style>body, html { margin:0; padding:0; width:100%; height:100%; overflow:hidden; background:#000; }</style></head><body></body></html>`);
                win.document.close();
                
                const iframe = win.document.createElement('iframe');
                iframe.style.cssText = "width:100%; height:100%; border:none;";
                iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-pointer-lock allow-forms");
                iframe.setAttribute("allowfullscreen", "true");
                
                if (this.currentGameHtml) {
                    win.document.body.appendChild(iframe);
                    iframe.contentDocument.open();
                    iframe.contentDocument.write(this.currentGameHtml);
                    iframe.contentDocument.close();
                } else {
                    iframe.src = this.currentGameUrl;
                    win.document.body.appendChild(iframe);
                }
            }
        });

        this.fullscreenBtn.addEventListener('click', () => {
            if (this.gameView.requestFullscreen) {
                this.gameView.requestFullscreen();
            } else if (this.gameView.webkitRequestFullscreen) {
                this.gameView.webkitRequestFullscreen();
            } else if (this.iframe.requestFullscreen) {
                this.iframe.requestFullscreen();
            }
        });
    }

    cleanPath(path) {
        if (!path) return '';
        return path
            .replace(/%7BHTML_URL%7D\//gi, '')
            .replace(/{HTML_URL}\//gi, '')
            .replace(/%7BCOVER_URL%7D\//gi, '')
            .replace(/{COVER_URL}\//gi, '')
            .replace(/^\//, '');
    }

    async loadGames() {
        let loadedGames = [];
        
        const fetchJSON = async (url) => {
            try { return await (await fetch(url)).json(); } 
            catch (e) { return []; }
        };

        // 1. GNMath Games
        const gnmathData = await fetchJSON(GNMATH_API);
        gnmathData.forEach(g => {
            const cleanUrlParam = this.cleanPath(g.url);
            const gameUrl = cleanUrlParam.includes('.') ? `${GNMATH_HTML}/${cleanUrlParam}` : `${GNMATH_HTML}/${cleanUrlParam}/index.html`;

            loadedGames.push({
                title: g.title || g.name,
                cover: g.cover ? `${GNMATH_COVER}/${this.cleanPath(g.cover)}` : FALLBACK_IMAGE,
                url: gameUrl,
                source: "GNMath"
            });
        });

        // 2. UGS Games
        const ugsData = await fetchJSON(UGS_API);
        ugsData.forEach(g => {
            let ugsHtmlBase = UGS_HTML_URL1;
            let rawUrl = g.url || "";
            
            if (rawUrl.includes("{HTML_URL2}") || g.repo === 'ugs-2') {
                ugsHtmlBase = UGS_HTML_URL2;
            } else if (rawUrl.includes("{HTML_URL3}") || g.repo === 'ugs-3') {
                ugsHtmlBase = UGS_HTML_URL3;
            }

            let finalCover = g.cover || g.image || "";
            finalCover = finalCover.replace(/{COVER_URL}/g, UGS_HTML_URL1.replace('/ugs-1@main', '/ugs-covers@main'));
            if (!finalCover.startsWith('http')) {
                finalCover = `${UGS_HTML_URL1}/${this.cleanPath(finalCover)}`;
            }

            let finalUrl = rawUrl
                .replace(/{HTML_URL1}/g, UGS_HTML_URL1)
                .replace(/{HTML_URL2}/g, UGS_HTML_URL2)
                .replace(/{HTML_URL3}/g, UGS_HTML_URL3);

            if (!finalUrl.startsWith('http')) {
                finalUrl = `${ugsHtmlBase}/${this.cleanPath(finalUrl)}`;
            }

            loadedGames.push({
                title: g.title || g.name,
                cover: finalCover || FALLBACK_IMAGE,
                url: finalUrl,
                source: "UGS"
            });
        });

        // 3. Daknux Games
        const daknuxData = await fetchJSON(DAKNUX_API);
        daknuxData.forEach(g => {
            const cleanUrlParam = this.cleanPath(g.url);
            const gameUrl = cleanUrlParam.includes('.') ? `${DAKNUX_HTML}/${cleanUrlParam}` : `${DAKNUX_HTML}/${cleanUrlParam}/index.html`;

            loadedGames.push({
                title: g.title || g.name,
                cover: g.cover ? `${DAKNUX_COVER}/${this.cleanPath(g.cover)}` : FALLBACK_IMAGE,
                url: gameUrl,
                source: "Daknux"
            });
        });

        this.games = loadedGames.filter(game => game.url && game.title);
    }

    applyFilters() {
        const lowerQuery = this.currentSearch.toLowerCase();
        
        this.filteredGames = this.games.filter(game => {
            const matchesSearch = game.title.toLowerCase().includes(lowerQuery);
            const matchesSource = this.currentSource === "All" || game.source === this.currentSource;
            return matchesSearch && matchesSource;
        });

        this.currentPage = 1;
        this.updateView();
    }

    renderGrid() {
        this.grid.innerHTML = '';
        const start = (this.currentPage - 1) * this.config.gamesPerPage;
        const pageGames = this.filteredGames.slice(start, start + this.config.gamesPerPage);

        const fragment = document.createDocumentFragment();
        pageGames.forEach(game => {
            const card = document.createElement('div');
            card.className = 'vanta-game-card';
            card.innerHTML = `
                <span class="vanta-badge">${game.source}</span>
                <img src="${game.cover}" alt="${game.title}" class="vanta-game-img" loading="lazy" onerror="this.src='${FALLBACK_IMAGE}'">
                <div class="vanta-game-title-overlay">${game.title}</div>
            `;
            card.onclick = () => this.playGame(game.url);
            fragment.appendChild(card);
        });
        this.grid.appendChild(fragment);
    }

    renderPagination() {
        this.pagination.innerHTML = '';
        const totalPages = Math.ceil(this.filteredGames.length / this.config.gamesPerPage);
        if (totalPages <= 1) return;

        const fragment = document.createDocumentFragment();
        const createBtn = (text, page, isActive = false) => {
            const btn = document.createElement('button');
            btn.className = `vanta-page-btn ${isActive ? 'active' : ''}`;
            btn.innerText = text;
            btn.onclick = () => {
                this.currentPage = page; 
                this.updateView(); 
                this.wrapper.scrollIntoView({ behavior: 'smooth' });
            };
            fragment.appendChild(btn);
        };

        if (this.currentPage > 1) createBtn('Prev', this.currentPage - 1);

        let startPage = Math.max(1, this.currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);

        for (let i = startPage; i <= endPage; i++) {
            createBtn(i, i, i === this.currentPage);
        }

        if (this.currentPage < totalPages) createBtn('Next', this.currentPage + 1);
        this.pagination.appendChild(fragment);
    }

    updateView() {
        this.renderGrid();
        this.renderPagination();
    }

    async playGame(url) {
        if (!url) return;
        this.currentGameUrl = url;
        this.currentGameHtml = "";
        this.menuView.style.display = 'none';
        this.gameView.style.display = 'block';

        try {
            const response = await fetch(url);
            const htmlText = await response.text();
            this.currentGameHtml = htmlText;
            this.iframe.srcdoc = htmlText;
        } catch (e) {
            this.iframe.removeAttribute('srcdoc');
            this.iframe.src = url;
        }
    }

    closeGame() {
        this.gameView.style.display = 'none';
        this.menuView.style.display = 'block';
        this.iframe.srcdoc = '';
        this.iframe.src = '';
        this.currentGameUrl = "";
        this.currentGameHtml = "";
    }

    playRandom() {
        if (this.filteredGames.length === 0) return;
        const randomGame = this.filteredGames[Math.floor(Math.random() * this.filteredGames.length)];
        this.playGame(randomGame.url);
    }
}

window.Vanta = new VantaSDK();
