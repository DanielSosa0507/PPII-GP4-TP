# Integración — Anomaly Detected

Documento de la tarea de integración hecha sobre `sandra-integracion` (checkout de `main` del repo `PPII-GP4-TP`), comparando contra `backend-daniel/client` (que solo se usó como referencia de qué pantallas faltaban, no se migró nada de ahí).

> Este documento se fue actualizando a medida que se sumó trabajo. La primera sección (ABM de fenómenos) fue la primera tanda; después se agregó la carga de los datasets reales al mapa — ver la sección "Carga de datasets reales" más abajo.

## Contexto y alcance

El frontend de `main` (templates Django en `anomaly_detected/frontend/`) ya tenía mapa con heatmap, comunidad con teorías/votos, favoritos, visitas y gamificación funcionando contra la API real. Pero el ABM de fenómenos estaba roto en un punto crítico: el formulario de alta no guardaba nada, y no existía ni Panel Admin ni una pantalla para que el usuario viera el estado de lo que reportó.

Se evaluó implementar todo el PDF de la propuesta (incluidas las "futuras etapas" y un juego de trivia), pero se decidió acotar al alcance imprescindible para que el ciclo de moderación funcione de punta a punta. Quedó **fuera de este alcance**: página propia de Ficha de Fenómeno (sigue como modal en el mapa), campos `forma`/`duración`/`nivel de actividad` del formulario (existen en el HTML pero no se persisten todavía), sistema de validación de 4 categorías, recomendaciones de películas/blogs, eventos de comunidad, alertas, recorridos temáticos ampliados, juego.

## Cambios realizados

### 1. Modelo
- `fenomenos/models.py`: nuevo campo `Fenomeno.estado_moderacion` (choices `pendiente`/`aprobado`/`rechazado`, default `pendiente`). El campo `validado` (booleano) se mantuvo sin tocar — la acción "Aprobar" del panel también lo pone en `True`, para no romper código existente que ya lo usa (ej. `DescargaPDFView`).
- Migración nueva: `fenomenos/migrations/0005_fenomeno_estado_moderacion.py`, aplicada contra la base sqlite local.

### 2. Alta y edición de fenómenos (`Reporte.html` + `reporte_formulario`)
- **Bug crítico arreglado**: `reporte_formulario` en `anomaly_detected/views.py` antes solo hacía `render(request, 'Reporte.html')` — no manejaba `POST`, así que nadie podía dar de alta un fenómeno desde el sitio. Ahora valida los campos, crea el `Fenomeno` con `creado_por=request.user` y `estado_moderacion='pendiente'`, crea un `Enlace` si se adjuntó un link de evidencia, guarda la imagen si se subió, y redirige a "Mis Fenómenos" con un mensaje.
- La misma vista ahora también sirve para **editar** un fenómeno propio mientras sigue `pendiente` (`/reporte/<id>/editar/`).
- `Fenomeno.latitud`/`longitud` son obligatorios pero el formulario no tenía ninguna forma de capturarlos. Se agregó un **mini-mapa Leaflet** (`static/js/reporte-mapa.js`) en el que el usuario hace clic para marcar el punto; ese clic completa dos inputs ocultos (`latitud`/`longitud`). En modo edición, el mapa arranca centrado en la ubicación ya guardada con el pin puesto.
- El campo "Lugar / Ubicación" (formato "Ciudad, Estado", como ya sugería el placeholder) se separa en el servidor: la parte después de la coma alimenta el campo `Fenomeno.estado`, que es el que usa la gamificación para contar "estados explorados". Sin esto, cada combinación ciudad+estado distinta se hubiera contado como un estado nuevo.
- Se agregaron inputs reales donde antes solo había una zona de carga decorativa sin `<input>` (imagen + link de evidencia), y `enctype="multipart/form-data"` al form (faltaba, sin eso no se puede subir una imagen).
- **Bug encontrado y arreglado de paso**: el `{% include 'partials/navbar.html' %}` de `Reporte.html` estaba partido en dos líneas (`'partials/\n    navbar.html'`), lo cual rompe la resolución de la ruta del template. Se corrigió a una sola línea.
- Los campos "Forma del OVNI" y "Nivel de actividad paranormal" siguen visibles en el formulario (UI ya existente de una iteración de diseño previa) pero **no se persisten** en este alcance — se ignoran al guardar, a propósito, para no tocar el modelo más de lo necesario.

