# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a database modeling assignment (MovieStream) that migrates a relational Oracle schema to MongoDB. The goal is to design a document model, seed it with data, and build a simple CRUD web app on top of it.

**Deliverables required:**
- `MODEL.md` — MongoDB schema design with embed/reference justification for each relationship
- `seed.js` (or `seed.py`) — script to recreate the database from scratch
- Web app with full CRUD on at least 2 collections (one must have relationships)
- `REFLECTION.md` — honest answers to the 3 reflection questions
- `README.md` — description, run-from-zero instructions, stack rationale, screenshot
- Deployed public URL (Vercel, Render, Railway, etc.)

## Source Schema (Oracle)

Six tables to migrate:

| Table | Key fields |
|-------|-----------|
| `CUSTOMER` | cust_id (PK), 36 demographic fields, segment_id (FK) |
| `CUSTOMER_SEGMENT` | segment_id (PK), name, short_name |
| `MOVIE` | movie_id (PK), title, year, cast/crew/genre/awards/studio/nominations (JSON), budget, gross, runtime, summary, list_price |
| `GENRE` | genre_id (PK), name |
| `ACTIVITY` | cust_id (FK), movie_id (FK), genre_id (FK), activity, activity_time, app, device, os |
| `CUSTSALES` | cust_id, movie_id, genre_id, day_id, payment_method, list_price, discount_percent, actual_price |

Note: `MOVIE` already stored cast, crew, genre, awards, studio, nominations as JSON columns in Oracle — these map naturally to embedded arrays in MongoDB.

## Recommended Stack

**Simplest path:** Node.js + Express + EJS + MongoDB (Mongoose or native driver) → deploy to Render with MongoDB Atlas M0

```bash
# Typical commands once project is set up
npm install
npm run seed      # populate database
npm start         # start server
npm run dev       # if using nodemon for development
```

Environment variable needed: `MONGODB_URI` (connection string to Atlas or local MongoDB).

## Seed Data Requirements

- At least 20 movies, 5 genres, 10 actors, 15 customers with interactions
- Data must be coherent (relationships make sense across documents)
- Running `node seed.js` (or `python seed.py`) should drop and recreate all collections

## Key Design Decisions to Document in MODEL.md

- **Genre**: embed name array in Movie, or keep separate `genres` collection and reference?
- **Cast/Crew**: already JSON in Oracle → embed directly in Movie document
- **Customer segment**: embed segment object in Customer, or reference?
- **Activity**: reference customer and movie by `_id` (high volume, write-heavy, benefits from normalized storage)
- **Sales (CUSTSALES)**: reference or embed snapshot of price at time of purchase?

## Reflection Questions (REFLECTION.md)

1. What would you redesign from scratch, and what did implementation reveal that wasn't obvious upfront?
2. Which CRUD operation felt forced compared to a SQL JOIN? Was the pain from NoSQL or from your model?
3. For MovieStream specifically — was NoSQL actually better than the relational model?
