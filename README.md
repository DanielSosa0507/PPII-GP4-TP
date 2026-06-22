<svg viewBox="0 0 1200 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="OVNI animado">
  <defs>
    <!-- Fondo espacial verde -->
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#021207"/>
      <stop offset="55%" stop-color="#06301c"/>
      <stop offset="100%" stop-color="#0a4d2c"/>
    </linearGradient>

    <!-- Domo del platillo -->
    <radialGradient id="dome" cx="50%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#d6ffe6"/>
      <stop offset="60%" stop-color="#5af0a0"/>
      <stop offset="100%" stop-color="#1f9c5e"/>
    </radialGradient>

    <!-- Cuerpo metálico del platillo -->
    <linearGradient id="hull" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#cfe8d8"/>
      <stop offset="45%" stop-color="#6fae88"/>
      <stop offset="100%" stop-color="#2f5a42"/>
    </linearGradient>

    <!-- Rayo tractor -->
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#9bffcf" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#9bffcf" stop-opacity="0"/>
    </linearGradient>

    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#9bffcf" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#9bffcf" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Cielo -->
  <rect width="1200" height="300" fill="url(#sky)"/>

  <!-- Estrellas titilantes -->
  <g fill="#d6ffe6">
    <circle cx="120" cy="60"  r="1.6"><animate attributeName="opacity" values="0.2;1;0.2" dur="2.4s" begin="0s"   repeatCount="indefinite"/></circle>
    <circle cx="300" cy="40"  r="1.2"><animate attributeName="opacity" values="0.2;1;0.2" dur="3.1s" begin="0.6s" repeatCount="indefinite"/></circle>
    <circle cx="520" cy="80"  r="1.8"><animate attributeName="opacity" values="0.2;1;0.2" dur="2.0s" begin="1.1s" repeatCount="indefinite"/></circle>
    <circle cx="760" cy="50"  r="1.3"><animate attributeName="opacity" values="0.2;1;0.2" dur="2.8s" begin="0.3s" repeatCount="indefinite"/></circle>
    <circle cx="980" cy="70"  r="1.6"><animate attributeName="opacity" values="0.2;1;0.2" dur="2.2s" begin="1.4s" repeatCount="indefinite"/></circle>
    <circle cx="1100" cy="45" r="1.2"><animate attributeName="opacity" values="0.2;1;0.2" dur="3.4s" begin="0.9s" repeatCount="indefinite"/></circle>
    <circle cx="200" cy="110" r="1.1"><animate attributeName="opacity" values="0.2;1;0.2" dur="2.6s" begin="1.8s" repeatCount="indefinite"/></circle>
    <circle cx="640" cy="120" r="1.4"><animate attributeName="opacity" values="0.2;1;0.2" dur="3.0s" begin="0.2s" repeatCount="indefinite"/></circle>
    <circle cx="880" cy="115" r="1.2"><animate attributeName="opacity" values="0.2;1;0.2" dur="2.3s" begin="2.0s" repeatCount="indefinite"/></circle>
    <circle cx="60"  cy="160" r="1.0"><animate attributeName="opacity" values="0.2;1;0.2" dur="3.2s" begin="1.2s" repeatCount="indefinite"/></circle>
    <circle cx="420" cy="170" r="1.3"><animate attributeName="opacity" values="0.2;1;0.2" dur="2.7s" begin="0.5s" repeatCount="indefinite"/></circle>
    <circle cx="1040" cy="160" r="1.1"><animate attributeName="opacity" values="0.2;1;0.2" dur="3.3s" begin="1.6s" repeatCount="indefinite"/></circle>
  </g>

  <!-- Estrella fugaz -->
  <g>
    <line x1="-60" y1="20" x2="-10" y2="40" stroke="#b8ffd9" stroke-width="2" stroke-linecap="round" opacity="0">
      <animate attributeName="opacity" values="0;0.9;0" dur="1.2s" begin="3s;9s;15s" repeatCount="indefinite"/>
      <animateTransform attributeName="transform" type="translate" values="0 0; 420 150" dur="1.2s" begin="3s;9s;15s" repeatCount="indefinite"/>
    </line>
  </g>

  <!-- OVNI completo (bobbing) -->
  <g>
    <animateTransform attributeName="transform" type="translate"
      values="0 0; 0 -14; 0 0" dur="3.6s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"/>

    <!-- Deriva horizontal sutil -->
    <g>
      <animateTransform attributeName="transform" type="translate"
        values="0 0; 18 0; 0 0" dur="8s" repeatCount="indefinite" additive="sum"
        calcMode="spline" keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"/>

      <!-- Rayo tractor -->
      <polygon points="600,160 550,300 650,300" fill="url(#beam)">
        <animate attributeName="opacity" values="0.25;0.9;0.25" dur="2s" repeatCount="indefinite"/>
      </polygon>
      <ellipse cx="600" cy="300" rx="55" ry="10" fill="url(#glow)">
        <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2s" repeatCount="indefinite"/>
      </ellipse>

      <!-- Resplandor inferior del platillo -->
      <ellipse cx="600" cy="150" rx="110" ry="26" fill="url(#glow)" opacity="0.5"/>

      <!-- Cuerpo del platillo -->
      <ellipse cx="600" cy="148" rx="100" ry="30" fill="url(#hull)" stroke="#1c3527" stroke-width="1.5"/>

      <!-- Domo -->
      <path d="M 555 138 A 45 45 0 0 1 645 138 Z" fill="url(#dome)" stroke="#7fffb9" stroke-width="1.5"/>
      <ellipse cx="585" cy="120" rx="12" ry="6" fill="#ffffff" opacity="0.5"/>

      <!-- Lucecitas parpadeantes -->
      <circle cx="530" cy="152" r="6" fill="#aaff7d">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="0.9s" begin="0s" repeatCount="indefinite"/>
      </circle>
      <circle cx="565" cy="160" r="6" fill="#5af0a0">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="0.9s" begin="0.3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="600" cy="163" r="6" fill="#9bffcf">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="0.9s" begin="0.6s" repeatCount="indefinite"/>
      </circle>
      <circle cx="635" cy="160" r="6" fill="#5af0a0">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="0.9s" begin="0.9s" repeatCount="indefinite"/>
      </circle>
      <circle cx="670" cy="152" r="6" fill="#aaff7d">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="0.9s" begin="1.2s" repeatCount="indefinite"/>
      </circle>
    </g>
  </g>
