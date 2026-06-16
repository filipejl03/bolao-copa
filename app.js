function logout() {
    localStorage.removeItem("bolao_login");
    location.reload();
}
// ── TEMA CLARO / ESCURO ───────────────────────────────────────────────────
function applyTheme() {
    const saved = localStorage.getItem("bolao_theme");
    if (saved === "dark")  { document.body.classList.add("dark");  document.body.classList.remove("light"); }
    if (saved === "light") { document.body.classList.add("light"); document.body.classList.remove("dark");  }
}

function toggleTheme() {
    const isDark = document.body.classList.contains("dark") ||
        (!document.body.classList.contains("light") &&
         window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDark) {
        document.body.classList.remove("dark");
        document.body.classList.add("light");
        localStorage.setItem("bolao_theme", "light");
    } else {
        document.body.classList.add("dark");
        document.body.classList.remove("light");
        localStorage.setItem("bolao_theme", "dark");
    }
    updateThemeBtn();
}

function updateThemeBtn() {
    const btn = document.getElementById("btn-theme");
    if (!btn) return;
    const isDark = document.body.classList.contains("dark") ||
        (!document.body.classList.contains("light") &&
         window.matchMedia("(prefers-color-scheme: dark)").matches);
    btn.textContent = isDark ? "☀ Claro" : "🌙 Escuro";
    btn.setAttribute("style", "margin-left:8px;padding:5px 14px;font-size:0.8rem;border-radius:20px;background:rgba(255,255,255,0.9) !important;border:1px solid rgba(0,0,0,0.15);color:#1b2e1c;font-weight:700;cursor:pointer");
}

applyTheme();

// ── MANUTENÇÃO ───────────────────────────────────────────────────────────────
function loadManutencaoStatus() {
    db.ref("manutencao").on("value", s => {
        const ativo  = s.val() === true;
        const statusEl = document.getElementById("manut-status");
        const btnEl    = document.getElementById("manut-btn");
        if (!statusEl || !btnEl) return;
        if (ativo) {
            statusEl.innerHTML = `<span style="color:#c62828;font-weight:700;font-size:0.88rem">● Manutenção ATIVA — participantes bloqueados</span>`;
            btnEl.textContent  = "Desativar manutenção";
            btnEl.className    = "btn-red btn-sm";
        } else {
            statusEl.innerHTML = `<span style="color:#2e7d32;font-weight:700;font-size:0.88rem">● Bolão funcionando normalmente</span>`;
            btnEl.textContent  = "Ativar manutenção";
            btnEl.className    = "btn-blue btn-sm";
        }
    });
}

window.toggleManutencao = () => {
    const btnEl = document.getElementById("manut-btn");
    if (btnEl) btnEl.disabled = true;
    db.ref("manutencao").once("value").then(s => {
        const novoValor = s.val() !== true;
        return db.ref("manutencao").set(novoValor);
    }).then(() => {
        if (btnEl) btnEl.disabled = false;
    }).catch(err => {
        console.error("Erro ao alterar manutencao:", err);
        if (btnEl) btnEl.disabled = false;
        alert("Erro ao alterar modo de manutencao. Tente novamente.");
    });
};

function telaManutencao(nomeUsuario) {
    app.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;padding:40px 20px">
            <div style="font-size:4rem;animation:girar 1.4s linear infinite;margin-bottom:24px">⚽</div>
            <h2 style="color:#2e7d32;font-size:1.3rem;margin-bottom:10px">Atualizando Ranking do Bolão</h2>
            <p style="color:#555;font-size:0.9rem;max-width:280px;line-height:1.6">Estamos calculando os pontos e atualizando a classificação. Volte em instantes!</p>
            <div style="display:flex;gap:6px;justify-content:center;margin-top:20px">
                <div style="width:8px;height:8px;border-radius:50%;background:#43a047;animation:pulsar 1.2s ease-in-out infinite"></div>
                <div style="width:8px;height:8px;border-radius:50%;background:#43a047;animation:pulsar 1.2s ease-in-out .2s infinite"></div>
                <div style="width:8px;height:8px;border-radius:50%;background:#43a047;animation:pulsar 1.2s ease-in-out .4s infinite"></div>
            </div>
            <p style="color:#aaa;font-size:0.78rem;margin-top:20px">Aguarde a manutenção encerrar para continuar.</p>
        </div>`;
}

const firebaseConfig = {
    apiKey: "AIzaSyAMEAYIBuax5h2CaBugrRraVCEeVVST2KI",
    authDomain: "bolao-copa-2026-c8b2b.firebaseapp.com",
    databaseURL: "https://bolao-copa-2026-c8b2b-default-rtdb.firebaseio.com",
    projectId: "bolao-copa-2026-c8b2b",
    storageBucket: "bolao-copa-2026-c8b2b.firebasestorage.app",
    messagingSenderId: "196377474707",
    appId: "1:196377474707:web:9305adfa8888472f13bf66"
};

firebase.initializeApp(firebaseConfig);
const db  = firebase.database();
const app = document.getElementById("app");

// ── AUTENTICAÇÃO ANÔNIMA ───────────────────────────────────────────────────
firebase.auth().signInAnonymously().catch(err => {
    console.error("Erro no login anônimo:", err);
});

// ── FORMATAÇÃO DE DATA/HORA ───────────────────────────────────────────────────
function formatDatetime(dt) {
    if (!dt) return "";
    const d = new Date(dt + (dt.includes("T") ? "" : "T00:00"));
    const dias = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
    const dia  = dias[d.getDay()];
    const dd   = String(d.getDate()).padStart(2, "0");
    const mm   = String(d.getMonth() + 1).padStart(2, "0");
    const hh   = String(d.getHours()).padStart(2, "0");
    const min  = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm} · ${dia} · ${hh}h${min}`;
}

// ── BANDEIRAS ────────────────────────────────────────────────────────────────
const FLAG_MAP = {
    "canadá":"🇨🇦","estados unidos":"🇺🇸","eua":"🇺🇸","méxico":"🇲🇽",
    "argentina":"🇦🇷","brasil":"🇧🇷","colômbia":"🇨🇴","equador":"🇪🇨",
    "paraguai":"🇵🇾","uruguai":"🇺🇾","haiti":"🇭🇹","panamá":"🇵🇦","curaçau":"🇨🇼",
    "alemanha":"🇩🇪","áustria":"🇦🇹","bélgica":"🇧🇪","bósnia e herzegovina":"🇧🇦",
    "croácia":"🇭🇷","escócia":"🏴󠁧󠁢󠁳󠁣󠁴󠁿","espanha":"🇪🇸","frança":"🇫🇷",
    "holanda":"🇳🇱","inglaterra":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","noruega":"🇳🇴","portugal":"🇵🇹",
    "tchéquia":"🇨🇿","suécia":"🇸🇪","suíça":"🇨🇭","turquia":"🇹🇷",
    "áfrica do sul":"🇿🇦","argélia":"🇩🇿","cabo verde":"🇨🇻","costa do marfim":"🇨🇮",
    "egito":"🇪🇬","gana":"🇬🇭","marrocos":"🇲🇦","rd congo":"🇨🇩",
    "senegal":"🇸🇳","tunísia":"🇹🇳","arábia saudita":"🇸🇦","austrália":"🇦🇺",
    "catar":"🇶🇦","coreia do sul":"🇰🇷","irã":"🇮🇷","iraque":"🇮🇶",
    "japão":"🇯🇵","jordânia":"🇯🇴","uzbequistão":"🇺🇿","nova zelândia":"🇳🇿",
};

function flag(teamName) {
    if (!teamName) return "";
    const key = teamName.toLowerCase().trim();
    return FLAG_MAP[key] ? FLAG_MAP[key] + " " : "";
}

function teamLabel(name) {
    return flag(name) + name;
}

// ── PONTUAÇÃO ────────────────────────────────────────────────────────────────
function calcPontos(pa, pb, ra, rb) {
    pa = parseInt(pa); pb = parseInt(pb);
    ra = parseInt(ra); rb = parseInt(rb);
    if (isNaN(pa) || isNaN(pb) || isNaN(ra) || isNaN(rb)) return null;

    const empateP = pa === pb;
    const empateR = ra === rb;
    const vencP   = pa > pb ? "A" : pa < pb ? "B" : "E";
    const vencR   = ra > rb ? "A" : ra < rb ? "B" : "E";

    if (pa === ra && pb === rb)
        return { cod: "PE", desc: "Placar Exato", pts: 25 };
    if (empateP && empateR)
        return { cod: "AE", desc: "Acertou Empate", pts: 15 };
    if (!empateP && vencP === vencR) {
        const golsVencP = vencP === "A" ? pa : pb;
        const golsVencR = vencR === "A" ? ra : rb;
        if (golsVencP === golsVencR)
            return { cod: "GV", desc: "Vencedor + Gols do Vencedor", pts: 18 };
    }
    if (!empateP && vencP === vencR) {
        const golsPerdP = vencP === "A" ? pb : pa;
        const golsPerdR = vencR === "A" ? rb : ra;
        if (golsPerdP === golsPerdR)
            return { cod: "GP", desc: "Vencedor + Gols do Perdedor", pts: 12 };
    }
    if (!empateP && vencP === vencR)
        return { cod: "VP", desc: "Apenas Vencedor", pts: 10 };

    return null;
}

