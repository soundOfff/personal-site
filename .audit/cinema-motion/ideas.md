# Ideas de interacción para las películas

## Implementadas

**HAL, un ojo que acompaña.** En reposo ocupa 56 × 56 px. Al tocarlo aparece un panel que nace desde el visor. Los comentarios son breves, hablan de la zona que estás explorando y desaparecen solos. El panel conserva conversación, voz y mute. Los ajustes menos frecuentes quedan dentro de Settings.

**Budapest, un encuadre que se desliza.** Los enlaces vuelven a usar el desplazamiento suave del navegador. El marco cambia durante 1,1 segundos y puede cambiar de dirección sin terminar antes la animación anterior. Se eliminó el salto diferido con desenfoque que forzaba el corte.

**Parasite, un pasadizo de servicio.** El lomo de un libro abre el nivel oculto debajo de la foto de la casa. La estantería y la escalera acompañan una apertura que puede cambiar de dirección durante el movimiento. El texto y el enlace del caso siguen en el flujo de lectura. La maqueta lateral de cuatro plantas se retiró por pedido del usuario, porque repetía la navegación principal.

**Blade Runner, un recuerdo construido al navegar.** Un caballo tallado aparece en el archivo, dentro de Tools. Cada sección visitada registra una pieza. Inspeccionar una pieza con foco o puntero la levanta respecto de la silueta. Sus enlaces permiten volver a las secciones. Al cambiar de película empieza un recuerdo nuevo.

**Blade Runner, cámara Esper.** Cada caso tiene un control Inspect que abre un visor junto a su fila. Architecture y Tradeoff cambian el recorte fotográfico y muestran fragmentos del caso real. El título original conserva su enlace. Escape cierra y devuelve el foco al control. El visor queda debajo del caso en pantallas estrechas.

**2001, una transmisión.** El HAL grande del bloque del agente se reemplazó por una franja con el recorrido Tierra–Júpiter y el estado de la transmisión. El HAL de la apertura y el pequeño acompañante conservan sus funciones.

**Home, una colección de películas.** La entrada se presenta como un catálogo oscuro con cuatro pósters gráficos y sus datos. Elegir una película entra directamente, sin tickets ni cuenta regresiva. House lights permite acceder al portfolio editorial.

## Alternativas que vale la pena explorar después

| Película | Idea | Cómo responde | Qué habría que cuidar |
| --- | --- | --- | --- |
| Parasite | La misma lluvia, dos casas | Sustituir el interludio de lluvia actual por dos ventanas que muestran el mismo tiempo desde arriba y abajo. | Reemplazar la escena existente para no duplicar el efecto. Mantener la comparación legible sin movimiento. |
| Parasite | Luz prestada | El gesto del Morse del sótano produce una respuesta arquitectónica arriba, con la lámpara y las habitaciones como un solo sistema. | La casa implementada ya contiene una primera conexión. Una ampliación debería reforzar esa relación y no añadir indicadores. |
| Blade Runner | Archivo físico | El caso bajo la línea de lectura sale unos milímetros de una estantería con canto y base visibles. | La propuesta A lo implementa como alternativa. No lo sumé al caballo para mantener una única idea de memoria. |
| Blade Runner | Cámara Wallace | La luz reflejada sobre el espacio arquitectónico responde a la inspección de un proyecto y vuelve lentamente al reposo. | Debe vincularse a una acción concreta y no quedar como otro resplandor o paralaje permanente. |

## Descartadas en esta pasada

El test de baseline que penaliza desplazarse rápido podría juzgar una conducta normal. Otro acompañante holográfico repetiría el papel de HAL. La piedra de Parasite propuesta en la antigua apertura no producía una diferencia visible al leer la página. Más nieve, partículas o inundaciones repetirían efectos que ya existen.

La comparación completa, los problemas encontrados y la verificación están en synthesis.md y judge.md.
