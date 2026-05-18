# MovieStream — MongoDB

Migración del esquema relacional de MovieStream (Oracle) a un modelo documental en MongoDB, con una aplicación web para interactuar con los datos.

**Live:** [https://moviestream-mongodb.onrender.com](https://moviestream-mongodb.onrender.com)

---

## ¿Qué hace?

Catálogo de películas con CRUD completo sobre dos colecciones:

- **Películas** — listar, buscar por título, filtrar por género, ver detalle, crear, editar, eliminar
- **Géneros** — listar, crear, editar, eliminar

La base de datos contiene **3,800 películas reales** con posters de Wikipedia, 25 géneros, 99 clientes y 99 actividades de compra — todos provenientes del dataset oficial de Oracle MovieStream.

---

## Stack

| Capa | Tecnología | Razón |
|------|-----------|-------|
| Servidor | Node.js + Express 4 | Mínimo boilerplate, suficiente para el scope |
| Templates | EJS + express-ejs-layouts | Renderizado server-side, sin build step |
| Base de datos | MongoDB Atlas M0 | Tier gratuito, conecta directo con Render |
| ODM | Mongoose 8 | Schema validation, queries limpias |
| Deploy | Render (free tier) | Detección automática de Node, fácil env vars |

---

## Cómo correrlo desde cero

### 1. Clonar

```bash
git clone https://github.com/leobardonm/moviestream-mongodb.git
cd moviestream-mongodb
npm install
```

### 2. Configurar MongoDB Atlas

1. Crear cuenta en [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas) → cluster M0 gratis
2. Database Access → agregar usuario con contraseña
3. Network Access → `0.0.0.0/0` (requerido para Render)
4. Connect → Drivers → copiar connection string

### 3. Variables de entorno

```bash
cp .env.example .env
# Editar .env con tu MONGODB_URI real
```

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/moviestream
PORT=3000
```

### 4. Poblar la base de datos

> El seed lee los datos del directorio `data/` que **no está en el repo** (está en `.gitignore`).
> Debes descargar los archivos del dataset de Oracle MovieStream:

```bash
mkdir data
BASE="https://objectstorage.us-ashburn-1.oraclecloud.com/n/c4u04/b/moviestream_landing/o"
curl -s "$BASE/genre/genre.csv" -o data/genre.csv
curl -s "$BASE/customer_segment/customer_segment.csv" -o data/customer_segment.csv
curl -s "$BASE/movie/movies.json" -o data/movies.json
curl -s "$BASE/activity/activity.json" -o data/activity.json
curl -s "$BASE/customer/customer.csv" -o data/customer.csv
```

Luego ejecutar:

```bash
npm run seed
# Inserta 25 géneros, 3800 películas, 99 clientes, 99 actividades
```

### 5. Iniciar

```bash
npm run dev   # desarrollo con nodemon
npm start     # producción
```

Abrir [http://localhost:3000](http://localhost:3000)

---

## Modelo de datos

Ver [MODEL.md](./MODEL.md) para el diseño completo con justificación de decisiones embed vs. reference.

---

## Reflexión

Ver [REFLECTION.md](./REFLECTION.md) para el análisis honesto de trade-offs NoSQL vs. relacional aplicados a este dominio.

---

## Screenshot

![MovieStream catalog](https://moviestream-mongodb.onrender.com)

> App desplegada en: [https://moviestream-mongodb.onrender.com](https://moviestream-mongodb.onrender.com)