// ── STATUS DA RODADA ───────────────────────────────────────────────────────
function getRoundStatus(rodada, rounds, grupos) {
    const r = rounds[rodada] || {};
    const jogos = grupos[rodada] || [];

    if (jogos.length > 0) {
        const totalComResultado = jogos.filter(item =>
            item.game.resultA !== undefined && item.game.resultB !== undefined
        ).length;
        if (totalComResultado === jogos.length) return "encerrada";
    }

    if (r.open) return "aberta";
    if (r.iniciada) return "andamento";
    return "fechada";
}

// ── STATUS DE JOGO INDIVIDUAL (mata-mata oitavas+) ────────────────────────
function getGameStatus(game) {
    if (game.resultA !== undefined && game.resultB !== undefined) return "encerrada";
    if (game.open) return "aberta";
    if (game.iniciada) return "andamento";
    return "fechada";
}

// ── VENCEDOR DO MATA-MATA ─────────────────────────────────────────────────
// Retorna o nome do time vencedor com base em finalA/B e penA/B
function vencedorMM(game) {
    const fa = parseInt(game.finalA);
    const fb = parseInt(game.finalB);
    if (isNaN(fa) || isNaN(fb)) return null;
    if (fa > fb) return game.a;
    if (fb > fa) return game.b;
    // empate no placar final → decide nos pênaltis
    const pa = parseInt(game.penA);
    const pb = parseInt(game.penB);
    if (!isNaN(pa) && !isNaN(pb)) {
        if (pa > pb) return game.a;
        if (pb > pa) return game.b;
    }
    return null;
}

// ── NOMES FIXOS DAS FASES ─────────────────────────────────────────────────
const FASES_MM = [
    "16 avos de final",
    "Oitavas de final",
    "Quartas de final",
    "Semifinal",
    "Disputa 3º lugar",
    "Final"
];
const FASE_INDEX = {};
FASES_MM.forEach((f, i) => { FASE_INDEX[f] = i; });

// Dada a fase atual, retorna a próxima fase para propagação
function proximaFase(faseAtual) {
    const idx = FASE_INDEX[faseAtual];
    if (idx === undefined) return null;
    if (faseAtual === "Semifinal") return "Final"; // Semifinal gera Final + Disputa 3º lugar
    if (idx < FASES_MM.length - 1) return FASES_MM[idx + 1];
    return null;
}

// ── LOGIN ────────────────────────────────────────────────────────────────────
function loginScreen() {
    app.innerHTML = `
        <div class="card">
            <h3>🏆 Bolão Copa 2026</h3>
            <select id="user"><option value="admin">Administrador</option></select><br>
            PIN <input id="pin" type="password"><br>
            <button onclick="login()">Entrar</button>
        </div>`;

    db.ref("participants").on("value", (s) => {
        const sel = document.getElementById("user");
        let options = '<option value="admin">Administrador</option>';
        s.forEach(c => {
            options += `<option value="${c.key}">${c.val().name}</option>`;
        });
        sel.innerHTML = options;
    });
}

window.login = async () => {
    const u = document.getElementById("user").value;
    const p = document.getElementById("pin").value;
    if (u === "admin" && p === "2025") {
        localStorage.setItem("bolao_login", "admin");
        adminPanel();
        return;
    }
    const s = await db.ref("participants/" + u).get();
    if (s.exists() && s.val().pin === p) {
        localStorage.setItem("bolao_login", u);
        participant(u, s.val());
    } else {
        alert("Login inválido");
    }
};

// ── ADMIN ────────────────────────────────────────────────────────────────────
function adminPanel() {
    app.innerHTML = `
        <h2 style="display:inline">⚙️ Administrador</h2>
        <button id="btn-theme" onclick="toggleTheme()" style="margin-left:8px;padding:5px 14px;font-size:0.8rem;border-radius:20px;background:rgba(255,255,255,0.9);border:1px solid rgba(0,0,0,0.15);color:#1b2e1c;font-weight:700;cursor:pointer">🌙 Escuro</button>
        <button class="btn-red" onclick="logout()">Sair</button>

        <div class="card">
            <h3>Novo participante</h3>
            <input id="n" placeholder="Nome">
            <input id="p" placeholder="PIN">
            <button class="btn-gold" onclick="addParticipant()">Cadastrar</button>
        </div>

        <div class="card">
            <h3>Novo jogo</h3>
            <input id="rodada" placeholder="Nome da Rodada (ex: Rodada 1)">
            <input id="t1" placeholder="Time A">
            <input id="t2" placeholder="Time B">
            <input id="grupo" placeholder="Grupo (ex: Grupo A) — deixe vazio para eliminatórias">
            <label style="font-size:0.85rem;color:#555">Data e hora do jogo</label>
            <input id="dt" type="datetime-local">
            <div style="margin:10px 0 8px;display:flex;align-items:center;gap:10px">
                <label class="mm-toggle-label" style="display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none">
                    <div class="mm-toggle" id="toggle-mm" onclick="toggleMM()" style="width:40px;height:22px;border-radius:11px;background:#ccc;position:relative;cursor:pointer;transition:background .2s;flex-shrink:0">
                        <div id="toggle-mm-dot" style="width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:3px;left:3px;transition:left .2s"></div>
                    </div>
                    <span id="toggle-mm-label" style="font-size:0.88rem;color:#555">Fase eliminatória (mata-mata)</span>
                </label>
            </div>
            <button class="btn-gold" onclick="addGame()">Adicionar</button>
        </div>

        <div class="card">
            <h3>⚙️ Manutenção</h3>
            <p style="font-size:0.88rem;color:#555;margin-bottom:10px">Quando ativada, os participantes veem apenas a tela "Atualizando Ranking" e não conseguem interagir.</p>
            <div id="manut-status" style="margin-bottom:8px"></div>
            <button id="manut-btn" class="btn-blue btn-sm" onclick="toggleManutencao()">Carregando...</button>
        </div>

        <div class="card">
            <h3>💾 Backup &amp; Restauração</h3>
            <p style="font-size:0.88rem;color:#555;margin-bottom:12px">Salve uma cópia de todos os dados ou restaure a partir de um backup anterior.</p>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
                <div style="flex:1;min-width:180px;background:#e1f5ee;border-radius:8px;padding:12px">
                    <div style="font-size:0.88rem;font-weight:700;color:#0f6e56;margin-bottom:4px">📥 Fazer Backup</div>
                    <div style="font-size:0.78rem;color:#2e7d32;margin-bottom:10px">Baixa um arquivo .json com todos os dados atuais do Firebase.</div>
                    <button class="btn-sm" style="background:#00897b;color:#fff;width:100%" onclick="fazerBackup()">Baixar Backup</button>
                </div>
                <div style="flex:1;min-width:180px;background:#fffdf0;border-radius:8px;padding:12px">
                    <div style="font-size:0.88rem;font-weight:700;color:#854f0b;margin-bottom:4px">📤 Carregar Backup</div>
                    <div style="font-size:0.78rem;color:#ba7517;margin-bottom:10px">Importa um .json e sobrescreve os dados no Firebase.</div>
                    <button class="btn-gold btn-sm" style="width:100%" onclick="document.getElementById('input-backup').click()">Carregar Backup</button>
                    <input type="file" id="input-backup" accept=".json" style="display:none" onchange="carregarBackup(event)">
                </div>
            </div>
            <div style="font-size:0.78rem;color:#c62828;margin-top:10px;padding:7px 10px;background:#fdecea;border-radius:6px">
                ⚠️ "Carregar Backup" substitui <strong>todos</strong> os dados atuais. Uma confirmação dupla será solicitada.
            </div>
        </div>

        <div class="card">
            <h3>Jogos por Rodada</h3>
            <div id="games"></div>
        </div>`;

    loadGamesAdmin();
    loadManutencaoStatus();
    updateThemeBtn();
}

// ── TOGGLE MATA-MATA ──────────────────────────────────────────────────────────
let _mmAtivo = false;
window.toggleMM = () => {
    _mmAtivo = !_mmAtivo;
    const dot   = document.getElementById("toggle-mm-dot");
    const track = document.getElementById("toggle-mm");
    const lbl   = document.getElementById("toggle-mm-label");
    if (_mmAtivo) {
        track.style.background = "#43a047";
        dot.style.left = "21px";
        lbl.style.color = "#2e7d32";
        lbl.style.fontWeight = "700";
    } else {
        track.style.background = "#ccc";
        dot.style.left = "3px";
        lbl.style.color = "#555";
        lbl.style.fontWeight = "400";
    }
};

