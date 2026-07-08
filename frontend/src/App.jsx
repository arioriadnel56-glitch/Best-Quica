import{useState,useEffect,useCallback}from"react";
import{api}from"./api.js";
import{LOGO_SM,LOGO_MD,LOGO_FAC}from"./logos.js";

/* ─── UTILS ─────────────────────────────────────────────────── */
const curr=(s,n)=>`${Number(n||0).toLocaleString("fr-FR")} ${s?.currency||"FCFA"}`;
const fmtN=n=>Number(n||0).toLocaleString("fr-FR");
const todayStr=()=>new Date().toISOString().split("T")[0];
const SALE_TYPES={detail:{label:"Détail",color:"#2563eb",bg:"#dbeafe"},gros:{label:"Gros",color:"#7c3aed",bg:"#ede9fe"},mixte:{label:"Mixte",color:"#d97706",bg:"#fef3c7"}};
const CLIENT_TYPES={detail:{label:"Détaillant",color:"#2563eb"},gros:{label:"Grossiste",color:"#7c3aed"},vip:{label:"VIP",color:"#dc2626"}};

/* ─── ROOT ───────────────────────────────────────────────────── */
export default function App(){
  const[screen,setScreen]=useState("landing");
  const[session,setSession]=useState(null);
  const[toast,setToast]=useState(null);
  const[isOnline,setIsOnline]=useState(navigator.onLine);
  useEffect(()=>{
    const on=()=>setIsOnline(true),off=()=>setIsOnline(false);
    window.addEventListener("online",on);window.addEventListener("offline",off);
    const t=localStorage.getItem("bq_token");
    if(t) api.me().then(d=>{setSession(d);setScreen("app");}).catch(()=>localStorage.removeItem("bq_token"));
    return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off);};
  },[]);
  const notify=useCallback((msg,type="info")=>{setToast({msg,type});setTimeout(()=>setToast(null),5000);},[]);
  const login=d=>{localStorage.setItem("bq_token",d.token);setSession(d);setScreen("app");};
  const logout=()=>{localStorage.removeItem("bq_token");setSession(null);setScreen("landing");};
  return(
    <div style={S.root}>
      {toast&&<div style={{...S.toast,background:toast.type==="error"?"#dc2626":toast.type==="success"?"#16a34a":"#1d4ed8"}}>{toast.msg}</div>}
      {screen==="landing"&&<Landing onLogin={()=>setScreen("login")} onRegister={()=>setScreen("register")}/>}
      {screen==="login"&&<LoginScreen onBack={()=>setScreen("landing")} onSuccess={login} notify={notify}/>}
      {screen==="register"&&<RegisterScreen onBack={()=>setScreen("landing")} onSuccess={login} notify={notify}/>}
      {screen==="app"&&session&&<Shell session={session} logout={logout} notify={notify} isOnline={isOnline}/>}
    </div>
  );
}

/* ─── LANDING ────────────────────────────────────────────────── */
function Landing({onLogin,onRegister}){
  return(
    <div style={S.landing}>
      <div style={S.landCard}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <img src={LOGO_MD} alt="Best-Quinca" style={{maxWidth:"100%",height:"auto",maxHeight:160,objectFit:"contain",marginBottom:12}}/>
          <p style={{color:"#64748b",marginTop:4,fontSize:14,fontStyle:"italic"}}>Le meilleur choix pour votre gestion</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:28}}>
          {[["📦","Catalogue avec prix Gros & Détail"],["👥","Gestion clients (Gros / Détail / VIP)"],["🧾","Facturation avec logo & tampon"],["📋","Historique des mouvements de stock"],["💾","Sauvegarde & restauration"],["📊","Rapports & exports Excel/CSV"],["🚛","Suivi logistique camions"],["🔐","Accès propriétaire / secrétaire"]].map(([ic,t])=>(
            <div key={t} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:18,flexShrink:0}}>{ic}</span>
              <span style={{fontSize:13,color:"#334155"}}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gap:10}}>
          <button style={S.btnPrimary} onClick={onRegister}>Créer l'espace de ma quincaillerie</button>
          <button style={S.btnGhost} onClick={onLogin}>J'ai déjà un compte — Se connecter</button>
        </div>
        <p style={{textAlign:"center",fontSize:12,color:"#94a3b8",marginTop:16}}>Chaque quincaillerie dispose d'un espace privé et sécurisé.</p>
      </div>
    </div>
  );
}

/* ─── REGISTER ───────────────────────────────────────────────── */
function RegisterScreen({onBack,onSuccess,notify}){
  const[step,setStep]=useState(1);
  const[store,setStore]=useState({storeName:"",city:"",phone:""});
  const[owner,setOwner]=useState({fullName:"",email:"",password:"",confirm:""});
  const[errors,setErrors]=useState({});
  const[loading,setLoading]=useState(false);
  const[showPwd,setShowPwd]=useState(false);
  function v1(){const e={};if(!store.storeName.trim())e.storeName="Obligatoire.";if(!store.city.trim())e.city="Obligatoire.";setErrors(e);return!Object.keys(e).length;}
  async function submit(){
    const e={};
    if(!owner.fullName.trim())e.fullName="Obligatoire.";
    if(!owner.email.includes("@"))e.email="E-mail invalide.";
    if(owner.password.length<8)e.password="Min. 8 caractères.";
    if(owner.password!==owner.confirm)e.confirm="Différents.";
    setErrors(e);if(Object.keys(e).length)return;
    setLoading(true);
    try{const d=await api.register({...store,...owner});notify("✅ Espace créé ! Bienvenue dans Best-Quinca.","success");onSuccess(d);}
    catch(err){notify(err.message,"error");}
    setLoading(false);
  }
  return(
    <div style={S.authWrap}>
      <div style={S.authCard}>
        <button style={S.backLink} onClick={onBack}>← Retour</button>
        <div style={{textAlign:"center",marginBottom:4}}><img src={LOGO_SM} alt="Best-Quinca" style={{maxWidth:220,height:"auto",maxHeight:60,objectFit:"contain"}}/></div>
        <h2 style={{fontSize:20,fontWeight:800,marginBottom:6}}>Créer votre espace</h2>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:20}}>
          {[["1","Ma quincaillerie"],["2","Mon compte"]].map(([n,l],i)=>(
            <div key={n} style={{display:"flex",alignItems:"center",gap:6,flex:1}}>
              <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,background:step>i?"#16a34a":step===i+1?"#1e3a5f":"#e2e8f0",color:(step>i||step===i+1)?"white":"#94a3b8"}}>{step>i?"✓":n}</div>
              <span style={{fontSize:11,color:step===i+1?"#1e3a5f":"#94a3b8",fontWeight:step===i+1?700:400}}>{l}</span>
              {i===0&&<div style={{flex:1,height:2,background:step>1?"#16a34a":"#e2e8f0"}}/>}
            </div>
          ))}
        </div>
        {step===1&&<>
          <Fld label="Nom de la quincaillerie *" value={store.storeName} onChange={v=>setStore({...store,storeName:v})} placeholder="Ex: Matériaux du Centre" err={errors.storeName}/>
          <Fld label="Ville *" value={store.city} onChange={v=>setStore({...store,city:v})} placeholder="Abidjan, Dakar, Cotonou..." err={errors.city}/>
          <Fld label="Téléphone" value={store.phone} onChange={v=>setStore({...store,phone:v})} placeholder="+225 07 00 00 00"/>
          <button style={{...S.btnPrimary,width:"100%",marginTop:8}} onClick={()=>v1()&&setStep(2)}>Continuer →</button>
        </>}
        {step===2&&<>
          <Fld label="Nom complet *" value={owner.fullName} onChange={v=>setOwner({...owner,fullName:v})} placeholder="Ibrahim Coulibaly" err={errors.fullName}/>
          <Fld label="Adresse e-mail *" value={owner.email} onChange={v=>setOwner({...owner,email:v})} type="email" placeholder="votre@email.com" err={errors.email}/>
          <Fld label="Mot de passe * (min. 8 car.)" value={owner.password} onChange={v=>setOwner({...owner,password:v})} type={showPwd?"text":"password"} err={errors.password}/>
          <Fld label="Confirmer le mot de passe *" value={owner.confirm} onChange={v=>setOwner({...owner,confirm:v})} type={showPwd?"text":"password"} err={errors.confirm}/>
          <label style={S.chk}><input type="checkbox" checked={showPwd} onChange={e=>setShowPwd(e.target.checked)}/><span>Afficher les mots de passe</span></label>
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <button style={{...S.btnGhost,flex:1}} onClick={()=>{setStep(1);setErrors({});}}>← Retour</button>
            <button style={{...S.btnPrimary,flex:2}} onClick={submit} disabled={loading}>{loading?"Création...":"Créer mon compte"}</button>
          </div>
        </>}
      </div>
    </div>
  );
}

/* ─── LOGIN ──────────────────────────────────────────────────── */
function LoginScreen({onBack,onSuccess,notify}){
  const[email,setEmail]=useState("");const[password,setPassword]=useState("");
  const[showPwd,setShowPwd]=useState(false);const[loading,setLoading]=useState(false);
  async function submit(){
    if(!email||!password){notify("Remplissez tous les champs.","error");return;}
    setLoading(true);
    try{const d=await api.login({email,password});notify("Bienvenue !","success");onSuccess(d);}
    catch(e){notify(e.message,"error");}
    setLoading(false);
  }
  return(
    <div style={S.authWrap}>
      <div style={S.authCard}>
        <button style={S.backLink} onClick={onBack}>← Retour</button>
        <div style={{textAlign:"center",marginBottom:4}}><img src={LOGO_SM} alt="Best-Quinca" style={{maxWidth:220,height:"auto",maxHeight:60,objectFit:"contain"}}/></div>
        <h2 style={{fontSize:20,fontWeight:800,marginBottom:6}}>Connexion</h2>
        <p style={{color:"#64748b",fontSize:13,marginBottom:20}}>Accédez à l'espace de votre quincaillerie.</p>
        <Fld label="Adresse e-mail" value={email} onChange={setEmail} type="email" placeholder="votre@email.com" onEnter={submit}/>
        <Fld label="Mot de passe" value={password} onChange={setPassword} type={showPwd?"text":"password"} placeholder="••••••••" onEnter={submit}/>
        <label style={S.chk}><input type="checkbox" checked={showPwd} onChange={e=>setShowPwd(e.target.checked)}/><span>Afficher</span></label>
        <button style={{...S.btnPrimary,width:"100%",marginTop:16}} onClick={submit} disabled={loading}>{loading?"Connexion...":"Se connecter"}</button>
      </div>
    </div>
  );
}

