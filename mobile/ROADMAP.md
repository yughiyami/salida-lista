# Prioridades de Salida Lista

## 1. Cartografía offline útil, no una promesa de cobertura total

Implementado en el código 1.0.3: una capa nacional generalizada (vías principales,
548 ciudades/pueblos y contorno referencial) y un paquete metropolitano Arequipa
de aproximadamente 32 × 30 km, además de los cinco extractos turísticos previos.
No equivale a calles/senderos de todo Perú ni a todo el departamento de Arequipa.
La APK nueva requiere validación física; la comprobación previa corresponde a 1.0.2.
Siguiente etapa: paquetes regionales más detallados y descargables con límites
explícitos, priorizando Arequipa y Colca.

Criterios: procedencia/licencia verificadas; tamaño, fecha y cobertura visibles;
mapa usable desde primera apertura sin red; descargas futuras recuperables y
verificadas; pruebas de memoria y rendimiento en Android de gama media.
No descargar masivamente tiles públicos de OSM ni usar su Editing API como
canal de distribución nacional.

## 2. GPS real offline y operación fuera de ruta

Probar al aire libre, sin red, precisión y antigüedad, permiso denegado,
servicio apagado, posición fuera del paquete y consumo de batería. Mantener
registro de eventos y asistencia sin GPS y fuera de cualquier geofence.
Distinguir siempre posición reciente, antigua y ausencia de cartografía.
No deducir que existe rescate o comunicación porque el GPS obtiene un punto.

## 3. Salidas reales y varios grupos offline

Sustituir el único grupo demo por salidas, participantes y responsables reales,
selección persistente de salida y separación de datos por agencia/grupo.
Antes de datos personales: autorización, consentimiento, cifrado apropiado,
retención y eliminación. Probar cierres, actualización y migraciones sin pérdidas.

## 4. Sincronización e integración Bókun

Backend autorizado como custodio de credenciales. Importar las reservas y salidas
que permita el acceso contratado, sin repetir su gestión comercial. Definir qué
sistema es dueño de cada campo y qué ocurre con cancelaciones y cambios sin red.
Sincronización idempotente de la cola, reintentos con backoff, conflictos visibles
y confirmación del servidor: no marcar enviado por abrir el selector de compartir.

## 5. WhatsApp como salida de comunicación, no como base de datos

Primero compartir un reporte manual con selección de destinatario por el usuario.
Después, integración servidor con WhatsApp Business Platform, consentimiento,
plantillas cuando correspondan y estados verificables de entrega/fallo.
Sin red, conservar el reporte pendiente; no prometer envío ni avisos remotos.

## Fuera del MVP prioritario

Chat para reservar guías, motor de reservas, IA conversacional, tracking familiar
permanente, mesh entre teléfonos y WhatsApp satelital. Requieren validación y,
en ciertos casos, hardware/servicio adicional. Ninguno sustituye un protocolo
operativo de seguridad ni está implementado por este demo.