window.addParticipant = () => {
    const nome = document.getElementById("n").value;
    const pin  = document.getElementById("p").value;
    if (!nome || !pin) { alert("Preencha nome e PIN"); return; }
    db.ref("participants").push({ name: nome, pin: pin });
    alert("Cadastrado!");
};

window.addGame = () => {
    const nomeRodada = document.getElementById("rodada").value.trim();
    const timeA      = document.getElementById("t1").value.trim();
    const timeB      = document.getElementById("t2").value.trim();
    const grupo      = document.getElementById("grupo").value.trim();
    const dt         = document.getElementById("dt").value;
    if (!nomeRodada || !timeA || !timeB) { alert("Preencha rodada e os dois times"); return; }

    db.ref("rounds/" + nomeRodada).once("value").then(snap => {
        if (!snap.exists()) {
            const roundData = { open: !_mmAtivo, iniciada: false };
            if (_mmAtivo) {
                roundData.eliminatorio = true;
                roundData.faseIndex = FASE_INDEX[nomeRodada] !== undefined ? FASE_INDEX[nomeRodada] : 0;
            }
            db.ref("rounds/" + nomeRodada).set(roundData);
        }
    });

    const gameData = { rodada: nomeRodada, a: timeA, b: timeB };
    if (grupo) gameData.grupo = grupo;
    if (dt)    gameData.datetime = dt;
    if (_mmAtivo) {
        gameData.eliminatorio = true;
        // ordemMM será atribuído com base na contagem atual de jogos da rodada
        db.ref("games").orderByChild("rodada").equalTo(nomeRodada).once("value").then(snap => {
            gameData.ordemMM = snap.numChildren() + 1;
            db.ref("games").push(gameData);
        });
    } else {
        db.ref("games").push(gameData);
    }
    alert("Jogo criado!");
};

// ── ADMIN: renderização dos jogos ─────────────────────────────────────────────
let _admGamesSnap  = null;
let _admRoundsSnap = null;

function loadGamesAdmin() {
    db.ref("games").on("value", s => { _admGamesSnap = s; renderGamesAdmin(); });
    db.ref("rounds").on("value", s => { _admRoundsSnap = s; renderGamesAdmin(); });
}

const STATUS_BADGES = {
    aberta:    { label: "Aberta",       bg: "#e8f5e9", color: "#2e7d32" },
    andamento: { label: "Em andamento", bg: "#fff8e1", color: "#f57f17" },
    fechada:   { label: "Fechada",      bg: "#fdecea", color: "#c0392b" },
    encerrada: { label: "Encerrada",    bg: "#eceff1", color: "#607d8b" }
};

function renderGamesAdmin() {
    if (!_admGamesSnap || !_admRoundsSnap) return;

    const rounds = {};
    _admRoundsSnap.forEach(c => { rounds[c.key] = c.val(); });

    const grupos = {};
    _admGamesSnap.forEach(c => {
        const g = c.val();
        if (!grupos[g.rodada]) grupos[g.rodada] = [];
        grupos[g.rodada].push({ id: c.key, game: g });
    });

    // Ordena jogos mata-mata por ordemMM dentro de cada rodada
    for (const rodada in grupos) {
        if (rounds[rodada] && rounds[rodada].eliminatorio) {
            grupos[rodada].sort((a, b) => (a.game.ordemMM || 0) - (b.game.ordemMM || 0));
        }
    }

    let h = "";
    for (const rodada in grupos) {
        const isElim = rounds[rodada] && rounds[rodada].eliminatorio;
        const status = getRoundStatus(rodada, rounds, grupos);
        h += isElim
            ? htmlRodadaAdminMM(rodada, rounds[rodada], grupos[rodada])
            : htmlRodadaAdmin(rodada, status, grupos[rodada]);
    }

    document.getElementById("games").innerHTML = h || "<p>Nenhum jogo cadastrado.</p>";
}

