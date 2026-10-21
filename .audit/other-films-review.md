# Cuatro contraplanos

## Intent

> Conservar Grand Budapest exactamente como está. Explorar las otras cuatro interpretaciones con encuadres distintos, imágenes reconstruidas y descubrimientos opcionales que lleven al trabajo real de Tomas. Preparar variantes rápidas para alinear el gusto antes de tocar producción.

## Reviewers

- Reviewer A. gpt-6-astra, high. Cuatro hallazgos y revisión de los cuatro conceptos.
- Reviewer B. gpt-6.1-sol, high. Cinco hallazgos.
- Reviewer C. gpt-6-luna, high. Cinco hallazgos.

Los tres recibieron el mismo brief y revisaron código sin editar archivos. Sus hipótesis visuales no son pruebas de navegador. El lead probó después las escenas del prototipo.

## Act on

| Problema | Acuerdo | Evidencia | Decisión para los prototipos |
| --- | --- | --- | --- |
| Las aperturas requieren entre 185 y 235svh antes de terminar su presentación. | A, B, C | Alturas en `src/reels/camera.css:112`, `183`, `343` y `626`. El perfil y Work se renderizan después de Opening. | Una composición inicial, scroll normal y un segundo plano que se abre por decisión del visitante. |
| Odyssey oculta contacto durante su apertura de escritorio. | A, B | `src/reels/camera.css:875` a `907`. La navegación de secciones no incluye Contact. | Nombre, Work y Contact visibles en el encabezado de las cuatro propuestas. |
| Los descubrimientos anteriores no están conectados a las aperturas actuales. | A, B | `mountFilmFind` no tiene llamadas. Las aperturas no contienen sus selectores. Los objetos están en Stage in:readme, que no se renderiza en el inicio. | Un control y un estado revelado junto a cada escena. No reactivar toda la capa anterior. |

Estos hallazgos quedan registrados para el polish de producción. No se aplicaron cambios de producción en esta fase.

## Consider

- A. Las imágenes nuevas no resuelven por sí solas la jerarquía de un póster. Se probaron composiciones distintas, con copia y navegación fuera de las obstrucciones importantes.
- A, B y C. Mood necesita una razón concreta para abrir la carta. Se enlaza el ensayo personal The unglamorous middle, con un resumen basado en el contenido existente. No se pide otro secreto al visitante.
- A y B. La comparación de Blade Runner puede convertirse en un dashboard y repetir el discurso de routing. Se redujo a una clase de solicitud, su criterio y el enlace al caso. No contiene puntajes, costos inventados ni una supuesta evaluación en vivo.
- A. La transición de Odyssey solo merece llamarse match cut si las formas y los ejes coinciden. El prototipo se presenta como corte del corredor a la órbita. La calibración de esa transición queda para una implementación elegida.

## Noted

- C señala que reduced motion deja el reloj de cámara en cero y no muestra paneles posteriores. Los paneles actuales son decorativos. La advertencia es válida si una futura escena contiene información significativa. Los prototipos usan controles y hidden, por lo que el contenido sigue disponible sin animación.
- C observa efectos pasivos en Mood y Odyssey. Se agrupan con el hallazgo de la capa desconectada, sin contarlos como fallos independientes de una interacción activa.
- La fotografía generada es material de exploración y no un fotograma real. La prueba debe decidir si su materialidad convence antes de llevarla a producción.

## Dismissed

- C atribuye un fallo actual de teclado y touch al efecto de sótano en Stage. Ese objeto no se renderiza y su controlador no se monta. Se conserva el requisito de entrada accesible para el prototipo, pero no se reporta como un control actual que funcione solo con mouse.
- No se convierte el comentario de C sobre dos secretos en Mood en un bug confirmado. El formulario existente está en otra parte del recorrido. Sí motivó dar contenido distinto a la carta nueva.

## Agreement map

Los tres identifican el costo de scroll y la necesidad de un descubrimiento voluntario con contenido. A y B prueban además que la capa anterior está desconectada y que Odyssey oculta contacto. Los tres eligen Parasite como concepto más fuerte. La objeción compartida más clara afecta a Mood si la carta no cuenta nada concreto.

Mi recomendación es desarrollar primero Parasite y Mood. Parasite expresa la relación entre producto e infraestructura. Mood permite introducir una faceta personal sin convertir la escena en una interfaz técnica. Blade Runner tiene la imagen de mayor escala, pero requiere cuidar que la explicación no se convierta en un panel de métricas. Odyssey necesita afinar la transición, después de validar su encuadre.

## Prototipos

| Película | Encuadre | Descubrimiento | Recompensa |
| --- | --- | --- | --- |
| Parasite | Ventanal horizontal que separa interior oscuro y jardín. | Abrir el nivel B1. | La decisión de Mint sobre stock cacheado y validación transaccional. |
| In the Mood for Love | Vista a través de celosías y reflejos. | Abrir la correspondencia sobre la mesa. | Una entrada al ensayo sobre el primer startup y el trabajo que no se muestra en la demo. |
| Blade Runner 2049 | Plano abierto monumental con un único punto de luz frío. | Inspeccionar la señal. | Una ruta ilustrativa de extracción. La pista conduce a la nota de Dex más abajo. |
| 2001 | Corredor simétrico con punto de fuga central. | Abrir la esclusa. | Órbita y explicación del catálogo restringido de A2UI. |

Todas las propuestas conservan enlaces directos a casos y contacto. La sección de proyectos usa el mismo contenido para que la comparación visual sea honesta. Los tonos y la tipografía se adaptan a cada película.

## Alcance

La fuente de las cuatro propuestas está en `.prototypes/film-variants`. Es código descartable. Grand Budapest y los archivos bajo src no se modificaron.

Las imágenes están en `assets/parasite.png`, `assets/mood.png`, `assets/blade.png` y `assets/odyssey.png`. Se generaron con el image_gen integrado. El prompt exacto de cada imagen se conserva en `assets/prompts.json`.

El experimento anterior en `.prototypes/budapest-variants` queda superado por la aclaración del usuario. No es la propuesta vigente.

## Verificación

Se abrieron las cuatro variantes de escritorio y sus cuatro descubrimientos en navegador. Las capturas completas están en `screenshots/parasite.png`, `mood.png`, `blade.png` y `odyssey.png`.

Se abrió cada descubrimiento en móvil. La lectura del DOM confirmó que las cuatro imágenes cargaron y que el ancho de página coincidió con el viewport disponible. Se corrigieron recortes de texto en las notas de Blade Runner y Odyssey. Los paneles permiten scroll si el contenido supera su altura disponible.

Los controles expanden contenido real, exponen aria-expanded y permiten volver con Escape. El foco vuelve al control que abrió la escena. El contenido usa hidden, no depende del reloj de scroll. La preferencia de movimiento reducido tiene una regla CSS que desactiva animaciones. No se cambió la preferencia del sistema para probarla.

Se verificó la pista de Blade Runner hasta la nota de Dex y su enlace al artículo. `node --check .prototypes/film-variants/app.js` pasó. `git diff --exit-code -- src public package.json package-lock.json` confirmó que la producción permanece sin cambios.

No se ejecutaron evaluaciones de modelos ni se enviaron correos. Las escenas son una exploración visual, no código listo para publicar.