### 3. "Mis Fenómenos" (`/mis-fenomenos/`, nuevo)
- Vista `mis_fenomenos_view` + template `mis_fenomenos.html`: lista los fenómenos del usuario logueado con badge de estado (pendiente/aprobado/rechazado).
- Acciones "Editar" y "Eliminar" visibles solo si el fenómeno sigue `pendiente` (vista `eliminar_fenomeno_view`, también valida que sea pendiente y propio antes de borrar).

### 4. Panel Admin (`/panel-admin/`, nuevo)
- Decorador nuevo `admin_required` (mismo estilo que `login_required_con_mensaje`, exige además `request.user.rol == 'admin'`; si no, redirige a inicio con mensaje de error).
- Vista `panel_admin_view` + template `panel_admin.html`:
  - KPIs: usuarios activos, fenómenos pendientes, total de fenómenos, nuevos esta semana.
  - Cola de moderación: fenómenos `pendiente` con botones **Aprobar** (→ `aprobado` + `validado=True`) / **Rechazar** (→ `rechazado`).
  - Tabla de comentarios recientes con toggle Ocultar/Mostrar sobre el campo `Comentario.activo` ya existente (no se creó un modelo de "reportes" nuevo, se mantuvo simple).
  - Tabla de usuarios: banear/desbanear (`Usuario.is_active`) y promover/degradar (`Usuario.rol`). Un admin no puede banearse ni quitarse el rol a sí mismo (chequeo en la vista).
- Link "Panel Admin" en el navbar, visible solo si `user.rol == 'admin'`.

### 5. Navbar
- `partials/navbar.html`: se agregó el link "Mis Fenómenos" (visible si está logueado) y "Panel Admin" (visible solo si además `rol == 'admin'`). Antes no había ningún check de rol en el navbar.

### Archivos tocados/creados
```
fenomenos/models.py                                  (campo nuevo)
fenomenos/migrations/0005_fenomeno_estado_moderacion.py  (nueva)
anomaly_detected/views.py                            (vistas nuevas + reporte_formulario reescrita)
anomaly_detected/urls.py                             (rutas nuevas)
frontend/Reporte.html                                (mini-mapa, inputs reales, bug del navbar)
frontend/mis_fenomenos.html                          (nueva)
frontend/panel_admin.html                            (nueva)
frontend/partials/navbar.html                        (links condicionales)
static/js/reporte-mapa.js                            (nuevo)
static/js/script.js                                  (sync del tipo + validación del mapa)
static/css/styles.css                                (clases nuevas, reusando paleta existente)
```

## Pruebas realizadas

No había `chromium-cli` ni Playwright instalados para manejar un navegador real, e instalar uno solo para este test era desproporcionado: lo único que hace el mini-mapa en el navegador es completar dos inputs ocultos (`latitud`/`longitud`), así que se probó la lógica real del servidor (la parte efectivamente escrita) simulando esos valores directamente con el `Client` de pruebas de Django (incluido, sin instalar nada nuevo), con sesión y CSRF reales de punta a punta.

Antes de probar se creó un entorno virtual (`sandra-integracion/venv`) e instalaron las dependencias de `requirements.txt`, ya que no existía ninguno en el checkout.

