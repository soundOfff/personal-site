# Comparar tres encuadres

Este prototipo descartable permite elegir una dirección visual. La página de producción no se modificó.

Abrir el [comparador local](http://127.0.0.1:4173/). Los botones superiores cambian entre fachada, pasillo y correspondencia. Los tres conservan nombre, contexto profesional y navegación directa.

Para volver a iniciarlo, ejecutar desde la raíz del repositorio.

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory .prototypes/budapest-variants
```

Los casos de estudio y el blog apuntan al servidor Astro en el puerto 4322. Si ese servidor está detenido, ejecutar `npm run dev -- --host 127.0.0.1 --port 4322`.

La ventana, el sobre y "Look a little closer" abren una pista. La pista lleva al sello E junto a Dex. El sello cuenta una decisión técnica del caso existente y enlaza el artículo sobre evals. Abrir proyectos no requiere seguir la pista.

La fotografía se generó con el image_gen integrado. `assets/scenes.png` contiene tres planos en una lámina. `assets/prompt.txt` conserva el prompt exacto. Las fuentes se copiaron de los paquetes ya instalados. Este prototipo no añade dependencias.

La revisión completa está en [el informe de interrogate](../../.audit/budapest-review.md). Las capturas de escritorio están en `screenshots/01-fachada.png`, `screenshots/02-pasillo.png` y `screenshots/03-correspondencia.png`.
