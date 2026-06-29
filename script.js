
const $ = (id) => document.getElementById(id);
const norm = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const unique = (arr) => [...new Set(arr.filter(Boolean))].sort((a,b)=>a.localeCompare(b));
const state = { search:'', priority:'', sector:'', location:'' };
let modal;

function priorityClass(p){const v=norm(p); if(v.includes('alta')) return 'alta'; if(v.includes('media')) return 'media'; return 'baja';}
function csvSafe(value){ return '"' + String(value || '').replaceAll('"','""') + '"'; }
function cleanLocation(v){ return String(v||'Por validar').replace(/\s*\(validar\)/ig,'').trim() || 'Por validar'; }
function mainProvince(v){ const s=cleanLocation(v); const parts=s.split(/[\/,-]/).map(x=>x.trim()).filter(Boolean); return parts[0] || 'Por validar'; }
function basicInfo(e){
  const sector = e.sector || 'sector por validar';
  const actividad = e.actividad || 'actividad empresarial por validar';
  const ubicacion = e.ubicacion || 'Costa Rica';
  return `${e.empresa} es una empresa vinculada a ${sector}. Su operación reportada se relaciona con ${actividad} y aparece ubicada en ${ubicacion}. Esta ficha está diseñada para uso comercial: antes de contactar, conviene validar cargo, sede y necesidad logística vigente.`;
}
function logisticsFit(e){
  const text = norm(`${e.empresa} ${e.sector} ${e.actividad}`); const fit=[];
  if(text.includes('medic')||text.includes('ciencias')||text.includes('farm')||text.includes('life')) fit.push('cadena fría','express crítico','freight para insumos','manejo aduanal sensible');
  if(text.includes('tecnolog')||text.includes('electron')||text.includes('manufactura avanzada')) fit.push('carga high-value','repuestos urgentes','importación de componentes','seguro de carga');
  if(text.includes('servicios')||text.includes('shared')||text.includes('financ')) fit.push('courier documental','importación de equipos','soluciones B2B recurrentes');
  if(text.includes('alimento')||text.includes('agro')) fit.push('exportación refrigerada','aduanas','freight regional');
  if(!fit.length) fit.push('freight internacional','courier express','importación / exportación','soporte aduanal');
  return [...new Set(fit)];
}
function filteredCompanies(){
  return empresasZF.filter(e=>{
    const haystack = norm(`${e.prioridad} ${e.empresa} ${e.sector} ${e.actividad} ${e.ubicacion} ${e.contacto} ${e.notas}`);
    return (!state.search || haystack.includes(norm(state.search))) &&
           (!state.priority || e.prioridad === state.priority) &&
           (!state.sector || e.sector === state.sector) &&
           (!state.location || mainProvince(e.ubicacion) === state.location);
  });
}
function populateFilters(){
  unique(empresasZF.map(e=>e.prioridad)).forEach(v=>$('priorityFilter').insertAdjacentHTML('beforeend',`<option value="${v}">${v}</option>`));
  unique(empresasZF.map(e=>e.sector)).forEach(v=>$('sectorFilter').insertAdjacentHTML('beforeend',`<option value="${v}">${v}</option>`));
  unique(empresasZF.map(e=>mainProvince(e.ubicacion))).forEach(v=>$('locationFilter').insertAdjacentHTML('beforeend',`<option value="${v}">${v}</option>`));
  $('statEmpresas').textContent = empresasZF.length;
  $('statAlta').textContent = empresasZF.filter(e=>norm(e.prioridad).includes('alta')).length;
  $('statSectores').textContent = unique(empresasZF.map(e=>e.sector)).length;
  $('statUbicaciones').textContent = unique(empresasZF.map(e=>mainProvince(e.ubicacion))).length;
}
function renderRows(){
  const rows = filteredCompanies();
  $('resultCount').textContent = `${rows.length} resultado${rows.length===1?'':'s'}`;
  $('companyRows').innerHTML = rows.map(e=>{
    const idx = empresasZF.indexOf(e);
    return `<tr>
      <td><span class="priority ${priorityClass(e.prioridad)}">${e.prioridad || 'Sin prioridad'}</span></td>
      <td>
        <span class="company-name">${e.empresa || 'Sin nombre'}</span>
        ${e.web ? `<a class="company-web-link" href="${e.web}" target="_blank" rel="noopener">Web de la empresa</a>` : ''}
        <button class="btn btn-sm btn-outline-fedex company-info-btn" onclick="openCompany(${idx})">Ver quiénes son</button>
      </td>
      <td>${e.sector || 'Por validar'}<span class="small-muted">${e.actividad || ''}</span></td>
      <td>${e.ubicacion || 'Por validar'}</td>
      <td>${e.contacto || 'Contacto por validar'}</td>
      <td class="text-end"><button class="btn btn-sm btn-fedex" onclick="openCompany(${idx})">Ficha</button></td>
    </tr>`;
  }).join('') || `<tr><td colspan="6" class="text-center py-5 text-muted">No hay resultados para esos filtros.</td></tr>`;
}
function openCompany(idx){
  const e = empresasZF[idx];
  $('modalTitle').textContent = e.empresa || 'Empresa';
  $('modalBody').innerHTML = `<div class="mb-3"><span class="priority ${priorityClass(e.prioridad)} me-2">${e.prioridad || 'Sin prioridad'}</span><span class="badge rounded-pill text-bg-light">${e.sector || 'Sector por validar'}</span></div>
  <p class="lead">${basicInfo(e)}</p>
  <div class="detail-grid">
    <div class="detail"><strong>Página web</strong>${e.web ? `<a href="${e.web}" target="_blank" rel="noopener">${e.web}</a>` : 'No disponible'}</div>
    <div class="detail"><strong>Ubicación</strong>${e.ubicacion || 'Por validar'}</div>
    <div class="detail"><strong>Actividad</strong>${e.actividad || 'Por validar'}</div>
    <div class="detail"><strong>Contacto</strong>${e.contacto || 'Por validar'}</div>
    <div class="detail"><strong>Fuente contacto</strong>${e.fuenteContacto ? `<a href="${e.fuenteContacto}" target="_blank" rel="noopener">Abrir fuente</a>` : 'No disponible'}</div>
    <div class="detail"><strong>Notas</strong>${e.notas || 'Sin notas'}</div>
  </div>
  <div class="strategy"><strong>Ángulo comercial recomendado</strong><ul class="mb-0 mt-2"><li>Ofrecer soluciones de ${logisticsFit(e).join(', ')}.</li><li>Validar rutas actuales, tiempos de tránsito, dolor aduanal, urgencias y costos por demoras.</li><li>Buscar decisores en Supply Chain, Logistics, Procurement, Operations o Plant Management.</li></ul></div>`;
  modal.show();
}
function renderDashboard(){
  const locCounts = {}; const sectorCounts={}; const priorityCounts={};
  empresasZF.forEach(e=>{locCounts[mainProvince(e.ubicacion)] = (locCounts[mainProvince(e.ubicacion)]||0)+1; sectorCounts[e.sector||'Por validar']=(sectorCounts[e.sector||'Por validar']||0)+1; priorityCounts[e.prioridad||'Sin prioridad']=(priorityCounts[e.prioridad||'Sin prioridad']||0)+1;});
  const locEntries = Object.entries(locCounts).sort((a,b)=>b[1]-a[1]);
  Plotly.newPlot('geoDashboard',[{type:'bar',x:locEntries.map(x=>x[0]),y:locEntries.map(x=>x[1]),text:locEntries.map(x=>`${x[1]} empresas`),textposition:'auto',marker:{color:'#4d148c'}}],{title:'Empresas por ubicación geográfica',margin:{t:55,l:45,r:20,b:80},paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',xaxis:{tickangle:-25},yaxis:{title:'Cantidad de empresas'}},{responsive:true,displaylogo:false});
  Plotly.newPlot('sectorDashboard',[{type:'pie',labels:Object.keys(sectorCounts),values:Object.values(sectorCounts),hole:.48,marker:{colors:['#ff6600','#4d148c','#ff8a2a','#35106b','#8f4bd6','#ffc08a','#6d2ca0','#2a0b52']}}],{title:'Distribución por sector',margin:{t:55,l:10,r:10,b:10},paper_bgcolor:'rgba(0,0,0,0)'},{responsive:true,displaylogo:false});
}
function exportCsv(){
 const header=['prioridad','empresa','sector','ubicacion','contacto','actividad','web','notas'];
 const lines=[header.join(',')].concat(filteredCompanies().map(e=>header.map(k=>csvSafe(e[k])).join(',')));
 const blob=new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='mi-venta-zona-franca-cr-resultados.csv'; a.click(); URL.revokeObjectURL(url);
}
function addMsg(type, html){const box=document.createElement('div'); box.className=`msg ${type}`; box.innerHTML=html; $('chatMessages').appendChild(box); $('chatMessages').scrollTop=$('chatMessages').scrollHeight;}
function botAnswer(q){
 const query=norm(q); let results=empresasZF.filter(e=>norm(`${e.empresa} ${e.sector} ${e.ubicacion} ${e.prioridad} ${e.contacto}`).includes(query));
 if(query.includes('alta')) results=empresasZF.filter(e=>norm(e.prioridad).includes('alta'));
 if(query.includes('media')) results=empresasZF.filter(e=>norm(e.prioridad).includes('media'));
 if(query.includes('baja')) results=empresasZF.filter(e=>norm(e.prioridad).includes('baja'));
 const named=empresasZF.find(e=>norm(e.empresa).includes(query) || query.includes(norm(e.empresa).slice(0,Math.min(14,norm(e.empresa).length))));
 if(query.includes('dashboard')||query.includes('ubicacion')) return 'El dashboard está en la sección <strong>Dashboard geográfico</strong>. También puedes filtrar el directorio por ubicación.';
 if(query.includes('vendo')||query.includes('estrategia')||query.includes('contactar')||named){const e=named||results[0]; if(e) return `<strong>${e.empresa}</strong><br>${basicInfo(e)}<br><br><strong>Oportunidades:</strong> ${logisticsFit(e).join(', ')}.<br><br><strong>Pregunta inicial:</strong> “¿Qué rutas, urgencias o procesos de importación/exportación están generando más costo o retraso actualmente?”`;}
 if(results.length) return `Encontré <strong>${results.length}</strong> coincidencia${results.length===1?'':'s'}.<br><br>` + results.slice(0,7).map(e=>`• <strong>${e.empresa}</strong> — ${e.prioridad||'N/A'}, ${e.sector||'N/A'}, ${e.ubicacion||'N/A'}`).join('<br>') + (results.length>7?'<br><br>Usa los filtros para ver más.':'');
 return 'No encontré coincidencia exacta. Prueba con empresa, prioridad, sector o ubicación. Ejemplos: <strong>Abbott</strong>, <strong>Cartago</strong>, <strong>ciencias de la vida</strong>, <strong>prioridad alta</strong>.';
}
function sendChat(){const input=$('chatInput'); const q=input.value.trim(); if(!q)return; addMsg('user',q); input.value=''; setTimeout(()=>addMsg('bot',botAnswer(q)),120);}
document.addEventListener('DOMContentLoaded',()=>{
 modal=new bootstrap.Modal($('companyModal')); populateFilters(); renderRows(); renderDashboard();
 addMsg('bot','Hola. Soy <strong>ZF SalesBot</strong>. Pregúntame por empresa, prioridad, sector, ubicación, contacto o estrategia de venta.');
 $('searchInput').addEventListener('input',e=>{state.search=e.target.value; renderRows();});
 $('priorityFilter').addEventListener('change',e=>{state.priority=e.target.value; renderRows();});
 $('sectorFilter').addEventListener('change',e=>{state.sector=e.target.value; renderRows();});
 $('locationFilter').addEventListener('change',e=>{state.location=e.target.value; renderRows();});
 $('clearFilters').addEventListener('click',()=>{state.search='';state.priority='';state.sector='';state.location='';['searchInput','priorityFilter','sectorFilter','locationFilter'].forEach(id=>$(id).value='');renderRows();});
 $('exportCsvBtn').addEventListener('click',exportCsv); $('chatSend').addEventListener('click',sendChat); $('chatInput').addEventListener('keydown',e=>{if(e.key==='Enter')sendChat();});
 document.querySelectorAll('.prompt-box').forEach(el=>el.addEventListener('click',()=>{$('chatInput').value=el.dataset.prompt; sendChat();}));
});