</svg>

## Anomaly Detected
 
> Red social geográfica para el reporte, exploración y debate de fenómenos paranormales e inexplicados.
 
![Python](https://img.shields.io/badge/Python-3.13-blue?logo=python)
![Django](https://img.shields.io/badge/Django-5.x-green?logo=django)
![DRF](https://img.shields.io/badge/DRF-REST_Framework-red)
![SQLite](https://img.shields.io/badge/Database-SQLite-lightgrey?logo=sqlite)
![License](https://img.shields.io/badge/License-MIT-yellow)
 
---
 
## ¿Qué es Anomaly Detected?
 
**Anomaly Detected** es una plataforma web donde los usuarios pueden reportar, explorar y debatir fenómenos paranormales e inexplicados alrededor del mundo. Desde avistamientos de OVNIs hasta lugares embrujados — si no tiene explicación, tiene lugar acá.
 
Los usuarios pueden:
- 📍 Reportar fenómenos con ubicación geográfica exacta
- 🗺️ Explorarlos en un mapa interactivo
- 💬 Comentar y debatir cada caso
- ✅ Validar reportes de otros usuarios
- ⭐ Guardar favoritos y marcar lugares visitados
- 📄 Descargar fichas en PDF de cada fenómeno
- 🧠 Publicar teorías y votar las de otros
---
 
##  Stack Tecnológico
 
| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.13 + Django 5.x |
| API | Django REST Framework |
| Base de datos | SQLite (dev) |
| Autenticación | Token Authentication (DRF) |
| PDF | ReportLab |
| Mapa | Leaflet.js |
| CORS | django-cors-headers |
| Frontend | HTML + CSS + JavaScript |
 
---
 
##  Estructura del Proyecto
 
```
PPII-GP4-TP/
├── venv/                        # Entorno virtual Python
├── README.md
└── anomaly_detected/            # Proyecto Django
    ├── manage.py
    ├── anomaly_detected/        # Configuración principal
    │   ├── settings.py
    │   └── urls.py
    ├── usuarios/                # Autenticación, perfiles y roles
    ├── fenomenos/               # Fenómenos, validaciones, PDF, favoritos
    ├── comentarios/             # Comentarios y moderación
    └── comunidad/               # Teorías y sistema de votos
```
 
---
 
##  Instalación y Setup
 
### 1. Clonar el repositorio
 
```bash
git clone https://github.com/tuusuario/PPII-GP4-TP.git
cd PPII-GP4-TP
```
 
### 2. Crear y activar el entorno virtual
 
```bash
python3 -m venv venv
source venv/bin/activate        # Mac / Linux
venv\Scripts\activate           # Windows
```
 
### 3. Instalar dependencias
 
```bash
pip install -r requirements.txt
```
 
### 4. Aplicar migraciones
 
```bash
cd anomaly_detected
python manage.py migrate
```
 
### 5. Crear superusuario (admin)
 
```bash
python manage.py createsuperuser
```
 
### 6. Correr el servidor
 
```bash
python manage.py runserver
```
 
Abrí `http://127.0.0.1:8000` en el navegador.
 
---
 
##  Endpoints de la API
 
Base URL: `http://127.0.0.1:8000`
 
### Usuarios
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/usuarios/register/` | Registrar cuenta |
| POST | `/api/usuarios/login/` | Login — devuelve token |
| GET/PUT | `/api/usuarios/perfil/` | Ver o editar perfil propio |
| GET | `/api/usuarios/lista/` | Listar usuarios (admin) |
 
### Fenómenos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/fenomenos/` | Listar fenómenos |
| POST | `/api/fenomenos/` | Crear fenómeno (admin) |
| GET/PUT/DELETE | `/api/fenomenos/<id>/` | Detalle, editar, eliminar |
| POST | `/api/fenomenos/<id>/validar/` | Validar un fenómeno |
| GET | `/api/fenomenos/<id>/pdf/` | Descargar ficha PDF |
| POST | `/api/fenomenos/<id>/puntuar/` | Puntuar 1-5 |
| GET/POST | `/api/fenomenos/favoritos/` | Ver o marcar favoritos |
| DELETE | `/api/fenomenos/favoritos/<id>/` | Desmarcar favorito |
| GET/POST | `/api/fenomenos/visitas/` | Ver o marcar visitados |
| DELETE | `/api/fenomenos/visitas/<id>/` | Desmarcar visitado |
 
### Comentarios
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/comentarios/?fenomeno=<id>` | Ver comentarios |
| POST | `/api/comentarios/` | Crear comentario |
| DELETE | `/api/comentarios/<id>/` | Eliminar comentario (admin) |
 
### Comunidad
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/comunidad/` | Listar o publicar teorías |
| GET/PUT/DELETE | `/api/comunidad/<id>/` | Detalle (editar/borrar = solo autor) |
| POST | `/api/comunidad/<id>/votar/` | Votar +1 / -1 |
 
---
 
##  Autenticación
 
Se usa **Token Authentication**. Al hacer login se recibe un token que debe enviarse en cada request protegido:
 
```
Authorization: Token aqui-va-el-token
```
 
### Roles
 
| Rol | Permisos |
|-----|----------|
| `user` | Ver fenómenos, comentar, validar, puntuar, favoritos, teorías |
| `admin` | Todo lo anterior + crear/editar/eliminar fenómenos, moderar comentarios |
 
---
 
## 🗺️ Mapa Interactivo
 
Cada fenómeno tiene coordenadas `latitud` y `longitud`. El frontend los renderiza con **Leaflet.js**:
 
```javascript
L.marker([fenomeno.latitud, fenomeno.longitud])
  .addTo(map)
  .bindPopup(fenomeno.titulo);
```
 
---
 
## Equipo — Grupo 4
 
| Nombre | Rol |
|--------|-----|
| Daniel Sosa | Backend (Django + DRF) |
| Stefany Rodriguez| Frontend |
| Sofia Maid | Diseño UX/UI |
| Sandra Lopez | Datos & Dashboards |
 
---
 
##  Pendiente
 
- [ ] Login con Google (OAuth2) — requiere credenciales de Google Cloud Console
- [ ] Suite de tests automatizados
- [ ] Deploy en producción
---
 
*PPII – Grupo 4 | Instituto de Formación Técnica Superior N° 18 | 2026*
 
<img width=100% src="https://capsule-render.vercel.app/api?type=waving&color=08D85A&height=120&section=footer"/>