// ── ADMIN: rodada normal ───────────────────────────────────────────────────
function htmlRodadaAdmin(rodada, status, jogos) {
    const idCollapse = "adm_" + rodada.replace(/\s+/g, '_');
    const b = STATUS_BADGES[status];

    let jogosHtml = "";
    jogos.forEach(item => {
        const g  = item.game;
        const ga = g.resultA !== undefined ? g.resultA : "";
        const gb = g.resultB !== undefined ? g.resultB : "";
        const metaInfo = [
            g.grupo    ? `<strong style="font-size:0.78rem">${g.grupo}</strong>` : "",
            g.datetime ? `<span style="color:#888;font-size:0.78rem">${formatDatetime(g.datetime)}</span>` : ""
        ].filter(Boolean).join(" ");
        jogosHtml += `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid #eee">
                <div>
                    <span>${teamLabel(g.a)} x ${teamLabel(g.b)}</span>
                    ${metaInfo ? `<div style="margin-top:3px">${metaInfo}</div>` : ""}
                </div>
                <div style="display:flex;gap:6px">
                    <input id="ga_${item.id}" size="2" value="${ga}" placeholder="A" style="width:40px;text-align:center">
                    <input id="gb_${item.id}" size="2" value="${gb}" placeholder="B" style="width:40px;text-align:center">
                    <button class="btn-gold btn-sm" onclick="saveResult('${item.id}')">Salvar</button>
                </div>
            </div>`;
    });

    let botoes = "";
    if (status === "aberta") {
        botoes = `<button class="btn-blue btn-sm" onclick="toggleRound('${rodada}', false)">🔒 Fechar para palpites</button>`;
    } else if (status === "fechada") {
        botoes = `
            <button class="btn-blue btn-sm" onclick="toggleRound('${rodada}', true)">🔓 Abrir para palpites</button>
            <button class="btn-blue btn-sm" onclick="toggleIniciada('${rodada}', true)">▶️ Marcar em andamento</button>`;
    } else if (status === "andamento") {
        botoes = `<button class="btn-blue btn-sm" onclick="toggleIniciada('${rodada}', false)">⏸️ Voltar para fechada</button>`;
    }

    return `
        <div class="card" style="border:1px solid #ccc;margin-bottom:10px">
            <div onclick="toggleCollapse('${idCollapse}')" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center">
                <h3 style="margin:0">${rodada}</h3>
                <div style="display:flex;align-items:center;gap:8px">
                    <span style="font-size:0.8rem;padding:2px 10px;border-radius:12px;background:${b.bg};color:${b.color}">${b.label}</span>
                    <span id="arrow_${idCollapse}" style="font-size:1.2rem;color:#888">▼</span>
                </div>
            </div>
            <div id="${idCollapse}" style="display:none;margin-top:12px">
                ${jogosHtml}
                ${botoes ? `<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">${botoes}</div>` : ""}
            </div>
        </div>`;
}

// ── ADMIN: rodada mata-mata ────────────────────────────────────────────────
function htmlRodadaAdminMM(rodada, roundData, jogos) {
    const idCollapse = "adm_" + rodada.replace(/\s+/g, '_');
    const faseIdx    = roundData.faseIndex || 0;
    // Para 16 avos: controle por rodada. Para oitavas+: controle por jogo.
    const ctrlRodada = faseIdx === 0;

    let jogosHtml = "";
    jogos.forEach(item => {
        const g      = item.game;
        const ga     = g.resultA !== undefined ? g.resultA : "";
        const gb     = g.resultB !== undefined ? g.resultB : "";
        const fa     = g.finalA  !== undefined ? g.finalA  : "";
        const fb     = g.finalB  !== undefined ? g.finalB  : "";
        const pa     = g.penA    !== undefined ? g.penA    : "";
        const pb     = g.penB    !== undefined ? g.penB    : "";
        const dt     = g.datetime || "";
        const gameStatus = ctrlRodada ? null : getGameStatus(g);
        const bGame  = gameStatus ? STATUS_BADGES[gameStatus] : null;

        const botoesJogo = (!ctrlRodada && gameStatus !== "encerrada") ? `
            <div style="margin-top:6px;display:flex;gap:5px;flex-wrap:wrap">
                ${gameStatus === "fechada"   ? `<button class="btn-blue btn-sm" onclick="toggleGameOpen('${item.id}', true)">🔓 Abrir palpite</button>` : ""}
                ${gameStatus === "aberta"    ? `<button class="btn-blue btn-sm" onclick="toggleGameOpen('${item.id}', false)">🔒 Fechar palpite</button>` : ""}
                ${gameStatus === "fechada"   ? `<button class="btn-blue btn-sm" onclick="toggleGameIniciada('${item.id}', true)">▶️ Em andamento</button>` : ""}
                ${gameStatus === "andamento" ? `<button class="btn-blue btn-sm" onclick="toggleGameIniciada('${item.id}', false)">⏸️ Voltar fechado</button>` : ""}
            </div>` : "";

        jogosHtml += `
            <div style="padding:10px 0;border-bottom:1px solid #eee">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:6px">
                    <div>
                        <span>${teamLabel(g.a)} x ${teamLabel(g.b)}</span>
                        ${dt ? `<div style="font-size:0.78rem;color:#888;margin-top:2px">${formatDatetime(dt)}</div>` : ""}
                    </div>
                    ${bGame ? `<span style="font-size:0.78rem;padding:2px 8px;border-radius:10px;background:${bGame.bg};color:${bGame.color}">${bGame.label}</span>` : ""}
                </div>
                ${!ctrlRodada ? `
                <div style="margin-bottom:4px;display:flex;align-items:center;gap:6px">
                    <label style="font-size:0.8rem;color:#555;min-width:110px">Data/hora</label>
                    <input id="gdt_${item.id}" type="datetime-local" value="${dt}" style="font-size:0.8rem;padding:4px 6px">
                    <button class="btn-sm" style="background:#607d8b;color:#fff;font-size:0.78rem" onclick="saveDatetime('${item.id}')">Salvar</button>
                </div>` : ""}
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;flex-wrap:wrap">
                    <label style="font-size:0.8rem;color:#555;min-width:110px">Tempo normal</label>
                    <input id="ga_${item.id}" size="2" value="${ga}" placeholder="A" style="width:38px;text-align:center">
                    <span style="color:#888">×</span>
                    <input id="gb_${item.id}" size="2" value="${gb}" placeholder="B" style="width:38px;text-align:center">
                    <small style="color:#888;font-size:0.75rem">→ pontuação</small>
                </div>
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;flex-wrap:wrap">
                    <label style="font-size:0.8rem;color:#555;min-width:110px">Placar final</label>
                    <input id="gfa_${item.id}" size="2" value="${fa}" placeholder="A" style="width:38px;text-align:center">
                    <span style="color:#888">×</span>
                    <input id="gfb_${item.id}" size="2" value="${fb}" placeholder="B" style="width:38px;text-align:center">
                    <small style="color:#888;font-size:0.75rem">→ chaveamento</small>
                </div>
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap">
                    <label style="font-size:0.8rem;color:#555;min-width:110px">Pênaltis (opcional)</label>
                    <input id="gpa_${item.id}" size="2" value="${pa}" placeholder="—" style="width:38px;text-align:center">
                    <span style="color:#888">×</span>
                    <input id="gpb_${item.id}" size="2" value="${pb}" placeholder="—" style="width:38px;text-align:center">
                    <small style="color:#888;font-size:0.75rem">→ chaveamento</small>
                </div>
                <button class="btn-gold btn-sm" onclick="saveResultMM('${item.id}', '${rodada}', ${item.game.ordemMM || 0})">Salvar resultado</button>
                ${botoesJogo}
            </div>`;
    });

    // Botões de controle da rodada (só para 16 avos — faseIdx===0)
    let botoesRodada = "";
    if (ctrlRodada) {
        const status = getRoundStatus(rodada, { [rodada]: roundData }, { [rodada]: jogos });
        const b = STATUS_BADGES[status];
        if (status === "aberta") {
            botoesRodada = `<button class="btn-blue btn-sm" onclick="toggleRound('${rodada}', false)">🔒 Fechar para palpites</button>`;
        } else if (status === "fechada") {
            botoesRodada = `
                <button class="btn-blue btn-sm" onclick="toggleRound('${rodada}', true)">🔓 Abrir para palpites</button>
                <button class="btn-blue btn-sm" onclick="toggleIniciada('${rodada}', true)">▶️ Marcar em andamento</button>`;
        } else if (status === "andamento") {
            botoesRodada = `<button class="btn-blue btn-sm" onclick="toggleIniciada('${rodada}', false)">⏸️ Voltar para fechada</button>`;
        }
    }

    const statusGeral  = getRoundStatus(rodada, { [rodada]: roundData }, { [rodada]: jogos });
    const bg           = STATUS_BADGES[statusGeral];
    const badgeRodada  = ctrlRodada
        ? `<span style="font-size:0.8rem;padding:2px 10px;border-radius:12px;background:${bg.bg};color:${bg.color}">${bg.label}</span>`
        : `<span style="font-size:0.78rem;color:#888">controle individual</span>`;

    return `
        <div class="card" style="border:1px solid #c8e6c9;margin-bottom:10px">
            <div onclick="toggleCollapse('${idCollapse}')" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center">
                <h3 style="margin:0">⚔️ ${rodada}</h3>
                <div style="display:flex;align-items:center;gap:8px">
                    ${badgeRodada}
                    <span id="arrow_${idCollapse}" style="font-size:1.2rem;color:#888">▼</span>
                </div>
            </div>
            <div id="${idCollapse}" style="display:none;margin-top:12px">
                ${jogosHtml}
                ${botoesRodada ? `<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">${botoesRodada}</div>` : ""}
            </div>
        </div>`;
}

// ── SALVAR RESULTADO MATA-MATA ─────────────────────────────────────────────
window.saveResultMM = (gid, rodada, ordemMM) => {
    const ra = document.getElementById("ga_"  + gid).value;
    const rb = document.getElementById("gb_"  + gid).value;
    const fa = document.getElementById("gfa_" + gid).value;
    const fb = document.getElementById("gfb_" + gid).value;
    const pa = document.getElementById("gpa_" + gid).value;
    const pb = document.getElementById("gpb_" + gid).value;

    if (ra === "" || rb === "") { alert("Preencha o placar do tempo normal"); return; }
    if (fa === "" || fb === "") { alert("Preencha o placar final"); return; }

    const updates = { resultA: ra, resultB: rb, finalA: fa, finalB: fb };
    if (pa !== "" && pb !== "") { updates.penA = pa; updates.penB = pb; }

    db.ref("games/" + gid).update(updates).then(() => {
        alert("Resultado salvo!");
        propagarMM(gid, rodada, ordemMM);
    });
};

// ── PROPAGAÇÃO AUTOMÁTICA DO CHAVEAMENTO ──────────────────────────────────
function propagarMM(gid, rodadaAtual, ordemMM) {
    // Não propaga a partir de Disputa 3º lugar ou Final
    if (rodadaAtual === "Disputa 3º lugar" || rodadaAtual === "Final") return;

    db.ref("games/" + gid).once("value").then(snap => {
        const game = snap.val();
        const venc = vencedorMM(game);
        if (!venc) return;

        // Determina em qual jogo da próxima fase este time vai entrar
        // Par: ordens 1+2 → oitava 1, ordens 3+4 → oitava 2, etc.
        const parIdx   = Math.ceil(ordemMM / 2); // posição do jogo-filho na próxima fase
        const slotMM   = ordemMM % 2 === 1 ? "a" : "b"; // time A ou B no jogo-filho

        // Nome da próxima fase
        let proximaRodada = proximaFase(rodadaAtual);
        if (!proximaRodada) return;

        // Para Semifinal: perdedor vai para Disputa 3º lugar, vencedor vai para Final
        // A propagação aqui é apenas do vencedor → Final
        // O perdedor é tratado separadamente quando ambas as semis tiverem resultado

        // Busca se já existe jogo na próxima fase com ordemMM = parIdx
        db.ref("games").orderByChild("rodada").equalTo(proximaRodada).once("value").then(snapProx => {
            let jogoExistente = null;
            let jogoExistenteId = null;
            snapProx.forEach(c => {
                if (c.val().ordemMM === parIdx) {
                    jogoExistente = c.val();
                    jogoExistenteId = c.key;
                }
            });

            if (jogoExistente) {
                // Jogo já existe: atualiza só o slot correto
                db.ref("games/" + jogoExistenteId + "/" + slotMM).set(venc);
            } else {
                // Jogo ainda não existe: cria com o primeiro time e aguarda o segundo
                const novoJogo = {
                    rodada: proximaRodada,
                    ordemMM: parIdx,
                    eliminatorio: true,
                    open: false,
                    iniciada: false
                };
                novoJogo[slotMM] = venc;
                novoJogo[slotMM === "a" ? "b" : "a"] = "Aguardando...";

                // Garante que a rodada existe no Firebase
                db.ref("rounds/" + proximaRodada).once("value").then(snapRound => {
                    if (!snapRound.exists()) {
                        db.ref("rounds/" + proximaRodada).set({
                            open: false,
                            iniciada: false,
                            eliminatorio: true,
                            faseIndex: FASE_INDEX[proximaRodada] || 0
                        });
                    }
                    db.ref("games").push(novoJogo);
                });
            }
        });

        // Caso semifinal: propagar perdedor para Disputa 3º lugar
        if (rodadaAtual === "Semifinal") {
            const perd = venc === game.a ? game.b : game.a;
            propagarPerdedorSemi(perd, parIdx, slotMM);
        }
    });
}

function propagarPerdedorSemi(perdedor, parIdx, slotMM) {
    const rodadaDisp = "Disputa 3º lugar";
    db.ref("games").orderByChild("rodada").equalTo(rodadaDisp).once("value").then(snapDisp => {
        let jogoExistente = null;
        let jogoExistenteId = null;
        snapDisp.forEach(c => {
            if (c.val().ordemMM === 1) {
                jogoExistente = c.val();
                jogoExistenteId = c.key;
            }
        });

        if (jogoExistente) {
            db.ref("games/" + jogoExistenteId + "/" + slotMM).set(perdedor);
        } else {
            const novoJogo = {
                rodada: rodadaDisp,
                ordemMM: 1,
                eliminatorio: true,
                open: false,
                iniciada: false
            };
            novoJogo[slotMM] = perdedor;
            novoJogo[slotMM === "a" ? "b" : "a"] = "Aguardando...";

            db.ref("rounds/" + rodadaDisp).once("value").then(snapRound => {
                if (!snapRound.exists()) {
                    db.ref("rounds/" + rodadaDisp).set({
                        open: false, iniciada: false,
                        eliminatorio: true,
                        faseIndex: FASE_INDEX[rodadaDisp] || 4
                    });
                }
                db.ref("games").push(novoJogo);
            });
        }
    });
}

// ── SALVAR DATA/HORA DE JOGO GERADO AUTOMATICAMENTE ──────────────────────
window.saveDatetime = (gid) => {
    const dt = document.getElementById("gdt_" + gid).value;
    if (!dt) { alert("Selecione data e hora"); return; }
    db.ref("games/" + gid + "/datetime").set(dt).then(() => {
        alert("Data/hora salva!");
    });
};

// ── CONTROLE INDIVIDUAL DE JOGO (oitavas+) ───────────────────────────────
window.toggleGameOpen = (gid, valor) => {
    db.ref("games/" + gid + "/open").set(valor);
    if (valor) db.ref("games/" + gid + "/iniciada").set(false);
};

window.toggleGameIniciada = (gid, valor) => {
    db.ref("games/" + gid + "/iniciada").set(valor);
    if (valor) db.ref("games/" + gid + "/open").set(false);
};

window.saveResult = (gid) => {
    const a = document.getElementById("ga_" + gid).value;
    const b = document.getElementById("gb_" + gid).value;
    if (a === "" || b === "") { alert("Preencha os dois placares"); return; }
    db.ref("games/" + gid).update({ resultA: a, resultB: b });
    alert("Resultado salvo!");
};

window.toggleRound = (nome, valor) => {
    db.ref("rounds/" + nome + "/open").set(valor);
};

window.toggleIniciada = (nome, valor) => {
    db.ref("rounds/" + nome + "/iniciada").set(valor);
};

// ── BACKUP & RESTAURAÇÃO ──────────────────────────────────────────────────────
window.fazerBackup = () => {
    db.ref("/").once("value").then(snap => {
        const dados = snap.val();
        const json  = JSON.stringify(dados, null, 2);
        const blob  = new Blob([json], { type: "application/json" });
        const url   = URL.createObjectURL(blob);
        const hoje  = new Date().toISOString().slice(0, 10);
        const a     = document.createElement("a");
        a.href      = url;
        a.download  = `backup-bolao-${hoje}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }).catch(err => {
        console.error("Erro ao fazer backup:", err);
        alert("Erro ao gerar backup. Verifique o console.");
    });
};