### Test 1 — Flujo principal (crear → pendiente → aprobar → aprobado)
| Paso | Resultado |
|---|---|
| Login usuario `tester` | 302 (login OK) |
| `GET /reporte/` | 200 |
| `POST /reporte/` (tipo OVNI, lugar "Roswell, NM", con lat/lng simulados) | 302 → redirige a `/mis-fenomenos/` |
| Fenómeno creado | título "OVNI en Roswell, NM", `estado_moderacion=pendiente`, `estado=NM` (separó bien la provincia) |
| `GET /mis-fenomenos/` | 200, aparece "Roswell" y "Pendiente" |
| Login admin `admintester` | 302 |
| `GET /panel-admin/` | 200, "Roswell" aparece en la cola de moderación |
| `POST /panel-admin/fenomeno/<id>/aprobar/` | 302 |
| Estado tras aprobar | `estado_moderacion=aprobado`, `validado=True` |
| `GET /mis-fenomenos/` (de nuevo como tester) | aparece "Aprobado"; ya no muestra botones Editar/Eliminar |

**Resultado: todo OK.**

### Test 2 — Casos de borde (rechazo, borrado, permisos)
| Caso | Resultado |
|---|---|
| Usuario normal intenta `GET /panel-admin/` | Redirigido fuera (302 a `/`), no accede al contenido del panel |
| Admin rechaza un fenómeno (`Lugar Embrujado en Winchester, CA`) | `estado_moderacion` pasa a `rechazado` |
| Usuario elimina un fenómeno propio mientras está `pendiente` (`OVNI en Phoenix, AZ`) | Se borra correctamente de la base |
| Usuario intenta `GET /reporte/<id>/editar/` sobre un fenómeno ya `rechazado` | `404` — el guard de "solo mientras está pendiente" funciona |

**Resultado: todo OK.**

### Verificación adicional
- `python manage.py check`: sin errores.
- `python manage.py migrate`: aplicó toda la cadena de migraciones (era la primera vez que se corría en este checkout) sin errores, incluida la nueva.

### Datos de prueba que quedaron en la base local
Para poder repetir las pruebas manualmente en el navegador (vía `python manage.py runserver`, **no** Live Server — ver nota abajo):
- Usuario normal: `tester` / `Tester123!`
- Usuario admin: `admintester` / `Admin123!` (rol admin)

Es la base sqlite local (`db.sqlite3`, ignorada por git), no se sube a ningún lado.

## Nota importante: cómo ver estas páginas

Los archivos de `frontend/` son **templates de Django** (usan `{% %}` / `{{ }}`), no HTML estático. Herramientas como la extensión Live Server de VS Code sirven el archivo tal cual está en disco, sin procesar esa sintaxis ni resolver `{% static %}` — por eso se ve el código del template sin renderizar y sin CSS. Para verlas correctamente hay que levantar el servidor de Django:

```
cd sandra-integracion/anomaly_detected
../venv/Scripts/python.exe manage.py runserver
```

y abrir las URLs reales (`http://127.0.0.1:8000/reporte/`, `/mis-fenomenos/`, `/panel-admin/`), no el archivo `.html` directamente.

## Carga de datasets reales (UFO, lugares embrujados, bases militares)

### Contexto
El equipo ya tenía los datasets limpios (`dataset/clean_ufo_data_nufor_2013_2024.csv`, `dataset/haunted_places_atemporal.csv`, `dataset/clean_bases.csv`, `dataset/us_pop_by_state_2020.csv`). Se pidió cargarlos a la base para que aparezcan en `mapa.html`, y de paso se aclararon dos dudas sobre funcionalidades que ya estaban parcialmente armadas por el equipo de frontend:

- **"Recorridos Temáticos"**: rutas armadas a mano (no calculadas) que dibujan una línea punteada conectando 2-3 puntos de interés de una temática (OVNI / Embrujados / Militar), con datos de distancia/duración/dificultad. La ruta "Militar" ya traía un comentario del compañero que la armó explicando que usaba bases militares hardcodeadas (Area 51, Edwards AFB, Nellis AFB) "hasta que haya datos reales" — no era un pedido de feature nueva, ya estaba resuelto así a propósito.
- **"Mapa de calor con datos predeterminados"**: el heatmap (`mapa-leaflet.js`) ya leía fenómenos reales de la API, pero el tamaño/color de cada mancha depende de un campo `actividad` que ningún fenómeno tenía cargado — por eso todas las manchas caían al mismo valor por defecto. No era un problema de conexión a la BD, sino de falta del dato.