/* ─── SHELL ──────────────────────────────────────────────────── */
function Shell({session,logout,notify,isOnline}){
  const{user}=session;
  const isOwner=user.role==="owner";
  const[view,setView]=useState(isOwner?"dashboard":"sec_home");
  const[storeData,setStoreData]=useState(session.store);

  const ownerNav=[
    {id:"dashboard",icon:"📊",label:"Tableau de bord"},
    {id:"clients",icon:"👥",label:"Clients"},
    {id:"stock",icon:"📦",label:"Catalogue & Stock"},
    {id:"movements",icon:"📋",label:"Mouvements stock"},
    {id:"invoices",icon:"🧾",label:"Factures"},
    {id:"sales",icon:"💰",label:"Ventes"},
    {id:"trucks",icon:"🚛",label:"Camions"},
    {id:"reports",icon:"📈",label:"Rapports"},
    {id:"team",icon:"👥",label:"Équipe"},
    {id:"settings",icon:"⚙️",label:"Paramètres"},
    {id:"backup",icon:"💾",label:"Sauvegarde"},
  ];
  const secNav=[
    {id:"sec_home",icon:"🏠",label:"Accueil"},
    {id:"sec_sale",icon:"🛒",label:"Saisir une vente"},
    {id:"sec_invoice",icon:"🧾",label:"Créer une facture"},
    {id:"sec_trucks",icon:"🚛",label:"Pointer voyages"},
    {id:"sec_stock",icon:"📦",label:"Consulter stock"},
    {id:"sec_clients",icon:"👥",label:"Clients"},
  ];
  const nav=isOwner?ownerNav:secNav;
  const ctx={user,store:storeData,setStoreData,isOwner,notify};

  return(
    <div style={S.shell}>
      <aside style={S.sidebar}>
        <div style={{padding:"18px 12px 10px"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <span style={{fontSize:20}}>🏪</span>
            <span style={{fontWeight:900,fontSize:14,color:"#f59e0b",letterSpacing:1}}>Best-Quinca</span>
          </div>
          <div style={{background:"#1e293b",borderRadius:8,padding:"7px 10px",fontSize:12,fontWeight:700,color:"white"}}>{storeData?.name}</div>
          <div style={{fontSize:11,color:"#475569",paddingLeft:10,marginTop:2}}>{storeData?.city}</div>
        </div>
        <nav style={{flex:1,padding:"4px 8px",display:"flex",flexDirection:"column",gap:1,overflowY:"auto"}}>
          {nav.map(n=>(
            <button key={n.id} onClick={()=>setView(n.id)} style={{...S.navBtn,...(view===n.id?S.navActive:{})}}>
              <span style={{fontSize:14,width:18,textAlign:"center"}}>{n.icon}</span>
              <span style={{fontSize:11}}>{n.label}</span>
            </button>
          ))}
        </nav>
        <div style={{padding:10,borderTop:"1px solid #1e293b"}}>
          <div style={{...S.pill,background:isOnline?"#dcfce7":"#fef9c3",color:isOnline?"#14532d":"#713f12",marginBottom:8}}>
            {isOnline?"🟢 En ligne":"🟡 Hors ligne"}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:18}}>{isOwner?"👑":"👩‍💼"}</span>
            <div><div style={{fontSize:11,fontWeight:700,color:"#f1f5f9"}}>{user.fullName}</div>
              <div style={{fontSize:10,color:"#64748b"}}>{isOwner?"Propriétaire":"Secrétaire"}</div>
            </div>
          </div>
          <button style={{...S.btnGhost,width:"100%",fontSize:11,padding:"6px"}} onClick={logout}>Déconnexion</button>
        </div>
      </aside>
      <main style={{flex:1,padding:22,overflowY:"auto"}}>
        {isOwner&&<>
          {view==="dashboard"&&<Dashboard ctx={ctx}/>}
          {view==="clients"&&<Clients ctx={ctx}/>}
          {view==="stock"&&<StockMgr ctx={ctx}/>}
          {view==="movements"&&<Movements ctx={ctx}/>}
          {view==="invoices"&&<Invoices ctx={ctx}/>}
          {view==="sales"&&<SalesList ctx={ctx}/>}
          {view==="trucks"&&<Trucks ctx={ctx}/>}
          {view==="reports"&&<Reports ctx={ctx}/>}
          {view==="team"&&<Team ctx={ctx}/>}
          {view==="settings"&&<Settings ctx={ctx}/>}
          {view==="backup"&&<Backup ctx={ctx}/>}
        </>}
        {!isOwner&&<>
          {view==="sec_home"&&<SecHome ctx={ctx}/>}
          {view==="sec_sale"&&<SecSale ctx={ctx}/>}
          {view==="sec_invoice"&&<Invoices ctx={ctx}/>}
          {view==="sec_trucks"&&<SecTrucks ctx={ctx}/>}
          {view==="sec_stock"&&<SecStock ctx={ctx}/>}
          {view==="sec_clients"&&<Clients ctx={ctx} readOnly/>}
        </>}
      </main>
    </div>
  );
}

