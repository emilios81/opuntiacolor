# OPC – OpuntiaColor v3.0

**Herramienta de procesamiento digital para realce de pigmentos y grabados en arte rupestre.**

OPC (OpuntiaColor) es una aplicación web de código abierto diseñada para el análisis y documentación de arte rupestre. Permite aplicar técnicas de decorrelation stretching, realce de pigmentos específicos y detección de micro-relieve sobre fotografías de campo, directamente desde el navegador y sin necesidad de conexión a internet.

🔗 **Usar online:** [https://emilios81.github.io/opuntiacolor/](https://emilios81.github.io/opuntiacolor/)

---

## Características principales

- **12 filtros especializados** para pinturas rupestres, grabados y análisis técnico
- **CRGB** — Decorrelation stretch con mapeo directo de componentes principales a RGB. Produce separación cromática máxima para revelar diferencias de pátina
- **DS-LAB** — Decorrelación en espacio CIE-LAB, sensible a diferencias perceptuales de pigmento
- **LDS** — Decorrelation stretch con reproyección, colores más naturales
- **YBK** — Amplificación de crominancia YCbCr con ecualización estadística
- **Micro-relieve** — Contraste local multi-escala + detección de bordes Sobel para grabados
- **Relieve** — Mapa de bordes multi-escala, genera un calco digital
- **Filtros de pigmento** — Rojo, Blanco, Negro, Bicromo (realce selectivo en espacio CIE-LAB)
- **CLAHE** — Contraste local adaptativo
- **Mapa de pigmentos** — Clasificación automática por falso color

### Herramientas de edición

- **Selección de zona** — Rectángulo, círculo o mano alzada para aplicar filtros solo en un área de interés
- **Intensidad variable** — Rango 0.2 a 5.0 con presets rápidos (Sutil, Suave, Medio, Fuerte, Extremo)
- **Contraste y saturación** — Ajustes post-procesamiento en tiempo real
- **Modo Acumular** — Encadenar filtros sobre el resultado anterior
- **Slider comparativo** — Comparación visual original / procesada
- **Modo Solar** — Interfaz de alto contraste para uso en campo bajo luz directa

### Entrada y salida

- **Carga:** JPG, PNG, RAW (DNG, CR2, NEF, ARW)
- **Exportación:** PNG, JPG, TIFF
- **Extracción automática de EXIF/GPS** con visualización de coordenadas

---

## Uso

1. Abrir [https://emilios81.github.io/opuntiacolor/](https://emilios81.github.io/opuntiacolor/) en cualquier navegador moderno
2. Arrastrar una fotografía o hacer clic para seleccionar
3. Elegir un filtro del panel lateral
4. Ajustar intensidad, contraste y saturación según necesidad
5. Opcionalmente, usar las herramientas de selección para delimitar una zona
6. Descargar el resultado en el formato deseado

**No requiere instalación, registro ni conexión a internet.** Todo el procesamiento se realiza localmente en el navegador.

---

## Tecnología

- React 18 (standalone, sin build tools)
- Procesamiento de imagen píxel a píxel en JavaScript puro
- Eigendecomposición Jacobi para decorrelation stretching
- Conversiones de color: RGB ↔ CIE-LAB ↔ YCbCr
- Parser EXIF/GPS nativo sin dependencias
- Encoder TIFF sin comprimir integrado

---

## Contexto académico

OPC fue desarrollado en el marco del **Laboratorio de Tecnologías Digitales Aplicadas a la Arqueología (LATDAA)**, como parte de un programa de desarrollo de herramientas de código abierto para la investigación y documentación del patrimonio arqueológico del Noroeste Argentino (NOA).

La herramienta implementa técnicas de procesamiento digital de imagen ampliamente utilizadas en el estudio de arte rupestre, incluyendo decorrelation stretching (Gillespie et al. 1986) y realce selectivo de pigmentos en espacios de color perceptuales.

---

## Cita sugerida

Villafañez, E. A. (2025). OPC – OpuntiaColor v3.0: Herramienta de procesamiento digital para realce de pigmentos en arte rupestre. LATDAA, Universidad Nacional de Catamarca. Disponible en: https://emilios81.github.io/opuntiacolor/

---

## Autor

**Dr. Emilio A. Villafañez**
- LATDAA (Laboratorio de Tecnologías Digitales Aplicadas a la Arqueología)
- Fundación de Historia Natural Félix de Azara
- Universidad Nacional de Catamarca (UNCA), Argentina
- CONICET

---

## Licencia

Este software se distribuye bajo la licencia **GNU General Public License v3.0**. Ver archivo [LICENSE](LICENSE) para más detalles.
