# Changelog — OPC OpuntiaColor

Todas las versiones que cambian resultados están señaladas de forma explícita.
Las imágenes procesadas con versiones anteriores a un cambio así **no son
reproducibles** con la versión nueva: para comparar, hay que reprocesarlas.

## v3.4.0 (2026)

### La intensidad de LDS pasa a ser el exponente de blanqueo

- **El control de intensidad ahora funciona en LDS.** Hasta v3.3.0 no tenía
  ningún efecto: las tres componentes principales se multiplicaban por
  `2 × intensidad`, un factor **común** a las tres, que se cancelaba exactamente
  contra la normalización por mínimo y máximo del final. No era un error de
  redondeo sino una identidad algebraica —la salida era idéntica byte a byte con
  intensidad 0.2 y con 5.0.

  En vez de un factor de escala, la intensidad es ahora el **exponente γ** al que
  se eleva la equalización de varianzas:

  ```
  componente_k  ←  componente_k · (σ̄ / σ_k)^γ        con  γ = intensidad / 1.5
  ```

  γ = 0 deja la transformación en la identidad, γ = 1 ecualiza por completo las
  varianzas (blanqueo ZCA) y γ > 1 sobre-blanquea. Como el exponente cambia la
  *forma* de la transformación y no su escala, no puede cancelarse. Topeado en
  γ = 2, que se alcanza en intensidad 3.0.

  Los pasos de proyección y reproyección juntos equivalen a aplicar `Σ^(−γ/2)` a
  los datos centrados: es un blanqueo ZCA parcial, con todo el rango intermedio
  bien definido.

### No cambia ningún resultado ya publicado

- **Con el valor por defecto (intensidad 1.5) γ vale exactamente 1**, que es la
  equalización completa que hacía v3.3.0. La salida es **idéntica byte a byte**,
  verificado en cinco imágenes, en modo lote con estadísticas congeladas y con
  zona seleccionada.
- Y como hasta v3.3.0 el control no hacía nada, **toda salida LDS existente *es*
  la salida por defecto**. Ninguna imagen ya publicada con LDS queda invalidada,
  cualquiera haya sido la intensidad con la que se generó.
- Hay una prueba automática que fija el checksum exacto de esa salida.

### Para qué sirve

Bajar la intensidad a 0.5 – 1.0 (γ ≈ 0.33 – 0.67) aplica una decorrelación
parcial: la roca conserva más su color real y el realce es más suave. Es la forma
de **verificar si un motivo sigue estando con menos estiramiento** — si aparece
solo a intensidad alta, conviene tratarlo como hipótesis. Hasta v3.3.0 esa
comprobación no se podía hacer, porque el filtro siempre aplicaba el máximo.

### Salvedades

- El extremo bajo **no devuelve la foto original**: la normalización por mínimo y
  máximo de cada canal se sigue aplicando, así que el piso es "la original con
  auto-niveles".
- La decorrelación efectiva crece hasta γ ≈ 1.3 y después vuelve a bajar: el
  sobre-blanqueo reintroduce correlación con la estructura invertida.
- "Intensidad 2.0" significa cosas distintas en cada filtro y **no es comparable
  entre ellos**. Al reportar parámetros hay que consignar el filtro.

