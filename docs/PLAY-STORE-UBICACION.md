# Google Play: ubicación en segundo plano y servicio en primer plano

Borrador de las respuestas para Play Console (Contenido de la app → Permisos sensibles). Hay que copiarlas a mano y adjuntar un video.

## Declaración de ubicación en segundo plano (`ACCESS_BACKGROUND_LOCATION`)

**Función principal que la requiere:** compartir con un grupo privado y de confianza (el "círculo") la ubicación de la persona para que sepan que está a salvo, y avisar cuando llega o sale de lugares que el propio grupo definió (casa, colegio).

**Por qué no basta el primer plano:** los avisos de llegada y salida y el seguimiento durante un trayecto deben funcionar con la pantalla apagada o la app cerrada; si no, el aviso no llega cuando importa.

**Cómo se informa al usuario:** antes del permiso del sistema aparece un aviso propio (Ajustes → "Seguir compartiendo con la app cerrada") que explica qué se recoge, para qué, que hay una notificación permanente y cómo apagarlo. El permiso es opcional: sin él la app sigue funcionando en primer plano.

**Video de demostración (obligatorio):** grabar (a) el aviso previo en Ajustes, (b) el permiso del sistema "Permitir todo el tiempo", (c) la notificación fija, (d) un lugar disparando un aviso con la app cerrada, (e) el apagado en Ajustes.

## Servicio en primer plano (`FOREGROUND_SERVICE_LOCATION`)

Tipo: ubicación. Uso: mantener el seguimiento compartido mientras la app está en segundo plano. Muestra una notificación persistente con el texto "Salida Lista comparte tu ubicación".

## Seguridad de los datos (Data safety)

| Pregunta | Respuesta |
|---|---|
| ¿Recopila ubicación aproximada/precisa? | Sí, ambas |
| ¿Se comparte con terceros? | No se vende; solo la ven los miembros que el usuario eligió |
| ¿Es opcional? | Sí, el usuario puede apagarla o pausarla |
| ¿Cifrada en tránsito? | Sí (HTTPS/WSS) |
| ¿El usuario puede pedir su eliminación? | Sí, desde la app (Ajustes → Eliminar mi cuenta) |
| Otros datos | Correo, nombre, mensajes |

## URL de eliminación de cuenta

Play pide una URL pública. Publicar `docs/PRIVACIDAD.md` en una página web y añadir en ella cómo eliminar la cuenta (Ajustes → Eliminar mi cuenta) o un correo de contacto.

## Antes de enviar a revisión

- Política de privacidad publicada (basada en `PRIVACIDAD.md`).
- Build firmada con clave de subida propia (la actual del APK es de depuración).
- Android 14+: confirmar que el tipo de servicio `location` está declarado (lo añade el plugin de `expo-location`).
