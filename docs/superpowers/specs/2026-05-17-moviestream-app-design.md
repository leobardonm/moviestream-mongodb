# MovieStream MongoDB App — Design Spec

**Date:** 2026-05-17  
**Stack:** Node.js + Express + EJS + Mongoose + MongoDB Atlas  
**Deploy:** Render (app) + MongoDB Atlas M0 (DB)

---

## Context

Migration of a relational Oracle schema (MovieStream) to MongoDB.  
Source: DDL-only (`database.txt`) — no existing data, all seed data is synthetic.

---

## MongoDB Collections

### `movies`
Central document. Cast, crew, awards, studio, nominations were already JSON columns in Oracle — embed them directly.  
Genres embedded as snapshot array `[{ genre_id, name }]` — denormalized for fast reads.

```json
{
  "_id": "ObjectId",
  "movie_id": 1,
  "title": "Inception",
  "year": 2010,
  "genres": [{ "genre_id": 1, "name": "Sci-Fi" }],
  "cast": [{ "name": "Leonardo DiCaprio", "role": "Cobb" }],
  "crew": [{ "name": "Christopher Nolan", "role": "Director" }],
  "awards": { "wins": 4, "nominations": 8 },
  "studio": { "name": "Warner Bros" },
  "runtime": "148 min",
  "summary": "A thief who steals corporate secrets through dream-sharing technology.",
  "list_price": 3.99,
  "image_url": "https://..."
}
```

### `genres`
Separate collection for CRUD management. Deleting a genre does NOT cascade — movies keep the embedded snapshot. This becomes a reflection point.

```json
{ "_id": "ObjectId", "genre_id": 1, "name": "Sci-Fi" }
```

### `customers`
Segment embedded as subdocument — it's a small, slow-changing lookup.

```json
{
  "_id": "ObjectId",
  "cust_id": 1,
  "first_name": "Ana",
  "last_name": "García",
  "email": "ana@example.com",
  "country": "Mexico",
  "age": 28,
  "income_level": "Middle",
  "segment": { "segment_id": 2, "name": "Premium Subscriber", "short_name": "PREM" }
}
```

### `activities`
High-volume, write-heavy — kept as separate collection with ObjectId references.

```json
{
  "_id": "ObjectId",
  "customer_id": "ObjectId",
  "movie_id": "ObjectId",
  "activity": "watch",
  "activity_time": "ISODate",
  "app": "web",
  "device": "desktop",
  "os": "macOS"
}
```

---

## App Structure

```
tareadb/
├── server.js           # Express entry point, mounts routes
├── seed.js             # Drop + recreate all collections with synthetic data
├── models/
│   ├── Movie.js
│   ├── Genre.js
│   ├── Customer.js
│   └── Activity.js
├── routes/
│   ├── movies.js       # GET /movies, GET /movies/new, POST /movies,
│   │                   # GET /movies/:id, GET /movies/:id/edit,
│   │                   # POST /movies/:id, POST /movies/:id/delete
│   └── genres.js       # Same pattern for genres
├── views/
│   ├── layout.ejs      # Shared nav + wrapper
│   ├── movies/
│   │   ├── index.ejs   # List + search by genre/title
│   │   ├── show.ejs    # Detail view
│   │   ├── new.ejs     # Create form
│   │   └── edit.ejs    # Edit form
│   └── genres/
│       ├── index.ejs
│       ├── new.ejs
│       └── edit.ejs
├── public/
│   └── style.css
├── .env                # MONGODB_URI
└── package.json
```

---

## CRUD Coverage

| Collection | List | Create | Edit | Delete | Relationship |
|------------|------|--------|------|--------|-------------|
| Movies | ✓ (filter by genre) | ✓ (select genres from dropdown) | ✓ | ✓ | genres embedded |
| Genres | ✓ | ✓ | ✓ | ✓ | referenced by movies |

The interesting operation: creating/editing a movie requires selecting genres from the `genres` collection — this is where the embed/reference hybrid shows its complexity.

---

## Seed Data

- 5 genres
- 20 movies (each with 1-3 genres, 3-5 cast members, director in crew)
- 4 customer segments
- 15 customers (spread across segments)
- ~40 activities (2-3 per customer, mix of watch/rate/search)

---

## Routing Pattern

Using POST-only forms (no PUT/DELETE from HTML forms), with `?_method=DELETE` override via `method-override` middleware.  
Actually simpler: use POST /movies/:id/delete for delete, POST /movies/:id for update.

---

## Environment

```
MONGODB_URI=mongodb+srv://...
PORT=3000
```

---

## Deployment

- Render: connect GitHub repo, set MONGODB_URI env var, start command `node server.js`
- MongoDB Atlas M0: whitelist `0.0.0.0/0` for Render's dynamic IPs