/* ─── DASHBOARD ──────────────────────────────────────────────── */
function Dashboard({ctx}){
  const[stats,setStats]=useState(null);const[mats,setMats]=useState([]);
  useEffect(()=>{api.salesStats().then(setStats).catch(()=>{});api.getMaterials().then(setMats).catch(()=>{});}, []);
  const low=mats.filter(m=>m.stock>0&&m.stock<=m.stock_min);
  const rupt=mats.filter(m=>m.stock<=0);
  return(
    <Pg title="📊 Tableau de bord">
      <div style={S.kpiGrid}>
        <Kpi label="CA du jour" value={curr(ctx.store,stats?.todayRevenue)} icon="💰" color="#16a34a"/>
        <Kpi label="dont Gros" value={curr(ctx.store,stats?.todayGros)} icon="📦" color="#7c3aed"/>
        <Kpi label="dont Détail" value={curr(ctx.store,stats?.todayDetail)} icon="🛒" color="#2563eb"/>
        <Kpi label="Ventes du jour" value={stats?.todayCount??0} icon="🧾" color="#d97706"/>
        <Kpi label="CA total cumulé" value={curr(ctx.store,stats?.totalRevenue)} icon="📈" color="#0891b2"/>
        <Kpi label="Produits" value={mats.length} icon="🏷️" color="#475569"/>
      </div>
      {rupt.length>0&&<Alrt color="#dc2626" bg="#fff1f2" border="#fca5a5" title={`🚨 ${rupt.length} rupture(s) de stock`}>{rupt.map(m=><AR key={m.id} name={m.name} label="RUPTURE" color="#dc2626"/>)}</Alrt>}
      {low.length>0&&<Alrt color="#d97706" bg="#fffbeb" border="#fcd34d" title={`⚠️ ${low.length} stock(s) faible`}>{low.map(m=><AR key={m.id} name={m.name} label={`${m.stock} ${m.unit_detail}`} color="#d97706"/>)}</Alrt>}
      {stats?.topProducts?.length>0&&<>
        <h3 style={{marginTop:22,marginBottom:10,fontSize:15}}>🏆 Top ventes</h3>
        <table style={S.tbl}><thead><tr>{["Produit","Qté","CA"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{stats.topProducts.map(p=><tr key={p.name}><td style={S.td}>{p.name}</td><td style={S.td}>{fmtN(p.tq)}</td><td style={S.td}><b style={{color:"#16a34a"}}>{curr(ctx.store,p.tc)}</b></td></tr>)}</tbody>
        </table>
      </>}
    </Pg>
  );
}

/* ─── CLIENTS ────────────────────────────────────────────────── */
function Clients({ctx,readOnly}){
  const[clients,setClients]=useState([]);const[q,setQ]=useState("");
  const[form,setForm]=useState({name:"",phone:"",email:"",address:"",client_type:"detail",note:""});
  const[editId,setEditId]=useState(null);const[showForm,setShowForm]=useState(false);const[detail,setDetail]=useState(null);
  const load=useCallback(()=>api.getClients(q).then(setClients).catch(()=>{}),[q]);
  useEffect(()=>{load();},[load]);
  async function save(){
    if(!form.name.trim()){ctx.notify("Nom obligatoire.","error");return;}
    try{editId?await api.updateClient(editId,form):await api.createClient(form);ctx.notify("✅ Client enregistré.","success");setShowForm(false);setEditId(null);load();}
    catch(e){ctx.notify(e.message,"error");}
  }
  async function del(id){if(!confirm("Supprimer ?"))return;try{await api.deleteClient(id);ctx.notify("Supprimé.","info");load();}catch(e){ctx.notify(e.message,"error");}}
  async function openDetail(id){try{setDetail(await api.getClient(id));}catch{}}
  function startEdit(c){setForm({name:c.name,phone:c.phone,email:c.email,address:c.address,client_type:c.client_type,note:c.note});setEditId(c.id);setShowForm(true);}
  return(
    <Pg title="👥 Gestion des Clients">
      <div style={S.bar}>
        <input style={{...S.inp,maxWidth:280}} placeholder="🔍 Rechercher un client..." value={q} onChange={e=>setQ(e.target.value)}/>
        {!readOnly&&<button style={S.btnPrimary} onClick={()=>{setForm({name:"",phone:"",email:"",address:"",client_type:"detail",note:""});setEditId(null);setShowForm(true);}}>+ Nouveau client</button>}
      </div>
      <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:9,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#1e40af"}}>
        ℹ️ Les <b>Grossistes</b> bénéficient automatiquement des prix Gros lors de la facturation. Les <b>VIP</b> ont accès à des conditions spéciales.
      </div>
      {showForm&&!readOnly&&<Modal title={editId?"Modifier client":"Nouveau client"} onClose={()=>{setShowForm(false);setEditId(null);}}>
        <Fld label="Nom *" value={form.name} onChange={v=>setForm({...form,name:v})} placeholder="M. Kouyaté Ibrahim"/>
        <Fld label="Téléphone" value={form.phone} onChange={v=>setForm({...form,phone:v})} placeholder="+225 07 00 00 00"/>
        <Fld label="Email" value={form.email} onChange={v=>setForm({...form,email:v})} type="email"/>
        <Fld label="Adresse" value={form.address} onChange={v=>setForm({...form,address:v})} placeholder="Quartier, Rue..."/>
        <div style={{marginBottom:12}}>
          <label style={S.lbl}>Type de client</label>
          <select style={S.inp} value={form.client_type} onChange={e=>setForm({...form,client_type:e.target.value})}>
            <option value="detail">Détaillant — achats au détail, prix unitaires</option>
            <option value="gros">Grossiste — achats en gros, prix grossiste</option>
            <option value="vip">VIP — client privilégié</option>
          </select>
        </div>
        <Fld label="Note" value={form.note} onChange={v=>setForm({...form,note:v})} placeholder="Informations supplémentaires..."/>
        <div style={S.mbtns}><button style={S.btnPrimary} onClick={save}>Enregistrer</button><button style={S.btnGhost} onClick={()=>{setShowForm(false);setEditId(null);}}>Annuler</button></div>
      </Modal>}
      {detail&&<Modal title={`Fiche — ${detail.name}`} onClose={()=>setDetail(null)} wide>
        <div style={{display:"flex",gap:12,marginBottom:14,flexWrap:"wrap"}}>
          <span style={{...S.chip,...(CLIENT_TYPES[detail.client_type]||{}),background:(CLIENT_TYPES[detail.client_type]?.color||"#64748b")+"20"}}>{CLIENT_TYPES[detail.client_type]?.label||detail.client_type}</span>
          {detail.phone&&<span>📞 {detail.phone}</span>}
          {detail.email&&<span>📧 {detail.email}</span>}
          {detail.address&&<span>📍 {detail.address}</span>}
        </div>
        <div style={S.kpiGrid}>
          <Kpi label="Achats" value={detail.sales?.length||0} icon="🧾" color="#2563eb"/>
          <Kpi label="CA total" value={curr(null,detail.totalCA)} icon="💰" color="#16a34a"/>
          <Kpi label="Factures" value={detail.invoices?.length||0} icon="📄" color="#7c3aed"/>
        </div>
        {detail.sales?.slice(0,8).length>0&&<table style={{...S.tbl,marginTop:12}}>
          <thead><tr>{["Date","Produit","Type","Qté","Total"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{detail.sales.slice(0,8).map(s=><tr key={s.id}>
            <td style={S.td}><small>{new Date(s.created_at).toLocaleDateString("fr-FR")}</small></td>
            <td style={S.td}>{s.mat_name}</td>
            <td style={S.td}><STypeBadge t={s.sale_type}/></td>
            <td style={S.td}>{s.qty}</td>
            <td style={S.td}><b style={{color:"#16a34a"}}>{fmtN(s.qty*s.unit_price)}</b></td>
          </tr>)}</tbody>
        </table>}
      </Modal>}
      {clients.length===0?<Empty icon="👥" title="Aucun client" sub={readOnly?"Aucun client enregistré.":'Cliquez sur "+ Nouveau client".'}/>
      :<table style={S.tbl}>
        <thead><tr>{["Nom","Type","Téléphone","Email","Actions"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{clients.map(c=><tr key={c.id}>
          <td style={S.td}><b style={{cursor:"pointer",color:"#1d4ed8"}} onClick={()=>openDetail(c.id)}>{c.name}</b></td>
          <td style={S.td}><span style={{...S.chip,background:(CLIENT_TYPES[c.client_type]?.color||"#64748b")+"20",color:CLIENT_TYPES[c.client_type]?.color||"#64748b"}}>{CLIENT_TYPES[c.client_type]?.label||c.client_type}</span></td>
          <td style={S.td}>{c.phone||"—"}</td><td style={S.td}>{c.email||"—"}</td>
          <td style={S.td}>
            <button style={S.bsm} onClick={()=>openDetail(c.id)}>👁️</button>
            {!readOnly&&<><button style={{...S.bsm,background:"#fef3c7",color:"#92400e",marginLeft:4}} onClick={()=>startEdit(c)}>✏️</button>
            <button style={{...S.bsm,background:"#fee2e2",color:"#dc2626",marginLeft:4}} onClick={()=>del(c.id)}>🗑️</button></>}
          </td>
        </tr>)}</tbody>
      </table>}
    </Pg>
  );
}

/* ─── STOCK ──────────────────────────────────────────────────── */
function StockMgr({ctx}){
  const[mats,setMats]=useState([]);const[search,setSearch]=useState("");
  const[showAdd,setShowAdd]=useState(false);const[editId,setEditId]=useState(null);
  const[form,setForm]=useState({name:"",category:"",unit_detail:"Unité",unit_gros:"Carton",price_detail:"",price_gros:"",qty_gros:"1",stock:"",stock_min:"10"});
  const UNITS=["Unité","Sac","Barre","m²","Pièce","Feuille","Bidon","Rouleau","Boîte","kg","Litre","Tonne","Mètre","Carton","Lot"];
  const load=()=>api.getMaterials().then(setMats).catch(()=>{});
  useEffect(()=>{load();},[]);
  const filtered=mats.filter(m=>m.name.toLowerCase().includes(search.toLowerCase())||(m.category||"").toLowerCase().includes(search.toLowerCase()));
  async function save(){
    if(!form.name.trim()){ctx.notify("Nom obligatoire.","error");return;}
    try{
      const d={...form,price_detail:Number(form.price_detail)||0,price_gros:Number(form.price_gros)||0,qty_gros:Number(form.qty_gros)||1,stock:Number(form.stock)||0,stock_min:Number(form.stock_min)||10};
      editId?await api.updateMaterial(editId,d):await api.createMaterial(d);
      ctx.notify("✅ Produit enregistré.","success");setShowAdd(false);setEditId(null);load();
    }catch(e){ctx.notify(e.message,"error");}
  }
  function startEdit(m){setForm({name:m.name,category:m.category,unit_detail:m.unit_detail,unit_gros:m.unit_gros,price_detail:String(m.price_detail),price_gros:String(m.price_gros),qty_gros:String(m.qty_gros),stock:String(m.stock),stock_min:String(m.stock_min)});setEditId(m.id);setShowAdd(true);}
  async function del(id){if(!confirm("Supprimer ?"))return;try{await api.deleteMaterial(id);ctx.notify("Supprimé.","info");load();}catch(e){ctx.notify(e.message,"error");}}
  return(
    <Pg title="📦 Catalogue & Stock (Gros / Détail)">
      <div style={S.bar}>
        <input style={{...S.inp,maxWidth:280}} placeholder="🔍 Produit ou catégorie..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <button style={S.btnPrimary} onClick={()=>{setForm({name:"",category:"",unit_detail:"Unité",unit_gros:"Carton",price_detail:"",price_gros:"",qty_gros:"1",stock:"",stock_min:"10"});setEditId(null);setShowAdd(true);}}>+ Nouveau produit</button>
      </div>
      {showAdd&&<Modal title={editId?"Modifier le produit":"Nouveau produit"} onClose={()=>{setShowAdd(false);setEditId(null);}} wide>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Nom *" value={form.name} onChange={v=>setForm({...form,name:v})} placeholder="Ex: Ciment Portland 50kg"/>
          <Fld label="Catégorie" value={form.category} onChange={v=>setForm({...form,category:v})} placeholder="Ciment, Fer, Bois..."/>
        </div>
        <div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:10,padding:14,marginBottom:12}}>
          <b style={{fontSize:13,color:"#14532d"}}>🛒 Vente au Détail</b>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:8}}>
            <div><label style={S.lbl}>Unité (détail)</label><select style={S.inp} value={form.unit_detail} onChange={e=>setForm({...form,unit_detail:e.target.value})}>{UNITS.map(u=><option key={u}>{u}</option>)}</select></div>
            <Fld label="Prix unitaire détail (FCFA) *" value={form.price_detail} onChange={v=>setForm({...form,price_detail:v})} type="number" placeholder="0"/>
          </div>
        </div>
        <div style={{background:"#f5f3ff",border:"1px solid #c4b5fd",borderRadius:10,padding:14,marginBottom:12}}>
          <b style={{fontSize:13,color:"#4c1d95"}}>📦 Vente en Gros</b>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginTop:8}}>
            <div><label style={S.lbl}>Unité (gros)</label><select style={S.inp} value={form.unit_gros} onChange={e=>setForm({...form,unit_gros:e.target.value})}>{UNITS.map(u=><option key={u}>{u}</option>)}</select></div>
            <Fld label="Prix gros (FCFA) *" value={form.price_gros} onChange={v=>setForm({...form,price_gros:v})} type="number" placeholder="0"/>
            <Fld label={`Qté ${form.unit_detail} / ${form.unit_gros}`} value={form.qty_gros} onChange={v=>setForm({...form,qty_gros:v})} type="number" placeholder="1"/>
          </div>
          <p style={{fontSize:11,color:"#7c3aed",marginTop:6}}>→ 1 {form.unit_gros||"lot"} = {form.qty_gros||1} {form.unit_detail||"unité"} · Éq. détail : {form.qty_gros&&form.price_gros?fmtN(Number(form.price_gros)/Number(form.qty_gros)):"—"} FCFA/{form.unit_detail||"unité"}</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Fld label="Stock actuel *" value={form.stock} onChange={v=>setForm({...form,stock:v})} type="number" placeholder="0"/>
          <Fld label="Seuil alerte" value={form.stock_min} onChange={v=>setForm({...form,stock_min:v})} type="number" placeholder="10"/>
        </div>
        <div style={S.mbtns}><button style={S.btnPrimary} onClick={save}>Enregistrer</button><button style={S.btnGhost} onClick={()=>{setShowAdd(false);setEditId(null);}}>Annuler</button></div>
      </Modal>}
      {mats.length===0?<Empty icon="📦" title="Catalogue vide" sub="Cliquez sur + Nouveau produit."/>
      :<table style={S.tbl}>
        <thead><tr>{["Produit","Catégorie","Stock","Prix Détail","Prix Gros","Unité Gros","Alerte",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{filtered.map(m=><tr key={m.id} style={{background:m.stock<=0?"#fff1f2":m.stock<=m.stock_min?"#fffbeb":"white"}}>
          <td style={S.td}><b>{m.name}</b>{m.category&&<span style={{...S.chip,marginLeft:6}}>{m.category}</span>}</td>
          <td style={S.td}>{m.category||"—"}</td>
          <td style={S.td}><span style={{fontWeight:700,color:m.stock<=0?"#dc2626":m.stock<=m.stock_min?"#d97706":"#16a34a"}}>{m.stock<=0?"Rupture":m.stock}</span> <small style={{color:"#94a3b8"}}>{m.unit_detail}</small></td>
          <td style={S.td}><span style={{...S.chip,background:"#dbeafe",color:"#1d4ed8"}}>{fmtN(m.price_detail)} /{m.unit_detail}</span></td>
          <td style={S.td}><span style={{...S.chip,background:"#ede9fe",color:"#7c3aed"}}>{fmtN(m.price_gros)} /{m.unit_gros}</span></td>
          <td style={S.td}><small style={{color:"#64748b"}}>1 {m.unit_gros} = {m.qty_gros} {m.unit_detail}</small></td>
          <td style={S.td}><small style={{color:"#94a3b8"}}>{m.stock_min}</small></td>
          <td style={S.td}>
            <button style={S.bsm} onClick={()=>startEdit(m)}>✏️</button>
            <button style={{...S.bsm,background:"#fee2e2",color:"#dc2626",marginLeft:4}} onClick={()=>del(m.id)}>🗑️</button>
          </td>
        </tr>)}</tbody>
      </table>}
    </Pg>
  );
}

/* ─── MOUVEMENTS ─────────────────────────────────────────────── */
function Movements({ctx}){
  const[mvts,setMvts]=useState([]);const[from,setFrom]=useState("");const[to,setTo]=useState("");const[type,setType]=useState("");
  useEffect(()=>{api.getMovements({from,to,type}).then(setMvts).catch(()=>{});},[from,to,type]);
  const TL={in:"Entrée",out:"Sortie",adjust:"Ajustement",sale:"Vente",return:"Retour"};
  const TC={in:"#16a34a",out:"#dc2626",adjust:"#7c3aed",sale:"#d97706",return:"#0891b2"};
  function exportCSV(){
    if(!mvts.length){ctx.notify("Aucune donnée.","error");return;}
    const rows=mvts.map(m=>[new Date(m.created_at).toLocaleString("fr-FR"),m.material_name,TL[m.type]||m.type,m.sale_type||"",m.qty,m.qty_before,m.qty_after,m.reason,m.created_by].join(";"));
    const csv=["Date;Produit;Type;Mode vente;Qté;Avant;Après;Motif;Par",...rows].join("\n");
    const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"})),download:"mouvements_stock.csv"});
    a.click();ctx.notify("✅ Export CSV effectué.","success");
  }
  return(
    <Pg title="📋 Historique des Mouvements de Stock">
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"flex-end"}}>
        <div><label style={S.lbl}>Du</label><input style={{...S.inp,width:150}} type="date" value={from} onChange={e=>setFrom(e.target.value)}/></div>
        <div><label style={S.lbl}>Au</label><input style={{...S.inp,width:150}} type="date" value={to} onChange={e=>setTo(e.target.value)}/></div>
        <div><label style={S.lbl}>Type</label><select style={{...S.inp,width:140}} value={type} onChange={e=>setType(e.target.value)}><option value="">Tous</option>{Object.entries(TL).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
        <button style={S.btnGhost} onClick={()=>{setFrom("");setTo("");setType("");}}>Réinitialiser</button>
        <button style={S.btnPrimary} onClick={exportCSV}>📥 Export CSV</button>
      </div>
      {mvts.length===0?<Empty icon="📋" title="Aucun mouvement" sub="Les mouvements apparaîtront ici."/>
      :<table style={S.tbl}><thead><tr>{["Date","Produit","Type","Mode","Qté","Avant","Après","Motif","Par"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{mvts.map(m=><tr key={m.id}>
          <td style={S.td}><small>{new Date(m.created_at).toLocaleString("fr-FR")}</small></td>
          <td style={S.td}><b>{m.material_name}</b></td>
          <td style={S.td}><span style={{...S.chip,background:(TC[m.type]||"#64748b")+"20",color:TC[m.type]||"#64748b"}}>{TL[m.type]||m.type}</span></td>
          <td style={S.td}>{m.sale_type&&<STypeBadge t={m.sale_type}/>}</td>
          <td style={S.td}><b style={{color:TC[m.type]}}>{["out","sale"].includes(m.type)?"-":"+"}{m.qty}</b></td>
          <td style={S.td}><small>{m.qty_before}</small></td>
          <td style={S.td}><small>{m.qty_after}</small></td>
          <td style={S.td}><small style={{color:"#64748b"}}>{m.reason||"—"}</small></td>
          <td style={S.td}><small style={{color:"#94a3b8"}}>{m.created_by}</small></td>
        </tr>)}</tbody>
      </table>}
    </Pg>
  );
}

/* ─── INVOICES ───────────────────────────────────────────────── */
function Invoices({ctx}){
  const[invoices,setInvoices]=useState([]);const[mats,setMats]=useState([]);const[clients,setClients]=useState([]);
  const[showCreate,setShowCreate]=useState(false);const[printInv,setPrintInv]=useState(null);const[statusF,setStatusF]=useState("");
  const reload=()=>api.getInvoices(statusF?{status:statusF}:{}).then(setInvoices).catch(()=>{});
  useEffect(()=>{reload();api.getMaterials().then(setMats).catch(()=>{});api.getClients().then(setClients).catch(()=>{});},[statusF]);
  const SL={draft:"Brouillon",paid:"Payée",cancelled:"Annulée"};const SC={draft:"#d97706",paid:"#16a34a",cancelled:"#dc2626"};
  async function changeStatus(id,s){try{await api.updateInvoiceStatus(id,s);ctx.notify("Statut mis à jour.","success");reload();}catch(e){ctx.notify(e.message,"error");}}
  async function openPrint(id){try{const d=await api.getInvoice(id);setPrintInv(d);}catch(e){ctx.notify(e.message,"error");}}
  async function del(id){if(!confirm("Supprimer ?"))return;try{await api.deleteInvoice(id);ctx.notify("Supprimée.","info");reload();}catch(e){ctx.notify(e.message,"error");}}
  return(
    <Pg title="🧾 Factures">
      <div style={S.bar}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["","draft","paid","cancelled"].map(s=><button key={s} style={{...S.btnGhost,fontSize:12,padding:"6px 12px",...(statusF===s?{background:"#1e3a5f",color:"white",border:"none"}:{})}} onClick={()=>setStatusF(s)}>{s===""?"Toutes":SL[s]}</button>)}
        </div>
        <button style={S.btnPrimary} onClick={()=>setShowCreate(true)}>+ Nouvelle facture</button>
      </div>
      {showCreate&&<CreateInvoice ctx={ctx} mats={mats} clients={clients} onClose={()=>setShowCreate(false)} onDone={()=>{setShowCreate(false);reload();}}/>}
      {printInv&&<PrintInvoice inv={printInv} store={ctx.store} onClose={()=>setPrintInv(null)}/>}
      {invoices.length===0?<Empty icon="🧾" title="Aucune facture" sub="Cliquez sur + Nouvelle facture."/>
      :<table style={S.tbl}><thead><tr>{["N° Facture","Date","Client","Type","Total TTC","Statut","Actions"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{invoices.map(inv=><tr key={inv.id}>
          <td style={S.td}><code style={S.ref}>{inv.invoice_num}</code></td>
          <td style={S.td}><small>{new Date(inv.created_at).toLocaleDateString("fr-FR")}</small></td>
          <td style={S.td}>{inv.client_name||"—"}</td>
          <td style={S.td}><STypeBadge t={inv.sale_type}/></td>
          <td style={S.td}><b style={{color:"#16a34a"}}>{curr(ctx.store,inv.total_ttc)}</b></td>
          <td style={S.td}><select style={{...S.chip,background:SC[inv.status]+"20",color:SC[inv.status],border:"none",cursor:"pointer",padding:"3px 8px"}} value={inv.status} onChange={e=>changeStatus(inv.id,e.target.value)}>{Object.entries(SL).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></td>
          <td style={S.td}>
            <button style={S.bsm} onClick={()=>openPrint(inv.id)}>🖨️ Imprimer</button>
            {ctx.isOwner&&<button style={{...S.bsm,background:"#fee2e2",color:"#dc2626",marginLeft:4}} onClick={()=>del(inv.id)}>🗑️</button>}
          </td>
        </tr>)}</tbody>
      </table>}
    </Pg>
  );
}

/* ─── CREATE INVOICE ─────────────────────────────────────────── */
function CreateInvoice({ctx,mats,clients,onClose,onDone}){
  const[clientId,setClientId]=useState("");const[clientName,setClientName]=useState("");
  const[clientPhone,setClientPhone]=useState("");const[clientAddress,setClientAddress]=useState("");
  const[lines,setLines]=useState([{materialId:"",description:"",sale_type:"detail",qty:"1",unit:"Unité",unit_price:""}]);
  const[discount,setDiscount]=useState("0");const[note,setNote]=useState("");
  const[deductStock,setDeductStock]=useState(true);const[loading,setLoading]=useState(false);
  const totalHT=lines.reduce((a,l)=>a+Number(l.qty||0)*Number(l.unit_price||0),0);
  const totalTTC=Math.max(0,totalHT-Number(discount||0));
  function selectClient(id){
    setClientId(id);
    const c=clients.find(x=>x.id===id);
    if(c){setClientName(c.name);setClientPhone(c.phone||"");setClientAddress(c.address||"");
      // Auto-set type selon client_type
      if(c.client_type==="gros") setLines(ls=>ls.map(l=>({...l,sale_type:"gros"})));
    }
  }
  function updateLine(i,k,v){
    const u=[...lines];u[i]={...u[i],[k]:v};
    if(k==="materialId"&&v){
      const m=mats.find(x=>x.id===v);
      if(m){
        const st=u[i].sale_type||"detail";
        u[i].description=m.name;u[i].unit=st==="gros"?m.unit_gros:m.unit_detail;
        u[i].unit_price=String(st==="gros"?m.price_gros:m.price_detail);
      }
    }
    if(k==="sale_type"&&u[i].materialId){
      const m=mats.find(x=>x.id===u[i].materialId);
      if(m){u[i].unit=v==="gros"?m.unit_gros:m.unit_detail;u[i].unit_price=String(v==="gros"?m.price_gros:m.price_detail);}
    }
    setLines(u);
  }
  async function submit(){
    if(lines.some(l=>!l.description.trim()||!l.qty||!l.unit_price)){ctx.notify("Remplissez toutes les lignes.","error");return;}
    setLoading(true);
    try{
      await api.createInvoice({clientId:clientId||null,clientName,clientPhone,clientAddress,lines:lines.map(l=>({...l,qty:Number(l.qty),unit_price:Number(l.unit_price)})),discount:Number(discount||0),note,deductStock});
      ctx.notify("✅ Facture créée.","success");onDone();
    }catch(e){ctx.notify(e.message,"error");}
    setLoading(false);
  }
  return(
    <Modal title="Nouvelle Facture" onClose={onClose} wide>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>
        <div><label style={S.lbl}>Client (liste)</label>
          <select style={S.inp} value={clientId} onChange={e=>selectClient(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {clients.map(c=><option key={c.id} value={c.id}>{c.name} ({CLIENT_TYPES[c.client_type]?.label||c.client_type})</option>)}
          </select>
        </div>
        <Fld label="Nom client (libre)" value={clientName} onChange={setClientName} placeholder="Client comptoir..."/>
        <Fld label="Téléphone client" value={clientPhone} onChange={setClientPhone} placeholder="+225..."/>
      </div>
      <Fld label="Adresse client (optionnel)" value={clientAddress} onChange={setClientAddress} placeholder="Quartier, rue..."/>
      <div style={{background:"#f8fafc",borderRadius:10,padding:14,marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <b style={{fontSize:14}}>Lignes de la facture</b>
          <button style={{...S.btnGhost,fontSize:12,padding:"4px 10px"}} onClick={()=>setLines([...lines,{materialId:"",description:"",sale_type:"detail",qty:"1",unit:"Unité",unit_price:""}])}>+ Ligne</button>
        </div>
        {lines.map((l,i)=><div key={i} style={{background:"white",borderRadius:8,padding:10,marginBottom:8,border:"1px solid #e2e8f0"}}>
          <div style={{display:"grid",gridTemplateColumns:"180px 1fr 120px auto",gap:8,alignItems:"flex-end",marginBottom:8}}>
            <div><label style={{...S.lbl,fontSize:10}}>Produit</label>
              <select style={S.inp} value={l.materialId} onChange={e=>updateLine(i,"materialId",e.target.value)}>
                <option value="">— Libre —</option>
                {mats.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div><label style={{...S.lbl,fontSize:10}}>Description *</label><input style={S.inp} value={l.description} onChange={e=>updateLine(i,"description",e.target.value)} placeholder="Description..."/></div>
            <div><label style={{...S.lbl,fontSize:10}}>Type</label>
              <select style={{...S.inp,background:l.sale_type==="gros"?"#f5f3ff":"#eff6ff",color:l.sale_type==="gros"?"#7c3aed":"#1d4ed8",fontWeight:700}} value={l.sale_type} onChange={e=>updateLine(i,"sale_type",e.target.value)}>
                <option value="detail">🛒 Détail</option><option value="gros">📦 Gros</option>
              </select>
            </div>
            <button style={{...S.bsm,background:"#fee2e2",color:"#dc2626",padding:"8px 10px"}} onClick={()=>setLines(lines.filter((_,j)=>j!==i))}>✕</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"100px 120px 120px 1fr",gap:8,alignItems:"flex-end"}}>
            <Fld label="Qté *" value={l.qty} onChange={v=>updateLine(i,"qty",v)} type="number"/>
            <Fld label="Unité" value={l.unit} onChange={v=>updateLine(i,"unit",v)} placeholder="Unité"/>
            <Fld label="Prix unit. *" value={l.unit_price} onChange={v=>updateLine(i,"unit_price",v)} type="number"/>
            <div style={{paddingBottom:2,color:"#16a34a",fontWeight:700,fontSize:14,textAlign:"right"}}>= {fmtN(Number(l.qty||0)*Number(l.unit_price||0))}</div>
          </div>
        </div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <Fld label="Remise (FCFA)" value={discount} onChange={setDiscount} type="number" placeholder="0"/>
        <Fld label="Note / Observation" value={note} onChange={setNote} placeholder="Optionnel..."/>
      </div>
      <label style={S.chk}><input type="checkbox" checked={deductStock} onChange={e=>setDeductStock(e.target.checked)}/><span>Déduire automatiquement du stock</span></label>
      <div style={{background:"#f8fafc",borderRadius:10,padding:14,marginTop:12,marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:13}}><span>Total HT</span><b>{curr(ctx.store,totalHT)}</b></div>
        {Number(discount)>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#dc2626"}}><span>Remise</span><span>- {curr(ctx.store,Number(discount))}</span></div>}
        <div style={{display:"flex",justifyContent:"space-between",fontSize:17,fontWeight:800,color:"#16a34a",borderTop:"1px solid #e2e8f0",paddingTop:8,marginTop:6}}><span>TOTAL TTC</span><span>{curr(ctx.store,totalTTC)}</span></div>
      </div>
      <div style={S.mbtns}><button style={S.btnPrimary} onClick={submit} disabled={loading}>{loading?"Création...":"Créer la facture"}</button><button style={S.btnGhost} onClick={onClose}>Annuler</button></div>
    </Modal>
  );
}

/* ─── PRINT INVOICE ──────────────────────────────────────────── */
function PrintInvoice({inv,store,onClose}){
  function doPrint(){
    const w=window.open("","_blank","width=900,height=1000");
    const logo=store?.logo_base64?`<img src="${store.logo_base64}" style="height:80px;max-width:180px;object-fit:contain;"/>`:LOGO_FAC?`<img src="${LOGO_FAC}" style="height:80px;max-width:200px;object-fit:contain;"/>`:`<div style="font-size:24px;font-weight:900;color:#1e3a5f;">${store?.name||"Best-Quinca"}</div>`;
    const SL={draft:"BROUILLON",paid:"PAYÉE",cancelled:"ANNULÉE"};const SC={draft:"#d97706",paid:"#16a34a",cancelled:"#dc2626"};
    const linesH=inv.lines?.map(l=>`<tr><td style="padding:9px 12px;border-bottom:1px solid #f0f0f0">${l.description}</td>
      <td style="padding:9px 12px;text-align:center;border-bottom:1px solid #f0f0f0;font-size:11px;background:${l.sale_type==="gros"?"#f5f3ff":"#eff6ff"};color:${l.sale_type==="gros"?"#7c3aed":"#1d4ed8"};font-weight:700">${l.sale_type==="gros"?"GROS":"DÉTAIL"}</td>
      <td style="padding:9px 12px;text-align:right;border-bottom:1px solid #f0f0f0">${l.qty} ${l.unit||""}</td>
      <td style="padding:9px 12px;text-align:right;border-bottom:1px solid #f0f0f0">${Number(l.unit_price).toLocaleString("fr-FR")}</td>
      <td style="padding:9px 12px;text-align:right;font-weight:700;border-bottom:1px solid #f0f0f0">${Number(l.total).toLocaleString("fr-FR")}</td></tr>`).join("")||"";
    w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>${inv.invoice_num}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;padding:32px}@media print{body{padding:16px}.noprint{display:none!important}}</style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;padding-bottom:20px;border-bottom:3px solid #1e3a5f">
      <div>${logo}<div style="margin-top:10px;font-size:12px;color:#64748b;line-height:1.7">${store?.address||""}<br/>${store?.city||""}<br/>${store?.phone?"Tél: "+store.phone:""}<br/>${store?.email?"Email: "+store.email:""}</div></div>
      <div style="text-align:right">
        <div style="font-size:30px;font-weight:900;color:#1e3a5f;letter-spacing:1px">FACTURE</div>
        <div style="font-size:17px;color:#64748b;margin-top:4px;font-weight:600">${inv.invoice_num}</div>
        <div style="font-size:12px;color:#94a3b8;margin-top:4px">Date : ${new Date(inv.created_at).toLocaleDateString("fr-FR")}</div>
        <div style="display:inline-block;background:${SC[inv.status]};color:white;padding:5px 14px;border-radius:20px;font-size:11px;font-weight:700;margin-top:8px">${SL[inv.status]}</div>
        <div style="font-size:11px;margin-top:6px;color:#94a3b8">Type : ${inv.sale_type==="gros"?"VENTE EN GROS":inv.sale_type==="mixte"?"GROS & DÉTAIL":"VENTE AU DÉTAIL"}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
      <div style="background:#f8fafc;border-radius:10px;padding:16px">
        <div style="font-size:10px;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;font-weight:700;letter-spacing:1px">Facturé à</div>
        <div style="font-weight:800;font-size:16px">${inv.client_name||"Client comptoir"}</div>
        ${inv.client_phone||inv.c_phone?`<div style="font-size:12px;color:#64748b;margin-top:4px">Tél: ${inv.client_phone||inv.c_phone}</div>`:""}
        ${inv.client_address||inv.c_address?`<div style="font-size:12px;color:#64748b">${inv.client_address||inv.c_address}</div>`:""}
      </div>
      <div style="background:#f8fafc;border-radius:10px;padding:16px">
        <div style="font-size:10px;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;font-weight:700;letter-spacing:1px">Émise par</div>
        <div style="font-weight:700;font-size:15px">${inv.created_by}</div>
        <div style="font-size:12px;color:#64748b;margin-top:3px">${store?.name||""}</div>
        ${inv.paid_at?`<div style="font-size:12px;color:#16a34a;margin-top:4px;font-weight:600">✅ Payée le ${new Date(inv.paid_at).toLocaleDateString("fr-FR")}</div>`:""}
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      <thead><tr style="background:#1e3a5f;color:white">
        <th style="padding:10px 12px;text-align:left;font-size:12px">Description</th>
        <th style="padding:10px 12px;text-align:center;font-size:12px">Type</th>
        <th style="padding:10px 12px;text-align:right;font-size:12px">Quantité</th>
        <th style="padding:10px 12px;text-align:right;font-size:12px">Prix Unit. (${store?.currency||"FCFA"})</th>
        <th style="padding:10px 12px;text-align:right;font-size:12px">Total (${store?.currency||"FCFA"})</th>
      </tr></thead><tbody>${linesH}</tbody>
    </table>
    <div style="display:flex;justify-content:flex-end;margin-bottom:24px">
      <div style="min-width:260px">
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px"><span>Total HT</span><b>${Number(inv.total_ht).toLocaleString("fr-FR")} ${store?.currency||"FCFA"}</b></div>
        ${Number(inv.discount)>0?`<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#dc2626"><span>Remise</span><span>- ${Number(inv.discount).toLocaleString("fr-FR")} ${store?.currency||"FCFA"}</span></div>`:""}
        <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:20px;font-weight:900;border-top:2px solid #1e3a5f;margin-top:4px;color:#16a34a"><span>TOTAL TTC</span><span>${Number(inv.total_ttc).toLocaleString("fr-FR")} ${store?.currency||"FCFA"}</span></div>
      </div>
    </div>
    ${inv.note?`<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:12px;font-size:13px;margin-bottom:20px"><b>Note :</b> ${inv.note}</div>`:""}
    <div style="margin-top:44px;border-top:1px solid #e2e8f0;padding-top:18px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px">
      <div style="font-size:11px;color:#94a3b8"><b>${store?.name||""}</b><br/>${store?.city||""}<br/>${store?.phone||""}<br/>Document généré par Best-Quinca</div>
      <div style="text-align:center"><div style="font-size:11px;color:#64748b;margin-bottom:30px">Signature Client</div><div style="border-top:1px solid #94a3b8;width:160px;margin:0 auto"></div></div>
      <div style="text-align:right"><div style="font-size:11px;color:#64748b;margin-bottom:30px">Signature & Cachet</div><div style="border-top:1px solid #94a3b8;width:160px;margin-left:auto"></div></div>
    </div>
    <div class="noprint" style="text-align:center;margin-top:32px">
      <button onclick="window.print()" style="background:#1e3a5f;color:white;border:none;padding:13px 32px;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer">🖨️ Imprimer / Enregistrer PDF</button>
      <button onclick="window.close()" style="background:#e2e8f0;color:#475569;border:none;padding:13px 22px;border-radius:8px;font-size:14px;cursor:pointer;margin-left:12px">Fermer</button>
    </div></body></html>`);
    w.document.close();
  }
  return(
    <Modal title={`Aperçu — ${inv.invoice_num}`} onClose={onClose} wide>
      <div style={{background:"#f8fafc",borderRadius:10,padding:14,marginBottom:14,fontSize:13}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
          <span><b>Client :</b> {inv.client_name||"—"}</span>
          <span><b>Date :</b> {new Date(inv.created_at).toLocaleDateString("fr-FR")}</span>
          <STypeBadge t={inv.sale_type}/>
        </div>
        <table style={S.tbl}><thead><tr>{["Description","Type","Qté","Prix unit.","Total"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{inv.lines?.map(l=><tr key={l.id}>
            <td style={S.td}>{l.description}</td>
            <td style={S.td}><STypeBadge t={l.sale_type}/></td>
            <td style={S.td}>{l.qty} {l.unit}</td>
            <td style={S.td}>{curr(ctx?.store||inv.store,l.unit_price)}</td>
            <td style={S.td}><b style={{color:"#16a34a"}}>{curr(ctx?.store||inv.store,l.total)}</b></td>
          </tr>)}</tbody>
        </table>
        <div style={{textAlign:"right",marginTop:10}}>
          {Number(inv.discount)>0&&<div style={{fontSize:12,color:"#dc2626"}}>Remise : -{curr(ctx?.store||inv.store,inv.discount)}</div>}
          <div style={{fontSize:16,fontWeight:800,color:"#16a34a"}}>Total TTC : {curr(ctx?.store||inv.store,inv.total_ttc)}</div>
        </div>
        <div style={{marginTop:8,fontSize:12,color:"#64748b"}}><b>Délivré par :</b> {inv.created_by}</div>
      </div>
      <button style={{...S.btnPrimary,width:"100%"}} onClick={doPrint}>🖨️ Ouvrir l'aperçu & Imprimer / PDF</button>
    </Modal>
  );
}

/* ─── SALES LIST ─────────────────────────────────────────────── */
function SalesList({ctx}){
  const[sales,setSales]=useState([]);const[from,setFrom]=useState("");const[to,setTo]=useState("");
  const load=()=>api.getSales(from||to?{from,to}:undefined).then(setSales).catch(()=>{});
  useEffect(()=>{load();},[from,to]);
  const total=sales.reduce((a,s)=>a+s.qty*s.unit_price,0);
  const totGros=sales.filter(s=>s.sale_type==="gros").reduce((a,s)=>a+s.qty*s.unit_price,0);
  const totDetail=sales.filter(s=>s.sale_type==="detail").reduce((a,s)=>a+s.qty*s.unit_price,0);
  async function del(id){if(!confirm("Supprimer ? Le stock sera restitué."))return;try{await api.deleteSale(id);ctx.notify("Supprimée.","info");load();}catch(e){ctx.notify(e.message,"error");}}
  return(
    <Pg title="💰 Historique des Ventes">
      <div style={S.bar}>
        <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
          <div><label style={S.lbl}>Du</label><input style={{...S.inp,width:148}} type="date" value={from} onChange={e=>setFrom(e.target.value)}/></div>
          <div><label style={S.lbl}>Au</label><input style={{...S.inp,width:148}} type="date" value={to} onChange={e=>setTo(e.target.value)}/></div>
          <button style={S.btnGhost} onClick={()=>{setFrom("");setTo("");}}>Tout</button>
        </div>
      </div>
      <div style={S.kpiGrid}>
        <Kpi label="CA total (période)" value={curr(ctx.store,total)} icon="💰" color="#16a34a"/>
        <Kpi label="CA Gros" value={curr(ctx.store,totGros)} icon="📦" color="#7c3aed"/>
        <Kpi label="CA Détail" value={curr(ctx.store,totDetail)} icon="🛒" color="#2563eb"/>
        <Kpi label="Nb ventes" value={sales.length} icon="🧾" color="#d97706"/>
      </div>
      {sales.length===0?<Empty icon="💰" title="Aucune vente" sub="Les ventes apparaîtront ici."/>
      :<table style={S.tbl}><thead><tr>{["Réf.","Date","Produit","Type","Qté","Prix unit.","Total","Client","Par",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{sales.map(s=><tr key={s.id}>
          <td style={S.td}><code style={S.ref}>{s.id.slice(0,8).toUpperCase()}</code></td>
          <td style={S.td}><small>{new Date(s.created_at).toLocaleString("fr-FR")}</small></td>
          <td style={S.td}>{s.material_name}</td>
          <td style={S.td}><STypeBadge t={s.sale_type}/></td>
          <td style={S.td}>{s.qty} <small style={{color:"#94a3b8"}}>{s.sale_type==="gros"?s.unit_gros:s.unit_detail}</small></td>
          <td style={S.td}>{curr(ctx.store,s.unit_price)}</td>
          <td style={S.td}><b style={{color:"#16a34a"}}>{curr(ctx.store,s.qty*s.unit_price)}</b></td>
          <td style={S.td}>{s.client_name_ref||s.client||"—"}</td>
          <td style={S.td}><small style={{color:"#94a3b8"}}>{s.created_by}</small></td>
          <td style={S.td}><button style={{...S.bsm,background:"#fee2e2",color:"#dc2626"}} onClick={()=>del(s.id)}>🗑️</button></td>
        </tr>)}</tbody>
      </table>}
    </Pg>
  );
}

/* ─── TRUCKS ─────────────────────────────────────────────────── */
function Trucks({ctx}){
  const[trucks,setTrucks]=useState([]);const[logs,setLogs]=useState([]);
  const[dateV,setDateV]=useState(todayStr());const[showAdd,setShowAdd]=useState(false);
  const[form,setForm]=useState({name:"",driver:""});const[trips,setTrips]=useState({});const[notes,setNotes]=useState({});
  const loadT=()=>api.getTrucks().then(setTrucks).catch(()=>{});
  const loadL=()=>api.getLogs(dateV).then(setLogs).catch(()=>{});
  useEffect(()=>{loadT();},[]);useEffect(()=>{loadL();},[dateV]);
  const getLog=tid=>logs.find(l=>l.truck_id===tid);
  async function addTruck(){if(!form.name.trim()||!form.driver.trim()){ctx.notify("Nom et chauffeur requis.","error");return;}try{await api.createTruck(form);ctx.notify("✅ Camion ajouté.","success");setShowAdd(false);setForm({name:"",driver:""});loadT();}catch(e){ctx.notify(e.message,"error");}}
  async function pointer(tid){const t=Number(trips[tid]||0);if(t<1){ctx.notify("Voyages invalide.","error");return;}try{await api.postLog({truckId:tid,date:dateV,trips:t,note:notes[tid]||""});ctx.notify("✅ Pointé.","success");setTrips({...trips,[tid]:""});loadL();}catch(e){ctx.notify(e.message,"error");}}
  return(
    <Pg title="🚛 Camions Logistiques">
      <div style={S.bar}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <label style={S.lbl}>Date :</label>
          <input style={{...S.inp,width:160}} type="date" value={dateV} onChange={e=>setDateV(e.target.value)} max={todayStr()}/>
          <span style={{fontSize:13,color:"#d97706",fontWeight:700}}>Total : {logs.reduce((a,b)=>a+b.trips,0)} voyages</span>
        </div>
        <button style={S.btnPrimary} onClick={()=>setShowAdd(true)}>+ Ajouter un camion</button>
      </div>
      {showAdd&&<Modal title="Nouveau camion" onClose={()=>setShowAdd(false)}>
        <Fld label="Nom & immatriculation *" value={form.name} onChange={v=>setForm({...form,name:v})} placeholder="Camion Alpha — BN 456 AB"/>
        <Fld label="Chauffeur *" value={form.driver} onChange={v=>setForm({...form,driver:v})} placeholder="Nom du chauffeur"/>
        <div style={S.mbtns}><button style={S.btnPrimary} onClick={addTruck}>Enregistrer</button><button style={S.btnGhost} onClick={()=>setShowAdd(false)}>Annuler</button></div>
      </Modal>}
      {trucks.length===0?<Empty icon="🚛" title="Aucun camion" sub='Cliquez sur "+ Ajouter un camion".'/>
      :<div style={{display:"grid",gap:12}}>
        {trucks.filter(t=>t.active).map(truck=>{
          const log=getLog(truck.id);
          return<div key={truck.id} style={{background:"white",borderRadius:12,padding:18,boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div><div style={{fontWeight:700,fontSize:16}}>🚛 {truck.name}</div><div style={{fontSize:13,color:"#64748b"}}>👤 {truck.driver}</div></div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {log&&<span style={{background:"#d97706",color:"white",padding:"4px 14px",borderRadius:20,fontWeight:800,fontSize:14}}>{log.trips} voyage{log.trips>1?"s":""}</span>}
                <button style={{...S.btnGhost,fontSize:11,padding:"3px 8px"}} onClick={()=>api.updateTruck(truck.id,{...truck,active:false}).then(loadT)}>Désactiver</button>
              </div>
            </div>
            {log?<div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:8,padding:12,marginTop:12,fontSize:13}}>
                <div>✅ <b>{log.trips} voyage(s)</b>{log.note?` — ${log.note}`:""}</div>
                <div style={{fontSize:11,color:"#64748b"}}>Par {log.created_by} · {new Date(log.created_at).toLocaleTimeString("fr-FR")}</div>
                <div style={{display:"flex",gap:8,marginTop:8}}>
                  <input style={{...S.inp,width:100}} type="number" min="1" placeholder="Corriger..." value={trips[truck.id]||""} onChange={e=>setTrips({...trips,[truck.id]:e.target.value})}/>
                  <button style={{background:"#fef3c7",color:"#92400e",border:"none",borderRadius:6,padding:"6px 12px",cursor:"pointer",fontSize:12}} onClick={()=>pointer(truck.id)}>Modifier</button>
                </div>
              </div>
              :<div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
                <input style={{...S.inp,width:120}} type="number" min="1" placeholder="Nb voyages" value={trips[truck.id]||""} onChange={e=>setTrips({...trips,[truck.id]:e.target.value})}/>
                <input style={{...S.inp,flex:1,minWidth:150}} placeholder="Observation (optionnel)" value={notes[truck.id]||""} onChange={e=>setNotes({...notes,[truck.id]:e.target.value})}/>
                <button style={S.btnPrimary} onClick={()=>pointer(truck.id)}>📍 Pointer</button>
              </div>}
          </div>;
        })}
      </div>}
    </Pg>
  );
}

/* ─── REPORTS ────────────────────────────────────────────────── */
function Reports({ctx}){
  const[from,setFrom]=useState("");const[to,setTo]=useState("");
  const[stats,setStats]=useState(null);const[sales,setSales]=useState([]);const[logs,setLogs]=useState([]);
  useEffect(()=>{api.salesStats().then(setStats).catch(()=>{});api.getSales(from||to?{from,to}:undefined).then(setSales).catch(()=>{});api.getLogs().then(setLogs).catch(()=>{});},[from,to]);
  const inR=d=>{if(from&&d<from)return false;if(to&&d>to)return false;return true;};
  const fS=sales.filter(s=>inR(s.created_at?.split("T")[0]||""));
  const fL=logs.filter(l=>inR(l.date||""));
  const tot=fS.reduce((a,s)=>a+s.qty*s.unit_price,0);
  const totG=fS.filter(s=>s.sale_type==="gros").reduce((a,s)=>a+s.qty*s.unit_price,0);
  const totD=fS.filter(s=>s.sale_type==="detail").reduce((a,s)=>a+s.qty*s.unit_price,0);
  function csv(data,fname){if(!data.length){ctx.notify("Aucune donnée.","error");return;}const h=Object.keys(data[0]);const rows=data.map(r=>h.map(k=>`"${String(r[k]??"")}"`).join(","));const blob=new Blob(["\uFEFF",[h.join(","),...rows].join("\n")],{type:"text/csv;charset=utf-8"});const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(blob),download:fname});a.click();ctx.notify("✅ Export CSV prêt.","success");}
  const csvS=fS.map(s=>({"Référence":s.id.slice(0,8).toUpperCase(),"Date":new Date(s.created_at).toLocaleString("fr-FR"),"Produit":s.material_name,"Catégorie":s.category||"","Type vente":s.sale_type==="gros"?"Gros":"Détail","Quantité":s.qty,"Prix Unitaire":s.unit_price,"Total":s.qty*s.unit_price,"Client":s.client_name_ref||s.client||"","Par":s.created_by}));
  const csvL=fL.map(l=>({"Date":l.date,"Camion":l.truck_name,"Chauffeur":l.driver,"Voyages":l.trips,"Note":l.note||"","Par":l.created_by}));
  return(
    <Pg title="📈 Rapports & Exports">
      <div style={{display:"flex",gap:10,marginBottom:22,flexWrap:"wrap",alignItems:"flex-end"}}>
        <div><label style={S.lbl}>Du</label><input style={{...S.inp,width:148}} type="date" value={from} onChange={e=>setFrom(e.target.value)}/></div>
        <div><label style={S.lbl}>Au</label><input style={{...S.inp,width:148}} type="date" value={to} onChange={e=>setTo(e.target.value)}/></div>
        <button style={S.btnGhost} onClick={()=>{setFrom("");setTo("");}}>Tout afficher</button>
      </div>
      <div style={S.kpiGrid}>
        <Kpi label="CA total (période)" value={curr(ctx.store,tot)} icon="💰" color="#16a34a"/>
        <Kpi label="CA Gros" value={curr(ctx.store,totG)} icon="📦" color="#7c3aed"/>
        <Kpi label="CA Détail" value={curr(ctx.store,totD)} icon="🛒" color="#2563eb"/>
        <Kpi label="Voyages camions" value={fL.reduce((a,b)=>a+b.trips,0)} icon="🚛" color="#d97706"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginTop:20}}>
        <div style={{background:"white",borderRadius:12,padding:22,boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
          <h3 style={{margin:"0 0 8px"}}>📊 Ventes (Gros + Détail)</h3>
          <p style={{color:"#64748b",fontSize:13,margin:"0 0 14px"}}>{fS.length} vente(s) · {curr(ctx.store,tot)}</p>
          <button style={S.btnPrimary} onClick={()=>csv(csvS,`ventes_${from||"tout"}_${to||"tout"}.csv`)}>📥 Export CSV (Excel)</button>
        </div>
        <div style={{background:"white",borderRadius:12,padding:22,boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
          <h3 style={{margin:"0 0 8px"}}>🚛 Logistique</h3>
          <p style={{color:"#64748b",fontSize:13,margin:"0 0 14px"}}>{fL.reduce((a,b)=>a+b.trips,0)} voyages</p>
          <button style={S.btnPrimary} onClick={()=>csv(csvL,`camions_${from||"tout"}_${to||"tout"}.csv`)}>📥 Export CSV (Excel)</button>
        </div>
      </div>
      {stats?.topProducts?.length>0&&<><h3 style={{marginTop:22,marginBottom:10}}>🏆 Top produits</h3>
        <table style={S.tbl}><thead><tr>{["Produit","Qté","CA"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{stats.topProducts.map(p=><tr key={p.name}><td style={S.td}>{p.name}</td><td style={S.td}>{fmtN(p.tq)}</td><td style={S.td}><b style={{color:"#16a34a"}}>{curr(ctx.store,p.tc)}</b></td></tr>)}</tbody>
        </table>
      </>}
    </Pg>
  );
}

/* ─── TEAM ───────────────────────────────────────────────────── */
function Team({ctx}){
  const[members,setMembers]=useState([]);const[showAdd,setShowAdd]=useState(false);
  const[form,setForm]=useState({fullName:"",email:"",password:"",role:"secretary"});const[showPwd,setShowPwd]=useState(false);const[loading,setLoading]=useState(false);
  const load=()=>api.getTeam().then(setMembers).catch(()=>{});
  useEffect(()=>{load();},[]);
  async function add(){if(!form.fullName.trim()||!form.email||form.password.length<8){ctx.notify("Remplissez tous les champs (mdp min. 8 car.).","error");return;}setLoading(true);try{await api.addMember(form);ctx.notify("✅ Membre ajouté.","success");setShowAdd(false);setForm({fullName:"",email:"",password:"",role:"secretary"});load();}catch(e){ctx.notify(e.message,"error");}setLoading(false);}
  async function del(id){if(!confirm("Supprimer ?"))return;try{await api.deleteMember(id);ctx.notify("Supprimé.","info");load();}catch(e){ctx.notify(e.message,"error");}}
  return(
    <Pg title="👥 Équipe">
      <div style={S.bar}><span style={{fontSize:13,color:"#475569"}}>{members.length} membre(s)</span><button style={S.btnPrimary} onClick={()=>setShowAdd(true)}>+ Ajouter</button></div>
      <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:9,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#1e40af"}}>
        ℹ️ <b>Secrétaire</b> : saisit les ventes (gros & détail), crée des factures, pointe les voyages. Ne peut pas modifier les stocks ni les prix.<br/>
        ℹ️ <b>Propriétaire</b> : accès complet à toutes les fonctionnalités.
      </div>
      {showAdd&&<Modal title="Ajouter un membre" onClose={()=>setShowAdd(false)}>
        <Fld label="Nom complet *" value={form.fullName} onChange={v=>setForm({...form,fullName:v})} placeholder="Aminata Kouyaté"/>
        <Fld label="E-mail * (identifiant)" value={form.email} onChange={v=>setForm({...form,email:v})} type="email"/>
        <Fld label="Mot de passe * (min. 8 car.)" value={form.password} onChange={v=>setForm({...form,password:v})} type={showPwd?"text":"password"}/>
        <label style={S.chk}><input type="checkbox" checked={showPwd} onChange={e=>setShowPwd(e.target.checked)}/><span>Afficher</span></label>
        <div style={{marginBottom:12}}><label style={S.lbl}>Rôle</label>
          <select style={S.inp} value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
            <option value="secretary">Secrétaire — saisie ventes gros/détail & factures</option>
            <option value="owner">Propriétaire — accès complet</option>
          </select>
        </div>
        <div style={S.mbtns}><button style={S.btnPrimary} onClick={add} disabled={loading}>{loading?"Création...":"Créer le compte"}</button><button style={S.btnGhost} onClick={()=>setShowAdd(false)}>Annuler</button></div>
      </Modal>}
      <div style={{display:"grid",gap:10}}>
        {members.map(m=><div key={m.id} style={{background:"white",borderRadius:12,padding:14,display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:42,height:42,borderRadius:"50%",background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{m.role==="owner"?"👑":"👩‍💼"}</div>
            <div><div style={{fontWeight:700}}>{m.full_name}</div><div style={{fontSize:12,color:"#64748b"}}>{m.email}</div>
              <span style={{...S.chip,background:m.role==="owner"?"#fef3c7":"#dbeafe",color:m.role==="owner"?"#92400e":"#1e40af",display:"inline-block",marginTop:3}}>{m.role==="owner"?"Propriétaire":"Secrétaire"}</span>
            </div>
          </div>
          {m.id!==ctx.user.id&&<button style={{...S.bsm,background:"#fee2e2",color:"#dc2626"}} onClick={()=>del(m.id)}>Supprimer</button>}
        </div>)}
      </div>
    </Pg>
  );
}

/* ─── SETTINGS ───────────────────────────────────────────────── */
function Settings({ctx}){
  const[form,setForm]=useState({name:ctx.store?.name||"",city:ctx.store?.city||"",phone:ctx.store?.phone||"",email:ctx.store?.email||"",address:ctx.store?.address||"",currency:ctx.store?.currency||"FCFA",logo_base64:ctx.store?.logo_base64||""});
  function handleLogo(e){const f=e.target.files[0];if(!f)return;if(f.size>700000){ctx.notify("Logo trop lourd (max 700 Ko).","error");return;}const r=new FileReader();r.onload=ev=>setForm(x=>({...x,logo_base64:ev.target.result}));r.readAsDataURL(f);}
  async function save(){try{const s=await api.updateStore(form);ctx.setStoreData(s);ctx.notify("✅ Paramètres enregistrés.","success");}catch(e){ctx.notify(e.message,"error");}}
  return(
    <Pg title="⚙️ Paramètres">
      <div style={{background:"white",borderRadius:12,padding:24,boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
        <h3 style={{margin:"0 0 18px"}}>Informations & Logo de la quincaillerie</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 220px",gap:24,alignItems:"flex-start"}}>
          <div>
            <Fld label="Nom de la quincaillerie *" value={form.name} onChange={v=>setForm({...form,name:v})}/>
            <Fld label="Ville" value={form.city} onChange={v=>setForm({...form,city:v})}/>
            <Fld label="Téléphone" value={form.phone} onChange={v=>setForm({...form,phone:v})}/>
            <Fld label="E-mail professionnel" value={form.email} onChange={v=>setForm({...form,email:v})}/>
            <Fld label="Adresse complète" value={form.address} onChange={v=>setForm({...form,address:v})} placeholder="Rue, Quartier, Ville..."/>
            <div style={{marginBottom:12}}><label style={S.lbl}>Devise</label>
              <select style={S.inp} value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}>
                {["FCFA","XOF","GNF","CDF","MAD","XAF","NGN","GHS","USD","EUR"].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{textAlign:"center"}}>
            <label style={S.lbl}>Logo (affiché sur les factures)</label>
            {form.logo_base64?<img src={form.logo_base64} style={{width:"100%",maxHeight:130,objectFit:"contain",border:"1px solid #e2e8f0",borderRadius:8,marginBottom:8}} alt="logo"/>
              :<div style={{width:"100%",height:130,background:"#f8fafc",border:"2px dashed #e2e8f0",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#94a3b8",marginBottom:8}}>Aucun logo</div>}
            <label style={{...S.btnGhost,display:"block",cursor:"pointer",textAlign:"center",fontSize:12,padding:"8px"}}>
              📁 Choisir un logo<input type="file" accept="image/*" style={{display:"none"}} onChange={handleLogo}/>
            </label>
            {form.logo_base64&&<button style={{...S.bsm,background:"#fee2e2",color:"#dc2626",marginTop:6,width:"100%",fontSize:11}} onClick={()=>setForm(f=>({...f,logo_base64:""}))}>Supprimer le logo</button>}
          </div>
        </div>
        <button style={{...S.btnPrimary,marginTop:16}} onClick={save}>Enregistrer les modifications</button>
      </div>
    </Pg>
  );
}

/* ─── BACKUP ─────────────────────────────────────────────────── */
function Backup({ctx}){
  const[loading,setLoading]=useState(false);
  async function doExport(){setLoading(true);try{const res=await api.exportBackup();if(!res.ok){ctx.notify("Erreur export.","error");return;}const blob=await res.blob();const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(blob),download:`bestquinca_backup_${todayStr()}.json`});a.click();ctx.notify("✅ Sauvegarde téléchargée.","success");}catch(e){ctx.notify(e.message,"error");}setLoading(false);}
  async function doRestore(e){const f=e.target.files[0];if(!f)return;if(!confirm("⚠️ Ceci remplacera TOUTES vos données actuelles. Continuer ?")){ e.target.value="";return;}setLoading(true);try{const data=JSON.parse(await f.text());await api.restoreBackup(data);ctx.notify("✅ Restauration effectuée. Rechargez la page.","success");setTimeout(()=>window.location.reload(),2000);}catch(e){ctx.notify("Fichier invalide: "+e.message,"error");}setLoading(false);e.target.value="";}
  return(
    <Pg title="💾 Sauvegarde & Restauration">
      <div style={{display:"grid",gap:16,maxWidth:600}}>
        <div style={{background:"white",borderRadius:12,padding:22,boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
          <h3 style={{margin:"0 0 8px"}}>📤 Exporter une sauvegarde</h3>
          <p style={{color:"#64748b",fontSize:13,margin:"0 0 16px",lineHeight:1.6}}>Télécharge un fichier <b>.json</b> contenant toutes vos données : clients, produits (prix gros/détail), ventes, factures, camions et mouvements de stock.</p>
          <button style={S.btnPrimary} onClick={doExport} disabled={loading}>{loading?"Export...":"📥 Télécharger la sauvegarde"}</button>
        </div>
        <div style={{background:"white",borderRadius:12,padding:22,border:"1.5px solid #fca5a5",boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
          <h3 style={{margin:"0 0 8px",color:"#dc2626"}}>📥 Restaurer depuis une sauvegarde</h3>
          <p style={{color:"#64748b",fontSize:13,margin:"0 0 4px",lineHeight:1.6}}>⚠️ <b>Attention :</b> remplace toutes les données actuelles par celles du fichier.</p>
          <p style={{color:"#dc2626",fontSize:12,margin:"0 0 16px"}}>Action irréversible. Exportez d'abord si nécessaire.</p>
          <label style={{...S.btnGhost,display:"inline-block",cursor:"pointer"}}>
            📂 Choisir un fichier (.json)<input type="file" accept=".json" style={{display:"none"}} onChange={doRestore} disabled={loading}/>
          </label>
        </div>
      </div>
    </Pg>
  );
}

/* ─── SECRÉTAIRE — ACCUEIL ───────────────────────────────────── */
function SecHome({ctx}){
  const[stats,setStats]=useState(null);const[mats,setMats]=useState([]);
  useEffect(()=>{api.salesStats().then(setStats).catch(()=>{});api.getMaterials().then(setMats).catch(()=>{});},[]);
  return(
    <Pg title={`Bonjour, ${ctx.user.fullName} 👋`}>
      <div style={{background:ctx.isOnline?"#dcfce7":"#fef9c3",borderRadius:9,padding:"10px 14px",color:ctx.isOnline?"#14532d":"#713f12",fontWeight:600,fontSize:13,marginBottom:20}}>
        {ctx.isOnline?"🟢 Connecté — données synchronisées.":"🟡 Hors ligne — vos saisies sont sauvegardées localement."}
      </div>
      <div style={S.kpiGrid}>
        <Kpi label="Ventes du jour" value={stats?.todayCount??0} icon="🧾" color="#2563eb"/>
        <Kpi label="CA Gros (aujourd'hui)" value={curr(ctx.store,stats?.todayGros)} icon="📦" color="#7c3aed"/>
        <Kpi label="CA Détail (aujourd'hui)" value={curr(ctx.store,stats?.todayDetail)} icon="🛒" color="#16a34a"/>
        <Kpi label="Produits catalogue" value={mats.length} icon="🏷️" color="#475569"/>
      </div>
      <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10,padding:"12px 16px",fontSize:13,color:"#1e40af"}}>
        <b>Rappel Best-Quinca :</b><br/>
        🛒 <b>Vente Détail</b> = vente à l'unité au prix unitaire détail.<br/>
        📦 <b>Vente Gros</b> = vente par lot/carton au prix grossiste (le stock se déduit en conséquence).<br/>
        Toute vente validée est définitive. Signalez toute erreur au propriétaire.
      </div>
    </Pg>
  );
}

/* ─── SECRÉTAIRE — VENTE ─────────────────────────────────────── */
function SecSale({ctx}){
  const[mats,setMats]=useState([]);const[clients,setClients]=useState([]);
  const[search,setSearch]=useState("");const[selId,setSelId]=useState("");const[saleType,setSaleType]=useState("detail");
  const[qty,setQty]=useState("");const[clientId,setClientId]=useState("");const[clientName,setClientName]=useState("");
  useEffect(()=>{api.getMaterials().then(setMats).catch(()=>{});api.getClients().then(setClients).catch(()=>{});},[]);
  const sel=mats.find(m=>m.id===selId);
  const filtered=mats.filter(m=>m.name.toLowerCase().includes(search.toLowerCase())||(m.category||"").toLowerCase().includes(search.toLowerCase()));
  const unitPrice=sel?(saleType==="gros"?sel.price_gros:sel.price_detail):0;
  const unitLabel=sel?(saleType==="gros"?sel.unit_gros:sel.unit_detail):"";
  const stockEquiv=sel&&saleType==="gros"?`(= ${Number(qty||0)*sel.qty_gros} ${sel.unit_detail} du stock)`:""
  const estTotal=Number(qty||0)*unitPrice;
  const maxQty=sel?(saleType==="gros"?Math.floor(sel.stock/sel.qty_gros):sel.stock):0;
  async function submit(){
    if(!selId||!qty||Number(qty)<=0){ctx.notify("Sélectionnez un produit et une quantité valide.","error");return;}
    if(Number(qty)>maxQty){ctx.notify(`Stock insuffisant. Max disponible : ${maxQty} ${unitLabel}.`,"error");return;}
    try{
      const s=await api.createSale({materialId:selId,qty:Number(qty),sale_type:saleType,clientId:clientId||null,client:clientName});
      ctx.notify(`✅ Vente ${saleType==="gros"?"en gros":"au détail"} enregistrée — ${curr(ctx.store,s.qty*s.unit_price)}`,"success");
      setSelId("");setQty("");setClientId("");setClientName("");setSearch("");
      api.getMaterials().then(setMats).catch(()=>{});
    }catch(e){ctx.notify(e.message,"error");}
  }
  return(
    <Pg title="🛒 Enregistrer une Vente">
      {/* Sélecteur de mode vente */}
      <div style={{display:"flex",gap:10,marginBottom:18}}>
        {["detail","gros"].map(t=><button key={t} onClick={()=>{setSaleType(t);setQty("");}} style={{flex:1,padding:"12px",border:`2px solid ${saleType===t?SALE_TYPES[t].color:"#e2e8f0"}`,borderRadius:10,background:saleType===t?SALE_TYPES[t].bg:"white",color:saleType===t?SALE_TYPES[t].color:"#64748b",fontWeight:700,cursor:"pointer",fontSize:14}}>
          {t==="detail"?"🛒 Vente au Détail — prix unitaire":"📦 Vente en Gros — prix grossiste"}
        </button>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:22,alignItems:"flex-start"}}>
        <div>
          <label style={S.lbl}>Sélectionner un produit</label>
          <input style={S.inp} placeholder="🔍 Tapez le nom ou la catégorie..." value={search} onChange={e=>{setSearch(e.target.value);setSelId("");}}/>
          <div style={{maxHeight:430,overflowY:"auto",display:"flex",flexDirection:"column",gap:6,marginTop:8,paddingRight:4}}>
            {filtered.map(m=>{
              const availGros=Math.floor(m.stock/m.qty_gros);
              return<div key={m.id} onClick={()=>{setSelId(m.id);setSearch(m.name);setQty("");}}
                style={{padding:12,border:`1px solid ${selId===m.id?SALE_TYPES[saleType].color:"#e2e8f0"}`,borderRadius:10,cursor:"pointer",background:selId===m.id?SALE_TYPES[saleType].bg:"white"}}>
                <div style={{fontWeight:600}}>{m.name}{m.category&&<span style={{...S.chip,marginLeft:8}}>{m.category}</span>}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,fontSize:12,color:"#64748b",marginTop:5}}>
                  <span>🛒 Détail : <b style={{color:"#2563eb"}}>{fmtN(m.price_detail)}/{m.unit_detail}</b></span>
                  <span>📦 Gros : <b style={{color:"#7c3aed"}}>{fmtN(m.price_gros)}/{m.unit_gros}</b> ({m.qty_gros} {m.unit_detail})</span>
                  <span>Stock : <b style={{color:m.stock<=0?"#dc2626":m.stock<=m.stock_min?"#d97706":"#16a34a"}}>{m.stock<=0?"Rupture":`${m.stock} ${m.unit_detail}`}</b></span>
                  <span>Dispo gros : <b style={{color:availGros<=0?"#dc2626":"#7c3aed"}}>{availGros} {m.unit_gros}</b></span>
                </div>
              </div>;
            })}
          </div>
        </div>
        <div>
          {sel?<div style={{background:saleType==="gros"?"#f5f3ff":"#eff6ff",border:`1.5px solid ${saleType==="gros"?"#c4b5fd":"#bfdbfe"}`,borderRadius:12,padding:16,marginBottom:14}}>
            <div style={{fontWeight:700,fontSize:16,marginBottom:10,color:SALE_TYPES[saleType].color}}>
              {saleType==="gros"?"📦":"🛒"} {sel.name}
            </div>
            {[
              ["Mode de vente",<STypeBadge t={saleType}/>],
              ["Prix unitaire",<b style={{color:"#16a34a",fontSize:16}}>{fmtN(unitPrice)} {ctx.store?.currency||"FCFA"}</b>],
              ["Unité",unitLabel],
              saleType==="gros"?["Équivalence",`1 ${sel.unit_gros} = ${sel.qty_gros} ${sel.unit_detail}`]:null,
              ["Stock dispo",<b style={{color:sel.stock<=sel.stock_min?"#d97706":"#16a34a"}}>{sel.stock} {sel.unit_detail}</b>],
              ["Max commandable",<b>{maxQty} {unitLabel}</b>],
              qty&&Number(qty)>0?["Total estimé",<b style={{color:"#7c3aed",fontSize:18}}>{fmtN(estTotal)} {ctx.store?.currency||"FCFA"}</b>]:null,
              qty&&Number(qty)>0&&saleType==="gros"?["Stock déduit",<small style={{color:"#64748b"}}>{stockEquiv}</small>]:null,
            ].filter(Boolean).map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${saleType==="gros"?"#ddd6fe":"#dbeafe"}`,fontSize:13}}><span style={{color:"#475569"}}>{k}</span><span>{v}</span></div>)}
            <p style={{fontSize:11,color:"#94a3b8",marginTop:8}}>Tarif mis à jour le {new Date(sel.updated_at).toLocaleDateString("fr-FR")}</p>
          </div>:<div style={{background:"#f8fafc",borderRadius:12,padding:24,textAlign:"center",color:"#94a3b8",marginBottom:14,fontSize:14}}>👈 Sélectionnez un produit</div>}
          <div style={{marginBottom:12}}>
            <label style={S.lbl}>Client (liste)</label>
            <select style={S.inp} value={clientId} onChange={e=>{setClientId(e.target.value);const c=clients.find(x=>x.id===e.target.value);if(c)setClientName(c.name);}}>
              <option value="">— Comptoir / Libre —</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.name} ({CLIENT_TYPES[c.client_type]?.label||c.client_type})</option>)}
            </select>
          </div>
          <Fld label={`Quantité * (${saleType==="gros"?`en ${sel?.unit_gros||"gros"}, max ${maxQty}`:`en ${sel?.unit_detail||"unité"}, max ${maxQty}`})`} value={qty} onChange={setQty} type="number" placeholder={`Max ${maxQty}`}/>
          <Fld label="Nom client (facultatif)" value={clientName} onChange={setClientName} placeholder="M. Touré, Chantier..."/>
          <button style={{...S.btnPrimary,width:"100%",padding:14,fontSize:15,background:SALE_TYPES[saleType].color}} onClick={submit} disabled={!selId||!qty||Number(qty)<=0}>
            {saleType==="gros"?"📦 Valider la vente en GROS":"🛒 Valider la vente au DÉTAIL"}
          </button>
          <p style={{fontSize:11,color:"#dc2626",marginTop:8,textAlign:"center",lineHeight:1.5}}>⚠️ Vente définitive après validation. Signalez toute erreur au propriétaire.</p>
        </div>
      </div>
    </Pg>
  );
}

/* ─── SECRÉTAIRE — CAMIONS ───────────────────────────────────── */
function SecTrucks({ctx}){
  const[trucks,setTrucks]=useState([]);const[logs,setLogs]=useState([]);
  const[dateV,setDateV]=useState(todayStr());const[trips,setTrips]=useState({});const[notes,setNotes]=useState({});
  useEffect(()=>{api.getTrucks().then(setTrucks).catch(()=>{});},[]);
  useEffect(()=>{api.getLogs(dateV).then(setLogs).catch(()=>{});},[dateV]);
  const getLog=tid=>logs.find(l=>l.truck_id===tid);
  async function pointer(tid){if(getLog(tid)){ctx.notify("Déjà pointé. Contactez le propriétaire.","error");return;}const t=Number(trips[tid]||0);if(t<1){ctx.notify("Nb voyages invalide.","error");return;}try{await api.postLog({truckId:tid,date:dateV,trips:t,note:notes[tid]||""});ctx.notify("✅ Voyage pointé.","success");setTrips({...trips,[tid]:""});api.getLogs(dateV).then(setLogs).catch(()=>{});}catch(e){ctx.notify(e.message,"error");}}
  return(
    <Pg title="🚛 Pointage des Voyages">
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:18}}>
        <label style={S.lbl}>Date :</label>
        <input style={{...S.inp,width:160}} type="date" value={dateV} onChange={e=>setDateV(e.target.value)} max={todayStr()}/>
      </div>
      <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:9,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#1e40af"}}>🔒 Un voyage pointé est définitif. Signalez toute erreur au propriétaire.</div>
      {trucks.filter(t=>t.active).map(truck=>{const log=getLog(truck.id);return<div key={truck.id} style={{background:"white",borderRadius:12,padding:18,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div><div style={{fontWeight:700,fontSize:16}}>🚛 {truck.name}</div><div style={{fontSize:13,color:"#64748b"}}>👤 {truck.driver}</div></div>
          {log&&<span style={{background:"#d97706",color:"white",padding:"4px 14px",borderRadius:20,fontWeight:800}}>{log.trips} voyage{log.trips>1?"s":""}</span>}
        </div>
        {log?<div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:8,padding:12,marginTop:12,fontSize:13}}>
          <div>✅ <b>{log.trips}</b> voyage(s){log.note?` — ${log.note}`:""}</div>
          <p style={{fontSize:12,color:"#dc2626",margin:"4px 0 0"}}>Pour corriger, contactez le propriétaire.</p>
        </div>
        :<div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
          <input style={{...S.inp,width:120}} type="number" min="1" placeholder="Nb voyages" value={trips[truck.id]||""} onChange={e=>setTrips({...trips,[truck.id]:e.target.value})}/>
          <input style={{...S.inp,flex:1,minWidth:150}} placeholder="Observation..." value={notes[truck.id]||""} onChange={e=>setNotes({...notes,[truck.id]:e.target.value})}/>
          <button style={S.btnPrimary} onClick={()=>pointer(truck.id)}>📍 Pointer</button>
        </div>}
      </div>;})}
    </Pg>
  );
}

