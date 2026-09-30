# Sukinema — frontend

Interfaz de Sukinema, un catálogo de tráilers estilo Netflix. React 18 + Vite + Tailwind.

La API está en [sukinema-backend](https://github.com/costanna/sukinema-backend).

## Arrancar en local

Requiere Node.js 18 o superior.

```
npm install
npm run dev
```

Queda en http://localhost:5173 y espera el backend en http://localhost:8088.

## Cuentas

La app pide iniciar sesión (o crear una cuenta) antes de mostrar el catálogo. Los campos de contraseña tienen un botón para verla mientras se escribe. La sesión dura 7 días y se cierra desde el menú del avatar.

Al crear la cuenta se muestra un **código de recuperación**: es lo que permite entrar desde "¿Olvidaste tu contraseña?" y poner una nueva. Desde **Mi cuenta** (menú del avatar) se cambia la contraseña y se genera un código nuevo.

Solo la cuenta administradora ve los botones para añadir, editar y eliminar tráilers; el servidor rechaza esas acciones a las demás. Cuál es la cuenta administradora se explica en el [README del backend](https://github.com/costanna/sukinema-backend#cuentas-y-permisos).

Si el servidor no responde, la pantalla de acceso lo avisa y ofrece un **modo demo**: un catálogo local de ejemplo donde nada se guarda.

## Perfiles

Tras entrar se elige quién está viendo. Cada cuenta tiene sus propios perfiles, entre 1 y 5, y se gestionan desde "Administrar perfiles" (menú del avatar).

Un perfil **infantil** solo ve tráilers para todos los públicos, +7 y +12, y no puede añadir, editar ni eliminar tráilers.

"Mi Lista" y los likes de cada perfil se guardan en el servidor, así que se ven igual desde cualquier dispositivo; cada perfil puede dar un like por tráiler, y pulsar de nuevo lo quita. En el navegador solo se recuerda la sesión y el perfil activo.

## Idiomas

La web está en **catalán, inglés y castellano**. La primera vez se abre en el idioma del navegador (en inglés si no es ninguno de los tres); después se recuerda el que se elija con el selector `CA · EN · ES`, que está en la pantalla de acceso, en el selector de perfiles, en el menú del avatar y en el pie.

| Qué | Dónde | Cómo se traduce |
| --- | --- | --- |
| Textos de la interfaz | `src/i18n/es.js`, `ca.js`, `en.js` | Una clave por texto, igual en los tres archivos |
| Tráilers iniciales (título y sinopsis) | `src/i18n/catalog.js` | Por ID de vídeo; el castellano es el original (`catalogSource.js`) |
| Categorías y géneros | `TERMS` en `src/i18n/catalog.js` | Una fila por término: castellano, catalán, inglés |
| Mensajes de error del servidor | Backend (`messages*.properties`) | La app envía el idioma elegido en `Accept-Language` |

El servidor guarda cada tráiler en un solo idioma. Un tráiler añadido desde la app se muestra tal como se escribió; sus géneros y su categoría sí se traducen si están en la tabla `TERMS`, se hayan escrito en el idioma que sea. El buscador encuentra tanto por el texto traducido como por el original.

Para añadir o cambiar textos, edita los tres archivos de idioma y comprueba que no falte nada:

```
npm run check:i18n
```

Avisa de claves sin traducir, de textos escritos directamente en los componentes y de tráilers iniciales sin traducción.

## Variables de entorno

| Variable | Para qué | Sin ella |
| --- | --- | --- |
| `VITE_API_URL` | URL del backend, sin `/api` al final | `http://localhost:8088` |

Se incrusta al compilar: si cambia, hay que volver a compilar. Ejemplo en [.env.example](.env.example).

## Despliegue

En Vercel: importa este repositorio, deja que detecte Vite y define `VITE_API_URL` con la URL pública del backend.

La guía completa (base de datos, backend y frontend, en orden) está en [DEPLOY.md del backend](https://github.com/costanna/sukinema-backend/blob/main/DEPLOY.md).
