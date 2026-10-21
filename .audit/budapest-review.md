# Budapest direction review

## Intent

> Hacer más singular el portfolio de Tomas a partir de Grand Budapest. Comparar encuadres, escenas y descubrimientos opcionales que enseñen algo de su trabajo. Mantener visibles su identidad, sus proyectos y el contacto. Separar la elección visual de una reescritura de producción.

## Reviewers

- Reviewer A. gpt-6-astra, high. Seis hallazgos.
- Reviewer B. gpt-6.1-sol, high. Seis hallazgos.
- Reviewer C. gpt-6-luna, high. Dos hallazgos y una observación de dirección.

Los tres revisaron el mismo brief y la misma base sin editar archivos. Sus conclusiones visuales se basaron en código. El lead abrió después la página actual y el prototipo en el navegador.

## Act on

Estos problemas quedan pendientes en la página de producción. Interrogate no autoriza aplicarlos automáticamente.

| Problema | Modelos | Evidencia | Decisión |
| --- | --- | --- | --- |
| El registro nombra proyectos sin enlazarlos. | A, B | `src/reels/openings/Budapest.astro:22`. Dex, Mint y Flagship son párrafos. | Enlazar cada proyecto desde la composición inicial. El prototipo sí permite abrir los casos desde su sección Work. |
| La etiqueta interactiva no aparece y su controlador no se monta. | A, B | `src/pages/index.astro:46` renderiza Opening. La etiqueta está en `src/reels/budapest/Stage.astro:85`, dentro del stage in:readme que no se renderiza. La búsqueda de mountFilmFind encuentra su declaración, sin llamadas. | Poner el descubrimiento dentro de la composición efectivamente renderizada. No restaurar el hero antiguo entero para recuperar un objeto. |
| La apertura prioriza el eslogan y retrasa la explicación profesional. | A, B | `src/reels/camera.css:455` reserva 175svh. La identidad del registro llega a 6px en móvil en `camera.css:1140`. | Nombre, contexto y acceso a Work deben aparecer en el primer encuadre. El prototipo los muestra antes de la imagen. |
| Las llaves ocultan el nombre del destino. El elemento actual también pierde el texto con foco de teclado. | A, B | `src/reels/budapest/reel.css:240` y `reel.css:291`. La corrección posterior solo cubre hover. | Mantener etiquetas legibles. Animar la llave como adorno. |
| El contacto inmediato desaparece entre 821 y 960px. | A | `src/reels/budapest/reel.css:566`. Se oculta contact-wrap y el reemplazo queda al final. | Reservar un contacto visible en el encabezado. |
| Los títulos de sección no forman una jerarquía de encabezados accesible. | B | `src/components/Keybar.astro:20` usa p y b. Los capítulos decorativos son spans ocultos a accesibilidad. | Usar encabezados semánticos sin cambiar su aspecto. El prototipo tiene h1, h2 y h3. |

## Consider

- A y B. El texto "Gift of the artist" y el movimiento de los retratos sugieren una acción también en artículos privados que no enlazan. Ver `src/reels/budapest/reel.css:2173`. Conservar el retrato, pero ajustar la atribución y la indicación de clic.
- C. Los nueve alias de hotel pueden sumar esfuerzo de interpretación. Ver el mapa chapters en `src/reels/budapest/Stage.astro:24`. Usar el vocabulario del hotel para la narración y nombres explícitos para navegar.
- A, B y C recomiendan la fachada. Coinciden en que demasiadas ventanas operables convertirían el portfolio en un juego de habitaciones. Probar pocos objetos y conservar enlaces normales.

## Noted

- C identifica una transición de 0.9 segundos en la etiqueta sin una excepción específica de movimiento reducido. Es un defecto latente si vuelve a montarse esa etiqueta. La etiqueta no está disponible en el recorrido actual, así que no es un fallo de movimiento observable hoy.
- La imagen generada es material de exploración. No representa un fotograma real. Debe revisarse su materialidad antes de usarla como arte final.
- En la primera carga del servidor local se observó una página oscura y un error SSR de React useState en el log. Una recarga mostró el selector y luego la landing. No se confirmó un defecto persistente ni se atribuyó una causa sin reproducirla.

## Dismissed

- C afirma que el funicular de 1932 termina antes de verse. La hipótesis presupone que se renderiza el diorama antiguo. Ese stage ya no está en la apertura actual. No corresponde corregir la temporización de un elemento ausente como si fuera un fallo visible.
- No se necesitan nuevas capas de abstracción ni tests automatizados para elegir entre estas composiciones. La comprobación relevante en esta fase es abrirlas e interactuar con ellas.

## Agreement map

A y B coinciden por separado en los enlaces ausentes, la interacción desconectada, la demora de la apertura y la navegación oculta. Es el consenso más sólido de la revisión. C detectó dos problemas en una interacción que ya no llega al usuario. La comprobación de su montaje cambió la prioridad de esos hallazgos.

Los tres prefieren la fachada. Eso es una recomendación compartida, no evidencia de que el usuario la prefiera. El comparador permite decidir entre las tres imágenes y sus objetos.

## Variants

| Variante | Encuadre | Interacción probada | Ventaja | Costo |
| --- | --- | --- | --- | --- |
| Fachada | Frontal y simétrico. | Ventana iluminada, pista y sello en Dex. | La silueta es reconocible y mantiene un eje claro. | Puede parecer una web de hotel si la escena domina la identidad profesional. |
| Pasillo | Frontal lateral con tres puertas. | Cada puerta abre una nota del proyecto con enlace al caso. | Explicita las tres áreas de trabajo. | En móvil el recorte necesita controles separados. |
| Correspondencia | Cenital sobre el escritorio. | Registro y sobre operables. | Los objetos dan una razón natural para explorar. | Se acerca más a la composición existente y cambia menos la identidad. |

Recomendación del lead. Desarrollar la fachada como apertura. Usar la mesa cenital para una escena posterior si la conversación con Tomas confirma esa combinación. No introducir todavía cambios de relación de aspecto ni scroll adicional. La búsqueda de una pista debe conducir a una decisión profesional, no a una recompensa sin contenido.

## Browser evidence

- Se abrieron las tres variantes y se guardaron capturas completas en `.prototypes/budapest-variants/screenshots`.
- Se siguió la pista del sobre hasta el sello de Dex. La nota final mostró el texto sobre el compromiso de los evals y el enlace a Evals are contracts.
- Se revisaron fachada y pasillo en un viewport de teléfono. El pasillo inicialmente recortaba los accesos laterales. Se reemplazaron por tres controles visibles de al menos 44px de alto. La lectura DOM posterior mostró ancho de página igual al ancho disponible.
- Se observó la jerarquía de encabezados del prototipo en el árbol accesible.
- `node --check .prototypes/budapest-variants/app.js` pasó.
- El movimiento reducido se contempla con CSS. No se ejecutó una prueba con la preferencia del sistema activada.
- No se probaron entregas de correo, el agente en vivo ni todos los destinos externos. Son límites de esta exploración visual.

## References

[David Bordwell analiza el encuadre y el formato 4:3 de Grand Budapest](https://www.davidbordwell.net/blog/2014/03/26/the-grand-budapest-hotel-wes-anderson-takes-the-43-challenge/). La referencia fundamenta la exploración de composiciones frontales y compactas. No implica reproducir la película literalmente.

[Ficha de Grand Budapest en Criterion](https://www.criterion.com/films/29601-the-grand-budapest-hotel).

La documentación local `docs/design/scroll-camera.md` registra que un experimento anterior descartó fotografía generada por su aspecto artificial. Por eso esta imagen se mantiene aislada y pendiente de feedback.