### Cambios
- **`fenomenos/models.py`**: campo nuevo `Fenomeno.actividad` (choices `baja`/`moderada`/`alta`/`extrema`, mismos nombres y valores que ya esperaba `mapa-leaflet.js` en `INTENSIDAD_COLOR`/`INTENSIDAD_RADIO`). Modelo nuevo `BaseMilitar` (`nombre`, `estado`, `operativa`) — **sin latitud/longitud**, porque `clean_bases.csv` no las trae; se usa solo para estadísticas de correlación (bases vs avistamientos por estado), no se dibuja como pin en el mapa. Migración: `fenomenos/migrations/0006_basemilitar_fenomeno_actividad.py`.
- **`fenomenos/management/commands/importar_datasets.py`** (nuevo): importa los 3 datasets con `bulk_create`. Los fenómenos OVNI usan `tipo='ovni'`, `estado` = código de 2 letras (para que combine con cómo se guarda manualmente), `fecha_ocurrencia` parseada del CSV, y crea un `Enlace` con el link al reporte original de NUFORC (`img_link`) cuando existe. Los embrujados usan `tipo='embrujado'`, con fallback a `city_latitude`/`city_longitude` si falta la coordenada puntual. A cada fila se le asigna un valor de `actividad` al azar con un reparto realista (40% moderada, 25% baja, 25% alta, 10% extrema) ya que ningún dataset trae una señal real de intensidad. Todo se importa con `creado_por=None` y `estado_moderacion='aprobado'` — ese `creado_por=None` es justo lo que el comando usa como marca para no reimportar duplicados si se corre de nuevo (se puede forzar con `--reset`).
- **`static/js/mapa-leaflet.js`**: arreglado el bug de `RUTAS` — las rutas "ovni" y "embrujado" buscaban un punto por `f.id === 'roswell'` (texto), pero los fenómenos de la API tienen `id` numérico, así que esa búsqueda nunca encontraba nada. Se cambiaron las 3 rutas (ovni/embrujado/militar) para usar coordenadas propias de lugares reales conocidos (`puntosCustom`), el mismo patrón que ya usaba la ruta militar, en vez de depender de qué haya cargado en la base en cada momento.

### Resultado de la importación (base local)
```
OVNIs importados: 1317 (+ 1317 enlaces de evidencia)
Lugares embrujados importados: 10974
Bases militares importadas: 633
```
(Los números son un poco menores a las filas totales de cada CSV porque se descartan filas sin coordenadas válidas o sin nombre.)

### Verificación
- Distribución real de `actividad` confirmada por consulta a la base: `moderada=4977, baja=3066, alta=3046, extrema=1202` (más 2 fenómenos de prueba del ABM, sin actividad asignada, no son de este import).
- `GET /api/fenomenos/` responde 200 e incluye el campo `actividad` con valores reales.
- `GET /mapa/` responde 200.
- `node --check static/js/mapa-leaflet.js` sin errores de sintaxis.
- **No verificado visualmente**: no hay navegador headless instalado (mismo motivo que en la prueba del ABM — ni `chromium-cli` ni Playwright están disponibles en este entorno), así que no se confirmó con una captura que las manchas de calor se vean con tamaños/colores distintos ni que las líneas de ruta se dibujen bien. Falta abrirlo en un navegador real para confirmar.

### Hallazgo de paso (no arreglado todavía)
`GET /api/fenomenos/` devuelve **todos** los fenómenos sin filtrar por `estado_moderacion` — se confirmó ver un fenómeno `rechazado` en la respuesta. Esto significa que el mapa público podría estar mostrando fenómenos que el admin rechazó. No se tocó porque no era parte de este pedido puntual, pero conviene decidir si se filtra (ej. que `FenomenoListCreateView` solo liste `estado_moderacion='aprobado'` para usuarios no-admin).

