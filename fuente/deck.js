const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],
esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
fmt=(v,d=1)=>Number(v).toLocaleString('es-ES',{maximumFractionDigits:d,minimumFractionDigits:d}),
dateNum=d=>new Date(d+'T00:00:00Z').getTime(),green='#86BC25',deep='#608d14';
const BOX={w:1400,h:430,l:85,r:1315,t:28,b:366},YEAR=365.25*86400000;
let current=0,metrP='50',tableRows=[],tableHeaders=[],tableFile='Datos.csv';
function svg(content,label){return `<svg viewBox="0 0 ${BOX.w} ${BOX.h}" role="img" aria-label="${esc(label)}">${content}</svg>`}
function axes(xmin,xmax,ymin,ymax,ticks,years,log=false){
 const {l,r,t,b}=BOX,x=v=>l+(v-xmin)/(xmax-xmin)*(r-l),y=v=>b-((log?Math.log10(v):v)-(log?Math.log10(ymin):ymin))/((log?Math.log10(ymax):ymax)-(log?Math.log10(ymin):ymin))*(b-t);
 let out='';for(const [v,label] of ticks){const yy=y(v);out+=`<line class="gridline" x1="${l}" y1="${yy}" x2="${r}" y2="${yy}"/><text x="${l-17}" y="${yy+6}" text-anchor="end">${esc(label)}</text>`}
 for(const year of years){const xx=x(dateNum(year+'-01-01'));out+=`<text x="${xx}" y="${b+41}" text-anchor="middle">${year}</text>`}
 return {out,x,y};
}
function line(rows,x,y,key='score',style='',cls='draw'){return `<path class="${cls}" pathLength="1" d="${rows.map((r,i)=>(i?'L':'M')+x(dateNum(r.date)).toFixed(2)+','+y(r[key]).toFixed(2)).join(' ')}" stroke="${deep}" stroke-width="4" ${style}/>`}
function point(x,y,r,tip,color=deep,i=0,extra=''){return `<circle class="point" cx="${x}" cy="${y}" r="${r}" fill="${color}" style="--i:${i}" data-tip="${esc(tip)}" ${extra}><title>${esc(tip)}</title></circle>`}
function eci(){
 const rows=DATA.eci,max=Math.ceil(Math.max(...rows.flatMap(r=>[r.score,r.high||r.score]))/20)*20,min=Math.floor(Math.min(...rows.map(r=>r.low??r.score))/20)*20;
 const ticks=[];for(let v=min;v<=max;v+=20)ticks.push([v,String(v)]);
 const a=axes(dateNum('2023-01-01'),dateNum('2026-11-01'),min,max,ticks,['2023','2024','2025','2026']);let out=a.out;
 rows.forEach((r,i)=>{if(Number.isFinite(r.low)&&Number.isFinite(r.high)){const x=a.x(dateNum(r.date)),lo=a.y(r.low),hi=a.y(r.high);out+=`<path d="M${x},${lo}V${hi}M${x-5},${lo}H${x+5}M${x-5},${hi}H${x+5}" stroke="#bbcba1" stroke-width="2" fill="none"/>`}});
 out+=line(rows,a.x,a.y);rows.forEach((r,i)=>out+=point(a.x(dateNum(r.date)),a.y(r.score),5,`${r.date} · ${r.name} · ECI ${fmt(r.score,2)}${r.low!==null?' · intervalo '+fmt(r.low,2)+'–'+fmt(r.high,2):' · intervalo no disponible'}`,deep,i));
 $('#eci-chart').innerHTML=svg(out,'Evolución de la frontera de ECI con intervalos publicados');
}
function benchmark(key){
 const data=DATA[key],a=axes(dateNum('2023-01-01'),dateNum('2026-11-01'),0,100,[[0,'0%'],[25,'25%'],[50,'50%'],[75,'75%'],[100,'100%']],['2023','2024','2025','2026']);let out=a.out;
 data.rows.forEach((r,i)=>{const latest=r.date>='2026-01-01';out+=point(a.x(dateNum(r.date)),a.y(r.score),latest?4.6:4,`${r.date} · ${r.name} · ${fmt(r.score,2)}%`,latest?green:'#b9bdb5',Math.min(50,Math.floor(i/6)),`fill-opacity="${latest?.65:.42}"`)});
 out+=line(data.frontier,a.x,a.y,'score','stroke-opacity=".95"');
 const best=data.frontier.at(-1);out+=point(a.x(dateNum(best.date)),a.y(best.score),7,`${best.name} · ${fmt(best.score,2)}%`,deep,60);
 out+=`<text x="${BOX.l+10}" y="${BOX.t+25}" class="frontier-label">${data.rows.length} resultados · mejores medias registradas</text>`;
 $('#'+key+'-chart').innerHTML=svg(out,key==='gpqa'?'GPQA Diamond, resultados y frontera desde 2023':'Mock AIME 2024–2025, resultados y frontera desde 2023');
}
function metr(p='50'){
 metrP=p;$$('[data-metr]').forEach(b=>b.classList.toggle('selected',b.dataset.metr===p));
 const rs=DATA.metr.filter(r=>r.sota),a=axes(dateNum('2019-01-01'),dateNum('2026-10-01'),.00001,100,[[1/3600,'1 s'],[1/60,'1 min'],[1,'1 h'],[16,'16 h'],[100,'100 h']],['2019','2020','2021','2022','2023','2024','2025','2026'],true);
 let out=`<rect x="${BOX.l}" y="${BOX.t}" width="${BOX.r-BOX.l}" height="${a.y(16)-BOX.t}" fill="#faf3de"/>`+a.out;
 out+=`<line x1="${BOX.l}" y1="${a.y(16)}" x2="${BOX.r}" y2="${a.y(16)}" stroke="#b88b36" stroke-dasharray="6 6"/><text x="${BOX.l+14}" y="${BOX.t+24}" style="fill:#9b752f;font-size:17px">Más de 16 h: estimación poco fiable</text>`;
 const rows=rs.map(r=>({...r,score:r['p'+p].estimate}));out+=line(rows,a.x,a.y);
 rs.forEach((r,i)=>{const v=r['p'+p],x=a.x(dateNum(r.date));if(v.ci_low>0&&v.ci_high>0)out+=`<path d="M${x},${a.y(v.ci_low)}V${a.y(v.ci_high)}M${x-5},${a.y(v.ci_low)}H${x+5}M${x-5},${a.y(v.ci_high)}H${x+5}" stroke="#b2c593" stroke-width="2" fill="none"/>`;out+=point(x,a.y(v.estimate),5,`${r.date} · ${r.name} · ${p}% éxito · ${fmt(v.estimate,4)} h · IC ${fmt(v.ci_low,4)}–${fmt(v.ci_high,4)} h`,deep,i)});
 $('#metr-chart').innerHTML=svg(out,`Horizonte METR al ${p}% de éxito; escala logarítmica e intervalos`);
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
 const counter=$('.active .counter');if(counter){const target=Number(counter.dataset.target),start=performance.now(),reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;function tick(t){const p=reduce?1:Math.min(1,(t-start)/1200);counter.textContent=Math.round(target*(1-(1-p)**3));if(p<1&&counter.closest('.slide').classList.contains('active'))requestAnimationFrame(tick)}requestAnimationFrame(tick)}
 $('#tooltip').style.display='none';
}
function panel(title,html){$('#panel-title').textContent=title;$('#panel-body').innerHTML=html;$('#panel').showModal();$('#panel').scrollTop=0}
function index(){panel('Productividad 10x · recorrido completo','<div class="index-list">'+SLIDES.map((r,i)=>`<button data-slide="${i}" class="${i===current?'current':''}">${String(i+1).padStart(2,'0')} · ${esc(r.title)}</button>`).join('')+'</div>')}
function notes(){panel(SLIDES[current].title,`<p>${esc(SLIDES[current].notes)}</p>`)}
function sources(){const ids=SLIDES[current].sources;panel('Fuentes · consulta 13/09/2026',(ids.length?`<p>Fuentes de esta diapositiva: ${ids.join(', ')}.</p>`:'<p>Contenido formativo adaptado del original facilitado. El registro completo de referencias aparece a continuación.</p>')+$('#source-template').innerHTML);if(ids.length)for(const a of $$('#panel-body article'))a.hidden=!ids.includes(a.id.replace('src-',''))}
function data(){
 const key=SLIDES[current].chart;if(!key)return;let note='';tableFile=key+'_datos.csv';
 if(key==='models'){tableHeaders=['Fecha','Modelo','Organización'];tableRows=DATA.models.map(r=>[r.date,r.name,r.organization]);note='Primera fecha por model_group en el catálogo completo; después se filtra entre 01/01/2026 y 13/09/2026.'}
 if(key==='eci'){tableHeaders=['Fecha','Modelo','ECI','IC inferior','IC superior'];tableRows=DATA.eci.map(r=>[r.date,r.name,r.score,r.low,r.high]);note='Máximos sucesivos. Un intervalo ausente se conserva como desconocido.'}
 if(['gpqa','aime'].includes(key)){tableHeaders=['Fecha','Configuración','Media %','Organización','Error estándar original'];tableRows=DATA[key].rows.map(r=>[r.date,r.name,r.score,r.organization,r.stderr]);note='Todas las observaciones con fecha y puntuación válidas desde 2023. La línea es la frontera de mean_score. El error estándar original, donde existe, se conserva en escala 0–1; no se dibuja como intervalo de confianza.'}
 if(key==='metr'){tableHeaders=['Fecha','Modelo','Frontera','Horizonte 50% h','IC inferior 50%','IC superior 50%','Horizonte 80% h','IC inferior 80%','IC superior 80%'];tableRows=DATA.metr.map(r=>[r.date,r.name,r.sota,r.p50.estimate,r.p50.ci_low,r.p50.ci_high,r.p80.estimate,r.p80.ci_low,r.p80.ci_high]);note='Valores originales en minutos, convertidos a horas dividiendo por 60. La gráfica utiliza modelos is_sota. Última actualización pública: 08/05/2026.'}
 panel('Datos · '+SLIDES[current].title,`<p>${esc(note)}</p><button id="download-table" class="download-data">Descargar CSV</button><div class="data-scroll"><table><thead><tr>${tableHeaders.map(x=>'<th>'+esc(x)+'</th>').join('')}</tr></thead><tbody>${tableRows.map(r=>'<tr>'+r.map(x=>'<td>'+(x===null?'No disponible':esc(x))+'</td>').join('')+'</tr>').join('')}</tbody></table></div>`);
}
function download(){const q=x=>'"'+String(x??'').replaceAll('"','""')+'"',text='\ufeff'+[tableHeaders,...tableRows].map(r=>r.map(q).join(',')).join('\r\n'),u=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download=tableFile;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000)}
$$('.slide').forEach(s=>s.querySelectorAll('.reveal').forEach((e,i)=>e.style.setProperty('--i',Math.min(i,7))));
eci();benchmark('gpqa');benchmark('aime');metr();models();fit();window.addEventListener('resize',fit);
$('#prev').onclick=()=>go(current-1);$('#next').onclick=()=>go(current+1);$('#slide-number').onchange=e=>go(Number(e.target.value)-1);$('#index-button').onclick=index;$('#notes-button').onclick=notes;$('#sources-button').onclick=sources;$('#data-button').onclick=data;$('#panel-close').onclick=()=>$('#panel').close();$('#fullscreen-button').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.();
$('#replay').onclick=()=>{const s=$('.slide.active');s.classList.remove('active');void s.offsetWidth;s.classList.add('active');go(current)};
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.slide!==undefined){go(Number(b.dataset.slide));$('#panel').close()}if(b.dataset.metr)metr(b.dataset.metr);if(b.id==='download-table')download()});
document.addEventListener('keydown',e=>{if($('#panel').open||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;const k=e.key.toLowerCase();if(['arrowright','arrowdown',' ','pagedown'].includes(k)){e.preventDefault();go(current+1)}if(['arrowleft','arrowup','pageup'].includes(k)){e.preventDefault();go(current-1)}if(k==='home')go(0);if(k==='end')go(SLIDES.length-1);if(k==='i')index();if(k==='n')notes();if(k==='d')data();if(k==='s')sources();if(k==='f')$('#fullscreen-button').click();if(k==='r')$('#replay').click()});
document.addEventListener('visibilitychange',()=>{const v=$('.slide.active video');if(!document.hidden&&v&&v.paused&&!v.ended&&!matchMedia('(prefers-reduced-motion:reduce)').matches)v.play()?.catch(()=>{})});
document.addEventListener('pointermove',e=>{const el=e.target.closest('[data-tip]'),t=$('#tooltip');if(!el){t.style.display='none';return}t.textContent=el.dataset.tip;t.style.display='block';t.style.left=Math.min(innerWidth-t.offsetWidth-12,e.clientX+16)+'px';t.style.top=Math.min(innerHeight-t.offsetHeight-12,e.clientY+16)+'px'});
go((parseInt(location.hash.slice(1))||1)-1);
