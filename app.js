function logout() {
    localStorage.removeItem("bolao_login");
    location.reload();
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
// Necessário para cumprir as regras de segurança (auth != null),
// sem exigir login real dos usuários — é tudo automático e invisível.
firebase.auth().signInAnonymously().catch(err => {
    console.error("Erro no login anônimo:", err);
});

// ── BANDEIRAS ────────────────────────────────────────────────────────────────
// Retorna emoji de bandeira para o nome do time (case-insensitive, aceita variações)
const FLAG_MAP = {
    // Américas
    "canadá":           "🇨🇦",
    "estados unidos":   "🇺🇸",
    "eua":              "🇺🇸",
    "méxico":           "🇲🇽",
    "argentina":        "🇦🇷",
    "brasil":           "🇧🇷",
    "colômbia":         "🇨🇴",
    "equador":          "🇪🇨",
    "paraguai":         "🇵🇾",
    "uruguai":          "🇺🇾",
    "haiti":            "🇭🇹",
    "panamá":           "🇵🇦",
    "curaçau":          "🇨🇼",
    // Europa
    "alemanha":         "🇩🇪",
    "áustria":          "🇦🇹",
    "bélgica":          "🇧🇪",
    "bósnia e herzegovina": "🇧🇦",
    "croácia":          "🇭🇷",
    "escócia":          "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "espanha":          "🇪🇸",
    "frança":           "🇫🇷",
    "holanda":          "🇳🇱",
    "inglaterra":       "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "noruega":          "🇳🇴",
    "portugal":         "🇵🇹",
    "tchéquia":         "🇨🇿",
    "suécia":           "🇸🇪",
    "suíça":            "🇨🇭",
    "turquia":          "🇹🇷",
    // África
    "áfrica do sul":    "🇿🇦",
    "argélia":          "🇩🇿",
    "cabo verde":       "🇨🇻",
    "costa do marfim":  "🇨🇮",
    "egito":            "🇪🇬",
    "gana":             "🇬🇭",
    "marrocos":         "🇲🇦",
    "rd congo":         "🇨🇩",
    "senegal":          "🇸🇳",
    "tunísia":          "🇹🇳",
    // Ásia / Oceania
    "arábia saudita":   "🇸🇦",
    "austrália":        "🇦🇺",
    "catar":            "🇶🇦",
    "coreia do sul":    "🇰🇷",
    "irã":              "🇮🇷",
    "iraque":           "🇮🇶",
    "japão":            "🇯🇵",
    "jordânia":         "🇯🇴",
    "uzbequistão":      "🇺🇿",
    "nova zelândia":    "🇳🇿",
};

function flag(teamName) {
    if (!teamName) return "";
    const key = teamName.toLowerCase().trim();
    return FLAG_MAP[key] ? FLAG_MAP[key] + " " : "";
}

// Retorna nome do time com bandeira prefixada
function teamLabel(name) {
    return flag(name) + name;
}

// ── PONTUAÇÃO ────────────────────────────────────────────────────────────────
// Retorna { cod, desc, pts } ou null se não acertou nada
function calcPontos(pa, pb, ra, rb) {
    pa = parseInt(pa); pb = parseInt(pb);
    ra = parseInt(ra); rb = parseInt(rb);
    if (isNaN(pa) || isNaN(pb) || isNaN(ra) || isNaN(rb)) return null;

    const empateP = pa === pb;
    const empateR = ra === rb;
    const vencP   = pa > pb ? "A" : pa < pb ? "B" : "E";
    const vencR   = ra > rb ? "A" : ra < rb ? "B" : "E";

    // PE — Placar Exato
    if (pa === ra && pb === rb)
        return { cod: "PE", desc: "Placar Exato", pts: 25 };

    // AE — Acertou Empate
    if (empateP && empateR)
        return { cod: "AE", desc: "Acertou Empate", pts: 15 };

    // GV — Vencedor + Gols do vencedor (não vale empate)
    if (!empateP && vencP === vencR) {
        const golsVencP = vencP === "A" ? pa : pb;
        const golsVencR = vencR === "A" ? ra : rb;
        if (golsVencP === golsVencR)
            return { cod: "GV", desc: "Vencedor + Gols do Vencedor", pts: 18 };
    }

    // GP — Vencedor + Gols do perdedor
    if (!empateP && vencP === vencR) {
        const golsPerdP = vencP === "A" ? pb : pa;
        const golsPerdR = vencR === "A" ? rb : ra;
        if (golsPerdP === golsPerdR)
            return { cod: "GP", desc: "Vencedor + Gols do Perdedor", pts: 12 };
    }

    // VP — Apenas vencedor
    if (!empateP && vencP === vencR)
        return { cod: "VP", desc: "Apenas Vencedor", pts: 10 };

    return null;
}

// ── STATUS DA RODADA ───────────────────────────────────────────────────────
// Retorna "aberta" | "andamento" | "fechada" | "encerrada"
// - aberta:     rounds[rodada].open === true
// - encerrada:  todos os jogos da rodada já têm resultado (tem prioridade sobre tudo)
// - andamento:  fechada para palpites (open=false), rounds[rodada].iniciada === true,
//               e ainda falta resultado de pelo menos 1 jogo
// - fechada:    fechada para palpites e ainda não foi marcada como "em andamento"
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
        <h2>⚙️ Administrador</h2>
        <button class="btn-red" onclick="logout()">Sair</button>

        <div class="card">
            <h3>Novo participante</h3>
            <input id="n" placeholder="Nome">
            <input id="p" placeholder="PIN">
            <button class="btn-gold" onclick="addParticipant()">Cadastrar</button>
        </div>

        <div class="card">
            <h3>Novo jogo</h3>
            <input id="rodada" placeholder="Nome da Rodada">
            <input id="t1" placeholder="Time A">
            <input id="t2" placeholder="Time B">
            <button class="btn-gold" onclick="addGame()">Adicionar</button>
        </div>

        <div class="card">
            <h3>Jogos por Rodada</h3>
            <div id="games"></div>
        </div>`;

    loadGamesAdmin();
}

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
    if (!nomeRodada || !timeA || !timeB) { alert("Preencha todos os campos"); return; }

    db.ref("rounds/" + nomeRodada).once("value").then(snap => {
        if (!snap.exists()) db.ref("rounds/" + nomeRodada).set({ open: true, iniciada: false });
    });

    db.ref("games").push({ rodada: nomeRodada, a: timeA, b: timeB });
    alert("Jogo criado!");
};

// ── ADMIN: rodadas colapsáveis ─────────────────────────────────────────────
// Mantém os últimos snapshots de "games" e "rounds" para re-renderizar
// sempre que qualquer um dos dois mudar.
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

    let h = "";
    for (const rodada in grupos) {
        const status = getRoundStatus(rodada, rounds, grupos);
        h += htmlRodadaAdmin(rodada, status, grupos[rodada]);
    }

    document.getElementById("games").innerHTML = h || "<p>Nenhum jogo cadastrado.</p>";
}

function htmlRodadaAdmin(rodada, status, jogos) {
    const idCollapse = "adm_" + rodada.replace(/\s+/g, '_');
    const b = STATUS_BADGES[status];

    let jogosHtml = "";
    jogos.forEach(item => {
        const g  = item.game;
        const ga = g.resultA !== undefined ? g.resultA : "";
        const gb = g.resultB !== undefined ? g.resultB : "";
        jogosHtml += `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid #eee">
                <span>${teamLabel(g.a)} x ${teamLabel(g.b)}</span>
                <div style="display:flex;gap:6px">
                    <input id="ga_${item.id}" size="2" value="${ga}" placeholder="A" style="width:40px;text-align:center">
                    <input id="gb_${item.id}" size="2" value="${gb}" placeholder="B" style="width:40px;text-align:center">
                    <button class="btn-gold" onclick="saveResult('${item.id}')">Salvar</button>
                </div>
            </div>`;
    });

    let botoes = "";
    if (status === "aberta") {
        botoes = `<button class="btn-blue" onclick="toggleRound('${rodada}', false)">🔒 Fechar para palpites</button>`;
    } else if (status === "fechada") {
        botoes = `
            <button class="btn-blue" onclick="toggleRound('${rodada}', true)">🔓 Abrir para palpites</button>
            <button class="btn-blue" onclick="toggleIniciada('${rodada}', true)">▶️ Marcar em andamento</button>`;
    } else if (status === "andamento") {
        botoes = `<button class="btn-blue" onclick="toggleIniciada('${rodada}', false)">⏸️ Voltar para fechada</button>`;
    }
    // encerrada: nenhum botão de status (apenas edição de resultados acima)

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

// ── PARTICIPANTE ──────────────────────────────────────────────────────────────

function participant(id, u) {
    app.innerHTML = `
        <h2>👤 ${u.name}</h2>
        <button class="btn-red" onclick="logout()">Sair</button>
        <div id="content"></div>`;

    loadParticipant(id);
}

let _partUid   = null;
let _partSnaps = { games: null, rounds: null, guesses: null, participants: null };

function loadParticipant(uid) {
    _partUid   = uid;
    _partSnaps = { games: null, rounds: null, guesses: null, participants: null };
    db.ref("games").on("value", s => { _partSnaps.games = s; renderParticipant(); });
    db.ref("rounds").on("value", s => { _partSnaps.rounds = s; renderParticipant(); });
    db.ref("guesses").on("value", s => { _partSnaps.guesses = s; renderParticipant(); });
    db.ref("participants").on("value", s => { _partSnaps.participants = s; renderParticipant(); });
}

function renderParticipant() {
    const gamesSnap        = _partSnaps.games;
    const roundsSnap       = _partSnaps.rounds;
    const guessesSnap      = _partSnaps.guesses;
    const participantsSnap = _partSnaps.participants;
    if (!gamesSnap || !roundsSnap || !guessesSnap || !participantsSnap) return;
    const uid = _partUid;

    // ── Preserva palpites em digitação e cards expandidos antes de redesenhar ─
    const palpitesDigitados = {};
    document.querySelectorAll('input[id^="pa_"], input[id^="pb_"]').forEach(el => {
        palpitesDigitados[el.id] = el.value;
    });
    const expandidos = [];
    document.querySelectorAll('[id^="round_"]').forEach(el => {
        if (el.style.display === 'block') expandidos.push(el.id);
    });

        // Monta dicionários
        const rounds = {};
        roundsSnap.forEach(c => { rounds[c.key] = c.val(); });

        const participants = {};
        participantsSnap.forEach(c => { participants[c.key] = c.val().name; });

        // Todos os palpites: guesses[gid][uid] = {a, b}
        const allGuesses = {};
        guessesSnap.forEach(gameSnap => {
            allGuesses[gameSnap.key] = {};
            gameSnap.forEach(userSnap => {
                allGuesses[gameSnap.key][userSnap.key] = userSnap.val();
            });
        });

        // Meus palpites
        const myGuesses = {};
        Object.keys(allGuesses).forEach(gid => {
            if (allGuesses[gid][uid]) myGuesses[gid] = allGuesses[gid][uid];
        });

        // Agrupa jogos por rodada
        const grupos = {};
        gamesSnap.forEach(c => {
            const g = c.val();
            if (!grupos[g.rodada]) grupos[g.rodada] = [];
            grupos[g.rodada].push({ id: c.key, game: g });
        });

        // ── Ranking geral (calculado antes para mostrar no topo) ──────────────
        const totalPts = {};
        const totalPE  = {}; // contagem de "Placar Exato" (1º critério de desempate)
        const totalGV  = {}; // contagem de "Vencedor + Gols do Vencedor" (2º critério)
        Object.keys(participants).forEach(pid => {
            totalPts[pid] = 0;
            totalPE[pid]  = 0;
            totalGV[pid]  = 0;
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
            .map(pid => ({
                name: participants[pid],
                pts:  totalPts[pid],
                pe:   totalPE[pid],
                gv:   totalGV[pid],
                isMe: pid === uid
            }))
            .sort((a, b) =>
                b.pts - a.pts ||   // 1º critério: total de pontos
                b.pe  - a.pe  ||   // 2º critério: mais "Placar Exato"
                b.gv  - a.gv       // 3º critério: mais "Vencedor + Gols do Vencedor"
            );

        let rankHtml = "";
        ranking.forEach((r, i) => {
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}º`;
            rankHtml += `<tr${r.isMe ? ' style="background:#fffbe6;font-weight:bold"' : ''}>
                <td style="padding:4px">${medal}</td>
                <td style="padding:4px">${r.name}${r.isMe ? " 👈" : ""}</td>
                <td style="padding:4px;text-align:right">${r.pts} pts</td>
            </tr>`;
        });

        // Ranking fixo no topo
        let h = `
            <div class="card">
                <h3>🏆 Ranking Geral</h3>
                <table id="ranking" style="width:100%;border-collapse:collapse">
                            <th style="padding:4px">#</th>
                            <th style="text-align:left;padding:4px">Participante</th>
                            <th style="text-align:right;padding:4px">Pontos</th>
                        </tr>
                    </thead>
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

        // ── Classifica cada rodada em um dos 4 status ─────────────────────────
        const rodadasAbertas    = [];
        const rodadasAndamento  = [];
        const rodadasEncerradas = [];
        const rodadasFechadas   = [];

        for (const rodada in grupos) {
            const status = getRoundStatus(rodada, rounds, grupos);
            if (status === "aberta")        rodadasAbertas.push(rodada);
            else if (status === "andamento") rodadasAndamento.push(rodada);
            else if (status === "encerrada") rodadasEncerradas.push(rodada);
            else                              rodadasFechadas.push(rodada);
        }

        // ── Rodada ABERTA: campos de palpite (visível) ────────────────────────
        function htmlRodadaAberta(rodada) {
            const idsRodada = grupos[rodada].map(item => item.id).join(',');
            let html = `
                <div class="card" style="border:2px solid #43a047;background:#f1f8f1">
                    <h3 style="color:#2e7d32">🟢 ${rodada} — Aberta para palpites</h3>`;

            grupos[rodada].forEach(item => {
                const g    = item.game;
                const prev = myGuesses[item.id] || {};
                const va   = prev.a !== undefined ? prev.a : "";
                const vb   = prev.b !== undefined ? prev.b : "";
                html += `
                    <div style="margin:8px 0;padding:8px;background:white;border-radius:6px;border:1px solid #c8e6c9">
                        <strong>${teamLabel(g.a)} x ${teamLabel(g.b)}</strong><br>
                        <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
                            <span>Palpite:</span>
                            <input id="pa_${item.id}" value="${va}" placeholder="0" style="width:52px;text-align:center;padding:8px;font-size:1.1rem">
                            <span style="font-weight:bold">x</span>
                            <input id="pb_${item.id}" value="${vb}" placeholder="0" style="width:52px;text-align:center;padding:8px;font-size:1.1rem">
                        </div>
                    </div>`;
            });

            // Painel de status dos participantes
            let statusRows = "";
            Object.keys(participants).forEach(pid => {
                const totalJogos     = grupos[rodada].length;
                const palpitesFeitos = grupos[rodada].filter(item => allGuesses[item.id] && allGuesses[item.id][pid]).length;
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
                        💾 Salvar todos os palpites de ${rodada}
                    </button>
                    <div style="margin-top:16px;border-top:1px solid #c8e6c9;padding-top:12px">
                        <strong style="color:#2e7d32">Status dos palpites</strong>
                        <table style="width:100%;border-collapse:collapse;margin-top:8px">
                            <thead>
                                <tr style="background:#e8f5e9">
                                    <th style="text-align:left;padding:4px">Participante</th>
                                    <th style="padding:4px">Status</th>
                                </tr>
                            </thead>
                            <tbody>${statusRows}</tbody>
                        </table>
                    </div>
                </div>`;
            return html;
        }

        // ── Helper: card de um jogo com a tabela de palpites de todos ───────────
        // Mostra pontos se o jogo já tem resultado, ou "aguardando" se não tem.
        function htmlJogoTabela(item) {
            const g         = item.game;
            const temResult = g.resultA !== undefined && g.resultB !== undefined;
            const resultadoLabel = temResult
                ? `<span style="display:inline-block;background:#e8f5e9;color:#2e7d32;font-weight:bold;padding:2px 10px;border-radius:12px;font-size:0.85rem">${g.resultA} x ${g.resultB}</span>`
                : `<span style="display:inline-block;background:#f0f0f0;color:#888;font-style:italic;padding:2px 10px;border-radius:12px;font-size:0.85rem">Pendente</span>`;

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
                    <td style="text-align:center;padding:4px">${guess.a} x ${guess.b}</td>
                    <td style="text-align:center;padding:4px">${pontosTd}</td>
                </tr>`;
            });

            return `
                <div class="card">
                    <strong>${teamLabel(g.a)} x ${teamLabel(g.b)}</strong>
                    <div style="margin:6px 0 12px">${resultadoLabel}</div>
                    <table style="width:100%;border-collapse:collapse">
                        <thead>
                            <tr style="background:#f0f0f0">
                                <th style="text-align:left;padding:4px">Participante</th>
                                <th style="padding:4px">Palpite</th>
                                <th style="padding:4px">Pontos</th>
                            </tr>
                        </thead>
                        <tbody>${linhas}</tbody>
                    </table>
                </div>`;
        }

        // ── Rodada EM ANDAMENTO: sem campos de palpite, palpites de todos visíveis (visível) ─
        function htmlRodadaAndamento(rodada) {
            let html = `
                <div class="card" style="border:2px solid #f9a825;background:#fffdf5">
                    <h3 style="color:#f57f17">🟡 ${rodada} — Em andamento</h3>`;

            grupos[rodada].forEach(item => { html += htmlJogoTabela(item); });

            html += `</div>`;
            return html;
        }

        // ── Rodada ENCERRADA: colapsada, com tabela completa de palpites/pontos ──
        function htmlRodadaEncerrada(rodada) {
            const idCollapse = "round_" + rodada.replace(/\s+/g, '_');
            let jogosHtml = "";

            grupos[rodada].forEach(item => { jogosHtml += htmlJogoTabela(item); });

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

        // ── Rodada FECHADA: colapsada, mostra só os próprios palpites (sem resultado) ─
        function htmlRodadaFechada(rodada) {
            const idCollapse = "round_" + rodada.replace(/\s+/g, '_');
            let jogosHtml = "";

            grupos[rodada].forEach(item => {
                const g     = item.game;
                const guess = myGuesses[item.id];
                jogosHtml += `
                    <div class="card">
                        <strong>${teamLabel(g.a)} x ${teamLabel(g.b)}</strong><br>
                        Seu palpite: ${guess ? `${guess.a} x ${guess.b}` : "—"}
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

        // Monta HTML: abertas, em andamento, encerradas, fechadas
        rodadasAbertas.forEach(rodada    => { h += htmlRodadaAberta(rodada);    });
        rodadasAndamento.forEach(rodada  => { h += htmlRodadaAndamento(rodada); });
        rodadasEncerradas.forEach(rodada => { h += htmlRodadaEncerrada(rodada); });
        rodadasFechadas.forEach(rodada   => { h += htmlRodadaFechada(rodada);   });

        document.getElementById("content").innerHTML = h || "<p>Nenhum jogo cadastrado.</p>";

    // ── Restaura palpites em digitação e cards expandidos ────────────────────
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
        localStorage.removeItem("bolao_login"); // login salvo não existe mais
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
