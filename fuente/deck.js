const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],
esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
fmt=(v,d=1)=>Number(v).toLocaleString('es-ES',{maximumFractionDigits:d,minimumFractionDigits:d}),
dateNum=d=>new Date(d+'T00:00:00Z').getTime(),green='#86BC25',deep='#608d14';
const BOX={w:1400,h:430,l:85,r:1315,t:28,b:366},YEAR=365.25*86400000;
let current=0,animationEpoch=0,tableRows=[],tableHeaders=[],tableFile='Datos.csv';
function svg(content,label){return `<svg viewBox="0 0 ${BOX.w} ${BOX.h}" role="img" aria-label="${esc(label)}">${content}</svg>`}
function axes(xmin,xmax,ymin,ymax,ticks,years,log=false){
 const {l,r,t,b}=BOX,x=v=>l+(v-xmin)/(xmax-xmin)*(r-l),y=v=>b-((log?Math.log10(v):v)-(log?Math.log10(ymin):ymin))/((log?Math.log10(ymax):ymax)-(log?Math.log10(ymin):ymin))*(b-t);
 let out='';for(const [v,label] of ticks){const yy=y(v);out+=`<line class="gridline" x1="${l}" y1="${yy}" x2="${r}" y2="${yy}"/><text x="${l-17}" y="${yy+6}" text-anchor="end">${esc(label)}</text>`}
 for(const year of years){const xx=x(dateNum(year+'-01-01'));out+=`<text x="${xx}" y="${b+41}" text-anchor="middle">${year}</text>`}
 return {out,x,y};
}
function line(rows,x,y,key='score',style='',cls='draw'){return `<path class="${cls}" pathLength="1" d="${rows.map((r,i)=>(i?'L':'M')+x(dateNum(r.date)).toFixed(2)+','+y(r[key]).toFixed(2)).join(' ')}" stroke="${deep}" stroke-width="4" ${style}/>`}
function point(x,y,r,tip,color=deep,i=0,extra=''){return `<circle class="point" cx="${x}" cy="${y}" r="${r}" fill="${color}" style="--i:${i}" data-tip="${esc(tip)}" ${extra}><title>${esc(tip)}</title></circle>`}
function mensa(){
 const rows=DATA.mensa.rows.filter(r=>r.selected),l=320,r=1320,top=22,base=126,bottom=384,
 x=v=>l+(v-55)/105*(r-l),bell=v=>base-97*Math.exp(-.5*((v-100)/15)**2);
 let out=`<rect x="${x(131)}" y="14" width="${r-x(131)}" height="${bottom-14}" fill="#f2f6eb"/>`;
 for(const v of [60,80,100,120,140,160])out+=`<line class="gridline" x1="${x(v)}" y1="${base}" x2="${x(v)}" y2="${bottom}"/><text x="${x(v)}" y="418" text-anchor="middle">${v}</text>`;
 const curve=Array.from({length:211},(_,i)=>55+i*.5).map((v,i)=>(i?'L':'M')+x(v)+','+bell(v)).join(' ');
 out+=`<path d="${curve} L${r},${base} L${l},${base}Z" fill="#eee"/><path d="${curve}" fill="none" stroke="#a9ada4" stroke-width="2"/>`;
 out+=`<line x1="${x(100)}" y1="${top+12}" x2="${x(100)}" y2="${bottom}" stroke="#888" stroke-dasharray="4 6"/><line x1="${x(131)}" y1="${top+40}" x2="${x(131)}" y2="${bottom}" stroke="${deep}" stroke-dasharray="5 5"/>`;
 out+=`<text x="${l}" y="20" style="font-size:17px">Distribución humana de referencia</text><text x="${x(100)}" y="${base+22}" text-anchor="middle" style="font-size:16px">Media: 100</text><text x="${x(131)+14}" y="31" style="font-size:18px;fill:${deep}">Percentil 98 humano ≈131</text><text x="${x(131)+14}" y="54" style="font-size:15px">2% superior · referencia orientativa</text>`;
 rows.forEach((row,i)=>{
  const yy=177+i*33,xx=x(row.score),name=row.name.replaceAll('Claude-','Claude '),tip=`${name} · ${row.score} · ${row.n} ejecución/es · ${row.from_date} a ${row.to_date}`;
  out+=`<g class="mensa-row" style="--i:${i}"><text x="292" y="${yy+7}" text-anchor="end" style="font-size:22px;fill:#292b25">${esc(name)}</text><line x1="${l}" y1="${yy}" x2="${r}" y2="${yy}" stroke="#e4e8de"/><circle class="mensa-dot" cx="${xx}" cy="${yy}" r="7" fill="${deep}" data-tip="${esc(tip)}"><title>${esc(tip)}</title></circle><text x="${xx+18}" y="${yy+7}" style="font-size:23px;fill:${deep};font-weight:700">${row.score}</text></g>`;
 });
 $('#mensa-chart').innerHTML=svg(out,'Puntuaciones de siete modelos en Mensa Norway verbalizado a 15 de septiembre de 2026, con referencias de una distribución humana teórica');
}

