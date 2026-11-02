# Privacidad y datos — Salida Lista

Texto base para la política de privacidad pública (Google Play la exige). Revisar con asesoría legal antes de publicar.

## Qué datos se recogen

| Dato | Para qué | Dónde | Cuánto se conserva |
|---|---|---|---|
| Correo electrónico | Iniciar sesión con código | Supabase Auth | Hasta eliminar la cuenta |
| Nombre visible | Que tu círculo te reconozca | `profiles` | Hasta eliminar la cuenta |
| Ubicación en vivo (última) | Mostrarte en el mapa de tus círculos | `user_locations` | Se sobrescribe; se borra al retirar el consentimiento |
| Historial de ubicación | Mantener la cola sin conexión y el último punto fiable | `location_history` | 30 días |
| Nivel de batería y si carga | Mostrarlo a tu círculo | `user_locations` | Se sobrescribe |
| Mensajes, llegadas a lugares, "Llegué bien", SOS | Comunicación del círculo | `messages` | 90 días |
| Token de notificaciones | Enviar avisos push | `push_tokens` | Hasta cerrar sesión o eliminar la cuenta |

No se venden datos, no hay publicidad ni analítica de terceros.

## Quién ve tu ubicación

- Solo miembros de un círculo al que perteneces **y** con el que no dejaste de compartir.
- Si pausas el uso compartido, nadie ve tu ubicación (la regla vive en la base de datos, no solo en la app).
- El SOS es la única excepción: avisa a todos tus círculos aunque estés en pausa, porque lo envías tú a propósito.

## Tus controles

- **Compartir ubicación** (Ajustes): apagar borra tu última ubicación del servidor.
- **Pausar** 15 min, 1 h, 8 h o 24 h.
- **Segundo plano**: opcional, con aviso explícito antes de pedir el permiso. Mientras está activo hay una notificación fija.
- **Por círculo**: puedes dejar de compartir con un círculo concreto.
- **Descargar mis datos**: exporta un JSON con todo lo almacenado.
- **Eliminar mi cuenta**: borra perfil, ubicación, historial, mensajes y tokens. Los círculos que creaste pasan a otro miembro o se eliminan si estás solo.

## Seguridad

- Sesión cifrada en el teléfono (AES-256, clave en el almacén seguro del sistema).
- Row Level Security en todas las tablas; las operaciones sensibles pasan por funciones del servidor.
- Códigos de invitación de 8 caracteres con límite de 10 intentos fallidos por hora.

## Límites conocidos

- La ubicación del teléfono puede ser imprecisa o desactualizada; no es un servicio de emergencias. El SOS avisa a tu círculo, **no** a policía, bomberos ni ambulancias.
- Si el teléfono no tiene conexión, las posiciones se guardan en el dispositivo (máx. 2.000) y se envían al reconectar.
