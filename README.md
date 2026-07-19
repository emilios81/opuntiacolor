# OPC – OpuntiaColor v3.2

**Herramienta de procesamiento digital para realce de pigmentos y grabados en arte rupestre.**

OPC (OpuntiaColor) es una aplicación web de código abierto diseñada para el análisis y documentación de arte rupestre. Permite aplicar técnicas de decorrelation stretching, realce de pigmentos específicos y detección de micro-relieve sobre fotografías de campo, directamente desde el navegador y **sin necesidad de conexión a internet** (todas las librerías y fuentes están incluidas localmente).

🔗 **Usar online:** [https://emilios81.github.io/opuntiacolor/](https://emilios81.github.io/opuntiacolor/)

---

## Características principales

- **12 filtros especializados** para pinturas rupestres, grabados y análisis técnico
- **CRGB** — Decorrelation stretch con mapeo directo de componentes principales a RGB. Produce separación cromática máxima para revelar diferencias de pátina
- **DS-LAB** — Decorrelación en espacio CIE-LAB, sensible a diferencias perceptuales de pigmento
- **LDS** — Decorrelation stretch con reproyección, colores más naturales
- **YBK** — Amplificación de crominancia YCbCr con ecualización estadística
- **Micro-relieve** — Contraste local multi-escala (imagen integral) + detección de bordes Sobel para grabados
- **Relieve** — Mapa de bordes multi-escala, genera un calco digital
- **Filtros de pigmento** — Rojo, Blanco, Negro, Bicromo (realce selectivo en espacio CIE-LAB)
- **CLAHE** — Ecualización adaptativa de histograma con límite de contraste (Zuiderveld 1994)
- **Mapa de pigmentos** — Clasificación automática por falso color

### Procesado por lote para fotogrametría (v3.2)

- **Un ajuste, todo el lote** — Elegí una foto de referencia, ajustá el filtro (o cadena de filtros) y aplicalo automáticamente a todas las fotos del lote fotogramétrico
- **Matriz congelada** — Las estadísticas de decorrelación se capturan de la referencia y se aplican idénticas a todo el lote: colores consistentes entre fotos, textura coherente en el modelo 3D
- **Flujo de reemplazo de texturas** — Cada foto se guarda con su mismo nombre y conserva su propio EXIF/GPS: alineá el modelo con los originales y reconstruí la textura con las realzadas (Metashape, Meshroom, etc.)
- **Opciones** — Formato JPG/PNG/TIFF, resolución hasta 8192 px, carpeta destino a elección (Chrome/Edge), progreso y cancelación

### Rigor y reproducibilidad (v3.1)

- **Componentes principales ordenados por varianza** — Los resultados de CRGB/DS-LAB son deterministas y comparables entre fotografías de un mismo panel
- **Estadísticas por zona** — Con una selección activa, la decorrelación se calcula con los datos de esa zona (como DStretch): mejor separación de pigmentos locales
- **Exportación reproducible** — El nombre del archivo registra filtro, intensidad y ajustes aplicados; el JPG exportado conserva el EXIF/GPS original

### Herramientas de edición

- **Selección de zona** — Rectángulo, círculo o mano alzada; el filtro se calcula y aplica sobre esa zona
- **Intensidad variable** — Rango 0.2 a 5.0 con presets rápidos (Sutil, Suave, Medio, Fuerte, Extremo)
- **Contraste y saturación** — Ajustes post-procesamiento en tiempo real
- **Modo Acumular** — Encadenar filtros sobre el resultado anterior
- **Slider comparativo** — Comparación visual original / procesada
- **Modo Solar** — Interfaz de alto contraste para uso en campo bajo luz directa

### Entrada y salida

- **Carga:** JPG, PNG, WebP (RAW no es decodificable por el navegador: convertir antes a JPG/PNG)
- **Resolución:** 2000px por defecto (rápido); opción de resolución completa hasta 8192px
- **Exportación:** PNG, JPG (conserva EXIF/GPS original), TIFF sin comprimir (spec 6.0)
- **Extracción automática de EXIF/GPS** con visualización de coordenadas

---

## Uso

1. Abrir `index.html` (o `OpuntiaColor.bat` en Windows) — no requiere internet, instalación ni registro
2. Arrastrar una fotografía o hacer clic para seleccionar
3. Elegir un filtro del panel lateral
4. Ajustar intensidad, contraste y saturación según necesidad
5. Opcionalmente, usar las herramientas de selección para delimitar una zona de interés
6. Descargar el resultado en el formato deseado

Todo el procesamiento se realiza localmente en el navegador.

---

## Estructura del proyecto

```
index.html        Página principal (carga app.js precompilado)
app.js            Aplicación compilada — NO editar a mano
src/app.jsx       Código fuente (editar acá)
build.js          Compila src/app.jsx → app.js  (node build.js o build.bat)
lib/              React, ReactDOM, Babel (solo para compilar) y fuentes locales
OpuntiaColor.bat  Acceso directo para abrir la app en Windows
```

Para modificar la aplicación: editar `src/app.jsx` y ejecutar `node build.js` (requiere Node.js; solo para desarrollo, no para usar la app).

---

## Tecnología

- React 18 (standalone, sin build tools en runtime; JSX precompilado con Babel)
- Procesamiento de imagen píxel a píxel en JavaScript puro
- Eigendecomposición Jacobi con ordenamiento por eigenvalor para decorrelation stretching
- Summed-area tables (imagen integral) para contraste local multi-escala
- Conversiones de color: RGB ↔ CIE-LAB ↔ YCbCr
- Parser y reinyector EXIF/GPS nativo sin dependencias
- Encoder TIFF sin comprimir integrado (conforme a spec TIFF 6.0)

---

## Contexto académico

OPC fue desarrollado en el marco del **Laboratorio de Tecnologías Digitales Aplicadas a la Arqueología (LATDAA)**, como parte de un programa de desarrollo de herramientas de código abierto para la investigación y documentación del patrimonio arqueológico del Noroeste Argentino (NOA).

La herramienta implementa técnicas de procesamiento digital de imagen ampliamente utilizadas en el estudio de arte rupestre, incluyendo decorrelation stretching (Gillespie et al. 1986), ecualización adaptativa de histograma con límite de contraste (Zuiderveld 1994) y realce selectivo de pigmentos en espacios de color perceptuales.

---

## Cita sugerida

Villafañez, E. A. (2026). OPC – OpuntiaColor v3.2: Herramienta de procesamiento digital para realce de pigmentos en arte rupestre. LATDAA, Universidad Nacional de Catamarca. Disponible en: https://emilios81.github.io/opuntiacolor/

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
