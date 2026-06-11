
const firebaseConfig={
apiKey:"AIzaSyAMEAYIBuax5h2CaBugrRraVCEeVVST2KI",
authDomain:"bolao-copa-2026-c8b2b.firebaseapp.com",
databaseURL:"https://bolao-copa-2026-c8b2b-default-rtdb.firebaseio.com",
projectId:"bolao-copa-2026-c8b2b",
storageBucket:"bolao-copa-2026-c8b2b.firebasestorage.app",
messagingSenderId:"196377474707",
appId:"1:196377474707:web:9305adfa8888472f13bf66"
};
firebase.initializeApp(firebaseConfig);
const db=firebase.database();
const app=document.getElementById("app");

function loginScreen(){
app.innerHTML=`<div class="card">
<h3>Login</h3>
<select id="user"><option value="admin">Administrador</option></select><br>
PIN <input id="pin" type="password"><br>
<button onclick="login()">Entrar</button></div>`;
db.ref("participants").once("value").then(s=>{
const sel=document.getElementById("user");
let options = '<option value="admin">Administrador</option>';
s.forEach(c=>{
    const p = c.val();
    options += `<option value="${c.key}">${p.name}</option>`;
});
sel.innerHTML = options;
});
window.login=async()=>{
const u=user.value,p=pin.value;
if(u==="admin" && p==="2025"){adminPanel();return;}
const s=await db.ref("participants/"+u).get();
if(s.exists() && s.val().pin===p){participant(u,s.val());}
else alert("Login inválido");
};

function adminPanel(){
app.innerHTML=`<h2>Administrador</h2>
<div class=card>
<h3>Novo participante</h3>
<input id=n placeholder=Nome>
<input id=p placeholder=PIN>
<button onclick="addParticipant()">Cadastrar</button>
</div>
<div class=card>
<h3>Novo jogo</h3>
<input id=t1 placeholder="Time A">
<input id=t2 placeholder="Time B">
<button onclick="addGame()">Adicionar</button>
</div>
<div class=card>
<button onclick="setOpen(true)">Abrir Palpites</button>
<button onclick="setOpen(false)">Fechar Palpites</button>
</div>
<div class=card>
<h3>Resultados</h3>
<div id=games></div></div>`;
loadGamesAdmin();
}
window.addParticipant=()=>{
db.ref("participants").push({name:n.value,pin:p.value});
alert("Cadastrado");
};
window.addGame=()=>{
db.ref("games").push({a:t1.value,b:t2.value});
alert("Jogo criado");
loadGamesAdmin();
};
window.setOpen=(v)=>db.ref("settings/open").set(v);

function loadGamesAdmin(){
db.ref("games").on("value",s=>{
let h="";
s.forEach(c=>{
const g=c.val();
h+=`<div>${g.a} x ${g.b}
<input id=ga_${c.key} size=2>
<input id=gb_${c.key} size=2>
<button onclick="saveResult('${c.key}')">Salvar</button></div>`;
});
games.innerHTML=h;
});
}
window.saveResult=(id)=>{
db.ref("games/"+id).update({
ra:document.getElementById("ga_"+id).value,
rb:document.getElementById("gb_"+id).value
});
};

function participant(id,u){
app.innerHTML=`<h2>${u.name}</h2><div id=content></div>`;
db.ref("settings/open").on("value",o=>loadParticipant(id,o.val()));
}
function loadParticipant(uid,open){
db.ref("games").once("value").then(s=>{
let h=`<p>Rodada ${open?"ABERTA":"FECHADA"}</p>`;
s.forEach(c=>{
const g=c.val();
h+=`<div class=card>${g.a} x ${g.b}<br>
<input id=pa_${c.key} size=2>
<input id=pb_${c.key} size=2>
${open?`<button onclick="saveGuess('${uid}','${c.key}')">Salvar</button>`:''}
</div>`;
});
content.innerHTML=h;
});
}
window.saveGuess=(uid,gid)=>{
db.ref(`guesses/${gid}/${uid}`).set({
a:document.getElementById("pa_"+gid).value,
b:document.getElementById("pb_"+gid).value
});
alert("Palpite salvo");
};
loginScreen();
