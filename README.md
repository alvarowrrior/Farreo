<div align="center">

<br />

# 🌙 Farreo

### Tu guía nocturna. Encuentra dónde salir esta noche.

**Farreo** es una aplicación web progresiva (PWA) que te ayuda a descubrir locales nocturnos — bares, discotecas, clubs y más — cerca de ti, en tiempo real y de forma visual a través de un mapa interactivo.

<br />

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Mapbox](https://img.shields.io/badge/Mapbox-000000?style=for-the-badge&logo=mapbox&logoColor=white)](https://www.mapbox.com)
[![SASS](https://img.shields.io/badge/SASS-CC6699?style=for-the-badge&logo=sass&logoColor=white)](https://sass-lang.com)

<br />

</div>

---

## ✨ ¿Qué es Farreo?

Farreo es una plataforma pensada para la vida nocturna urbana. Imagina **Google Maps, pero solo para salir de fiesta**: un mapa en tiempo real donde puedes explorar los locales de tu ciudad, ver sus fotos, escuchar la música que ponen, y compartir el sitio con tus amigos con un solo clic.

---

## 🚀 Funcionalidades principales

### 🗺️ Mapa Interactivo
Visualiza todos los locales en un mapa de Mapbox con marcadores agrupados (clusters). Toca cualquier marcador para ver el panel de detalles con información completa.

### 🔎 Buscador inteligente
Una barra de búsqueda flotante te permite encontrar locales por nombre o tipo, ordenados automáticamente por proximidad a tu ubicación usando la **fórmula de Haversine**.

### 📋 Bottom Sheet arrastrables
Al seleccionar un local, aparece un panel deslizante (al estilo apps nativas de iOS/Android) con:
- 📸 Carrusel de fotos con scroll horizontal
- 🎵 Preview de audio con reproducción aleatoria de velocidad (efecto vinilo)
- ⭐ Valoración y categoría del local
- 📍 Dirección y botón de cómo llegar con Google Maps
- 🔗 Botón de compartir que copia el enlace directo al portapapeles

### 🔒 Panel de Administración
Área protegida por Firebase Auth para gestionar los locales de la base de datos: creación, edición y eliminación con subida de imágenes y audio a Firebase Storage.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Uso |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Renderizado, routing y SSR |
| **Lenguaje** | TypeScript | Tipado estático en todo el proyecto |
| **Estilos** | SASS (SCSS) con BEM | Sistema de diseño modular |
| **Animaciones** | Framer Motion | Bottom sheet y transiciones |
| **Mapa** | Mapbox GL JS | Mapa interactivo con marcadores |
| **Backend** | Firebase Firestore | Base de datos NoSQL en tiempo real |
| **Auth** | Firebase Auth | Login de administrador |
| **Storage** | Firebase Storage | Subida de fotos y audio |
| **Geolocalización** | Capacitor + Browser API | Posición del usuario |

---

## 🏗️ Arquitectura de Estilos

El proyecto usa una arquitectura **SCSS modular** con un único punto de entrada:

```
app/globals.scss            ← único punto de entrada
styles/
├── _variables.scss         ← tokens: colores, tipografía, breakpoints
├── utils/_mixins.scss      ← flex-center, render-from, text-truncate, glass-effect
├── base/_reset.scss        ← normalización del navegador
├── layout/                 ← header y estructura global
├── components/             ← cards, avatar, mapa
└── pages/                  ← estilos por página (home, buscar, admin...)
```

Toda la nomenclatura sigue la metodología **BEM** (`bloque__elemento--modificador`). No hay clases de Tailwind ni estilos inline en el JSX — toda la lógica visual vive en SCSS.

---

## ⚙️ Instalación y uso

```bash
# 1. Clonar el repositorio
git clone https://github.com/alvarowrrior/Farreo.git
cd Farreo

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.local.example .env.local
# Rellena tus claves de Firebase y Mapbox

# 4. Arrancar el servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📁 Estructura del Proyecto

```
farreo/
├── app/
│   ├── globals.scss        ← punto de entrada de estilos
│   ├── page.tsx            ← página de inicio
│   ├── buscar/             ← página principal del mapa
│   ├── admin/              ← panel de administración
│   ├── login/              ← autenticación
│   └── perfil/             ← perfil de usuario
├── components/
│   ├── MapNearMe.tsx       ← componente principal del mapa
│   ├── MapSearchBar.tsx    ← barra de búsqueda flotante
│   └── MapSelector.tsx     ← selector de ubicación en admin
├── lib/
│   ├── firebase.ts         ← configuración de Firebase
│   ├── locales.ts          ← servicio de datos de locales
│   └── location.ts         ← geolocalización del usuario
└── styles/                 ← arquitectura SCSS completa
```

---

<div align="center">

Hecho por Álvaro; Farreo · **v3.4.0**

</div>