function benchmark(key){
 const data=DATA[key],a=axes(dateNum('2023-01-01'),dateNum('2026-11-01'),0,100,[[0,'0%'],[25,'25%'],[50,'50%'],[75,'75%'],[100,'100%']],['2023','2024','2025','2026']);let out=a.out;
 data.rows.forEach((r,i)=>{const latest=r.date>='2026-01-01';out+=point(a.x(dateNum(r.date)),a.y(r.score),latest?4.6:4,`${r.date} · ${r.name} · ${fmt(r.score,2)}%`,latest?green:'#b9bdb5',Math.min(50,Math.floor(i/6)),`fill-opacity="${latest?.65:.42}"`)});
 out+=line(data.frontier,a.x,a.y,'score','stroke-opacity=".95"');
 const best=data.frontier.at(-1);out+=point(a.x(dateNum(best.date)),a.y(best.score),7,`${best.name} · ${fmt(best.score,2)}%`,deep,60);
 out+=`<text x="${BOX.l+10}" y="${BOX.t+25}" class="frontier-label">${data.rows.length} resultados · mejores medias registradas</text>`;
 if(key==='gpqa'){
  const y=a.y(data.human_expert);
  out+=`<line x1="${BOX.l}" y1="${y}" x2="${BOX.r}" y2="${y}" stroke="#9b6b30" stroke-width="2.5" stroke-dasharray="9 7"/><rect x="${BOX.l+15}" y="${y-34}" width="425" height="28" fill="white" fill-opacity=".94"/><text x="${BOX.l+23}" y="${y-13}" style="fill:#865b27;font-size:21px">Humano experto (PhD) · 69,7% ≈70%</text>`;
 }
 $('#'+key+'-chart').innerHTML=svg(out,key==='gpqa'?'GPQA Diamond, resultados y frontera desde 2023':'Mock AIME 2024–2025, resultados y frontera desde 2023');
}
function metr(){
 const rs=DATA.metr.filter(r=>r.sota&&r.date>='2024-01-01').sort((a,b)=>dateNum(a.date)-dateNum(b.date)),
 a=axes(dateNum('2024-01-01'),dateNum('2026-05-15'),0,20,[[0,'0 h'],[4,'4 h'],[8,'8 h'],[12,'12 h'],[16,'16 h'],[20,'20 h']],[]);
 const points=rs.map(r=>({...r,score:r.p50.estimate})),d=points.map((r,i)=>(i?'L':'M')+a.x(dateNum(r.date))+','+a.y(r.score)).join(' ');
 let out=`<defs><clipPath id="metr-reveal"><rect class="metr-sweep" x="${BOX.l}" y="0" width="${BOX.r-BOX.l}" height="430"/></clipPath></defs><rect x="${BOX.l}" y="${BOX.t}" width="${BOX.r-BOX.l}" height="${a.y(16)-BOX.t}" fill="#faf3de"/>`+a.out;
 out+=`<line x1="${BOX.l}" y1="${a.y(16)}" x2="${BOX.r}" y2="${a.y(16)}" stroke="#b88b36" stroke-dasharray="6 6"/><text x="${BOX.l+15}" y="${BOX.t+26}" style="fill:#956b1e;font-size:17px">Más de 16 h: estimación poco fiable</text>`;
 for(const [date,label] of [['2024-01-01','ene 2024'],['2024-07-01','jul 2024'],['2025-01-01','ene 2025'],['2025-07-01','jul 2025'],['2026-01-01','ene 2026'],['2026-05-01','may 2026']])out+=`<text x="${a.x(dateNum(date))}" y="${BOX.b+42}" text-anchor="middle">${label}</text>`;
 out+=`<g clip-path="url(#metr-reveal)"><path d="${d} L${a.x(dateNum(points.at(-1).date))},${BOX.b} L${a.x(dateNum(points[0].date))},${BOX.b}Z" fill="#86bc251b"/><path d="${d}" fill="none" stroke="${deep}" stroke-width="4" stroke-linejoin="round"/>`;
 const labels={'gpt 4o':['7 min',12,-18],'o3':['2 h',12,-18],'gpt 5 2':['5,9 h',-17,-18],'claude opus 4 6':['12 h',-20,0],'claude mythos preview early':['17,4 h',-17,-18]};
 rs.forEach(row=>{const v=row.p50,x=a.x(dateNum(row.date)),y=a.y(v.estimate),tip=`${row.date} · ${row.name} · 50% éxito · ${fmt(v.estimate,2)} h · IC ${fmt(v.ci_low,2)}–${fmt(v.ci_high,2)} h`;
  out+=`<circle cx="${x}" cy="${y}" r="6" fill="${v.estimate>16?'#ac7d27':deep}" data-tip="${esc(tip)}"><title>${esc(tip)}</title></circle>`;
  if(labels[row.name]){const [text,dx,dy]=labels[row.name];out+=`<text x="${x+dx}" y="${y+dy}" text-anchor="${dx<0?'end':'start'}" style="font-size:23px;font-weight:700;fill:${v.estimate>16?'#956b1e':deep};paint-order:stroke;stroke:white;stroke-width:5px;stroke-linejoin:round">${text}</text>`}
 });
 out+='</g>';
 $('#metr-chart').innerHTML=svg(out,'Horizonte METR de tareas de software al 50% de éxito, de 2024 a mayo de 2026; escala lineal de cero a veinte horas');
}

