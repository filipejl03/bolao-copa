function logout() {
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
    if (u === "admin" && p === "2025") { adminPanel(); return; }
    const s = await db.ref("participants/" + u).get();
    if (s.exists() && s.val().pin === p) { participant(u, s.val()); }
    else alert("Login inválido");
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
            <h3>Salvar Resultados</h3>
            <div id="games"></div>
        </div>

        <div class="card">
            <h3>Rodadas</h3>
            <div id="rounds"></div>
        </div>`;

    loadGamesAdmin();
    loadRounds();
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
        if (!snap.exists()) db.ref("rounds/" + nomeRodada).set({ open: true });
    });

    db.ref("games").push({ rodada: nomeRodada, a: timeA, b: timeB });
    alert("Jogo criado!");
};

function loadGamesAdmin() {
    db.ref("games").on("value", s => {
        let h = "";
        const grupos = {};

        s.forEach(c => {
            const g = c.val();
            if (!grupos[g.rodada]) grupos[g.rodada] = [];
            grupos[g.rodada].push({ id: c.key, game: g });
        });

        for (const rodada in grupos) {
            h += `<h3>${rodada}</h3>`;
            grupos[rodada].forEach(item => {
                const g  = item.game;
                const ga = g.resultA !== undefined ? g.resultA : "";
                const gb = g.resultB !== undefined ? g.resultB : "";
                h += `
                    <div style="margin-bottom:8px">
                        <strong>${g.a} x ${g.b}</strong>
                        <input id="ga_${item.id}" size="2" value="${ga}" placeholder="A">
                        <input id="gb_${item.id}" size="2" value="${gb}" placeholder="B">
                        <button class="btn-gold" onclick="saveResult('${item.id}')">Salvar</button>
                    </div>`;
            });
        }

        document.getElementById("games").innerHTML = h || "<p>Nenhum jogo cadastrado.</p>";
    });
}

window.saveResult = (gid) => {
    const a = document.getElementById("ga_" + gid).value;
    const b = document.getElementById("gb_" + gid).value;
    if (a === "" || b === "") { alert("Preencha os dois placares"); return; }
    db.ref("games/" + gid).update({ resultA: a, resultB: b });
    alert("Resultado salvo!");
};

function loadRounds() {
    db.ref("rounds").on("value", s => {
        let h = "";
        s.forEach(c => {
            const r = c.val();
            h += `
                <div style="margin-bottom:10px">
                    <strong>${c.key}</strong>
                    ${r.open ? "🟢 Aberta" : "🔴 Fechada"}
                    <button class="btn-blue" onclick="toggleRound('${c.key}', ${!r.open})">
                        ${r.open ? "Fechar palpites" : "Abrir palpites"}
                    </button>
                </div>`;
        });
        document.getElementById("rounds").innerHTML = h || "<p>Nenhuma rodada.</p>";
    });
}

window.toggleRound = (nome, valor) => {
    db.ref("rounds/" + nome + "/open").set(valor);
};

// ── PARTICIPANTE ──────────────────────────────────────────────────────────────

function participant(id, u) {
    app.innerHTML = `
        <h2>👤 ${u.name}</h2>
        <button class="btn-red" onclick="logout()">Sair</button>
        <div id="content"></div>`;

    loadParticipant(id);
}

function loadParticipant(uid) {
    Promise.all([
        db.ref("games").once("value"),
        db.ref("rounds").once("value"),
        db.ref("guesses").once("value"),
        db.ref("participants").once("value")
    ]).then(([gamesSnap, roundsSnap, guessesSnap, participantsSnap]) => {

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
        Object.keys(participants).forEach(pid => { totalPts[pid] = 0; });

        gamesSnap.forEach(c => {
            const g = c.val();
            if (g.resultA === undefined || g.resultB === undefined) return;
            Object.keys(participants).forEach(pid => {
                const guess = allGuesses[c.key] && allGuesses[c.key][pid];
                if (!guess) return;
                const r = calcPontos(guess.a, guess.b, g.resultA, g.resultB);
                if (r) totalPts[pid] += r.pts;
            });
        });

        const ranking = Object.keys(participants)
            .map(pid => ({ name: participants[pid], pts: totalPts[pid], isMe: pid === uid }))
            .sort((a, b) => b.pts - a.pts);

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
                <table style="width:100%;border-collapse:collapse">
                    <thead>
                        <tr style="background:#f0f0f0">
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

        // ── Separa rodadas abertas e fechadas ─────────────────────────────────
        const rodadasAbertas  = [];
        const rodadasFechadas = [];

        for (const rodada in grupos) {
            const open = rounds[rodada] ? rounds[rodada].open : false;
            if (open) rodadasAbertas.push(rodada);
            else rodadasFechadas.push(rodada);
        }

        // Função para montar conteúdo de uma rodada aberta
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
                        <strong>${g.a} x ${g.b}</strong><br>
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

        // Função para montar conteúdo de uma rodada fechada (colapsável)
        function htmlRodadaFechada(rodada) {
            const idCollapse = "round_" + rodada.replace(/\s+/g, '_');
            let jogosHtml = "";

            grupos[rodada].forEach(item => {
                const g         = item.game;
                const temResult = g.resultA !== undefined && g.resultB !== undefined;
                const resultadoLabel = temResult
                    ? `<span style="color:#27ae60"><strong>Resultado: ${g.resultA} x ${g.resultB}</strong></span>`
                    : `<em>Resultado pendente</em>`;

                let linhas = "";
                Object.keys(participants).forEach(pid => {
                    const guess = allGuesses[item.id] && allGuesses[item.id][pid];
                    if (!guess) {
                        linhas += `<tr><td>${participants[pid]}</td><td>—</td><td>—</td></tr>`;
                        return;
                    }
                    let pontosTd = "—";
                    if (temResult) {
                        const r = calcPontos(guess.a, guess.b, g.resultA, g.resultB);
                        pontosTd = r
                            ? `<span title="${r.desc}" style="font-weight:bold;color:#2980b9">${r.cod} +${r.pts}pts</span>`
                            : `<span style="color:#c0392b">0 pts</span>`;
                    }
                    const destaque = pid === uid ? ' style="background:#fffbe6"' : '';
                    linhas += `<tr${destaque}>
                        <td>${participants[pid]}${pid === uid ? " 👈" : ""}</td>
                        <td style="text-align:center">${guess.a} x ${guess.b}</td>
                        <td style="text-align:center">${pontosTd}</td>
                    </tr>`;
                });

                jogosHtml += `
                    <div class="card">
                        <strong>${g.a} x ${g.b}</strong> — ${resultadoLabel}<br><br>
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

        // Monta HTML: abertas primeiro, depois fechadas
        rodadasAbertas.forEach(rodada  => { h += htmlRodadaAberta(rodada);  });
        rodadasFechadas.forEach(rodada => { h += htmlRodadaFechada(rodada); });

        document.getElementById("content").innerHTML = h || "<p>Nenhum jogo cadastrado.</p>";
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
loginScreen();

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
