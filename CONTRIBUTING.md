# Cómo contribuir

OPC es una herramienta de laboratorio de uso abierto. Los aportes son
bienvenidos, en cualquiera de estas formas.

## Reportar un problema

Abrir un issue en https://github.com/emilios81/opuntiacolor/issues indicando:

- Versión de OPC (aparece en el encabezado de la aplicación)
- Navegador y sistema operativo
- Qué se esperaba y qué pasó
- Si es posible, los parámetros usados: filtro, intensidad, resolución de
  trabajo y si había una selección activa

Para problemas de procesamiento, el nombre del archivo exportado ya contiene
buena parte de esa información.

**No hace falta adjuntar la fotografía.** Si el problema depende de una imagen
concreta, conviene describirla (tipo de soporte, pigmento, condiciones de luz)
antes que subir material de un sitio arqueológico a un repositorio público.

## Sugerir un filtro o una función

Los aportes más útiles son los que vienen con referencia bibliográfica: qué
técnica es, dónde está publicada y qué problema resuelve que los filtros
actuales no resuelvan. OPC implementa métodos publicados, no recetas.

## Modificar el código

1. Editar **`src/app.jsx`**, nunca `app.js` (es un archivo generado).
2. Compilar: `node build.js`
3. Correr las pruebas: `node tests/run-tests.js`
4. Enviar el pull request con `src/app.jsx` y `app.js` actualizados.

Requiere Node.js 16 o superior. No hay que instalar dependencias: Babel está
incluido en `lib/`.

### Si el cambio afecta resultados

Cualquier modificación que altere las imágenes de salida —un algoritmo, un
parámetro por defecto, una normalización— tiene que:

- Documentarse en `CHANGELOG.md` bajo un encabezado que lo diga explícitamente
- Actualizarse en `docs/ALGORITMOS.md`
- Venir acompañada de una prueba en `tests/run-tests.js` que verifique el
  comportamiento nuevo

Que un realce "se vea mejor" no es criterio suficiente. La herramienta se usa
para documentar patrimonio: un cambio que mejora el aspecto pero rompe la
comparabilidad entre versiones es un retroceso.

### Estilo

El código sigue la convención del archivo existente: funciones puras para el
procesamiento, sin dependencias externas, con comentarios que expliquen **por
qué** se hizo algo cuando no es evidente. Los comentarios que documentan
decisiones —por qué `setTimeout` y no `requestAnimationFrame`, por qué las
componentes van ordenadas— son parte del valor del repositorio: conviene
mantenerlos y agregar los propios.

## Licencia de los aportes

Al contribuir código se acepta que se distribuya bajo la **GNU GPL v3.0 o
posterior**, igual que el resto del proyecto.