function models(){
 const a=axes(0,1,0,30,[[0,'0'],[10,'10'],[20,'20'],[30,'30']],[]);let out=a.out;
 DATA.months.forEach((r,i)=>{const x=126+i*131,h=BOX.b-a.y(r.count),y=a.y(r.count);out+=`<rect class="bar" x="${x}" y="${y}" width="74" height="${h}" fill="${i===8?'#425627':green}" style="--i:${i}" data-tip="${r.month} · ${r.count} grupos de modelos"/><text x="${x+37}" y="${y-12}" text-anchor="middle" style="font-size:24px;fill:#333">${r.count}</text><text x="${x+37}" y="${BOX.b+42}" text-anchor="middle">${r.month}</text>`});
 $('#launch-chart').innerHTML=svg(out,'Número de grupos de modelos con primera publicación cada mes de 2026');
}
function fit(){const rect=$('#viewport').getBoundingClientRect(),scale=Math.min(rect.width/1600,rect.height/900);$('#stage').style.transform=`translate(-50%,-50%) scale(${scale})`}
function go(i){
 current=Math.max(0,Math.min(SLIDES.length-1,i));$$('.slide').forEach((s,j)=>{s.classList.toggle('active',j===current);s.inert=j!==current;s.setAttribute('aria-hidden',String(j!==current))});
 $('#slide-number').value=current+1;$('#prev').disabled=current===0;$('#next').disabled=current===SLIDES.length-1;$('#chapter').textContent=SLIDES[current].section;$('#progress').style.width=(current+1)/SLIDES.length*100+'%';history.replaceState(null,'','#'+(current+1));document.title=`${current+1}/${SLIDES.length} · ${SLIDES[current].title} · Deloitte`;
 $('#data-button').disabled=!SLIDES[current].chart;
 $$('.slide video').forEach(v=>{if(v.closest('.slide').classList.contains('active')&&!matchMedia('(prefers-reduced-motion:reduce)').matches){v.currentTime=0;v.play()?.catch(()=>{})}else v.pause()});
 const epoch=++animationEpoch,reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
 $$('.active .counter,.active .multiplier-counter').forEach(counter=>{
  const target=Number(counter.dataset.target),multiply=counter.classList.contains('multiplier-counter'),start=performance.now(),duration=multiply?3600:1200;
  function tick(now){if(epoch!==animationEpoch)return;const p=reduce?1:Math.min(1,(now-start)/duration),value=multiply?Math.round(10**(4*p)):Math.round(target*(1-(1-p)**3));counter.textContent=value.toLocaleString('es-ES');if(p<1)requestAnimationFrame(tick)}
  tick(start);
 });
 $('#tooltip').style.display='none';
}
function panel(title,html){$('#panel-title').textContent=title;$('#panel-body').innerHTML=html;$('#panel').showModal();$('#panel').scrollTop=0}
function index(){panel('Productividad 10x · recorrido completo','<div class="index-list">'+SLIDES.map((r,i)=>`<button data-slide="${i}" class="${i===current?'current':''}">${String(i+1).padStart(2,'0')} · ${esc(r.title)}</button>`).join('')+'</div>')}
function notes(){panel(SLIDES[current].title,`<p>${esc(SLIDES[current].notes)}</p>`)}
function sources(){const ids=SLIDES[current].sources;panel('Fuentes · actualización 15/09/2026',(ids.length?`<p>Fuentes de esta diapositiva: ${ids.join(', ')}.</p>`:'<p>Contenido formativo adaptado del original facilitado. El registro completo de referencias aparece a continuación.</p>')+$('#source-template').innerHTML);if(ids.length)for(const a of $$('#panel-body article'))a.hidden=!ids.includes(a.id.replace('src-',''))}
function data(){
 const key=SLIDES[current].chart;if(!key)return;let note='';tableFile=key+'_datos.csv';
 if(key==='models'){tableHeaders=['Fecha','Modelo','Organización'];tableRows=DATA.models.map(r=>[r.date,r.name,r.organization]);note='Primera fecha por model_group en el catálogo completo; después se filtra entre 01/01/2026 y 13/09/2026.'}
 if(key==='mensa'){tableHeaders=['Modelo','Puntuación','Modalidad','Ejecuciones','Desde','Hasta','En gráfica'];tableRows=DATA.mensa.rows.map(r=>[r.name,r.score,r.modality,r.n,r.from_date,r.to_date,r.selected?'Sí':'No']);note=DATA.mensa.method}
 if(['gpqa','aime'].includes(key)){tableHeaders=['Fecha','Configuración','Media %','Organización','Error estándar original'];tableRows=DATA[key].rows.map(r=>[r.date,r.name,r.score,r.organization,r.stderr]);note=(key==='gpqa'?'Referencia humana en GPQA Diamond: 69,7% (expertos PhD; fuente: Epoch AI). ':'')+'Todas las observaciones con fecha y puntuación válidas desde 2023. La línea es la frontera de mean_score. El error estándar original, donde existe, se conserva en escala 0–1; no se dibuja como intervalo de confianza.'}
 if(key==='metr'){tableHeaders=['Fecha','Modelo','Frontera','Horizonte 50% h','IC inferior 50%','IC superior 50%','Horizonte 80% h','IC inferior 80%','IC superior 80%'];tableRows=DATA.metr.map(r=>[r.date,r.name,r.sota,r.p50.estimate,r.p50.ci_low,r.p50.ci_high,r.p80.estimate,r.p80.ci_low,r.p80.ci_high]);note='Valores originales en minutos, convertidos a horas dividiendo por 60. La gráfica muestra las estimaciones centrales al 50% de los modelos is_sota desde 2024 en escala lineal. Aquí se conservan todos los modelos e intervalos publicados. Última actualización pública: 08/05/2026.'}
 panel('Datos · '+SLIDES[current].title,`<p>${esc(note)}</p><button id="download-table" class="download-data">Descargar CSV</button><div class="data-scroll"><table><thead><tr>${tableHeaders.map(x=>'<th>'+esc(x)+'</th>').join('')}</tr></thead><tbody>${tableRows.map(r=>'<tr>'+r.map(x=>'<td>'+(x===null?'No disponible':esc(x))+'</td>').join('')+'</tr>').join('')}</tbody></table></div>`);
}
function download(){const q=x=>'"'+String(x??'').replaceAll('"','""')+'"',text='\ufeff'+[tableHeaders,...tableRows].map(r=>r.map(q).join(',')).join('\r\n'),u=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download=tableFile;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000)}
$$('.slide').forEach(s=>s.querySelectorAll('.reveal').forEach((e,i)=>e.style.setProperty('--i',Math.min(i,7))));
mensa();benchmark('gpqa');benchmark('aime');metr();models();fit();window.addEventListener('resize',fit);
$('#prev').onclick=()=>go(current-1);$('#next').onclick=()=>go(current+1);$('#slide-number').onchange=e=>go(Number(e.target.value)-1);$('#index-button').onclick=index;$('#notes-button').onclick=notes;$('#sources-button').onclick=sources;$('#data-button').onclick=data;$('#panel-close').onclick=()=>$('#panel').close();$('#fullscreen-button').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.();
$('#replay').onclick=()=>{const s=$('.slide.active');s.classList.remove('active');void s.offsetWidth;s.classList.add('active');go(current)};
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.slide!==undefined){go(Number(b.dataset.slide));$('#panel').close()}if(b.id==='download-table')download()});
document.addEventListener('keydown',e=>{if($('#panel').open||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;const k=e.key.toLowerCase();if(['arrowright','arrowdown',' ','pagedown'].includes(k)){e.preventDefault();go(current+1)}if(['arrowleft','arrowup','pageup'].includes(k)){e.preventDefault();go(current-1)}if(k==='home')go(0);if(k==='end')go(SLIDES.length-1);if(k==='i')index();if(k==='n')notes();if(k==='d')data();if(k==='s')sources();if(k==='f')$('#fullscreen-button').click();if(k==='r')$('#replay').click()});
document.addEventListener('visibilitychange',()=>{const v=$('.slide.active video');if(!document.hidden&&v&&v.paused&&!v.ended&&!matchMedia('(prefers-reduced-motion:reduce)').matches)v.play()?.catch(()=>{})});
document.addEventListener('pointermove',e=>{const el=e.target.closest('[data-tip]'),t=$('#tooltip');if(!el){t.style.display='none';return}t.textContent=el.dataset.tip;t.style.display='block';t.style.left=Math.min(innerWidth-t.offsetWidth-12,e.clientX+16)+'px';t.style.top=Math.min(innerHeight-t.offsetHeight-12,e.clientY+16)+'px'});
go((parseInt(location.hash.slice(1))||1)-1);
