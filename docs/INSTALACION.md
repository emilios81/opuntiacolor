# Instalación y requisitos

OPC no se instala: es una página web que corre entera en el navegador. Hay tres
formas de usarla, de menor a mayor control.

---

## 1. Online

https://emilios81.github.io/opuntiacolor/

No requiere cuenta ni registro. La primera carga baja unos 3 MB (React,
tipografías y la aplicación); después el navegador la cachea y funciona incluso
sin conexión mientras no se limpie la caché.

**Las fotografías no se suben a ningún lado.** GitHub Pages sirve los archivos
de la aplicación y nada más: el procesamiento ocurre en la máquina de quien la
usa, y el servidor no ve las imágenes.

## 2. Sin conexión (recomendado para trabajo de campo)

1. Descargar el repositorio: botón **Code → Download ZIP** en
   https://github.com/emilios81/opuntiacolor, o bien

   ```bash
   git clone https://github.com/emilios81/opuntiacolor.git
   ```

2. Descomprimir donde sea.
3. Abrir `index.html` con el navegador. En Windows, doble clic en
   `OpuntiaColor.bat`.

No hace falta servidor, ni Node, ni internet: React, Babel y las tipografías
están incluidas en `lib/`. Es la forma pensada para una notebook en el campo.

> **Nota sobre `file://`** — Al abrir `index.html` directamente, algunos
> navegadores restringen la lectura de archivos locales. Chrome, Edge y Firefox
> actuales funcionan bien. Si algo no carga, servir la carpeta desde un puerto
> local resuelve cualquier restricción:
>
> ```bash
> python -m http.server 8000
> ```
>
> y abrir http://localhost:8000

## 3. Compilar desde el código fuente

Solo hace falta si se va a modificar la aplicación.

**Requisitos:** Node.js ≥ 16. Nada más — no hay `npm install`, no hay
dependencias que bajar. Babel está incluido en `lib/babel.min.js`.

```bash
node build.js
```

Compila `src/app.jsx` → `app.js`. En Windows también sirve `build.bat`.

### Regla que no conviene romper

| Archivo | Qué es |
|---|---|
| `src/app.jsx` | **El código fuente. Se edita acá.** |
| `app.js` | Generado por `node build.js`. **No editar a mano.** |
| `rockart-enhancer.jsx` | Fuente legado anterior a v3.1, obsoleto desde v3.0 |

`index.html` carga `app.js` como script plano, **sin Babel**. Si `app.js`
contiene JSX sin compilar, el navegador tira un `SyntaxError` y la página
aparece en blanco, sin ningún mensaje visible. Es exactamente lo que pasó entre
el 28 de julio y el 4 de agosto de 2026 (ver el CHANGELOG).

Después de tocar `src/app.jsx`: **compilar y commitear los dos archivos juntos.**

```bash
node build.js
node tests/run-tests.js     # verifica, entre otras cosas, que se correspondan
git add src/app.jsx app.js
```

---

## Requisitos del navegador

| | |
|---|---|
| **Chrome / Edge** | 90 o posterior |
| **Firefox** | 88 o posterior |
| **Safari** | 15 o posterior |

Lo que hace falta es soporte de `<canvas>` con `ImageData`, `Uint8ClampedArray`
y ES2018. Cualquier navegador de escritorio actualizado sirve.

**Memoria.** El procesamiento a resolución completa (hasta 8192 px) mantiene
varios buffers en memoria a la vez. Una foto de 8000 × 6000 ocupa unos 190 MB
solo en el buffer RGBA, y el pipeline necesita entre tres y cinco copias. Con
menos de 8 GB de RAM conviene trabajar a 2000 px y dejar la resolución completa
para la exportación final.

**Móviles.** La interfaz responde, pero el procesamiento a resolución completa
puede agotar la memoria del navegador y hacer que la pestaña se recargue sola.
En teléfono, usar 2000 px.

---

## Verificar la instalación

```bash
node tests/run-tests.js
```

34 pruebas sin dependencias ni imágenes de entrada. Comprueban las conversiones
de color, la eigendescomposición contra una solución analítica independiente, el
determinismo, la máscara de selección, el congelado de estadísticas del lote y
la correspondencia entre `src/app.jsx` y `app.js`. Ver [tests/README.md](../tests/README.md).

---

## Formatos

| | |
|---|---|
| **Entrada** | JPG, PNG, WebP |
| **Salida** | PNG, JPG (conserva EXIF/GPS), TIFF sin comprimir (spec 6.0) |

**RAW no está soportado** (CR2, NEF, ARW, DNG…). No es una limitación de OPC
sino del navegador: no puede decodificar formatos RAW. Hay que revelarlos antes
con Lightroom, darktable, RawTherapee o el software de la cámara, y exportar a
JPG o PNG.

Para trabajo métrico o de archivo conviene exportar el revelado a **TIFF o PNG
de 8 bits** en lugar de JPG, para no acumular artefactos de compresión antes del
realce. OPC trabaja internamente en 8 bits por canal: un TIFF de 16 bits se
reduce a 8 al cargarlo.
