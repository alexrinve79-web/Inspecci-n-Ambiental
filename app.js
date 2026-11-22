let DB = JSON.parse(localStorage.getItem('inspDB')||'null') || {
  divisiones: ["Acería","Laminación","Servicios"],
  areas: { "Acería": ["Horno","Colada","Ajuste"] },
  responsables: { "Horno": ["Juan Perez"], "Colada": ["Ana Gomez"] },
  correos: { "Juan Perez":"juan@empresa.com", "Ana Gomez":"ana@empresa.com" },
  inspecciones: []
};
let tempHallazgos=[]; let sevSel='Leve'; let gps='';

function save(){ localStorage.setItem('inspDB', JSON.stringify(DB)); }
function $(id){ return document.getElementById(id); }
function init(){
  $('fecha').value = new Date().toISOString().slice(0,10);
  $('planta').innerHTML = DB.divisiones.map(d=>`<option>${d}</option>`).join('');
  $('fDiv').innerHTML = `<option value="">Todas</option>`+DB.divisiones.map(d=>`<option>${d}</option>`).join('');
  $('fArea').innerHTML = `<option value="">Todas</option>`;
  cargarSub(); renderDash();
}
function cargarSub(){
  let div = $('planta').value;
  let subs = DB.areas[div]||[];
  $('subarea').innerHTML = subs.map(s=>`<option>${s}</option>`).join('');
  asignarResp();
}
function asignarResp(){
  let sub = $('subarea').value;
  let resps = DB.responsables[sub]||["Sin asignar"];
  $('responsable').innerHTML = resps.map(r=>`<option>${r}</option>`).join('');
  asignarCorreo();
}
function asignarCorreo(){ $('correo').value = DB.correos[$('responsable').value]||""; }
function showStep(n){
  ['p1','p2','p3'].forEach((id,i)=>$(id).classList.toggle('hidden', i!==(n-1)));
  ['b1','b2','b3'].forEach((id,i)=>$(id).classList.toggle('tab-active', i===(n-1)));
  if(n===3) renderDash();
}
function getGPS(){
  if(navigator.geolocation){ navigator.geolocation.getCurrentPosition(p=>{ gps=p.coords.latitude+','+p.coords.longitude; $('gpsText').textContent='📍 '+gps; }); } else { alert('No GPS'); }
}
function setSev(s){
  sevSel=s;
  ['sLeve','sMedio','sCrit'].forEach(id=>$(id).classList.remove('sev-on'));
  if(s==='Leve') $('sLeve').classList.add('sev-on');
  if(s==='Medio') $('sMedio').classList.add('sev-on');
  if(s==='Crítico') $('sCrit').classList.add('sev-on');
}
$('foto')?.addEventListener('change', e=>{
  let r=new FileReader(); r.onload=ev=>{ $('preview').src=ev.target.result; $('preview').classList.remove('hidden'); }; r.readAsDataURL(e.target.files[0]);
});
function addHallazgoTemp(){
  let d=$('desc').value; if(!d) return alert('Escribe descripción');
  tempHallazgos.push({desc:d, sev:sevSel, ubic:$('ubic').value, tipo:$('tipo').value, foto:$('preview').src});
  $('listaTemp').innerHTML = tempHallazgos.map(h=>`<div style="border:1px solid #ddd;padding:8px;border-radius:8px;margin-top:6px">${h.desc} - ${h.sev}</div>`).join('');
  $('desc').value='';
}
function guardarTodo(){
  let insp={div:$('planta').value, area:$('subarea').value, resp:$('responsable').value, correo:$('correo').value, fecha:$('fecha').value, gps, hallazgos:tempHallazgos, estado:'Abierto'};
  DB.inspecciones.push(insp); save(); tempHallazgos=[]; $('listaTemp').innerHTML=''; alert('Guardado!'); renderDash(); showStep(3);
}
function renderDash(){
  let fD=$('fDiv').value, fA=$('fArea').value;
  if(fD){ let ars=DB.areas[fD]||[]; $('fArea').innerHTML=`<option value="">Todas</option>`+ars.map(a=>`<option>${a}</option>`).join(''); }
  let list=DB.inspecciones.filter(i=>(!fD||i.div===fD)&&(!fA||i.area===fA));
  let total=list.length;
  let crit=list.reduce((a,i)=>a+i.hallazgos.filter(h=>h.sev==='Crítico').length,0);
  $('statDiv').innerHTML=`<p>Total inspecciones: <b>${total}</b> | Críticos: <b>${crit}</b></p>`;
  $('listaAll').innerHTML = list.map((i,idx)=>`<div style="border:1px solid #ddd;padding:10px;border-radius:10px;margin-top:8px"><b>${i.div} - ${i.area}</b><br>${i.resp} - ${i.fecha}<br>Hallazgos: ${i.hallazgos.length}<br><button onclick="exportPDF(${idx})" style="margin-top:6px;padding:6px 10px;background:#1a4d2e;color:white;border:none;border-radius:6px">PDF</button></div>`).join('') || 'Sin datos';
}
function exportPDF(idx){
  let i=DB.inspecciones[idx]; const {jsPDF}=window.jspdf; let doc=new jsPDF(); doc.text(`Inspeccion ${i.div} - ${i.area}`,10,10); doc.text(`Resp: ${i.resp} Fecha: ${i.fecha}`,10,20); i.hallazgos.forEach((h,n)=>doc.text(`${n+1}. ${h.desc} [${h.sev}]`,10,30+n*10)); doc.save('inspeccion.pdf');
}
function gestionDiv(){ $('adminEdit').innerHTML=`<input id="newDiv" class="input" placeholder="Nueva división"><button onclick="addDiv()" class="btn-green">Agregar</button>`+DB.divisiones.map(d=>`<p>${d}</p>`).join(''); }
function addDiv(){ let v=$('newDiv').value; if(v){ DB.divisiones.push(v); DB.areas[v]=[]; save(); init(); gestionDiv(); } }
function gestionArea(){ let d=$('planta').value; $('adminEdit').innerHTML=`<p>División: ${d}</p><input id="newArea" class="input" placeholder="Nueva área"><button onclick="addArea()" class="btn-green">Agregar</button>`+(DB.areas[d]||[]).map(a=>`<p>${a}</p>`).join(''); }
function addArea(){ let v=$('newArea').value; let d=$('planta').value; if(v){ DB.areas[d].push(v); save(); cargarSub(); gestionArea(); } }
function gestionResp(){ $('adminEdit').innerHTML=`<input id="newResp" class="input" placeholder="Nombre"><input id="newRespArea" class="input" placeholder="Subárea (Horno)"><input id="newRespMail" class="input" placeholder="correo"><button onclick="addResp()" class="btn-green">Agregar responsable</button>`; }
function addResp(){ let n=$('newResp').value, a=$('newRespArea').value, m=$('newRespMail').value; if(!DB.responsables[a]) DB.responsables[a]=[]; DB.responsables[a].push(n); DB.correos[n]=m; save(); alert('Agregado'); }
function gestionCorr(){ gestionResp(); }

init();
