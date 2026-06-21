export function getGuiHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Coreling</title>
<style>
:root{--bg:#0a0c0b;--panel:#111714;--border:#1e2e24;--text:#e8f5ec;--muted:#7a9a86;--accent:#50fa7b;--accent2:#3ddc6a;--glow:rgba(80,250,123,.15)}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--text);min-height:100vh;overflow:hidden}
.bg{position:fixed;inset:0;background:radial-gradient(ellipse 80% 60% at 20% 0%,rgba(80,250,123,.08),transparent 60%),radial-gradient(ellipse 60% 50% at 100% 100%,rgba(61,220,106,.06),transparent 55%);pointer-events:none;animation:pulse 8s ease-in-out infinite alternate}
@keyframes pulse{from{opacity:.7}to{opacity:1}}
.app{display:grid;grid-template-columns:260px 1fr;height:100vh;position:relative;z-index:1}
.sidebar{border-right:1px solid var(--border);background:rgba(17,23,20,.85);backdrop-filter:blur(12px);padding:1.25rem;display:flex;flex-direction:column;gap:1rem;animation:slideIn .5s ease}
@keyframes slideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:none}}
.logo{font-weight:700;font-size:1.25rem;color:var(--accent);letter-spacing:-.02em}
.logo span{color:var(--muted);font-weight:500;font-size:.75rem;display:block;margin-top:.15rem}
.tabs{display:flex;flex-direction:column;gap:.35rem}
.tab{padding:.55rem .75rem;border-radius:8px;border:1px solid transparent;background:transparent;color:var(--muted);cursor:pointer;text-align:left;font-size:.875rem;transition:all .2s}
.tab:hover{color:var(--text);background:rgba(80,250,123,.06)}
.tab.active{color:var(--accent);border-color:var(--border);background:rgba(80,250,123,.1)}
.main{display:flex;flex-direction:column;min-height:0;animation:fadeUp .6s ease .1s both}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.panel{display:none;flex:1;flex-direction:column;min-height:0;padding:1.25rem 1.5rem}
.panel.active{display:flex}
.messages{flex:1;overflow-y:auto;padding:.5rem 0;display:flex;flex-direction:column;gap:1rem}
.msg{max-width:720px;padding:.85rem 1rem;border-radius:12px;line-height:1.55;font-size:.925rem;animation:msgIn .35s ease}
@keyframes msgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.msg.user{align-self:flex-end;background:rgba(80,250,123,.12);border:1px solid var(--border)}
.msg.bot{align-self:flex-start;background:var(--panel);border:1px solid var(--border)}
.status{display:none;align-items:center;gap:.75rem;padding:.75rem 1rem;border-radius:10px;background:rgba(80,250,123,.08);border:1px solid var(--border);margin-bottom:.75rem;animation:shimmer 1.2s ease infinite alternate}
.status.show{display:flex}
@keyframes shimmer{from{box-shadow:0 0 0 0 var(--glow)}to{box-shadow:0 0 24px 2px var(--glow)}}
.cube{width:18px;height:18px;border:2px solid var(--accent);animation:spin3d 1s linear infinite}
@keyframes spin3d{0%{transform:rotate(0deg) scale(1)}50%{transform:rotate(180deg) scale(.85)}100%{transform:rotate(360deg) scale(1)}}
.status-text{display:flex;flex-direction:column;gap:.15rem}
.status-quote{font-weight:600;color:var(--accent)}
.status-role{font-size:.8rem;color:var(--muted)}
.compose{display:flex;gap:.5rem;padding-top:.75rem;border-top:1px solid var(--border)}
textarea,input[type=text],select{flex:1;background:var(--panel);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:.65rem .85rem;font:inherit;resize:none}
textarea:focus,input:focus,select:focus{outline:none;border-color:var(--accent)}
.btn{padding:.65rem 1.1rem;border-radius:10px;border:none;font-weight:600;cursor:pointer;font-size:.875rem;transition:transform .15s,box-shadow .15s}
.btn-primary{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#051008}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 20px var(--glow)}
.btn-ghost{background:transparent;border:1px solid var(--border);color:var(--text)}
.roles{display:flex;flex-direction:column;gap:.75rem;overflow-y:auto;flex:1;min-height:0}
.role-card{padding:.85rem;border:1px solid var(--border);border-radius:12px;background:var(--panel);animation:fadeUp .4s ease both}
.role-card input,.role-card select{width:100%;margin-top:.35rem;margin-bottom:.5rem;font-size:.8rem;padding:.45rem .6rem;background:#0d1210;border:1px solid var(--border);border-radius:6px;color:var(--text)}
.role-head{display:flex;justify-content:space-between;align-items:center}
.role-head strong{font-size:.875rem}
.feed{border:2px dashed var(--border);border-radius:14px;padding:2rem;text-align:center;color:var(--muted);cursor:pointer;transition:border-color .2s,background .2s;margin-bottom:1rem}
.feed.drag{border-color:var(--accent);background:rgba(80,250,123,.05);color:var(--accent)}
.feed-list{font-size:.8rem;color:var(--muted);margin-top:.5rem;text-align:left}
.toolbar{display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem}
.hidden{display:none!important}
</style>
</head>
<body>
<div class="bg"></div>
<div class="app">
  <aside class="sidebar">
    <div class="logo">Coreling<div><span>GUI · localhost</span></div></div>
    <nav class="tabs">
      <button class="tab active" data-tab="chat">Chat</button>
      <button class="tab" data-tab="orchestrator">Orchestrator</button>
    </nav>
    <p style="font-size:.75rem;color:var(--muted);line-height:1.4;margin-top:auto">Inspired by LibreChat bones — Coreling green, not a full clone.</p>
  </aside>
  <main class="main">
    <section class="panel active" id="panel-chat">
      <div class="messages" id="chat-msgs"></div>
      <div class="compose">
        <textarea id="chat-input" rows="2" placeholder="Message Coreling…"></textarea>
        <button class="btn btn-primary" id="chat-send">Send</button>
      </div>
    </section>
    <section class="panel" id="panel-orchestrator">
      <div class="toolbar">
        <button class="btn btn-ghost" id="add-role">+ Role</button>
        <button class="btn btn-ghost" id="save-roles">Save roles</button>
      </div>
      <div class="roles" id="roles"></div>
      <div class="feed" id="feed">Drop files here or click to feed · any file type</div>
      <input type="file" id="file-input" multiple class="hidden"/>
      <div class="feed-list" id="feed-list"></div>
      <div class="status" id="orch-status"><div class="cube"></div><div class="status-text"><span class="status-quote" id="status-quote"></span><span class="status-role" id="status-role"></span></div></div>
      <div class="messages" id="orch-msgs" style="max-height:180px"></div>
      <div class="compose">
        <textarea id="orch-input" rows="2" placeholder="Describe the task to orchestrate…"></textarea>
        <button class="btn btn-primary" id="orch-run">Orchestrated chat</button>
      </div>
    </section>
  </main>
</div>
<script>
let config={roles:[],models:[],quotes:[]};
let fedFiles=[];
const $=id=>document.getElementById(id);

document.querySelectorAll('.tab').forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    $('panel-'+btn.dataset.tab).classList.add('active');
  };
});

