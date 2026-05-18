# REFLECTION.md — Reflexión sobre la implementación

## 1. Volviendo a empezar

Si rediseñara el modelo desde cero, cambiaría la decisión de embeber géneros en películas como snapshot `{genre_id, name}`.

Al principio parecía la decisión obvia: los géneros son parte natural del documento de película, las lecturas son más rápidas, y el esquema original de Oracle ya los tenía como JSON. Lo que no anticipé fue el momento en que el formulario de edición de película necesita mostrar qué géneros ya tiene asignados para marcar los checkboxes correctos.

El problema concreto: los géneros embebidos guardan `genre_id` (número), pero el formulario HTML trabaja con `_id` de MongoDB (ObjectId). Para saber cuáles checkboxes marcar, tuve que comparar `genre_id` numéricos — un campo que existe en ambos lados — pero que no es el identificador natural de MongoDB. El código resultante fue:

```js
const selectedGenreIds = movie.genres.map(g => g.genre_id);
// En el template: selectedGenreIds.includes(g.genre_id)
```

Funciona, pero es frágil. Si hubiera guardado los ObjectIds de género en el embedding (`{_id: ObjectId, name: "..."}`), el código sería más limpio y consistente con el resto del sistema. La información que me faltó al inicio fue cuánto trabajo hace el formulario de edición con los datos relacionados — solo lo descubrí cuando escribí las rutas de actualización.

---

## 2. La conversación con el modelo

La operación más incómoda fue **editar una película y que sus géneros se actualicen correctamente**.

En SQL, esto sería:
```sql
UPDATE movie SET ... WHERE movie_id = ?;
DELETE FROM movie_genre WHERE movie_id = ?;
INSERT INTO movie_genre (movie_id, genre_id) VALUES (...);
```

Tres operaciones limpias y atómicas sobre tablas normalizadas.

En MongoDB, para hacer lo equivalente, la ruta de actualización tiene que:

1. Recibir los `_id` de los géneros seleccionados en el formulario
2. Ir a la colección `genres` y buscar esos documentos para obtener `{genre_id, name}`
3. Reemplazar el array `genres` embebido en el documento de película

```js
const genreDocs = await Genre.find({ _id: { $in: selectedIds } });
const embeddedGenres = genreDocs.map(g => ({ genre_id: g.genre_id, name: g.name }));
await Movie.findByIdAndUpdate(id, { genres: embeddedGenres });
```

Son dos queries en lugar de una operación simple. Y si la primera falla a mitad del camino, los géneros embebidos quedan inconsistentes — MongoDB no tiene transacciones en el mismo sentido que SQL (aunque las soporta con multi-document transactions, que no usé aquí).

¿Era inherente a NoSQL o consecuencia de mi modelo? **Ambos.** La necesidad de dos queries es consecuencia de haber separado géneros en su propia colección mientras los embebo en películas. Si hubiera optado por embedding puro (sin colección `genres`), no habría este problema — pero tampoco tendría CRUD de géneros. El trade-off está en la arquitectura, no solo en MongoDB.

---

## 3. La pregunta honesta

Para MovieStream específicamente: **depende de qué parte del sistema estés mirando.**

**Donde NoSQL ganó claramente:**

El catálogo de películas. La tabla `MOVIE` en Oracle ya almacenaba `cast`, `crew`, `genre`, `awards`, `studio` y `nominations` como columnas JSON — el modelo relacional ya era un híbrido forzado. Llevar eso a MongoDB fue literalmente copiar la estructura: un documento de película es exactamente lo que ya era, sin el overhead de columnas JSON en una BD relacional. Leer una película con todos sus metadatos es un solo `findById()` sin JOINs. Para una app de catálogo con muchas lecturas y pocos writes, esto es real.

**Donde el modelo relacional hubiera sido mejor:**

Las actividades y las ventas (`ACTIVITY`, `CUSTSALES`). Son tablas de hechos transaccionales con relaciones muchos-a-muchos reales — exactamente el caso de uso donde el modelo relacional brilla. En MongoDB terminé con colecciones que se ven casi idénticas al esquema relacional original (referencias por ObjectId en lugar de foreign keys), pero sin las garantías de integridad referencial. Si borro una película, sus actividades siguen existiendo apuntando a un ObjectId que ya no existe. En Oracle, una foreign key hubiera impedido eso o hecho cascade delete.

**Conclusión honesta:**

MovieStream es un dominio mixto. El catálogo de películas (con sus metadatos ricos y jerárquicos) se beneficia genuinamente del modelo documental. El tracking de actividades y ventas no — ahí el modelo relacional es más apropiado, más seguro y más expresivo. La respuesta correcta para un sistema real probablemente sería una arquitectura mixta: MongoDB para el catálogo, PostgreSQL para transacciones y analítica. La pregunta "¿NoSQL o SQL?" suele ser una falsa dicotomía cuando el dominio tiene partes con naturalezas distintas.
