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

class VantaSDK {
    constructor() {
        this.games = [];
        this.filteredGames = [];
        this.currentPage = 1;
        this.currentSearch = "";
        this.currentSource = "All";
        this.currentGameUrl = "";
        this.currentGameHtml = "";
        
        this.config = {
            container: '#games',
            columns: 8,
            rows: 4,
            gamesPerPage: 32,
            fontFamily: "'Inter', 'Poppins', 'Segoe UI', sans-serif"
        };
    }

    async init(options) {
        this.config = { ...this.config, ...options };
        this.container = document.querySelector(this.config.container);
        
        if (!this.container) return;

        this.injectStyles();
        this.buildUI();
        await this.loadGames();
        this.applyFilters();
    }

    injectStyles() {
        if (document.getElementById('vanta-styles')) {
            document.getElementById('vanta-styles').remove();
        }

        const style = document.createElement('style');
        style.id = 'vanta-styles';
        
        style.innerHTML = `
            html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100%;
                height: 100vh;
                overflow: hidden;
                background: #000000;
            }
            .vanta-wrapper {
                font-family: ${this.config.fontFamily};
                background: #000000;
                color: #ffffff;
                width: 100vw;
                height: 100vh;
                padding: 2vh 2vw;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
            }
            .vanta-wrapper *, .vanta-wrapper *::before, .vanta-wrapper *::after {
                box-sizing: border-box;
            }
            .vanta-menu-view {
                display: flex;
                flex-direction: column;
                height: 100%;
                width: 100%;
            }
            .vanta-header { 
                flex-shrink: 0; 
                display: flex; 
                gap: 1vw; 
                margin-bottom: 2vh; 
                align-items: center; 
            }
            .vanta-search {
                flex-grow: 1; padding: 1.5vh 1.5vw; border: 1px solid #222; border-radius: 8px;
                background: #0a0a0a; color: #fff; font-size: max(14px, 1vw); outline: none; transition: all 0.3s ease;
            }
            .vanta-search:focus { border-color: #555; }
            .vanta-search::placeholder { color: #666; }
            .vanta-source-select {
                padding: 1.5vh 1.5vw; border: 1px solid #222; border-radius: 8px;
                background: #0a0a0a; color: #fff; font-size: max(14px, 1vw); outline: none; cursor: pointer; transition: all 0.3s ease;
            }
            .vanta-source-select:hover { background: #111; border-color: #444; }
            .vanta-btn {
                background: #ffffff; color: #000000; border: none; padding: 1.5vh 2vw;
                border-radius: 8px; cursor: pointer; font-size: max(13px, 0.9vw); font-weight: 700; transition: all 0.2s ease;
                text-transform: uppercase;
            }
            .vanta-btn:hover { background: #e0e0e0; transform: translateY(-2px); }
            .vanta-btn:active { transform: translateY(1px); }
            .vanta-grid {
                flex-grow: 1;
                display: grid; 
                grid-template-columns: repeat(${this.config.columns}, 1fr); 
                grid-template-rows: repeat(${this.config.rows}, 1fr);
                gap: 1.5vh 1vw;
                min-height: 0;
            }
            .vanta-game-card {
                background: #050505; border-radius: 12px; overflow: hidden; position: relative;
                transition: all 0.2s ease; cursor: pointer; border: 1px solid #1a1a1a;
                width: 100%; height: 100%;
            }
            .vanta-game-card:hover { transform: scale(1.02); border-color: #444; box-shadow: 0 10px 30px rgba(0,0,0,0.8); z-index: 10; }
            .vanta-game-img { width: 100%; height: 100%; object-fit: cover; transition: all 0.3s ease; }
            .vanta-game-card:hover .vanta-game-img { filter: brightness(0.6); transform: scale(1.05); }
            .vanta-badge {
                position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.9);
                color: white; font-size: max(9px, 0.7vw); font-weight: 700; padding: 4px 8px; border-radius: 6px; z-index: 2;
                border: 1px solid #333; text-transform: uppercase;
            }
            .vanta-game-title-overlay {
                position: absolute; bottom: 0; left: 0; width: 100%;
                background: linear-gradient(to top, #000 0%, rgba(0,0,0,0.9) 60%, transparent 100%);
                color: #fff; padding: 20px 10px 10px 10px; font-size: max(12px, 0.9vw); font-weight: 700;
                text-align: center; opacity: 0; transition: opacity 0.2s ease; pointer-events: none; z-index: 2;
            }
            .vanta-game-card:hover .vanta-game-title-overlay { opacity: 1; }
            .vanta-pagination { 
                flex-shrink: 0; 
                display: flex; 
                justify-content: center; 
                gap: 0.5vw; 
                margin-top: 2vh; 
            }
            .vanta-page-btn {
                padding: 1vh 1.5vw; border: 1px solid #222; background: #0a0a0a;
                color: #fff; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; font-weight: 600; font-size: max(13px, 0.9vw);
            }
            .vanta-page-btn:hover { background: #1a1a1a; border-color: #555; }
            .vanta-page-btn.active { background: #fff; color: #000; border-color: #fff; }
            .vanta-game-view {
                display: none; position: relative; width: 100%; height: 100%;
                background: #000; border-radius: 12px; overflow: hidden; border: 1px solid #222;
            }
            .vanta-iframe { width: 100%; height: 100%; border: none; background: #fff; }
            .vanta-toolbar {
                position: absolute; top: 12px; left: 12px; display: flex; gap: 10px; z-index: 10;
            }
            .vanta-action-btn {
                background: #0a0a0a; color: #fff; border: 1px solid #333; padding: 10px 16px;
                border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 13px; transition: all 0.2s ease;
            }
            .vanta-action-btn:hover { background: #1a1a1a; border-color: #fff; }
            .vanta-back-btn { background: #aa2e25; border-color: #d32f2f; }
            .vanta-back-btn:hover { background: #d32f2f; border-color: #f44336; }
        `;
        document.head.appendChild(style);
    }

    buildUI() {
        this.container.innerHTML = `
            <div class="vanta-wrapper" id="vanta-main-wrapper">
                <div class="vanta-menu-view">
                    <div class="vanta-header">
                        <select class="vanta-source-select">
                            <option value="All">All Sources</option>
                            <option value="GNMath">GNMath</option>
                            <option value="UGS">UGS</option>
                            <option value="Daknux">Daknux</option>
                        </select>
                        <input type="text" class="vanta-search" placeholder="Search games...">
                        <button class="vanta-btn vanta-random-btn">Random Game</button>
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

        this.gameView = this.container.querySelector('.vanta-game-view');
        this.iframe = this.container.querySelector('.vanta-iframe');
        this.backBtn = this.container.querySelector('.vanta-back-btn');
        this.aboutBlankBtn = this.container.querySelector('.vanta-aboutblank-btn');
        this.fullscreenBtn = this.container.querySelector('.vanta-fullscreen-btn');

        this.searchInput.addEventListener('input', (e) => {
            this.currentSearch = e.target.value;
            this.applyFilters();
        });
        
        this.sourceSelect.addEventListener('change', (e) => {
            this.currentSource = e.target.value;
            this.applyFilters();
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
        this.menuView.style.display = 'flex';
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
