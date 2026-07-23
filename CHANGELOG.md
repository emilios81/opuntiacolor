# Changelog — OPC OpuntiaColor

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