window.carregarBackup = (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;

    const primeira = confirm(
        "⚠️ ATENÇÃO: Esta operação vai SUBSTITUIR todos os dados atuais do bolão pelo conteúdo do arquivo selecionado.\n\nArquivo: " + file.name + "\n\nDeseja continuar?"
    );
    if (!primeira) return;

    const segunda = confirm(
        "Confirmação final: todos os dados atuais (jogos, palpites, participantes, resultados) serão APAGADOS e substituídos.\n\nClique em OK para confirmar a restauração."
    );
    if (!segunda) return;

    const reader = new FileReader();
    reader.onload = e => {
        try {
            const dados = JSON.parse(e.target.result);
            db.ref("/").set(dados).then(() => {
                alert("✅ Backup carregado com sucesso! Os dados foram restaurados.");
            }).catch(err => {
                console.error("Erro ao restaurar backup:", err);
                alert("Erro ao restaurar os dados. Verifique o console.");
            });
        } catch (err) {
            alert("Arquivo inválido. Certifique-se de que é um backup .json gerado pelo sistema.");
        }
    };
    reader.readAsText(file);
};

// ── PARTICIPANTE ──────────────────────────────────────────────────────────────
let _abaAtiva = "palpites"; // palpites | ranking | matamata

function participant(id, u) {
    _partNome = u.name;
    app.innerHTML = `
        <h2 style="display:inline">👤 ${u.name}</h2>
        <button id="btn-theme" onclick="toggleTheme()" style="margin-left:8px;padding:5px 14px;font-size:0.8rem;border-radius:20px;background:rgba(255,255,255,0.9);border:1px solid rgba(0,0,0,0.15);color:#1b2e1c;font-weight:700;cursor:pointer">🌙 Escuro</button>
        <button class="btn-red" onclick="logout()">Sair</button>
        <div class="abas-nav">
            <button class="aba-btn aba-ativa" id="aba-palpites"  onclick="mudarAba('palpites')">Palpites</button>
            <button class="aba-btn"            id="aba-ranking"   onclick="mudarAba('ranking')">🏆 Ranking</button>
            <button class="aba-btn"            id="aba-matamata" onclick="mudarAba('matamata')">⚔️ Mata-mata</button>
        </div>
        <div id="content"></div>`;

    updateThemeBtn();
    loadParticipant(id);
}

window.mudarAba = (aba) => {
    _abaAtiva = aba;
    document.querySelectorAll(".aba-btn").forEach(b => b.classList.remove("aba-ativa"));
    const btn = document.getElementById("aba-" + aba);
    if (btn) btn.classList.add("aba-ativa");
    renderParticipant();
};

let _partUid   = null;
let _partSnaps = { games: null, rounds: null, guesses: null, participants: null };
let _partNome  = "";

function loadParticipant(uid) {
    _partUid   = uid;
    _partSnaps = { games: null, rounds: null, guesses: null, participants: null };

    db.ref("manutencao").on("value", s => {
        if (s.val() === true) {
            telaManutencao(_partNome);
        } else {
            db.ref("games").on("value",        snap => { _partSnaps.games        = snap; renderParticipant(); });
            db.ref("rounds").on("value",       snap => { _partSnaps.rounds       = snap; renderParticipant(); });
            db.ref("guesses").on("value",      snap => { _partSnaps.guesses      = snap; renderParticipant(); });
            db.ref("participants").on("value", snap => { _partSnaps.participants  = snap; renderParticipant(); });
        }
    });
}

