/* Dashboard CIC 2023. Solo conteos agregados; sin registros individuales. */
(() => {
  'use strict';
  const DATA = window.DASHBOARD_DATA;
  const $ = id => document.getElementById(id);
  const number = value => new Intl.NumberFormat('es-AR').format(value);
  const percent = value => new Intl.NumberFormat('es-AR', {maximumFractionDigits:1, minimumFractionDigits:1}).format(value) + ' %';
  const countPercent = (value, base) => `${number(value)} (${base ? percent(value/base*100) : '—'})`;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const COLORS = {primary:'#247b74', dark:'#124e4c', orange:'#bf714f', muted:'#9aa89c', grid:'#e9eee6'};
  const YES_NO = ['Sí', 'No'];
  const FILTERS = {province:'', area:'', mode:''};
  let tab = 'distribucion', aggregateData, charts = [];
  const TABS = {
    distribucion: {kicker:'01 / DISTRIBUCIÓN', title:'Dónde y en qué áreas', description:'Lugar de presentación a carrera, modalidad y composición disciplinar del relevamiento.'},
    situacion: {kicker:'02 / SITUACIÓN ACTUAL', title:'Becas, trabajo y permanencia', description:'La situación informada en la encuesta. Cada vínculo se representa por separado; una respuesta puede mencionar varios.'},
    tramites: {kicker:'03 / BECAS Y ALTA', title:'El recorrido hasta el ingreso', description:'Solicitudes de beca extraordinaria, requisitos y estado del trámite de alta.'},
    acciones: {kicker:'04 / ACCIONES Y PARTICULARIDADES', title:'Propuestas y situaciones a considerar', description:'Las acciones colectivas señaladas y los temas que aparecen en los comentarios de particularidades.'},
  };
  const DEFINITIONS = [
    {key:'mode', tab:'distribucion', title:'Modalidad de ingreso', kicker:'CONVOCATORIA', orientation:'horizontal', single:true, wide:true, note:'Se conservan las etiquetas específicas de Tecnología, Ciencias del Mar y Mendoza. Se corrigen ocho modalidades mediante coincidencias nominales únicas con los anexos oficiales de CIC 2023.'},
    {key:'disciplinaryArea', id:'area', tab:'distribucion', title:'Gran área — General, Fortalecimiento y Exterior', kicker:'DISTRIBUCIÓN DISCIPLINAR', single:true, wide:true, height:390, scoped:true, emptyNote:'Esta selección se presenta en los gráficos de Temas Estratégicos y Proyectos Especiales.', note:'Incluye únicamente General, Fortalecimiento y Exterior: 256 respuestas sin filtros, todas con gran área identificada. Los porcentajes usan las respuestas de esas modalidades que cumplen los filtros activos. Temas Estratégicos y Proyectos Especiales se muestran por sus sectores y proyectos en los gráficos siguientes; su gran área no se deduce de esas categorías.'},
    {key:'strategicSector', tab:'distribucion', title:'Temas Estratégicos y Tecnología — sectores', kicker:'CLASIFICACIÓN DE LA MODALIDAD', single:true, wide:true, scroll:true, height:430, scoped:true, emptyNote:'No hay respuestas de Temas Estratégicos y Tecnología dentro de esta selección.', note:'Solo ingresos de Temas Estratégicos y Tecnología: 56 respuestas sin filtros. Cada barra corresponde a una subcomisión oficial de la convocatoria 2023. Los porcentajes se calculan sobre las respuestas de esta modalidad que cumplen los filtros. Deslizá horizontalmente para ver todos los sectores.'},
    {key:'specialProject', tab:'distribucion', title:'Proyectos Especiales — proyectos y líneas', kicker:'CLASIFICACIÓN DE LA MODALIDAD', single:true, wide:true, scroll:true, height:430, scoped:true, emptyNote:'No hay respuestas de Proyectos Especiales dentro de esta selección.', note:'Solo ingresos de Proyectos Especiales: 53 respuestas sin filtros, incluidas las etiquetas específicas de Ciencias del Mar y Mendoza. Cada barra corresponde a un proyecto o línea oficial de 2023. Los porcentajes se calculan sobre las respuestas de esta modalidad que cumplen los filtros.'},
    {key:'commission', tab:'distribucion', title:'Comisión o subcomisión', kicker:'EVALUACIÓN', single:true, wide:true, scroll:true, height:490, excludedLabels:['Comisión no especificada','Sin dato'], missingTitle:'Sin comisión identificada', note:'Nombres normalizados con documentación oficial. En Fortalecimiento se identifica la subcomisión ad hoc por la modalidad y la gran área, conservando separada la disciplina. Los casos pendientes se informan aparte y permanecen en las tablas y descargas. Deslizá horizontalmente para recorrer las categorías; los nombres completos están en los datos y al pasar el puntero.'},
    {key:'scholarship', tab:'situacion', title:'Situación de beca CONICET', kicker:'TIPO DE BECA', single:true, wide:true, height:390, note:'Sin beca CONICET no significa ausencia de otros trabajos o becas. Los casos sin dato sobre beca CONICET conservan sus otros vínculos clasificados.'},
    {key:'coverage', tab:'situacion', title:'Plazo de cobertura de beca CONICET', kicker:'COBERTURA', single:true, wide:true, height:365, note:'Solo becas CONICET identificadas. Las extensiones se clasifican Hasta el alta por actualización del responsable del relevamiento. Julio de 2026 es una interpretación contextual de un caso; no se lo reclasificó como beca vencida.'},
    {key:'links', tab:'situacion', title:'Otros vínculos y actividades actuales', kicker:'TRABAJO Y SOSTENIMIENTO', wide:true, scroll:true, height:480, note:'Integra información explícita y clasificaciones aprobadas de situación actual y otras respuestas. Cada caso cuenta una vez por vínculo. Incluye tres relatos de estadía en el exterior clasificados como trabajo por indicación del responsable del relevamiento.'},
    {key:'otherScholarships', tab:'situacion', title:'Otras becas y posdoctorados', kicker:'OTROS FINANCIAMIENTOS', wide:true, height:370, note:'Se conservan los financiadores sin identificar. Esta categoría no implica que todos los posdoctorados sean contratos o becas de la misma institución. La beca Humboldt declara diciembre de 2026 y no se actualizó a Hasta el alta.'},
    {key:'entryStatus', tab:'situacion', title:'Situaciones de ingreso informadas', kicker:'MENCIONES EXPLÍCITAS', wide:true, height:310, note:'Únicamente casos que informaron explícitamente renuncia, intención de no aceptar o ingreso efectivizado. No se infiere la situación del resto y se conservan las 365 respuestas.'},
    {key:'J', id:'permanencia', tab:'situacion', title:'¿Se mantiene en Ciencia y Técnica?', kicker:'PERMANENCIA', kind:'pie', bool:true, note:'Porcentaje sobre respuestas Sí/No. Los vacíos se informan aparte y no se interpretan como No.'},
    {key:'N', id:'exterior', tab:'situacion', title:'¿Actualmente está en el exterior?', kicker:'RESIDENCIA ACTUAL', kind:'pie', bool:true, note:'La residencia actual es distinta del lugar de presentación a carrera que muestra el mapa.'},
    {key:'K', tab:'situacion', title:'Formas de permanencia en Ciencia y Técnica', kicker:'COMENTARIOS SOBRE PERMANENCIA', orientation:'horizontal', wide:true, note:'Solo comentarios de esta pregunta, sin sumar nuevos casos de situación actual. Se conservan cuatro comentarios que mencionan actividades aunque respondieron No a permanencia. Las categorías pueden superponerse.'},
    {key:'H', id:'solicitud-barras', tab:'tramites', title:'Inicio de solicitud de beca extraordinaria', kicker:'SOLICITUD / CANTIDADES', bool:true, height:300, note:'Se muestran las respuestas Sí/No. Los vacíos quedan fuera de las barras y se detallan debajo.'},
    {key:'H', id:'solicitud-torta', tab:'tramites', title:'Inicio de solicitud: proporciones', kicker:'SOLICITUD / PORCENTAJES', kind:'pie', bool:true, note:'Misma pregunta que el gráfico de barras, con porcentaje sobre respuestas válidas.'},
    {key:'I', tab:'tramites', title:'Situación del pedido de beca extraordinaria', kicker:'RESULTADOS INFORMADOS', orientation:'horizontal', wide:true, note:'Clasificación de los comentarios de esta pregunta; no representa todos los pedidos de beca. Su universo es independiente del Sí/No anterior.'},
    {key:'L', id:'alta', tab:'tramites', title:'¿Completó el trámite de alta?', kicker:'DOCUMENTACIÓN', kind:'pie', bool:true, wide:true, note:'Completar el trámite no equivale a un ingreso efectivizado. Se conserva la respuesta original de la encuesta.'},
    {key:'M', tab:'tramites', title:'Motivos de no completar el trámite de alta', kicker:'MOTIVOS INFORMADOS', orientation:'horizontal', wide:true, note:'Comentarios con motivos identificables; se excluye una respuesta sin información. Una respuesta puede mencionar más de un motivo. Ciudadanía aparece aquí en 14 respuestas del relevamiento completo.'},
    {key:'O', tab:'tramites', title:'Requisitos y situación frente a la beca extraordinaria', kicker:'REQUISITOS INFORMADOS', orientation:'horizontal', wide:true, note:'Se distinguen requisitos reportados de no solicitud, renuncia o falta de información. La documentación presentada no se supone obligatoria cuando el comentario no lo aclara.'},
    {key:'P', tab:'acciones', title:'Acciones colectivas consideradas', kicker:'PROPUESTAS', orientation:'horizontal', wide:true, percentage:true, others:'POthers', note:'Respuesta múltiple. Porcentajes sobre todas las respuestas de la selección, incluidas las que no agregan propuestas: sin filtros, 365. Se unifican los reclamos judiciales por altas y financiamiento. Los rechazos expresados en comentarios no se cuentan como apoyo.'},
    {key:'Q', tab:'acciones', title:'Particularidades de los casos de ingreso', kicker:'TEMAS DE LOS COMENTARIOS', orientation:'horizontal', wide:true, others:'QOthers', note:'Comentarios con particularidades identificables. Cada respuesta puede aportar a varios temas. No se suman estas menciones con las de otras preguntas: en el relevamiento completo, ciudadanía aparece aquí en 5 respuestas, algunas también incluidas en motivos del alta.'},
  ];

  function aggregate(filters = FILTERS) {
    const result = {n:0, counts:{}, bases:{}};
    for (const bucket of DATA.buckets) {
      if (Object.entries(filters).some(([key,value]) => value && bucket[key] !== value)) continue;
      result.n += bucket.n;
      for (const [metric,counts] of Object.entries(bucket.counts)) {
        const target = result.counts[metric] ||= {};
        for (const [label,n] of Object.entries(counts)) target[label] = (target[label] || 0) + n;
      }
      for (const [key,n] of Object.entries(bucket.bases)) result.bases[key] = (result.bases[key] || 0) + n;
    }
    return result;
  }

  function rowsFor(def, data = aggregateData) {
    const values = data.counts[def.key] || {};
    if (def.bool) return YES_NO.map(label => [label,values[label] || 0]);
    return Object.entries(values).sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0],'es'));
  }

  function denominator(def, data = aggregateData) {
    if (def.bool) return YES_NO.reduce((n,label) => n + (data.counts[def.key]?.[label] || 0), 0);
    return def.percentage ? data.n : data.bases[def.key] || 0;
  }

  function splitLabel(label, limit = 24) {
    const words = label.split(' '), lines = [];
    let line = '';
    for (const word of words) {
      if (line.length && (line+' '+word).length > limit) { lines.push(line); line = word; }
      else line += (line ? ' ' : '') + word;
    }
    if (line) lines.push(line);
    return lines;
  }

  function barColor(label) {
    if (/^Sin |^Gran área sin |^Comisión no /.test(label)) return '#9da99d';
    if (label === 'Otros') return '#b48262';
    return COLORS.primary;
  }

  const valueLabels = {
    id:'valueLabels',
    afterDatasetsDraw(chart) {
      if (chart.config.type !== 'bar') return;
      const {ctx} = chart;
      ctx.save();ctx.font='600 10px system-ui';ctx.fillStyle='#294b43';
      const horizontal = chart.options.indexAxis === 'y';
      chart.getDatasetMeta(0).data.forEach((bar,index) => {
        const value = chart.data.datasets[0].data[index];
        if (!value) return;
        const count = chart.$counts?.[index];
        if (count === undefined) return;
        const label = countPercent(count, chart.$base);
        ctx.textAlign = horizontal ? 'left' : 'center';
        ctx.textBaseline = horizontal ? 'middle' : 'bottom';
        ctx.fillText(label,horizontal ? bar.x+7 : bar.x,horizontal ? bar.y : bar.y-7);
      });
      ctx.restore();
    },
  };

  function download(content, filename, type) {
    const url = URL.createObjectURL(new Blob([content],{type}));
    const link = document.createElement('a');link.href=url;link.download=filename;link.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  }

  function tableMarkup(rows, def) {
    const den = denominator(def), showPercent = true;
    return `<table><thead><tr><th>Categoría</th><th class="num">Respuestas</th>${showPercent ? '<th class="num">Porcentaje</th>' : ''}</tr></thead><tbody>${rows.map(([label,n]) => `<tr><td>${escape(label)}</td><td class="num">${number(n)}</td>${showPercent ? `<td class="num">${den ? percent(n/den*100) : '—'}</td>` : ''}</tr>`).join('')}</tbody></table>`;
  }

  function createCard(def) {
    const allRows = rowsFor(def), rows = def.excludedLabels ? allRows.filter(([label]) => !def.excludedLabels.includes(label)) : allRows;
    const missingRows = def.excludedLabels ? allRows.filter(([label]) => def.excludedLabels.includes(label)) : [];
    const missingCount = missingRows.reduce((sum,[,n]) => sum+n,0);
    const den = denominator(def), base = aggregateData.bases[def.key] || 0;
    const id = def.id || def.key;
    const card = document.createElement('article');card.className='card'+(def.wide ? ' wide' : '');card.id='card-'+id;
    let caption = def.bool ? `${number(den)} respuestas válidas de ${number(aggregateData.n)} en la selección` :
      def.percentage ? `Porcentaje sobre ${number(aggregateData.n)} respuestas · Selección múltiple` :
      `${number(base)} respuestas${def.single ? '' : ' con información clasificada'} · Cantidad y porcentaje por categoría`;
    if (def.scoped) caption=`${number(den)} respuestas de estas modalidades dentro de ${number(aggregateData.n)} en la selección · Cantidad y porcentaje`;
    if (def.excludedLabels) caption=`${number(base-missingCount)} respuestas con categoría identificada de ${number(base)} en la selección · Porcentajes sobre ${number(den)} respuestas`;
    card.innerHTML=`<div class="card-head"><div><div class="card-kicker">${escape(def.kicker)}</div><h3>${escape(def.title)}</h3></div><div class="card-actions"><button type="button" class="table-button" aria-expanded="false" aria-controls="table-${id}" aria-label="Ver datos: ${escape(def.title)}">Datos</button><button type="button" class="png-button" aria-label="Descargar gráfico: ${escape(def.title)}">PNG ↓</button></div></div><p class="card-caption">${caption}</p><div class="chart-scroll"><div class="chart-inner"></div></div><div id="table-${id}" class="data-table-wrap" hidden>${tableMarkup(allRows,def)}</div>`;
    const inner = card.querySelector('.chart-inner');
    if (!base || !den || !rows.some(r => r[1])) {
      inner.className='chart-no-data';inner.innerHTML=def.scoped && aggregateData.n ? `<strong>Sin casos de estas modalidades en la selección</strong><span>${escape(def.emptyNote)}</span>` : missingCount ? '<strong>Sin categoría identificada en esta selección</strong><span>Los casos pendientes se detallan debajo y en la tabla de datos.</span>' : '<strong>Sin respuestas para este gráfico</strong><span>Cambiá los filtros para explorar otros casos.</span>';
      card.querySelector('.png-button').disabled=true;
    } else {
      const canvas = document.createElement('canvas');canvas.setAttribute('role','img');canvas.setAttribute('aria-label',`${def.title}. ${number(base)} respuestas. Los valores completos están disponibles en el botón Datos.`);inner.append(canvas);
      const horizontal = def.orientation === 'horizontal';
      const labelLimit=horizontal ? (window.innerWidth<600 ? 20 : 43) : def.scroll ? 19 : 25;
      const rowHeight=Math.max(38,Math.max(...rows.map(([label]) => splitLabel(label,labelLimit).length))*13+16);
      inner.style.height=(def.kind === 'pie' ? 235 : horizontal ? Math.max(240,rows.length*rowHeight+40) : def.height || 350)+'px';
      if (def.scroll) inner.style.minWidth=Math.max(650,rows.length*105)+'px';
      else if (!horizontal && def.kind !== 'pie') inner.style.minWidth=rows.length*130+'px';
      const labels = rows.map(r => r[0]), counts = rows.map(r => r[1]);
      const values = def.percentage ? counts.map(n => n/den*100) : counts;
      const pie = def.kind === 'pie';
      const settings = {
        type:pie ? 'pie' : 'bar',
        data:{labels:pie ? labels : labels.map(l => splitLabel(l,labelLimit)),datasets:[{data:values,backgroundColor:pie ? [COLORS.primary,COLORS.orange] : labels.map(barColor),borderWidth:pie ? 4 : 0,borderColor:'#ffffff',borderRadius:pie ? 0 : 4,maxBarThickness:horizontal ? 23 : 65,hoverBackgroundColor:pie ? undefined : COLORS.dark}]},
        plugins:[valueLabels],
        options:{responsive:true,maintainAspectRatio:false,animation:false,indexAxis:horizontal ? 'y' : 'x',layout:{padding:{top:pie ? 0 : 20,right:horizontal ? 105 : 12,bottom:2}},
          plugins:{legend:{display:false},tooltip:{backgroundColor:'#143d37',padding:12,displayColors:false,
            callbacks:{title:items => splitLabel(labels[items[0].dataIndex],65),label:item => {
              const n=counts[item.dataIndex];
              return `${countPercent(n,den)} respuestas`;
            }}},title:{display:false}},
          scales:pie ? {} : {
            x:{grid:{display:horizontal,color:COLORS.grid},border:{display:false},beginAtZero:true,max:horizontal && def.percentage ? 100 : undefined,
              ticks:{autoSkip:false,color:'#53695f',font:{size:10},maxRotation:0,minRotation:0,precision:0,
                callback:horizontal ? (def.percentage ? value => value+' %' : value => number(value)) : function(value){return this.getLabelForValue(value);}}},
            y:{grid:{display:!horizontal,color:COLORS.grid},border:{display:false},beginAtZero:true,
              ticks:{autoSkip:false,color:'#53695f',font:{size:10},precision:0},suggestedMax:!horizontal ? Math.max(...values)*1.17 : undefined},
          },
        },
      };
      const chart = new Chart(canvas,settings);chart.$counts=counts;chart.$base=den;chart.update('none');charts.push(chart);
      card.querySelector('.png-button').addEventListener('click',() => {
        const a=document.createElement('a');a.download=`cic2023-${id}.png`;a.href=chart.toBase64Image();a.click();
      });
      if (pie) {
        const legend=document.createElement('div');legend.className='pie-legend';
        legend.innerHTML=rows.map(([label,n],index) => `<div><span class="legend-dot" style="background:${index ? COLORS.orange : COLORS.primary}"></span><span>${escape(label)}</span><strong>${countPercent(n,den)}</strong></div>`).join('');
        card.append(legend);
      }
    }
    if (def.bool) {
      const missing=aggregateData.counts[def.key]?.['Sin respuesta'] || 0;
      const note=document.createElement('div');note.className='missing-note';note.textContent=`Sin respuesta: ${countPercent(missing,aggregateData.n)} del total de la selección. Los porcentajes Sí/No usan las respuestas válidas.`;card.append(note);
    }
    if (missingCount) {
      const note=document.createElement('div');note.className='missing-note';
      note.innerHTML=`<strong>${escape(def.missingTitle)}: ${countPercent(missingCount,aggregateData.n)}.</strong> Incluidas en el total de la selección y en la tabla de datos.<br>${missingRows.map(([label,n]) => `${escape(label)}: ${countPercent(n,aggregateData.n)}`).join(' · ')}`;
      card.append(note);
    }
    if (def.others) {
      const detail = Object.entries(aggregateData.counts[def.others] || {}).sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0],'es'));
      if (detail.length) {
        const details=document.createElement('details');details.className='others-detail';
        details.innerHTML=`<summary>Qué incluye Otros en esta selección</summary><ul>${detail.map(([l,n]) => `<li>${escape(l)} <strong>${countPercent(n,den)}</strong></li>`).join('')}</ul>`;
        card.append(details);
      }
    }
    const note=document.createElement('p');note.className='chart-footnote';note.textContent=def.note;card.append(note);
    const toggle=card.querySelector('.table-button'), table=card.querySelector('.data-table-wrap');
    toggle.addEventListener('click',() => {table.hidden=!table.hidden;toggle.setAttribute('aria-expanded',String(!table.hidden));});
    return card;
  }

  const MAP_COLORS=['#edf1e8','#c9e2cb','#a1d0b3','#72b59d','#418b7b','#175d56'];
  function mapColor(n) { return MAP_COLORS[n === 0 ? 0 : n < 5 ? 1 : n < 10 ? 2 : n < 20 ? 3 : n < 50 ? 4 : 5]; }

  function renderMap() {
    const counts=aggregateData.counts.province || {}, n=aggregateData.n;
    const card=document.createElement('article');card.className='card map-card';card.id='card-mapa';
    const properties=(name,extra='') => `class="province-shape${FILTERS.province === name ? ' selected' : ''}${extra}" data-province="${escape(name)}" fill="${mapColor(counts[name] || 0)}" tabindex="0" role="button" aria-label="${escape(name)}: ${countPercent(counts[name] || 0,n)} respuestas. Seleccionar provincia." aria-pressed="${FILTERS.province === name}"`;
    const [cx,cy]=DATA.map.cabaPoint;
    const cabaCount=counts.CABA || 0;
    const mapSvg=`<svg id="argentina-map" xmlns="http://www.w3.org/2000/svg" viewBox="${DATA.map.viewBox}" role="group" aria-label="Mapa de respuestas por provincia. Seleccioná una provincia para filtrar.">
      <title>Respuestas por provincia de presentación a carrera</title><desc>Las 24 jurisdicciones se representan con colores por cantidad de respuestas. CABA tiene un recuadro ampliado.</desc>
      ${DATA.map.provinces.map(p => `<path d="${p.d}" ${properties(p.name)}><title>${escape(p.name)}: ${countPercent(counts[p.name] || 0,n)}</title></path>`).join('')}
      <text x="518" y="192" class="map-label" fill="#78988b" font-style="italic">Océano Atlántico</text>
      <path class="map-connector" d="M${cx},${cy}L503,371L503,420"/>
      <rect x="480" y="382" width="178" height="215" rx="12" class="inset-box"/>
      <text x="495" y="402" class="map-label" font-size="9">AMPLIACIÓN</text>
      <path d="${DATA.map.caba}" ${properties('CABA')}><title>CABA: ${countPercent(cabaCount,n)} respuestas</title></path>
      <text x="565" y="552" text-anchor="middle" class="map-label" font-weight="650">CABA</text>
      <text x="565" y="580" text-anchor="middle" class="map-count">${countPercent(cabaCount,n)}</text>
      <circle cx="${cx}" cy="${cy}" r="5" ${properties('CABA',' caba-marker')}/>
    </svg>`;
    const ranks=DATA.options.province.map(p => [p,counts[p] || 0]).sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0],'es'));
    card.innerHTML=`<div class="card-head"><div><div class="card-kicker">DISTRIBUCIÓN TERRITORIAL</div><h3>Provincia de presentación a carrera</h3></div><div class="card-actions"><button class="svg-download" aria-label="Descargar mapa en formato SVG">SVG ↓</button></div></div><p class="card-caption">${number(n)} respuestas · 24 jurisdicciones · Seleccioná una provincia en el mapa o en la lista para filtrar.</p><div class="map-layout"><div class="map-canvas">${mapSvg}<div class="map-legend">${['0','1–4','5–9','10–19','20–49','50 o más'].map((l,i) => `<div><span style="background:${MAP_COLORS[i]}"></span><small>${l}</small></div>`).join('')}</div><div class="map-hint">Cantidad de respuestas · Misma escala para CABA y las provincias</div></div><div class="map-side"><h4>Respuestas por jurisdicción</h4><div class="map-rank">${ranks.map(([p,count]) => `<button type="button" class="${FILTERS.province === p ? 'selected ' : ''}${!count ? 'province-zero' : ''}" data-province="${escape(p)}" aria-pressed="${FILTERS.province === p}"><span>${escape(p)}</span><strong>${number(count)}</strong><small>(${n ? percent(count/n*100) : '—'})</small></button>`).join('')}</div></div></div><p class="chart-footnote">La ubicación es la de presentación a carrera, no la residencia actual. CABA se cuenta una sola vez aunque aparezca en su ubicación real y en el recuadro. Vista del territorio continental y Tierra del Fuego. Geometrías: IGN, archivo utilizado en el proyecto OAJ.</p>`;
    for (const element of card.querySelectorAll('[data-province]')) {
      const province=element.dataset.province;
      const choose=() => {FILTERS.province=FILTERS.province === province ? '' : province;$('province-filter').value=FILTERS.province;refresh();};
      element.addEventListener('click',choose);
      if (element.tagName !== 'BUTTON') {
        element.addEventListener('keydown',event => {if (event.key==='Enter' || event.key===' ') {event.preventDefault();choose();}});
        const tooltip=$('map-tooltip');
        const show=event => {tooltip.innerHTML=`<strong>${escape(province)}</strong>${countPercent(counts[province] || 0,n)} respuestas`;tooltip.hidden=false;const rect=element.getBoundingClientRect();tooltip.style.left=Math.min(window.innerWidth-210,(event.clientX || rect.right)+12)+'px';tooltip.style.top=Math.max(8,Math.min(window.innerHeight-85,(event.clientY || rect.top)+12))+'px';};
        element.addEventListener('pointermove',show);element.addEventListener('focus',show);
        element.addEventListener('pointerleave',() => tooltip.hidden=true);element.addEventListener('blur',() => tooltip.hidden=true);
      }
    }
    card.querySelector('.svg-download').addEventListener('click',() => {
      const clone=card.querySelector('svg').cloneNode(true);
      const style=document.createElementNS('http://www.w3.org/2000/svg','style');
      style.textContent='.province-shape{stroke:white;stroke-width:1}.inset-box{fill:#fafcf7;stroke:#d1ddcb}.map-label{fill:#46655b;font-family:Arial}.map-count{fill:#183836;font-family:Arial;font-size:21px;font-weight:bold}.map-connector{stroke:#719389;stroke-dasharray:4 5;fill:none}.caba-marker{stroke:white;stroke-width:1.5}.selected{stroke:#102f2c;stroke-width:2.5}';clone.prepend(style);
      download(new XMLSerializer().serializeToString(clone),'cic2023-mapa.svg','image/svg+xml;charset=utf-8');
    });
    return card;
  }

  function renderKPIs() {
    const n=aggregateData.n;
    const items=[{label:'Respuestas en la selección',value:number(n),note:`de ${number(DATA.meta.n)} respuestas del relevamiento`,deco:'↗'}];
    for (const [key,label] of [['L','Completó el trámite de alta'],['N','Actualmente en el exterior'],['J','Se mantiene en Ciencia y Técnica']]) {
      const values=aggregateData.counts[key] || {}, yes=values.Sí || 0, valid=yes+(values.No || 0), blank=values['Sin respuesta'] || 0;
      items.push({label,value:valid ? percent(yes/valid*100) : '—',note:`${number(yes)} de ${number(valid)} respuestas válidas · ${number(blank)} sin respuesta`,deco:'·'});
    }
    $('kpis').innerHTML=items.map(item => `<article class="kpi"><span class="kpi-decoration" aria-hidden="true">${item.deco}</span><div class="kpi-label">${item.label}</div><div class="kpi-number">${item.value}</div><div class="kpi-note">${item.note}</div></article>`).join('');
  }

  function renderCharts() {
    $('map-tooltip').hidden=true;
    for (const chart of charts) chart.destroy();charts=[];
    const target=$('charts');target.replaceChildren();
    if (tab==='distribucion') target.append(renderMap());
    // Insertar los lienzos antes de crear gráficos permite a Chart.js medirlos.
    for (const def of DEFINITIONS.filter(d => d.tab===tab)) {
      const placeholder=document.createElement('div');placeholder.className='card'+(def.wide ? ' wide' : '');target.append(placeholder);
      // createCard usa un ancho de lienzo explícito cuando requiere desplazamiento.
      const card=createCard(def);placeholder.replaceWith(card);
    }
    requestAnimationFrame(() => {for (const chart of charts) chart.resize();});
  }

  function updateURL() {
    const params=new URLSearchParams();
    for (const [key,value] of Object.entries(FILTERS)) if (value) params.set(key,value);
    const query=params.toString();
    history.replaceState(null,'',location.pathname+(query ? '?'+query : '')+'#'+tab);
  }

  function refresh() {
    aggregateData=aggregate();
    renderKPIs();
    const active=Object.values(FILTERS).filter(Boolean);
    $('filter-status').innerHTML=active.length ? active.map(t => `<span class="filter-chip">${escape(t)}</span>`).join('')+` ${number(aggregateData.n)} respuestas` : `Mostrando las ${number(DATA.meta.n)} respuestas del relevamiento`;
    $('empty-state').hidden=aggregateData.n!==0;
    const section=TABS[tab];$('section-kicker').textContent=section.kicker;$('section-title').textContent=section.title;$('section-description').textContent=section.description;
    for (const link of document.querySelectorAll('[data-tab]')) {const active=link.dataset.tab===tab;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}
    renderCharts();updateURL();
  }

  function exportCSV() {
    const cell=value => '"'+String(value ?? '').replace(/"/g,'""')+'"';
    const lines=[['Sección','Indicador','Categoría','Respuestas','Denominador','Porcentaje','Provincia','Gran área','Modalidad']];
    for (const def of DEFINITIONS.filter(d => d.id!=='solicitud-torta')) {
      const den=denominator(def);
      for (const [label,n] of rowsFor(def)) lines.push([TABS[def.tab].title,def.title,label,n,den,den ? (n/den*100).toFixed(4) : '',FILTERS.province,FILTERS.area,FILTERS.mode]);
      if (def.bool) lines.push([TABS[def.tab].title,def.title,'Sin respuesta',aggregateData.counts[def.key]?.['Sin respuesta'] || 0,aggregateData.n,'',FILTERS.province,FILTERS.area,FILTERS.mode]);
    }
    for (const province of DATA.options.province) lines.push(['Distribución','Provincia de presentación',province,aggregateData.counts.province?.[province] || 0,aggregateData.n,aggregateData.n ? ((aggregateData.counts.province?.[province] || 0)/aggregateData.n*100).toFixed(4) : '',FILTERS.province,FILTERS.area,FILTERS.mode]);
    download('\ufeff'+lines.map(row => row.map(cell).join(';')).join('\r\n'),'cic2023-conteos-seleccion.csv','text/csv;charset=utf-8');
  }

  function init() {
    Chart.defaults.font.family='system-ui, -apple-system, Segoe UI, sans-serif';Chart.defaults.color='#53695f';
    const params=new URLSearchParams(location.search);
    for (const key of Object.keys(FILTERS)) {
      const select=$(key+'-filter');
      for (const label of DATA.options[key]) {const option=document.createElement('option');option.value=label;option.textContent=key==='area' && label==='Gran área sin determinar' ? 'Área no informada (Temas Estratégicos / Proyectos Especiales)' : label;select.append(option);}
      const value=params.get(key);if(DATA.options[key].includes(value)) FILTERS[key]=value;
      select.value=FILTERS[key];select.addEventListener('change',() => {FILTERS[key]=select.value;refresh();});
    }
    const fromHash=location.hash.slice(1);if (TABS[fromHash]) tab=fromHash;
    for (const link of document.querySelectorAll('[data-tab],.brand')) link.addEventListener('click',event => {event.preventDefault();tab=link.dataset.tab || 'distribucion';refresh();$('section-title').scrollIntoView({block:'start',behavior:'smooth'});});
    $('reset-filters').addEventListener('click',() => {for (const key of Object.keys(FILTERS)) {FILTERS[key]='';$(key+'-filter').value='';}refresh();});
    $('export-csv').addEventListener('click',exportCSV);$('print').addEventListener('click',() => window.print());
    $('method-link').addEventListener('click',() => {$('methodology').open=true;});
    window.addEventListener('popstate',() => {const t=location.hash.slice(1);if(TABS[t])tab=t;const p=new URLSearchParams(location.search);for(const key of Object.keys(FILTERS)){const value=p.get(key);FILTERS[key]=DATA.options[key].includes(value) ? value : '';$(key+'-filter').value=FILTERS[key];}refresh();});
    window.CIC={aggregate,rowsFor,denominator,definitions:DEFINITIONS,getState:() => ({tab,filters:{...FILTERS},data:aggregateData,charts:charts.length}),selectTab:value => {if(TABS[value]){tab=value;refresh();}}};
    refresh();
  }
  init();
})();