async function loadConfig(){
  const r=await fetch('/api/config');
  config=await r.json();
  renderRoles();
}

function renderRoles(){
  const el=$('roles');
  el.innerHTML='';
  config.roles.forEach((role,i)=>{
    const card=document.createElement('div');
    card.className='role-card';
    card.style.animationDelay=(i*0.05)+'s';
    card.innerHTML=\`
      <div class="role-head"><strong>Role \${i+1}</strong></div>
      <input data-i="\${i}" data-f="name" value="\${role.name}" placeholder="Role name"/>
      <select data-i="\${i}" data-f="model">\${config.models.map(m=>\`<option value="\${m.id}" \${m.id===role.model?'selected':''}>\${m.label}</option>\`).join('')}</select>
      <input data-i="\${i}" data-f="keywords" value="\${role.keywords.join(', ')}" placeholder="keywords, comma separated"/>
    \`;
    el.appendChild(card);
  });
  el.querySelectorAll('input,select').forEach(inp=>{
    inp.onchange=()=>{
      const i=+inp.dataset.i,f=inp.dataset.f;
      if(f==='keywords') config.roles[i].keywords=inp.value.split(',').map(s=>s.trim()).filter(Boolean);
      else config.roles[i][f]=inp.value;
    };
  });
}

$('add-role').onclick=()=>{
  config.roles.push({id:'role-'+Date.now(),name:'New Agent',model:config.models[0]?.id||'chat',keywords:[]});
  renderRoles();
};
$('save-roles').onclick=async()=>{
  await fetch('/api/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({roles:config.roles})});
};

const feed=$('feed'),fileInput=$('file-input');
feed.onclick=()=>fileInput.click();
feed.ondragover=e=>{e.preventDefault();feed.classList.add('drag');};
feed.ondragleave=()=>feed.classList.remove('drag');
feed.ondrop=e=>{e.preventDefault();feed.classList.remove('drag');addFiles(e.dataTransfer.files);};
fileInput.onchange=()=>addFiles(fileInput.files);

async function addFiles(fileList){
  for(const f of fileList){
    const text=await f.text().catch(()=>'[binary file: '+f.name+']');
    fedFiles.push({name:f.name,content:text});
  }
  $('feed-list').textContent='Fed: '+fedFiles.map(x=>x.name).join(', ');
}

function addMsg(container,text,who){
  const d=document.createElement('div');
  d.className='msg '+who;
  d.textContent=text;
  container.appendChild(d);
  container.scrollTop=container.scrollHeight;
}

async function orchestrate(){
  const msg=$('orch-input').value.trim();
  if(!msg&&!fedFiles.length) return;
  const status=$('orch-status');
  const q=config.quotes[Math.floor(Math.random()*config.quotes.length)]||'Working…';
  $('status-quote').textContent=q;
  $('status-role').textContent='Assigning agent…';
  status.classList.add('show');
  $('orch-run').disabled=true;
  try{
    const r=await fetch('/api/orchestrate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg,files:fedFiles})});
    const data=await r.json();
    if(data.error) throw new Error(data.error);
    $('status-quote').textContent=data.quote;
    $('status-role').textContent='using '+data.role.name+' · model '+data.role.model;
    addMsg($('orch-msgs'),'['+data.role.name+'] '+data.response,'bot');
    fedFiles=[];$('feed-list').textContent='';
    $('orch-input').value='';
  }catch(e){
    addMsg($('orch-msgs'),'Error: '+e.message,'bot');
  }finally{
    setTimeout(()=>status.classList.remove('show'),1200);
    $('orch-run').disabled=false;
  }
}
$('orch-run').onclick=orchestrate;

$('chat-send').onclick=async()=>{
  const msg=$('chat-input').value.trim();
  if(!msg) return;
  addMsg($('chat-msgs'),msg,'user');
  $('chat-input').value='';
  $('chat-send').disabled=true;
  try{
    const r=await fetch('/api/orchestrate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg,files:[]})});
    const data=await r.json();
    if(data.error) throw new Error(data.error);
    addMsg($('chat-msgs'),data.response,'bot');
  }catch(e){addMsg($('chat-msgs'),e.message,'bot');}
  $('chat-send').disabled=false;
};

loadConfig();
</script>
</body>
</html>`
}
