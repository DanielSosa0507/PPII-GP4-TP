<p align="center">
  <img src="./anomaly_detected/ufo-header.svg" alt="OVNI" width="100%">
</p> 
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
 
<p align="center">
  <img src="./anomaly_detected/haunte-footer.svg" width="100%">
</p>