Detalle en [docs/LIMITACIONES.md §3](docs/LIMITACIONES.md#3-el-rango-de-intensidad-de-lds-no-llega-a-la-foto-original)
y [docs/PARAMETROS.md](docs/PARAMETROS.md#lds-la-intensidad-es-el-exponente-de-blanqueo).

---

## v3.3.0 (2026)

> **Nota de publicación (4 de agosto de 2026).** La subida original de v3.3.0
> quedó incompleta y el sitio publicado estuvo en blanco entre el 28 de julio y
> el 4 de agosto. Se subió `app.js` ya compilado pero no `src/app.jsx`, que
> siguió en v3.2 sin la corrección de Jacobi; y un commit posterior sobreescribió
> `app.js` con el código fuente JSX **sin compilar**. Como `index.html` carga
> `app.js` como script plano y sin Babel, el navegador no podía parsearlo y la
> página no mostraba nada.
>
> Ya está corregido: `src/app.jsx` contiene la fuente de v3.3.0 y `app.js` es su
> compilado, idéntico byte a byte al que se había publicado el 28 de julio. **La
> aplicación en sí no cambió: los resultados de v3.3.0 son los mismos.** Se
> agregaron además los archivos que este changelog ya anunciaba y que no se
> habían subido (`docs/` y `tests/`), incluida una prueba automática que compara
> `app.js` con el resultado de compilar `src/app.jsx` para que el desfase no
> pueda repetirse.

### Corrección científica — cambia los resultados

- **Rotación de Jacobi corregida** — La eigendecomposición actualizaba las
  columnas de la matriz en una copia auxiliar, pero solo volcaba de vuelta las
  filas *p* y *q*. Las filas restantes quedaban con sus columnas *p*,*q* sin
  actualizar: la matriz perdía la simetría durante la iteración y el resultado
  convergía a eigenvalores incorrectos. En una covarianza típica de fotografía
  de panel el error era grande —λ₂ podía salir sobrevaluada varias veces y λ₃
  colapsaba prácticamente a cero—, justo en las componentes de baja varianza
  que el decorrelation stretch busca amplificar.

  Los eigenvalores ahora coinciden con los de una implementación de referencia
  (`numpy.linalg.eigh`) hasta la precisión de máquina, y hay una prueba
  automática que lo verifica contra valores calculados de forma independiente.

  **Afecta a CRGB, DS-LAB y LDS.** Las imágenes generadas con v3.0 a v3.2.1
  difieren de las que produce esta versión. Si hay material publicado o en
  preparación con las versiones anteriores, hay que reprocesarlo.

### Documentación y empaquetado

- `docs/ALGORITMOS.md` — descripción completa de cada filtro, paso a paso.
- `docs/PARAMETROS.md` — rangos, valores por defecto y efecto de cada parámetro.
- `docs/INSTALACION.md` — requisitos, formas de uso y compilación.
- `docs/LIMITACIONES.md` — límites metodológicos, técnicos y de reproducibilidad.
- `tests/` — pruebas automáticas del núcleo de procesamiento, sin dependencias
  (`node tests/run-tests.js`): conversiones de color, eigendecomposición contra
  valores de referencia, determinismo, comportamiento de la máscara de
  selección, congelado de estadísticas del lote y correspondencia entre
  `src/app.jsx` y `app.js`.
- `CITATION.cff` — GitHub muestra cómo citar la herramienta.
- `LICENSE` — texto completo de la GPL v3 (antes había solo el aviso de
  copyright) y encabezado de licencia en el código fuente.
- `THIRD-PARTY-NOTICES.md` — atribución de React, Babel y las tipografías
  incluidas en `lib/`, como exigen sus licencias.
- `package.json` y `.zenodo.json` — metadatos de versión, dependencias y
  depósito.

### Problemas conocidos

- **La intensidad no tiene efecto en LDS.** El factor de amplificación se
  cancela exactamente con la normalización por mínimo y máximo posterior. Sin
  resolver: la corrección exige decidir qué debería controlar ese parámetro en
  un filtro que reproyecta al espacio original.
  *Resuelto en v3.4.0: la intensidad pasó a ser el exponente de blanqueo.*

---

## v3.2 (2026)

### Procesado por lote para fotogrametría
- **Botón "Procesar lote"** — Ajustá el filtro (o cadena de filtros con Acumular) en una foto de referencia y aplicalo automáticamente a todas las fotos del lote fotogramétrico.
- **Matriz congelada** — Las estadísticas de los filtros (matriz de decorrelación, medias, desvíos, rangos de normalización) se capturan de la foto de referencia y se aplican **idénticas** a todo el lote. Sin esto, cada foto recalcularía sus propias estadísticas y la textura del modelo 3D quedaría inconsistente entre fotos. Si había una selección de zona activa, la matriz proviene de esa zona (como la matriz guardada de DStretch).
- **Mismo nombre de archivo** — Cada foto procesada se guarda con el nombre del original (en la carpeta destino que elijas), para el flujo estándar de reemplazo de texturas: alinear el modelo con los originales y reconstruir la textura con las realzadas.
- **EXIF por foto** — En formato JPG, cada foto del lote conserva su propio EXIF/GPS (distancia focal para Metashape/Meshroom, coordenadas, fecha).
- **Carpeta destino** — Con la File System Access API (Chrome/Edge) elegís dónde guardar; en navegadores sin soporte las fotos se descargan una por una. Todo sigue siendo 100% local.
- **Opciones de lote** — Formato (JPG recomendado / PNG / TIFF), resolución máxima (completa 8192 / 4000 / 2000 px), barra de progreso, cancelación y reporte de errores por archivo.
- **Ajustes post incluidos** — El contraste y la saturación aplicados a la referencia también se aplican al lote.

### Correcciones (v3.2.1)
- **Cuelgue del lote con contraste/saturación** — Con ajustes post activos, el lote creaba un segundo canvas a resolución completa por foto y aplicaba `ctx.filter` (CSS), que con fotos grandes cae al render por software: minutos por foto y el doble de memoria. Ahora el ajuste se aplica por píxel (matriz exacta de los filtros CSS `contrast()`/`saturate()`), sin canvas extra.
- **Memoria en lotes largos** — Se reutiliza un único canvas de trabajo para todo el lote (antes se creaba uno por foto sin liberar su memoria) y se libera al terminar.

---

## v3.1 (2026)

### Corrección científica
- **Componentes principales ordenados** — La eigendecomposición Jacobi ahora ordena los eigenvectores por eigenvalor descendente. Antes la asignación PC→canal RGB era arbitraria: la misma escena podía dar colores distintos en fotos distintas. Ahora CRGB y DS-LAB son reproducibles y comparables entre imágenes.
- **Estadísticas por zona de selección** — Con una selección activa, los filtros estadísticos (CRGB, DS-LAB, LDS, YBK, Blanco, Negro, Bicromo, Mapa de pigmentos, Micro-relieve) calculan media/covarianza/decorrelación solo con los píxeles de esa zona, como DStretch. Mejor separación de pigmentos locales.
- **CLAHE real** — El filtro CLAHE ahora implementa el algoritmo de Zuiderveld (1994): histogramas por tile 8×8 con clip limit e interpolación bilineal. Antes era un realce de contraste local por normalización estadística.

### Rendimiento
- **Micro-relieve con imagen integral** — Los promedios de vecindario usan summed-area tables (O(1) por píxel). En imágenes grandes pasa de minutos a menos de un segundo.
- **Máscara de mano alzada rasterizada con canvas** — Reemplaza el point-in-polygon por píxel.
- **Precompilado** — `app.js` se genera con `node build.js`; el navegador ya no compila JSX en cada arranque (arranque instantáneo, −2.8 MB).

### Correcciones
- **Modo Acumular + intensidad** — Mover el slider de intensidad con Acumular activo ya no reaplica el filtro sobre sí mismo sin control.
- **TIFF válido según spec 6.0** — BitsPerSample como array [8,8,8], X/YResolution como RATIONAL, ResolutionUnit agregado.
- **RAW eliminado de la interfaz** — El navegador no puede decodificar RAW; la promesa era falsa (los archivos se rechazaban en silencio). La UI ahora indica convertir a JPG/PNG antes.
- **Procesamiento con setTimeout** — requestAnimationFrame se pausaba si la pestaña perdía visibilidad y el filtro quedaba colgado.

### Nuevas funciones
- **Resolución completa opcional** — Toggle para procesar hasta 8192px en lugar del límite de 2000px (para publicación/archivo).
- **Exportación reproducible** — El nombre del archivo registra filtro, intensidad y ajustes post (`_OPC_crgb_i1.8_c10.png`); el JPG exportado conserva el EXIF/GPS original.
- **100% offline** — React, ReactDOM y las fuentes se cargan desde `lib/`; no se necesita internet nunca.

---

## v3.0 (2025)

### Filtros
- **CRGB reescrito** — Nuevo algoritmo de mapeo directo de componentes principales a canales RGB sin reproyección. Produce separación cromática máxima, ideal para revelar diferencias de pátina en petroglifos y grabados.
- **YBK reescrito** — Ecualización estadística de crominancia YCbCr (3× más agresiva). Normaliza por desviación estándar global antes de amplificar. Azules profundos y amarillos saturados.
- **LDS reescrito** — Ecualización de eigenvalues con reproyección al espacio RGB original. Separación cromática fuerte manteniendo colores naturales.
- **DS-LAB reescrito** — Decorrelación en espacio CIE-LAB con mapeo directo de PCs a RGB. Máxima sensibilidad a diferencias perceptuales de pigmento.
- **Micro-relieve** — Renombrado de "Petroglifo" para evitar confusión con la categoría.

### Selección de zona
- Tres herramientas: rectángulo, círculo y mano alzada
- Los filtros se aplican solo dentro de la zona seleccionada
- Máscara visual con oscurecimiento exterior y borde punteado
- Cada nueva selección reemplaza automáticamente la anterior
- Corrección de mapeo de coordenadas para objectFit contain

### Interfaz
- Filtros en lista única sin categorías (antes divididos en Pinturas/Grabados/Técnico)
- Descripción de uso visible debajo de cada filtro
- Eliminado subtítulo del header
- Eliminada toda mención a DStretch

### Exportación
- Soporte de exportación en PNG, JPG y TIFF
- Encoder TIFF sin comprimir integrado (RGB 8-bit)
- Aceptación de archivos RAW (DNG, CR2, CR3, NEF, ARW, ORF, RW2)

---

## v2.5 (2025)

### Filtros nuevos
- **CRGB** — Decorrelation stretch puro en espacio RGB
- **DS-LAB** — Decorrelation stretch en espacio CIE-LAB
- **Relieve** — Mapa de bordes multi-escala (Sobel 3×3 + 5×5) con falso color cálido

### Controles
- Intensidad ampliada: rango 0.2 – 5.0 (antes 0.5 – 3.0)
- 5 presets de intensidad: Sutil, Suave, Medio, Fuerte, Extremo
- Controles de contraste (-80 a +80) y saturación (-100 a +100) post-procesamiento
- Modo Acumular (filter stacking): encadenar filtros sobre el resultado anterior

---

## v2.0 (2025)

### Base
- 9 filtros: Rojo, Blanco, Negro, Bicromo, Petroglifo, YBK, LDS, CLAHE, Mapa de Pigmentos
- Slider comparativo original / procesada
- Extracción automática de EXIF/GPS
- Modo Solar para uso en campo
- Logo personalizado en zona de carga
- Procesamiento 100% local (sin servidor)

---

## v1.0 (2024)

- Versión inicial
- Filtros básicos de realce de pigmentos
- Interfaz mínima