## Mapa: clustering + filtro por estado + buscador (después de probar con datos reales)

### Contexto
Al probar `mapa.html` con los 12.293 fenómenos importados, aparecieron 4 problemas. Ninguno se debía a la base de datos (sqlite vs Postgres no iba a cambiar nada de esto):

1. **Lento y "no se ve limpio"**: se dibujaban los ~12.000 puntos sueltos en Leaflet, sin agrupar.
2. **Filtro "POR ESTADO"**: el `<select>` no tenía ningún JS atado (`mapa.html`), nunca se había programado. Además las opciones hardcodeadas ("New Mexico") no coincidían con el formato real guardado ("NM").
3. **Buscador**: buscaba por `f.nombre`, pero el campo real de la API es `titulo` — nunca encontraba nada.
4. **"Puntos de interés"**: el texto decía "5"/"4" pero las rutas reales siempre tuvieron 3/2 puntos — número de relleno desactualizado.

### Cambios
- **`frontend/mapa.html`**: se sumó el plugin **Leaflet.markercluster** (CSS+JS por CDN), se le dio `id="selectEstado"` al select (antes no tenía ninguno) y se vació de opciones hardcodeadas, y se corrigieron los conteos de "puntos de interés" a 3/2/3.
- **`static/js/mapa-leaflet.js`**:
  - Los marcadores ahora se agregan a un `L.markerClusterGroup()` en vez de directo al mapa (con fallback a `L.layerGroup()` si el plugin no llegara a cargar, para no romper todo lo demás).
  - Filtro de tipo (OVNI/Embrujados) y filtro de estado ahora se combinan en una sola función `aplicarFiltros()` — antes el de tipo agregaba/quitaba marcadores del mapa directamente, lo cual ya no tiene sentido estando agrupados.
  - `poblarSelectEstado()`: llena el `<select>` con los valores reales de `estado` que hay en los datos cargados (ej. "NM", "CA"), en vez de la lista hardcodeada que no coincidía.
  - `toggleCapaCalor()`: ahora oculta/muestra todo el grupo de marcadores de una vez (`mapa.removeLayer(grupoMarcadores)`), en vez de intentar ocultar el DOM de cada marcador individual (que ya no aplica con clustering).
  - Buscador: `f.nombre` → `f.titulo` (+ también compara contra `f.estado`, ya que el placeholder dice "Buscar estado o ciudad...").

### Verificación
- `node --check static/js/mapa-leaflet.js`: sin errores.
- Servidor reiniciado y confirmado que el archivo servido coincide con el de disco (`diff` sin diferencias) — ver nota de caché más abajo.
- `GET /mapa/`: 200.
- **Pendiente confirmar visualmente** (clustering real, filtro de estado funcionando, buscador encontrando resultados) — avisar después de probarlo en el navegador.

### Nota: por qué el primer intento mostró un archivo roto
Al probar por primera vez después de los cambios del import de datasets, el navegador tiró `Uncaught SyntaxError` en `mapa-leaflet.js`. La causa no fue un error de código: el servidor de desarrollo venía corriendo desde antes de terminar de editar el archivo, y sirvió una versión vieja/incompleta cacheada en memoria (confirmado comparando con `curl` + `diff` contra el archivo real en disco, que estaba completo y bien). Se resolvió reiniciando el servidor. **Si en el futuro algo se edita mientras el servidor está corriendo y se ve raro en el navegador, antes de asumir que es un bug de código, probar reiniciar `runserver`.**

## Mapa: clustering + filtros + bases militares por estado + traducción (sesión siguiente)

### Bugs chicos arreglados sobre la marcha
- El popup de los Recorridos Temáticos numeraba doble ("1. 1. Stanley Hotel, CO") porque la lista `<ol>` ya numera sola y además se le agregaba el número a mano en el JS — se sacó el número manual.
- Se sacó el botón "Bases militares" del filtro de tipo (no hacía nada, las bases no tienen coordenadas individuales) y se lo reincorporó después ya funcional (ver más abajo).

