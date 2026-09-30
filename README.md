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

Si el backend no está levantado, la app sigue funcionando con un catálogo local de ejemplo (el indicador del navbar pasa de "Spring Boot 3 API" a "Catálogo Local") y los cambios no se guardan.

## Perfiles

Al entrar se elige quién está viendo. Un perfil **infantil** solo ve tráilers para todos los públicos, +7 y +12, y no puede añadir, editar ni eliminar tráilers.

Desde "Administrar perfiles" (menú del avatar) se crean, editan y eliminan perfiles, hasta un máximo de 5.

"Mi Lista", los likes ya dados y el perfil activo se guardan en el `localStorage` del navegador, separados por perfil.

## Variables de entorno

| Variable | Para qué | Sin ella |
| --- | --- | --- |
| `VITE_API_URL` | URL del backend, sin `/api` al final | `http://localhost:8088` |

Se incrusta al compilar: si cambia, hay que volver a compilar. Ejemplo en [.env.example](.env.example).

## Despliegue

En Vercel: importa este repositorio, deja que detecte Vite y define `VITE_API_URL` con la URL pública del backend.

La guía completa (base de datos, backend y frontend, en orden) está en [DEPLOY.md del backend](https://github.com/costanna/sukinema-backend/blob/main/DEPLOY.md).