function renderParticipant() {
    const gamesSnap        = _partSnaps.games;
    const roundsSnap       = _partSnaps.rounds;
    const guessesSnap      = _partSnaps.guesses;
    const participantsSnap = _partSnaps.participants;
    if (!gamesSnap || !roundsSnap || !guessesSnap || !participantsSnap) return;
    const uid = _partUid;

    const palpitesDigitados = {};
    document.querySelectorAll('input[id^="pa_"], input[id^="pb_"]').forEach(el => {
        palpitesDigitados[el.id] = el.value;
    });
    const expandidos = [];
    document.querySelectorAll('[id^="round_"]').forEach(el => {
        if (el.style.display === 'block') expandidos.push(el.id);
    });

    const rounds = {};
    roundsSnap.forEach(c => { rounds[c.key] = c.val(); });

    const participants = {};
    participantsSnap.forEach(c => { participants[c.key] = c.val().name; });

    const allGuesses = {};
    guessesSnap.forEach(gameSnap => {
        allGuesses[gameSnap.key] = {};
        gameSnap.forEach(userSnap => {
            allGuesses[gameSnap.key][userSnap.key] = userSnap.val();
        });
    });

    const myGuesses = {};
    Object.keys(allGuesses).forEach(gid => {
        if (allGuesses[gid][uid]) myGuesses[gid] = allGuesses[gid][uid];
    });

    const grupos = {};
    gamesSnap.forEach(c => {
        const g = c.val();
        if (!grupos[g.rodada]) grupos[g.rodada] = [];
        grupos[g.rodada].push({ id: c.key, game: g });
    });

    // Ordena jogos MM por ordemMM
    for (const rodada in grupos) {
        if (rounds[rodada] && rounds[rodada].eliminatorio) {
            grupos[rodada].sort((a, b) => (a.game.ordemMM || 0) - (b.game.ordemMM || 0));
        }
    }

    // ── Cálculo do ranking ─────────────────────────────────────────────────
    const totalPts = {};
    const totalPE  = {};
    const totalGV  = {};
    Object.keys(participants).forEach(pid => {
        totalPts[pid] = 0; totalPE[pid] = 0; totalGV[pid] = 0;
    });

    gamesSnap.forEach(c => {
        const g = c.val();
        if (g.resultA === undefined || g.resultB === undefined) return;
        Object.keys(participants).forEach(pid => {
            const guess = allGuesses[c.key] && allGuesses[c.key][pid];
            if (!guess) return;
            const r = calcPontos(guess.a, guess.b, g.resultA, g.resultB);
            if (!r) return;
            totalPts[pid] += r.pts;
            if (r.cod === "PE") totalPE[pid]++;
            if (r.cod === "GV") totalGV[pid]++;
        });
    });

    const ranking = Object.keys(participants)
        .map(pid => ({ name: participants[pid], pts: totalPts[pid], pe: totalPE[pid], gv: totalGV[pid], isMe: pid === uid }))
        .sort((a, b) => b.pts - a.pts || b.pe - a.pe || b.gv - a.gv);

    // ── Conteúdo por aba ──────────────────────────────────────────────────
    const contentEl = document.getElementById("content");
    if (!contentEl) return;

    if (_abaAtiva === "ranking") {
        contentEl.innerHTML = htmlAbaRanking(ranking);
        return;
    }

    if (_abaAtiva === "matamata") {
        contentEl.innerHTML = htmlAbaMataMata(grupos, rounds, allGuesses, participants, uid);
        // Restaura aba de fase ativa no chaveamento
        const faseSalva = localStorage.getItem("bolao_fase_mm") || "16 avos de final";
        mostrarFaseMM(faseSalva);
        return;
    }

    // ── ABA PALPITES (igual a antes) ──────────────────────────────────────
    const rodadasAbertas    = [];
    const rodadasAndamento  = [];
    const rodadasEncerradas = [];
    const rodadasFechadas   = [];

    for (const rodada in grupos) {
        const rnd = rounds[rodada] || {};
        // Jogos MM oitavas+: controle individual por jogo — a mesma rodada pode
        // ter jogos em estados diferentes simultaneamente, então ela entra em
        // TODAS as listas relevantes; cada função de render filtra os jogos
        // que realmente pertencem àquele estado.
        if (rnd.eliminatorio && (rnd.faseIndex || 0) >= 1) {
            const jogos = grupos[rodada];
            const temAberto    = jogos.some(item => getGameStatus(item.game) === "aberta");
            const temAndamento = jogos.some(item => getGameStatus(item.game) === "andamento");
            const temFechado   = jogos.some(item => getGameStatus(item.game) === "fechada");
            const temEncerrado = jogos.some(item => getGameStatus(item.game) === "encerrada");

            if (temAberto)    rodadasAbertas.push(rodada);
            if (temAndamento) rodadasAndamento.push(rodada);
            if (temEncerrado) rodadasEncerradas.push(rodada);
            if (temFechado)   rodadasFechadas.push(rodada);
        } else {
            const status = getRoundStatus(rodada, rounds, grupos);
            if (status === "aberta")        rodadasAbertas.push(rodada);
            else if (status === "andamento") rodadasAndamento.push(rodada);
            else if (status === "encerrada") rodadasEncerradas.push(rodada);
            else                              rodadasFechadas.push(rodada);
        }
    }

    let h = "";
    rodadasAbertas.forEach(rodada    => { h += htmlRodadaAberta(rodada, grupos, myGuesses, allGuesses, participants, uid, rounds);    });
    rodadasAndamento.forEach(rodada  => { h += htmlRodadaAndamento(rodada, grupos, allGuesses, participants, uid, rounds); });
    rodadasEncerradas.forEach(rodada => { h += htmlRodadaEncerrada(rodada, grupos, allGuesses, participants, uid, rounds); });
    rodadasFechadas.forEach(rodada   => { h += htmlRodadaFechada(rodada, grupos, myGuesses, uid, rounds); });

    contentEl.innerHTML = h || "<p>Nenhum jogo cadastrado.</p>";
    updateThemeBtn();

    Object.keys(palpitesDigitados).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = palpitesDigitados[id];
    });
    expandidos.forEach(id => {
        const el    = document.getElementById(id);
        const arrow = document.getElementById('arrow_' + id);
        if (el)    el.style.display = 'block';
        if (arrow) arrow.textContent = '▲';
    });
}

