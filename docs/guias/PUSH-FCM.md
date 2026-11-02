# Notificaciones push en Android (Firebase)

La app registra el teléfono con Expo Push y el servidor (trigger `notify_circle_message`) envía los avisos a `exp.host`. Sin los pasos de abajo la app **sigue funcionando** por Realtime mientras está abierta, pero no recibe avisos con la app cerrada.

1. Crea un proyecto en Firebase y añade una app Android con el paquete `com.salidalista.mobile`.
2. Descarga `google-services.json` y guárdalo en `mobile/google-services.json` (no se versiona).
3. En `app.json` añade `"android": { "googleServicesFile": "./google-services.json" }`.
4. Vincula el proyecto EAS: `cd mobile && pnpm dlx eas-cli@latest init` (escribe `extra.eas.projectId` en `app.json`; ya lo lee `registerForPush`).
5. Sube la clave de cuenta de servicio FCM v1: `pnpm dlx eas-cli@latest credentials` → Android → Google Service Account Key for Push Notifications (FCM V1).
6. Reconstruye la app. En Ajustes → Notificaciones → "Activar notificaciones".

Verificación: en Supabase, `select count(*) from public.push_tokens;` debe subir tras activar las notificaciones; luego envía un mensaje de chat desde otro teléfono.
