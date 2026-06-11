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
const db = firebase.database();
const app = document.getElementById("app");

// ── LOGIN ────────────────────────────────────────────────────────────────────

function loginScreen() {
    app.innerHTML = `
        <div class="card">
            <h3>Login</h3>
            <select id="user"><option value="admin">Administrador</option></select><br>
            PIN <input id="pin" type="password"><br>
            <button onclick="login()">Entrar</button>
        </div>`;

    db.ref("participants").on("value", (s) => {
        const sel = document.getElementById("user");
        let options = '<option value="admin">Administrador</option>';
        s.forEach(c => {
            const p = c.val();
            options += `<option value="${c.key}">${p.name}</option>`;
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
        <h2>Administrador</h2>
        <button onclick="logout()">Sair</button>

        <div class="card">
            <h3>Novo participante</h3>
            <input id="n" placeholder="Nome">
            <input id="p" placeholder="PIN">
            <button onclick="addParticipant()">Cadastrar</button>
        </div>

        <div class="card">
            <h3>Novo jogo</h3>
            <input id="rodada" placeholder="Nome da Rodada">
            <input id="t1" placeholder="Time A">
            <input id="t2" placeholder="Time B">
            <button onclick="addGame()">Adicionar</button>
        </div>

        <div class="card">
            <h3>Resultados</h3>
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
    // FIX: usar getElementById em vez de variáveis globais implícitas
    const nome = document.getElementById("n").value;
    const pin  = document.getElementById("p").value;
    if (!nome || !pin) { alert("Preencha nome e PIN"); return; }
    db.ref("participants").push({ name: nome, pin: pin });
    alert("Cadastrado");
};

window.addGame = () => {
    const nomeRodada = document.getElementById("rodada").value;
    const timeA      = document.getElementById("t1").value;
    const timeB      = document.getElementById("t2").value;
    if (!nomeRodada || !timeA || !timeB) { alert("Preencha todos os campos"); return; }

    // Cria a rodada somente se não existir
    db.ref("rounds/" + nomeRodada).once("value").then(snap => {
        if (!snap.exists()) {
            db.ref("rounds/" + nomeRodada).set({ open: true });
        }
    });

    db.ref("games").push({ rodada: nomeRodada, a: timeA, b: timeB });
    alert("Jogo criado");
};

// FIX: apenas uma declaração de loadGamesAdmin (stub vazio removido)
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
                const g = item.game;
                // Pré-preenche resultado salvo, se houver
                const ga = g.resultA !== undefined ? g.resultA : "";
                const gb = g.resultB !== undefined ? g.resultB : "";
                h += `
                    <div>
                        ${g.a} x ${g.b}
                        <input id="ga_${item.id}" size="2" value="${ga}">
                        <input id="gb_${item.id}" size="2" value="${gb}">
                        <button onclick="saveResult('${item.id}')">Salvar</button>
                    </div>`;
            });
        }

        document.getElementById("games").innerHTML = h;
    });
}

// FIX: função saveResult implementada
window.saveResult = (gid) => {
    const a = document.getElementById("ga_" + gid).value;
    const b = document.getElementById("gb_" + gid).value;
    if (a === "" || b === "") { alert("Preencha os dois placares"); return; }
    db.ref("games/" + gid).update({ resultA: a, resultB: b });
    alert("Resultado salvo");
};

function loadRounds() {
    db.ref("rounds").on("value", s => {
        let h = "";
        s.forEach(c => {
            const r = c.val();
            h += `
                <div style="margin-bottom:10px">
                    <strong>${c.key}</strong>
                    - ${r.open ? "🟢 Aberta" : "🔴 Fechada"}
                    <button onclick="toggleRound('${c.key}', ${!r.open})">
                        ${r.open ? "Fechar" : "Abrir"}
                    </button>
                </div>`;
        });
        document.getElementById("rounds").innerHTML = h;
    });
} // FIX: chave extra removida — toggleRound agora está fora de loadRounds

window.toggleRound = (nome, valor) => {
    db.ref("rounds/" + nome + "/open").set(valor);
};

// ── PARTICIPANTE ──────────────────────────────────────────────────────────────

function participant(id, u) {
    app.innerHTML = `
        <h2>${u.name}</h2>
        <button onclick="logout()">Sair</button>
        <div id="content"></div>`;

    loadParticipant(id);
}

// FIX: busca estado real das rodadas e palpites já salvos
function loadParticipant(uid) {
    Promise.all([
        db.ref("games").once("value"),
        db.ref("rounds").once("value"),
        db.ref("guesses").once("value")
    ]).then(([gamesSnap, roundsSnap, guessesSnap]) => {

        const rounds = {};
        roundsSnap.forEach(c => { rounds[c.key] = c.val(); });

        const guesses = {};
        guessesSnap.forEach(gameSnap => {
            guessesSnap.child(gameSnap.key);
            const g = guessesSnap.child(gameSnap.key).child(uid).val();
            if (g) guesses[gameSnap.key] = g;
        });

        // Reagrupa por rodada
        const grupos = {};
        gamesSnap.forEach(c => {
            const g = c.val();
            if (!grupos[g.rodada]) grupos[g.rodada] = [];
            grupos[g.rodada].push({ id: c.key, game: g });
        });

        let h = "";
        for (const rodada in grupos) {
            const open = rounds[rodada] ? rounds[rodada].open : false;
            h += `<h3>${rodada} — ${open ? "🟢 Aberta" : "🔴 Fechada"}</h3>`;
            grupos[rodada].forEach(item => {
                const g    = item.game;
                const prev = guesses[item.id] || {};
                const va   = prev.a !== undefined ? prev.a : "";
                const vb   = prev.b !== undefined ? prev.b : "";
                h += `
                    <div class="card">
                        ${g.a} x ${g.b}<br>
                        <input id="pa_${item.id}" size="2" value="${va}" ${open ? "" : "disabled"}>
                        <input id="pb_${item.id}" size="2" value="${vb}" ${open ? "" : "disabled"}>
                        ${open ? `<button onclick="saveGuess('${uid}','${item.id}')">Salvar</button>` : ""}
                    </div>`;
            });
        }

        document.getElementById("content").innerHTML = h || "<p>Nenhum jogo cadastrado.</p>";
    });
}

window.saveGuess = (uid, gid) => {
    const a = document.getElementById("pa_" + gid).value;
    const b = document.getElementById("pb_" + gid).value;
    db.ref(`guesses/${gid}/${uid}`).set({ a, b });
    alert("Palpite salvo");
};

// ── INIT ──────────────────────────────────────────────────────────────────────
loginScreen();