### Referencias siempre visibles + bug de z-index con Leaflet
- Se movió el bloque "REFERENCIAS" (antes al final de la sidebar, había que scrollear) a un overlay flotante sobre el mapa (`.referencias-mapa-float`), junto al buscador y los controles de zoom que ya flotaban.
- Bug encontrado al probarlo: al hacer zoom/interactuar con el mapa, las capas internas de Leaflet (tiles, marcadores, popups — que usan z-index hasta 700) tapaban el buscador y las referencias (z-index:10). Causa raíz: `#map-leaflet` tenía `position: relative` (heredado de `leaflet.css`) pero **sin z-index propio**, así que no generaba su propio contexto de apilamiento — sus capas internas competían directo contra los overlays del mapa en vez de quedar contenidas adentro. Se arregló agregando `z-index: 1` a `#map-leaflet` (lo contiene correctamente) y subiendo los overlays a `z-index: 1000` (refuerzo). Si en el futuro se agregan más elementos flotantes sobre el mapa, conviene que tengan z-index alto por la misma razón.

### Bases militares por estado (sin coordenadas individuales)
`clean_bases.csv` no trae latitud/longitud por base, solo nombre + estado + si está activa. En vez de pines individuales (imposible sin coordenadas), se agregó:
- **`fenomenos/views.py`** → `BasesPorEstadoView`, nueva URL `/api/fenomenos/bases-por-estado/`: agrupa `BaseMilitar` por `estado` con `Count`.
- **`static/js/mapa-leaflet.js`**: tabla `CENTROIDES_ESTADOS` (coordenadas fijas, geografía conocida, no vienen de la BD) para los 50 estados + DC + Guam + Puerto Rico. Al activar el botón "Bases militares (por estado)" en `mapa.html`, dibuja una burbuja roja en el centroide de cada estado con la cantidad de bases (tooltip "Nevada: 12 bases militares"). Un valor de `estado` en los datos ("Naval Magazine") no matchea ningún centroide — se ignora sin romper nada.

### Traducción de descripciones al castellano
Las descripciones de `haunted_places`/`summary` de OVNIs vienen en inglés del dataset original. Se agregó:
- **`fenomenos/models.py`**: campo `Fenomeno.descripcion_traducida` (default `True` — lo que escribe un usuario por el ABM ya está en castellano; el import de datasets lo pone en `False`).
- **`fenomenos/management/commands/traducir_descripciones.py`** (nuevo, usa `deep-translator` + Google Translate gratuito, sin API key): traduce de a uno, con pausa entre pedidos para no saturar el servicio, y va marcando `descripcion_traducida=True` a medida que traduce — así se puede interrumpir y retomar sin repetir trabajo ni perder lo ya traducido.
- **Importante**: no se pudo correr desde el entorno donde yo ejecuto comandos — tiene la salida a internet bloqueada (ni siquiera pypi.org respondía a una conexión directa), así que **lo corrió Sandra desde su propia terminal**. Mientras corre (tarda bastante, ~12.300 descripciones), el resto del sitio sigue funcionando pero un poco más lento por la contención de escritura en sqlite.

## Pendiente / próximos pasos
- Conectar la base de datos real (Postgres en Supabase, según lo charlado) vía `DATABASE_URL`, y correr `migrate` + `importar_datasets` ahí.
- Deploy en Render (no se encontró `Procfile` ni configuración de Render todavía en este checkout).
- Confirmar visualmente en un navegador real que el heatmap y las rutas se ven bien (no se pudo automatizar la verificación visual en este entorno).
- Decidir si se filtra `estado_moderacion` en la API pública de fenómenos (ver hallazgo arriba).
- Integrar los gráficos de Tableau en `reportes.html` vía el "Embed Code" de Tableau Public (no como imagen estática).
- Si más adelante se quiere ampliar el alcance: persistir forma/duración del formulario, sistema de validación de 4 categorías, ficha de fenómeno como página propia, geocodificar las bases militares si se consigue su ubicación, etc.
