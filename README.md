# Relevamiento de ingresantes CIC 2023

Dashboard del relevamiento de 365 respuestas, completado entre el 15 de septiembre y el 27 de octubre de 2026.

## Explorar

- Distribución provincial, modalidad, comisión y gran área.
- Situación de becas, cobertura, vínculos laborales y permanencia en Ciencia y Técnica.
- Becas extraordinarias, requisitos y trámite de alta.
- Acciones colectivas y particularidades.

Los filtros de provincia, gran área y modalidad se combinan y actualizan todos los gráficos. CABA tiene un recuadro ampliado y se cuenta una sola vez. Las tablas de cada gráfico contienen los valores completos. En los gráficos de gran área y comisión, los casos sin clasificación identificada se informan aparte de las barras y permanecen en tablas, descargas y totales. Se pueden descargar los conteos de la selección en CSV, cada gráfico en PNG y el mapa en SVG.

## Archivos

- `index.html`: entrada para GitHub Pages.
- `assets/app.js` y `assets/style.css`: interfaz y visualizaciones.
- `assets/data.js`: conteos agregados por provincia, gran área y modalidad.
- `dashboard-cic2023.html`: versión completa sin conexión, con estilos, datos y biblioteca de gráficos integrados.
- `.nojekyll`: permite servir directamente los archivos estáticos.

El repositorio contiene únicamente la versión web y sus conteos agregados. El Excel, los identificadores de fila, los nombres de institutos y los comentarios originales no se incluyen.

## Criterios

Se cuentan respuestas de esta encuesta, no el universo de postulaciones CIC 2023. En las preguntas Sí/No, los porcentajes se calculan sobre respuestas válidas y los vacíos se muestran aparte. En acciones colectivas, el denominador incluye todas las respuestas de la selección (365 sin filtros). Las categorías de respuestas múltiples no deben sumarse como si fueran personas distintas.

La ubicación corresponde a la presentación a carrera y no necesariamente a la residencia actual. Completar el trámite de alta no equivale a tener el ingreso efectivizado.

Las extensiones posdoctorales CONICET se actualizaron a Hasta el alta por indicación del responsable del relevamiento. El resto de los datos conserva el período de la encuesta. Una fecha de julio de 2026 interpretada por contexto permanece identificada como tal.

Las categorías de un caso en acciones y particularidades se agruparon en Otros antes de filtrar. La agrupación permanece estable. Su detalle por tema se puede desplegar en los gráficos. El ranking de institutos está aplazado.

## Uso local y publicación

Abrir `dashboard-cic2023.html` directamente en un navegador para usar la versión sin conexión. Para una vista previa de los archivos separados:

```sh
python -m http.server 8000
```

En GitHub Pages, usar la rama `main` y la carpeta raíz `/`. No requiere compilación ni servicios de backend.

La exportación de datos se genera en el espacio de trabajo privado mediante `construir_dashboard.py`, que comprueba los conteos contra las clasificaciones revisadas antes de generar la web. Ese procesamiento y los archivos de origen permanecen fuera del repositorio público.

## Créditos

- Chart.js 4.5.1, licencia MIT: ver `assets/Chart.js-LICENSE.md`.
- Geometrías provinciales con fuente IGN, tomadas del archivo utilizado en el proyecto OAJ del responsable del relevamiento. La representación y el recuadro de CABA fueron adaptados para este dashboard.

Versión: 16 de noviembre de 2026.
