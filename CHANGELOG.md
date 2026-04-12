# Changelog — OPC OpuntiaColor

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
