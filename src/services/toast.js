// Los avisos viajan como un evento de ventana: cualquier parte de la app puede lanzarlos
// y ToastContainer (montado una vez en App) los muestra
export const TOAST_EVENT = 'sukinema-toast';
let nextToastId = 0;

export function showToast(message, type = 'success', duration = 3000) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, {
    detail: { message, type, duration, id: ++nextToastId }
  }));
}
