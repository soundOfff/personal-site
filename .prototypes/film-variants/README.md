# Comparar las otras cuatro películas

Abrir el [comparador local](http://127.0.0.1:4174/). Los cuatro botones superiores cambian la propuesta. Grand Budapest queda como está en la landing actual.

Para iniciar el prototipo desde la raíz del repositorio.

```sh
python3 -m http.server 4174 --bind 127.0.0.1 --directory .prototypes/film-variants
```

Los casos, el blog y el CV apuntan al servidor Astro local en el puerto 4322. Para iniciarlo.

```sh
npm run dev -- --host 127.0.0.1 --port 4322
```

En Parasite, abrir el otro piso. En Mood, abrir la carta. En Blade Runner, inspeccionar la señal y buscar la nota junto a Dex. En 2001, abrir la esclusa. Escape vuelve al plano inicial. El trabajo y el contacto están disponibles sin explorar.

Este código es un prototipo descartable. No se modificó src ni se publicaron cambios. Las cuatro escenas generadas están en assets. Los prompts exactos están en `assets/prompts.json`.

La revisión de los tres modelos y el criterio del lead se guardaron en [el informe](../../.audit/other-films-review.md).