/* ─── SECRÉTAIRE — STOCK ─────────────────────────────────────── */
function SecStock({ctx}){
  const[mats,setMats]=useState([]);const[search,setSearch]=useState("");
  useEffect(()=>{api.getMaterials().then(setMats).catch(()=>{});},[]);
  const filtered=mats.filter(m=>m.name.toLowerCase().includes(search.toLowerCase())||(m.category||"").toLowerCase().includes(search.toLowerCase()));
  return(
    <Pg title="📦 Consultation du Stock">
      <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:9,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#1e40af"}}>🔒 Lecture seule — Seul le propriétaire peut modifier les prix et quantités.</div>
      <input style={{...S.inp,maxWidth:300,marginBottom:14}} placeholder="🔍 Rechercher..." value={search} onChange={e=>setSearch(e.target.value)}/>
      {mats.length===0?<Empty icon="📦" title="Catalogue vide" sub="Le propriétaire n'a pas encore ajouté de produits."/>
      :<table style={S.tbl}><thead><tr>{["Produit","Catégorie","Prix Détail","Prix Gros","Stock","Unité Gros","Mis à jour"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{filtered.map(m=><tr key={m.id}>
          <td style={S.td}><b>{m.name}</b></td>
          <td style={S.td}>{m.category?<span style={S.chip}>{m.category}</span>:"—"}</td>
          <td style={S.td}><span style={{...S.chip,background:"#dbeafe",color:"#1d4ed8"}}>{fmtN(m.price_detail)}/{m.unit_detail}</span></td>
          <td style={S.td}><span style={{...S.chip,background:"#ede9fe",color:"#7c3aed"}}>{fmtN(m.price_gros)}/{m.unit_gros}</span></td>
          <td style={S.td}><span style={{fontWeight:700,color:m.stock<=0?"#dc2626":m.stock<=m.stock_min?"#d97706":"#16a34a"}}>{m.stock<=0?"Rupture":m.stock}</span> <small style={{color:"#94a3b8"}}>{m.unit_detail}</small></td>
          <td style={S.td}><small style={{color:"#64748b"}}>1 {m.unit_gros} = {m.qty_gros} {m.unit_detail}</small></td>
          <td style={S.td}><small style={{color:"#94a3b8"}}>Le {new Date(m.updated_at).toLocaleDateString("fr-FR")}</small></td>
        </tr>)}</tbody>
      </table>}
    </Pg>
  );
}

/* ─── SHARED COMPONENTS ──────────────────────────────────────── */
function STypeBadge({t}){const st=SALE_TYPES[t]||SALE_TYPES.detail;return<span style={{...S.chip,background:st.bg,color:st.color}}>{st.label}</span>;}
function Pg({title,children}){return<div style={{maxWidth:1200,margin:"0 auto"}}><h2 style={{fontSize:20,fontWeight:800,marginBottom:20,color:"#0f172a"}}>{title}</h2>{children}</div>;}
function Kpi({label,value,icon,color}){return<div style={{...S.kpiCard,borderLeft:`4px solid ${color}`}}><span style={{fontSize:24}}>{icon}</span><div><div style={{fontSize:17,fontWeight:800,color}}>{value??<span style={{color:"#e2e8f0"}}>—</span>}</div><div style={{fontSize:11,color:"#64748b",marginTop:2}}>{label}</div></div></div>;}
function Alrt({color,bg,border,title,children}){return<div style={{background:bg,border:`1px solid ${border}`,borderRadius:10,padding:13,marginBottom:12}}><div style={{fontWeight:700,color,marginBottom:8}}>{title}</div>{children}</div>;}
function AR({name,label,color}){return<div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid rgba(0,0,0,.05)",fontSize:13}}><span>{name}</span><span style={{background:color,color:"white",padding:"1px 8px",borderRadius:10,fontSize:11,fontWeight:700}}>{label}</span></div>;}
function Fld({label,value,onChange,type="text",placeholder,err,onEnter}){return<div style={{marginBottom:12}}>{label&&<label style={S.lbl}>{label}</label>}<input style={{...S.inp,...(err?{borderColor:"#ef4444"}:{})}} type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} onKeyDown={e=>e.key==="Enter"&&onEnter?.()}/>{err&&<p style={{color:"#dc2626",fontSize:12,margin:"3px 0 0"}}>{err}</p>}</div>;}
function Modal({title,onClose,children,wide}){return<div style={S.overlay} onClick={e=>e.target===e.currentTarget&&onClose()}><div style={{...S.modal,...(wide?{width:820}:{})}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h3 style={{margin:0}}>{title}</h3><button style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#64748b"}} onClick={onClose}>✕</button></div>{children}</div></div>;}
function Empty({icon,title,sub}){return<div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"56px 24px",color:"#64748b"}}><div style={{fontSize:44}}>{icon}</div><div style={{fontWeight:700,fontSize:16,marginTop:14}}>{title}</div><div style={{color:"#94a3b8",fontSize:14,marginTop:6,maxWidth:360,textAlign:"center"}}>{sub}</div></div>;}

/* ─── STYLES ─────────────────────────────────────────────────── */
const S={
  root:{minHeight:"100vh",fontFamily:"'Inter','Segoe UI',sans-serif",color:"#0f172a",background:"#f1f5f9"},
  toast:{position:"fixed",top:14,right:14,color:"white",padding:"12px 20px",borderRadius:10,zIndex:1000,fontSize:14,fontWeight:600,boxShadow:"0 4px 24px rgba(0,0,0,.2)",maxWidth:440},
  landing:{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:24},
  landCard:{background:"white",borderRadius:20,padding:"36px 44px",maxWidth:560,width:"100%",boxShadow:"0 20px 60px rgba(30,58,95,0.15)",border:"1px solid rgba(30,58,95,0.08)"},
  authWrap:{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:24},
  authCard:{background:"white",borderRadius:20,padding:"40px 44px",maxWidth:480,width:"100%",boxShadow:"0 12px 48px rgba(0,0,0,.1)"},
  backLink:{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:13,padding:0,marginBottom:20,display:"block"},
  authBrand:{display:"flex",alignItems:"center",gap:10,marginBottom:18},
  chk:{display:"flex",gap:8,alignItems:"center",marginBottom:10,cursor:"pointer",fontSize:13,color:"#475569"},
  shell:{display:"flex",minHeight:"100vh"},
  sidebar:{width:214,background:"linear-gradient(180deg,#0f172a 0%,#1e3a5f 100%)",display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",flexShrink:0,borderRight:"1px solid rgba(245,158,11,0.2)"},
  navBtn:{display:"flex",alignItems:"center",gap:8,width:"100%",background:"none",border:"none",color:"#94a3b8",padding:"8px 10px",borderRadius:8,cursor:"pointer",textAlign:"left"},
  navActive:{background:"rgba(245,158,11,0.15)",color:"#f59e0b",borderLeft:"3px solid #f59e0b"},
  pill:{borderRadius:20,padding:"4px 10px",fontSize:11,fontWeight:600,textAlign:"center"},
  kpiGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))",gap:14,marginBottom:20},
  kpiCard:{background:"white",borderRadius:12,padding:"13px 15px",display:"flex",gap:14,alignItems:"center",boxShadow:"0 2px 8px rgba(0,0,0,.05)"},
  tbl:{width:"100%",borderCollapse:"collapse",background:"white",borderRadius:12,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,.05)"},
  th:{background:"#1e3a5f",color:"white",padding:"10px 12px",textAlign:"left",fontSize:12,fontWeight:700},
  td:{padding:"10px 12px",borderBottom:"1px solid #f1f5f9",fontSize:13,verticalAlign:"middle"},
  chip:{background:"#e0f2fe",color:"#0369a1",padding:"2px 8px",borderRadius:10,fontSize:11,fontWeight:600},
  ref:{background:"#f1f5f9",padding:"2px 7px",borderRadius:4,fontSize:11,fontFamily:"monospace"},
  bar:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10},
  lbl:{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:4},
  inp:{width:"100%",padding:"10px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,outline:"none",boxSizing:"border-box",background:"white"},
  btnPrimary:{background:"linear-gradient(135deg,#1e3a5f 0%,#2d5a8e 100%)",color:"white",border:"none",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontWeight:700,fontSize:13,boxShadow:"0 2px 8px rgba(30,58,95,0.3)"},
  btnGhost:{background:"white",color:"#475569",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 18px",cursor:"pointer",fontSize:13},
  bsm:{background:"#f1f5f9",color:"#334155",border:"none",borderRadius:6,padding:"5px 9px",cursor:"pointer",fontSize:12},
  overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,padding:16},
  modal:{background:"white",borderRadius:16,padding:26,width:500,maxWidth:"100%",maxHeight:"92vh",overflowY:"auto"},
  mbtns:{display:"flex",gap:10,marginTop:16},
};