// ── ABA RANKING ───────────────────────────────────────────────────────────
function htmlAbaRanking(ranking) {
    let rankHtml = "";
    ranking.forEach((r, i) => {
        const medal    = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}º`;
        const rowColor = i === 0 ? "color:#b8860b" : i === 1 ? "color:#888" : i === 2 ? "color:#cd7f32" : "";
        rankHtml += `<tr style="${rowColor}">
            <td style="padding:4px">${medal}</td>
            <td style="padding:4px">${r.name}</td>
            <td style="padding:4px;text-align:right">${r.pts} pts</td>
        </tr>`;
    });
    return `
        <div class="card">
            <h3>🏆 Ranking Geral</h3>
            <table id="ranking" style="width:100%;border-collapse:collapse">
                <thead><tr style="background:#e8f5e9">
                    <th style="padding:4px">#</th>
                    <th style="text-align:left;padding:4px">Participante</th>
                    <th style="text-align:right;padding:4px">Pontos</th>
                </tr></thead>
                <tbody>${rankHtml}</tbody>
            </table>
            <br>
            <small>
                <strong>PE</strong> Placar Exato = 25pts &nbsp;|&nbsp;
                <strong>GV</strong> Vencedor + Gols Vencedor = 18pts &nbsp;|&nbsp;
                <strong>AE</strong> Acertou Empate = 15pts<br>
                <strong>GP</strong> Vencedor + Gols Perdedor = 12pts &nbsp;|&nbsp;
                <strong>VP</strong> Apenas Vencedor = 10pts
            </small>
        </div>`;
}

// ── ABA MATA-MATA (chaveamento visual) ────────────────────────────────────
function htmlAbaMataMata(grupos, rounds, allGuesses, participants, uid) {
    // Determina quais fases existem
    const fasesExistentes = FASES_MM.filter(f => grupos[f] && grupos[f].length > 0);
    if (fasesExistentes.length === 0) {
        return `<div class="card"><p style="color:#888;font-size:0.9rem">O chaveamento ainda não foi iniciado.</p></div>`;
    }

    const btns = FASES_MM.map(f => {
        if (!fasesExistentes.includes(f)) return "";
        const label = f === "16 avos de final" ? "16 avos" :
                      f === "Oitavas de final" ? "Oitavas" :
                      f === "Quartas de final" ? "Quartas" :
                      f === "Disputa 3º lugar" ? "3º lugar" : f;
        return `<button class="fase-mm-btn" id="fasebtn_${f.replace(/\s+/g,'_')}" onclick="mostrarFaseMM('${f}')">${label}</button>`;
    }).join("");

    let fasesHtml = "";
    FASES_MM.forEach(fase => {
        if (!fasesExistentes.includes(fase)) return;
        const jogos = (grupos[fase] || []).slice().sort((a, b) => (a.game.ordemMM || 0) - (b.game.ordemMM || 0));
        const isFinal = fase === "Final";

        let jogosHtml = "";

        if (isFinal) {
            jogosHtml += `<div style="text-align:center;padding:10px 0 6px">
                <img src="logo.png" alt="Taça" style="height:80px;width:auto;border-radius:8px;background:#000;padding:4px">
                <div style="font-size:0.78rem;font-weight:700;color:#b8860b;text-transform:uppercase;letter-spacing:.08em;margin-top:6px">Grande Final</div>
            </div>`;
        }

        jogos.forEach(item => {
            jogosHtml += htmlCaixinhaMM(item, isFinal);
        });

        fasesHtml += `<div class="fase-mm-content" id="fase_${fase.replace(/\s+/g,'_')}" style="display:none">${jogosHtml}</div>`;
    });

    return `
        <div class="card">
            <div class="fase-mm-nav">${btns}</div>
            ${fasesHtml}
        </div>`;
}

function htmlCaixinhaMM(item, isFinal) {
    const g = item.game;
    const temFinal = g.finalA !== undefined && g.finalB !== undefined;
    const venc     = temFinal ? vencedorMM(g) : null;
    const temPen   = g.penA !== undefined && g.penB !== undefined;

    const fa = temFinal ? g.finalA : "—";
    const fb = temFinal ? g.finalB : "—";

    const dtLabel = g.datetime
        ? `<div class="mm-card-meta">${formatDatetime(g.datetime)}</div>`
        : `<div class="mm-card-meta" style="color:#bbb">Data a definir</div>`;

    const statusLabel = (() => {
        if (g.resultA !== undefined) return `<span style="color:#2e7d32;font-weight:700;font-size:0.75rem">Encerrado</span>`;
        if (g.open)     return `<span style="color:#43a047;font-weight:700;font-size:0.75rem">Aberto</span>`;
        if (g.iniciada) return `<span style="color:#f57f17;font-weight:700;font-size:0.75rem">Em andamento</span>`;
        return `<span style="color:#aaa;font-size:0.75rem">Pendente</span>`;
    })();

    const isAguardandoA = g.a === "Aguardando...";
    const isAguardandoB = g.b === "Aguardando...";

    const linhaA = `
        <div class="mm-time-row ${venc === g.a ? 'mm-vencedor' : ''}">
            <span class="mm-time-nome">${isAguardandoA ? '<em style="color:#bbb;font-weight:400">Aguardando...</em>' : (flag(g.a) || "") + (g.a || "?")}</span>
            <span class="mm-time-placar">${temFinal ? fa : (isAguardandoA ? "" : "—")}${temPen && venc === g.a ? ` <span class="mm-pen">(${g.penA})</span>` : temPen && !isAguardandoA ? ` <span class="mm-pen">(${g.penA})</span>` : ""}</span>
        </div>`;

    const linhaB = `
        <div class="mm-time-row ${venc === g.b ? 'mm-vencedor' : ''}">
            <span class="mm-time-nome">${isAguardandoB ? '<em style="color:#bbb;font-weight:400">Aguardando...</em>' : (flag(g.b) || "") + (g.b || "?")}</span>
            <span class="mm-time-placar">${temFinal ? fb : (isAguardandoB ? "" : "—")}${temPen && !isAguardandoB ? ` <span class="mm-pen">(${g.penB})</span>` : ""}</span>
        </div>`;

    return `
        <div class="mm-card ${isFinal ? 'mm-card-final' : ''}">
            <div class="mm-card-top">
                ${dtLabel}
                ${statusLabel}
            </div>
            ${linhaA}
            ${linhaB}
        </div>`;
}

window.mostrarFaseMM = (fase) => {
    localStorage.setItem("bolao_fase_mm", fase);
    document.querySelectorAll(".fase-mm-content").forEach(el => { el.style.display = "none"; });
    document.querySelectorAll(".fase-mm-btn").forEach(el => { el.classList.remove("fase-mm-btn-ativa"); });
    const el  = document.getElementById("fase_" + fase.replace(/\s+/g, '_'));
    const btn = document.getElementById("fasebtn_" + fase.replace(/\s+/g, '_'));
    if (el)  el.style.display  = "block";
    if (btn) btn.classList.add("fase-mm-btn-ativa");
};

// ── RODADA ABERTA ─────────────────────────────────────────────────────────
function htmlRodadaAberta(rodada, grupos, myGuesses, allGuesses, participants, uid, rounds) {
    const rnd = rounds[rodada] || {};
    const isElimIndiv = rnd.eliminatorio && (rnd.faseIndex || 0) >= 1;

    // Para MM oitavas+: mostra apenas os jogos que estão abertos individualmente
    let jogosParaExibir = grupos[rodada];
    if (isElimIndiv) {
        jogosParaExibir = grupos[rodada].filter(item => item.game.open === true);
        if (jogosParaExibir.length === 0) return "";
    }

    const idsRodada = jogosParaExibir.map(item => item.id).join(',');
    let html = `
        <div class="card" style="border:2px solid #43a047;background:#f1f8f1">
            <h3 style="color:#2e7d32">🟢 ${rodada} — Aberta para palpites</h3>`;

    jogosParaExibir.forEach(item => {
        const g    = item.game;
        const prev = myGuesses[item.id] || {};
        const va   = prev.a !== undefined ? prev.a : "";
        const vb   = prev.b !== undefined ? prev.b : "";

        const grupoLabel = g.grupo
            ? `<div style="font-size:0.78rem;font-weight:700;color:#1b2e1c;margin-bottom:3px">${g.grupo}</div>`
            : "";
        const dataLabel = g.datetime
            ? `<div style="font-size:0.8rem;color:#666;margin-bottom:8px">${formatDatetime(g.datetime)}</div>`
            : "";

        html += `
            <div style="margin:10px 0;padding:12px 14px;background:white;border-radius:10px;border:1px solid #c8e6c9;text-align:center">
                ${grupoLabel}${dataLabel}
                <div style="display:flex;align-items:center;justify-content:center;gap:16px">
                    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
                        <span style="font-size:2rem;line-height:1">${flag(g.a) || "🏳️"}</span>
                        <span style="font-weight:700;font-size:0.85rem">${g.a}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px">
                        <input id="pa_${item.id}" value="${va}" placeholder="0" style="width:50px;text-align:center;padding:8px;font-size:1.1rem">
                        <span style="font-weight:bold;color:#555;font-size:1.1rem">×</span>
                        <input id="pb_${item.id}" value="${vb}" placeholder="0" style="width:50px;text-align:center;padding:8px;font-size:1.1rem">
                    </div>
                    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
                        <span style="font-size:2rem;line-height:1">${flag(g.b) || "🏳️"}</span>
                        <span style="font-weight:700;font-size:0.85rem">${g.b}</span>
                    </div>
                </div>
            </div>`;
    });

    // Painel de status dos participantes
    let statusRows = "";
    Object.keys(participants).forEach(pid => {
        const totalJogos     = jogosParaExibir.length;
        const palpitesFeitos = jogosParaExibir.filter(item => allGuesses[item.id] && allGuesses[item.id][pid]).length;
        const completo       = palpitesFeitos === totalJogos;
        const destaque       = pid === uid ? ' style="background:#fffbe6"' : '';
        statusRows += `
            <tr${destaque}>
                <td style="padding:4px">${participants[pid]}${pid === uid ? " 👈" : ""}</td>
                <td style="text-align:center;padding:4px;font-size:1.2rem">
                    ${completo
                        ? '<span title="Palpite realizado" style="color:#27ae60">●</span>'
                        : '<span title="Falta palpitar"    style="color:#e74c3c">✕</span>'}
                </td>
            </tr>`;
    });

    html += `
            <button onclick="saveAllGuesses('${uid}','${idsRodada}')" style="width:100%;padding:12px;font-size:1rem;margin-top:8px">
                💾 Salvar palpites de ${rodada}
            </button>
            <div style="margin-top:16px;border-top:1px solid #c8e6c9;padding-top:12px">
                <strong style="color:#2e7d32">Status dos palpites</strong>
                <table style="width:100%;border-collapse:collapse;margin-top:8px">
                    <thead><tr style="background:#e8f5e9">
                        <th style="text-align:left;padding:4px">Participante</th>
                        <th style="padding:4px">Status</th>
                    </tr></thead>
                    <tbody>${statusRows}</tbody>
                </table>
            </div>
        </div>`;
    return html;
}

// ── HELPER: card de jogo com placar + tabela de palpites ──────────────────
function htmlJogoTabela(item, allGuesses, participants, uid) {
    const g         = item.game;
    const temResult = g.resultA !== undefined && g.resultB !== undefined;

    const grupoLabel = g.grupo
        ? `<div style="font-size:0.78rem;font-weight:700;color:#1b2e1c;margin-bottom:3px">${g.grupo}</div>`
        : "";
    const dataLabel = g.datetime
        ? `<div style="font-size:0.78rem;color:#666;margin-bottom:8px">${formatDatetime(g.datetime)}</div>`
        : "";

    const placarCentro = temResult
        ? `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex-shrink:0">
               <div style="display:flex;align-items:center;gap:5px">
                   <span style="font-size:1.5rem;font-weight:800;color:#2e7d32;min-width:26px;text-align:center">${g.resultA}</span>
                   <span style="font-size:0.95rem;font-weight:700;color:#bbb">×</span>
                   <span style="font-size:1.5rem;font-weight:800;color:#2e7d32;min-width:26px;text-align:center">${g.resultB}</span>
               </div>
               <span style="font-size:0.65rem;font-weight:700;color:#2e7d32;text-transform:uppercase;letter-spacing:.05em">Resultado</span>
           </div>`
        : `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex-shrink:0">
               <div style="display:flex;align-items:center;gap:5px">
                   <span style="font-size:1.4rem;font-weight:800;color:#ccc;min-width:26px;text-align:center">—</span>
                   <span style="font-size:0.95rem;font-weight:700;color:#bbb">×</span>
                   <span style="font-size:1.4rem;font-weight:800;color:#ccc;min-width:26px;text-align:center">—</span>
               </div>
               <span style="font-size:0.65rem;font-weight:700;color:#bbb;text-transform:uppercase;letter-spacing:.05em">Pendente</span>
           </div>`;

    let linhas = "";
    Object.keys(participants).forEach(pid => {
        const guess    = allGuesses[item.id] && allGuesses[item.id][pid];
        const destaque = pid === uid ? ' style="background:#fffbe6"' : '';

        if (!guess) {
            linhas += `<tr${destaque}>
                <td style="padding:4px">${participants[pid]}${pid === uid ? " 👈" : ""}</td>
                <td style="text-align:center;padding:4px">—</td>
                <td style="text-align:center;padding:4px">—</td>
            </tr>`;
            return;
        }

        let pontosTd;
        if (temResult) {
            const r = calcPontos(guess.a, guess.b, g.resultA, g.resultB);
            pontosTd = r
                ? `<span title="${r.desc}" style="font-weight:bold;color:#2980b9">${r.cod} +${r.pts}pts</span>`
                : `<span style="color:#c0392b">0 pts</span>`;
        } else {
            pontosTd = `<em style="color:#999">aguardando</em>`;
        }

        linhas += `<tr${destaque}>
            <td style="padding:4px">${participants[pid]}${pid === uid ? " 👈" : ""}</td>
            <td style="text-align:center;padding:4px">${guess.a} × ${guess.b}</td>
            <td style="text-align:center;padding:4px">${pontosTd}</td>
        </tr>`;
    });

    return `
        <div class="card" style="text-align:center">
            ${grupoLabel}${dataLabel}
            <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:10px">
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">
                    <span style="font-size:1.7rem;line-height:1">${flag(g.a) || "🏳️"}</span>
                    <span style="font-size:0.82rem;font-weight:700">${g.a}</span>
                </div>
                ${placarCentro}
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">
                    <span style="font-size:1.7rem;line-height:1">${flag(g.b) || "🏳️"}</span>
                    <span style="font-size:0.82rem;font-weight:700">${g.b}</span>
                </div>
            </div>
            <table style="width:100%;border-collapse:collapse;text-align:left">
                <thead><tr style="background:#e8f5e9">
                    <th style="padding:4px">Participante</th>
                    <th style="padding:4px;text-align:center">Palpite</th>
                    <th style="padding:4px;text-align:center">Pontos</th>
                </tr></thead>
                <tbody>${linhas}</tbody>
            </table>
        </div>`;
}

// ── RODADA EM ANDAMENTO ────────────────────────────────────────────────────
function htmlRodadaAndamento(rodada, grupos, allGuesses, participants, uid, rounds) {
    const rnd = rounds[rodada] || {};
    const isElimIndiv = rnd.eliminatorio && (rnd.faseIndex || 0) >= 1;

    let jogosParaExibir = grupos[rodada];
    if (isElimIndiv) {
        jogosParaExibir = grupos[rodada].filter(item => getGameStatus(item.game) === "andamento");
        if (jogosParaExibir.length === 0) return "";
    }

    let html = `
        <div class="card" style="border:2px solid #f9a825;background:#fffdf5">
            <h3 style="color:#f57f17">🟡 ${rodada} — Em andamento</h3>`;

    jogosParaExibir.forEach(item => { html += htmlJogoTabela(item, allGuesses, participants, uid); });

    html += `</div>`;
    return html;
}

// ── RODADA ENCERRADA ───────────────────────────────────────────────────────
function htmlRodadaEncerrada(rodada, grupos, allGuesses, participants, uid, rounds) {
    const rnd = rounds[rodada] || {};
    const isElimIndiv = rnd.eliminatorio && (rnd.faseIndex || 0) >= 1;

    let jogosParaExibir = grupos[rodada];
    if (isElimIndiv) {
        jogosParaExibir = grupos[rodada].filter(item => getGameStatus(item.game) === "encerrada");
        if (jogosParaExibir.length === 0) return "";
    }

    const idCollapse = "round_" + rodada.replace(/\s+/g, '_');
    let jogosHtml = "";
    jogosParaExibir.forEach(item => { jogosHtml += htmlJogoTabela(item, allGuesses, participants, uid); });

    return `
        <div class="card" style="border:1px solid #ccc">
            <div onclick="toggleCollapse('${idCollapse}')" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center">
                <h3 style="margin:0;color:#555">⚪ ${rodada} — Encerrada</h3>
                <span id="arrow_${idCollapse}" style="font-size:1.2rem;color:#888">▼</span>
            </div>
            <div id="${idCollapse}" style="display:none;margin-top:12px">
                ${jogosHtml}
            </div>
        </div>`;
}

// ── RODADA FECHADA ─────────────────────────────────────────────────────────
function htmlRodadaFechada(rodada, grupos, myGuesses, uid, rounds) {
    const rnd = rounds[rodada] || {};
    const isElimIndiv = rnd.eliminatorio && (rnd.faseIndex || 0) >= 1;

    let jogosParaExibir = grupos[rodada];
    if (isElimIndiv) {
        jogosParaExibir = grupos[rodada].filter(item => getGameStatus(item.game) === "fechada");
        if (jogosParaExibir.length === 0) return "";
    }

    const idCollapse = "round_" + rodada.replace(/\s+/g, '_');
    let jogosHtml = "";

    jogosParaExibir.forEach(item => {
        const g     = item.game;
        const guess = myGuesses[item.id];
        const grupoLabel = g.grupo
            ? `<div style="font-size:0.78rem;font-weight:700;color:#1b2e1c;margin-bottom:3px">${g.grupo}</div>`
            : "";
        const dataLabel = g.datetime
            ? `<div style="font-size:0.78rem;color:#666;margin-bottom:6px">${formatDatetime(g.datetime)}</div>`
            : "";

        jogosHtml += `
            <div class="card" style="text-align:center">
                ${grupoLabel}${dataLabel}
                <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:8px">
                    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">
                        <span style="font-size:1.7rem;line-height:1">${flag(g.a) || "🏳️"}</span>
                        <span style="font-size:0.82rem;font-weight:700">${g.a}</span>
                    </div>
                    <div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex-shrink:0">
                        <div style="display:flex;align-items:center;gap:5px">
                            <span style="font-size:1.4rem;font-weight:800;color:#ccc;min-width:26px;text-align:center">—</span>
                            <span style="font-size:0.95rem;font-weight:700;color:#bbb">×</span>
                            <span style="font-size:1.4rem;font-weight:800;color:#ccc;min-width:26px;text-align:center">—</span>
                        </div>
                        <span style="font-size:0.65rem;font-weight:700;color:#bbb;text-transform:uppercase;letter-spacing:.05em">Pendente</span>
                    </div>
                    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">
                        <span style="font-size:1.7rem;line-height:1">${flag(g.b) || "🏳️"}</span>
                        <span style="font-size:0.82rem;font-weight:700">${g.b}</span>
                    </div>
                </div>
                <div style="font-size:0.85rem;color:#555;border-top:1px solid #e8f5e9;padding-top:7px">
                    Seu palpite: <strong>${guess ? `${guess.a} × ${guess.b}` : "—"}</strong>
                </div>
            </div>`;
    });

    return `
        <div class="card" style="border:1px solid #ccc">
            <div onclick="toggleCollapse('${idCollapse}')" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center">
                <h3 style="margin:0;color:#555">🔴 ${rodada} — Fechada</h3>
                <span id="arrow_${idCollapse}" style="font-size:1.2rem;color:#888">▼</span>
            </div>
            <div id="${idCollapse}" style="display:none;margin-top:12px">
                ${jogosHtml}
            </div>
        </div>`;
}

window.saveAllGuesses = (uid, idsStr) => {
    const ids = idsStr.split(',');
    const updates = {};
    let algumVazio = false;

    for (const gid of ids) {
        const a = document.getElementById("pa_" + gid).value;
        const b = document.getElementById("pb_" + gid).value;
        if (a === "" || b === "") { algumVazio = true; continue; }
        updates[`guesses/${gid}/${uid}`] = { a, b };
    }

    if (Object.keys(updates).length === 0) {
        alert("Preencha pelo menos um palpite antes de salvar.");
        return;
    }

    db.ref().update(updates).then(() => {
        if (algumVazio) {
            alert("Palpites salvos! ⚠️ Alguns jogos ficaram em branco e não foram salvos.");
        } else {
            alert("Todos os palpites foram salvos! ✅");
        }
    });
};

// ── INIT ──────────────────────────────────────────────────────────────────────
async function init() {
    const saved = localStorage.getItem("bolao_login");
    if (saved === "admin") { adminPanel(); return; }
    if (saved) {
        const s = await db.ref("participants/" + saved).get();
        if (s.exists()) { participant(saved, s.val()); return; }
        localStorage.removeItem("bolao_login");
    }
    loginScreen();
}
init();

// ── COLLAPSE ──────────────────────────────────────────────────────────────────
window.toggleCollapse = (id) => {
    const el    = document.getElementById(id);
    const arrow = document.getElementById("arrow_" + id);
    if (el.style.display === "none") {
        el.style.display = "block";
        arrow.textContent = "▲";
    } else {
        el.style.display = "none";
        arrow.textContent = "▼";
    }
};
