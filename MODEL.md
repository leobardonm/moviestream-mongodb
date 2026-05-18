# MODEL.md — Modelo Documental de MovieStream

## Contexto

Este documento describe las decisiones de diseño para migrar el esquema relacional de Oracle (6 tablas) al modelo documental de MongoDB.

---

## Colecciones

### 1. `genres`

```json
{
  "_id": "ObjectId",
  "genre_id": 1,
  "name": "Action"
}
```

**Decisión:** Colección separada, **sin embedding** en otras entidades.

**Justificación:** Los géneros son una entidad de catálogo que se gestiona de forma independiente (CRUD propio). Mantenerla separada permite crear, editar y eliminar géneros sin tocar los documentos de películas. Son solo 25 documentos — el costo de un lookup adicional es despreciable.

---

### 2. `movies`

```json
{
  "_id": "ObjectId",
  "movie_id": 3799,
  "title": "Inception",
  "year": 2010,
  "genres": [
    { "genre_id": 20, "name": "Sci-Fi" },
    { "genre_id": 22, "name": "Thriller" }
  ],
  "cast": [
    { "name": "Leonardo DiCaprio", "role": "Cobb" },
    { "name": "Ellen Page", "role": "Ariadne" }
  ],
  "crew": [
    { "name": "Christopher Nolan", "role": "director" }
  ],
  "awards": { "wins": 4, "nominations": 8 },
  "studio": { "name": "Warner Bros" },
  "runtime": "148 min",
  "summary": "A thief who enters the dreams of others...",
  "list_price": 3.99,
  "image_url": "https://upload.wikimedia.org/..."
}
```

**Decisiones:**

| Campo | Decisión | Razón |
|-------|----------|-------|
| `genres` | **Embed** como array `[{genre_id, name}]` | El esquema original de Oracle ya tenía `GENRE` como columna JSON en `MOVIE`. Los géneros de una película no cambian frecuentemente. La consulta más común (listar + filtrar por género) se resuelve en un solo documento sin JOIN. |
| `cast` | **Embed** como array `[{name, role}]` | Ya era JSON en Oracle. El elenco es intrínseco a la película — no existe independientemente. |
| `crew` | **Embed** como array `[{name, role}]` | Igual que cast: intrínseco, ya era JSON en Oracle. |
| `awards` | **Embed** como objeto `{wins, nominations}` | Dato agregado simple, no requiere colección propia. |
| `studio` | **Embed** como objeto `{name}` | Solo necesitamos el nombre, sin relaciones adicionales. |

**Trade-off consciente:** Los géneros están embebidos como snapshot (`{genre_id, name}`). Si el nombre de un género cambia, los documentos de películas no se actualizan automáticamente. Para este dominio, eso es aceptable — los nombres de géneros son estables.

---

### 3. `customers`

```json
{
  "_id": "ObjectId",
  "cust_id": 1392835,
  "first_name": "Jivaja",
  "last_name": "Gidh",
  "email": "jivaja.gidh@oraclemail.com",
  "country": "Brazil",
  "age": 52,
  "income_level": "B: 30,000 - 49,999",
  "segment": {
    "segment_id": 6,
    "name": "Midage Male",
    "short_name": "Midage Male"
  }
}
```

**Decisión:** El segmento de cliente se **embebe** como subdocumento.

**Justificación:** `CUSTOMER_SEGMENT` es una tabla de lookup pequeña y estable (10 segmentos). En el modelo relacional existía solo para evitar repetición de texto. En MongoDB, la denormalización es la norma — embeber el segmento elimina la necesidad de un join y hace al documento de cliente auto-contenido para las consultas más frecuentes (perfil de usuario). Si los nombres de segmento cambian, se puede hacer un `updateMany` — ocurre raramente.

---

### 4. `activities`

```json
{
  "_id": "ObjectId",
  "customer_id": "ObjectId → customers",
  "movie_id": "ObjectId → movies",
  "activity": "purchase",
  "activity_time": "2020-10-01T00:00:00Z",
  "app": "chrome",
  "device": "mac",
  "os": "macos"
}
```

**Decisión:** Colección separada con **referencias por ObjectId** a `customers` y `movies`.

**Justificación:** Las actividades son eventos de alta frecuencia (potencialmente millones). Embeber actividades dentro del documento de cliente crearía documentos que crecen sin límite (problema de "unbounded arrays" en MongoDB). La referencia por ObjectId preserva la capacidad de consultar actividades independientemente (¿qué clientes vieron esta película? ¿qué películas vio este cliente?) con un lookup eficiente.

---

## Resumen de decisiones

| Relación Oracle | Decisión MongoDB | Razonamiento |
|----------------|-----------------|--------------|
| MOVIE ↔ GENRE (M:N con tabla intermedia) | Embed géneros en Movie | Elimina la tabla intermedia; género es atributo de la película |
| MOVIE.cast / crew / awards (JSON cols) | Embed arrays directamente | Ya era JSON en Oracle; natural en documento |
| CUSTOMER → CUSTOMER_SEGMENT (M:1) | Embed segmento en Customer | Lookup pequeño y estable; elimina join |
| ACTIVITY → CUSTOMER, MOVIE, GENRE (FKs) | Referencias por ObjectId | Alta cardinalidad; arrays no acotados son anti-pattern |

## Consultas que se volvieron más fáciles

- Obtener una película con todos sus metadatos (cast, crew, géneros, premios): **un solo documento**, sin JOINs
- Filtrar películas por género: `db.movies.find({ "genres.name": "Sci-Fi" })` — índice en campo embebido

## Consultas que se volvieron más difíciles

- Renombrar un género y que se refleje en todas las películas: requiere `updateMany` en lugar de un UPDATE de una sola fila
- Obtener el historial de actividades de un cliente con datos de película: requiere `$lookup` (el JOIN de MongoDB)
