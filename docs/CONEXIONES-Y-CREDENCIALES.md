# Qué falta para conectar Salida Lista

**Estado del incremento:** cliente móvil local. No hay servidor, importación Bókun, recepción de WhatsApp ni monitoreo de operaciones implementados. La demo NO cambia de estado por configurar variables. No introducir secretos en la app ni enviarlos por el chat.

## Qué podemos probar ahora sin credenciales

Presencia, checklist, creación de eventos, posición puntual con permiso, persistencia SQLite y compartir un parte de demostración mediante el selector del teléfono. Para elegir WhatsApp, debe estar instalado y disponible. Compartir requiere que el usuario complete el envío; no comprobamos destinatario, entrega o aceptación.

## Bókun — primera conexión privada de solo lectura

| Necesario | Quién lo facilita | Dónde va |
|---|---|---|
| Cuenta del operador y autorización de acceso | Administrador de la agencia | Permisos de integración y contrato |
| Acceso API permitido y permisos mínimos para consultar reservas/productos | Administrador/Bókun | Cuenta del proveedor |
| Access key y secret key REST | Administrador, en configuración API | Gestor de secretos del backend |
| Entorno y base URL correctos | Bókun/administrador | Backend, sin asumir que test y producción son iguales |
| IDs/productos/reservas de prueba y mapeo de salidas | Operaciones | Configuración servidor |
| Webhooks y acceso HTTPS receptor | Desarrollador + configuración Bókun | Backend futuro |

Bókun documenta el par access/secret y la firma de las solicitudes REST. Verificar el contexto de booking channel y los permisos de la API concreta; no copiar privilegios de escritura innecesarios. Una app pública OAuth sigue otro registro/scopes y no se habilita automáticamente por tener estas claves. [Autenticación REST oficial](https://bokun.dev/booking-api-rest/vU6sCfxwYdJWd1QAcLt12i/configuring-the-platform-for-api-usage-and-authentication/sFiGRpo4detkmrZPcWtQPj).

**Prueba futura:** consultar una reserva autorizada real o sandbox, mapearla, actualizar/cancelar y reconciliar sin duplicados. Ninguna solicitud se realizará desde el celular usando el secreto del proveedor.

## WhatsApp — compartir manual vs. integración empresarial

El selector nativo actual no necesita token Meta. Es una acción personal explícita: el guía elige aplicación y destinatario. La automatización empresarial futura sí necesita:

| Necesario | Uso |
|---|---|
| Portfolio empresarial y app Meta con WhatsApp habilitado | Autorizar activos empresariales |
| Cuenta de WhatsApp Business (WABA ID) y número admitido/registrado | Identificar negocio y canal |
| Phone Number ID | Referencia técnica para enviar desde ese número |
| Access token válido del servidor y permisos concedidos | Mensajería/gestión según operaciones autorizadas; no depender del token temporal del panel en producción |
| Meta App ID y App Secret | Identidad app y verificación de firmas de webhooks |
| Verify token propio | Handshake de verificación del endpoint; NO es el App Secret |
| URL HTTPS pública, webhook suscrito y validación de firma | Recepción de mensajes y estados |
| Consentimientos y plantillas aprobadas cuando correspondan | Comunicaciones conforme a la política del canal |

Revisar elegibilidad, verificación y reglas del número al provisionar; no se presupone que cualquier número existente pueda migrarse sin cambios. Fuentes: [colección oficial de Meta](https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api), [política WhatsApp Business](https://business.whatsapp.com/policy).

## Distribución y pruebas físicas

- Expo/EAS: cuenta del proyecto y permisos de build, no credencial Bókun/Meta.
- Android: se puede generar APK de pruebas internas y provisionar firma en EAS.
- iOS físico: cuenta Apple y provisionamiento/dispositivos admitidos según distribución.
- D2C: modelo/SO/plan elegibles y prueba en zona real sin cobertura terrestre; no exige claves de una API nuestra, pero tampoco habilita nuestra API automáticamente.
- Nearby: aún no implementado; integración SDK nativa y permisos/plataformas por probar.

La plantilla `server.env.example` es documentación para el futuro backend, no un servidor operativo. `mobile/.env.example` no contiene secretos ni variables activas en este incremento.

## Próxima conexión real

1. Aprobar una cuenta de prueba Bókun y un número empresarial de prueba.
2. Provisionar backend e identidad; establecer contrato multiagencia.
3. Configurar secretos mediante un canal seguro.
4. Validar lectura Bókun y webhook firmado de WhatsApp por separado.
5. Conectar la outbox y acuses, manteniendo «local», «recibido» y «aceptado» como estados distintos.
