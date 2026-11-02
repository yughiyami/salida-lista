# Salida Lista — refinamiento visual y botón fijo

**Estado:** implementado, compilado e instalado en el emulador Android. Validado sin red el 16/10/2026. No probado en iOS ni teléfono físico.

## Qué cambió

- Inicio y preparación incorporan una fotografía real de Salkantay incluida en la aplicación, no descargada al abrir la pantalla.
- Tarjeta principal marfil, jerarquía y encuadre más próximos a las interfaces generadas.
- Ruta con contornos vectoriales, hitos y trazo discontinuo; dibujo artístico local, **no cartografía ni navegación**. Sin escala o posición ficticia del grupo.
- «Registrar evento» está fuera del ScrollView, en una franja fija encima de la navegación. El contenido puede desplazarse sin mover u ocultar el botón.
- Se conservaron aviso de demostración, guardia no activada, ubicación opcional y distinción entre guardado local y recepción remota.

## Ver las pantallas reales

| Pantalla / caso | Captura |
|---|---|
| Inicio, foto sin red | [Inicio actualizado](evidence/android-visual-2026-10-16/01-home-photo-offline.png) |
| Preparación, foto compacta | [Preparación actualizada](evidence/android-visual-2026-10-16/02-prepare-photo-offline.png) |
| Ruta, antes de desplazar | [Ruta y acción fija](evidence/android-visual-2026-10-16/03-route-fixed-default.png) |
| Ruta, después de desplazar | [Acción permanece fija](evidence/android-visual-2026-10-16/04-route-fixed-scrolled.png) |
| Pantalla pequeña y texto grande | [320×640 dp, fuente 130 %](evidence/android-visual-2026-10-16/05-route-small-large-font.png) |
| Evento nuevo tras reiniciar sin red | [Eventos conservados](evidence/android-visual-2026-10-16/07-events-reopened-offline.png) |
| Fotografía tras reiniciar sin red | [Foto local conservada](evidence/android-visual-2026-10-16/08-home-reopened-offline.png) |
| Participantes después de actualizar | [Presencias conservadas](evidence/android-visual-2026-10-16/09-participants-preserved.png) |
| Estado final de la app | [Ruta con tres partes locales](evidence/android-visual-2026-10-16/10-route-final-default.png) |

Son capturas reales de la app instalada, no nuevos mockups. En pantalla pequeña se necesita desplazar el contenido para ver toda la ruta, pero no para acceder a Registrar evento.

## Pruebas de posición e interacción

| Escenario | Bounds del botón (px) | Inicio de navegación (y) | Resultado |
|---|---|---|---|
| 1080×2400, densidad 420, fuente 100 %, sin scroll | [63,1991]–[1017,2132] | 2188 | Visible y accionable. |
| Mismo tamaño, después de scroll | [63,1991]–[1017,2132] | 2188 | Misma posición; no se desplaza con contenido. |
| 840×1680, densidad 420: 320×640 dp, fuente 130 % | [63,1271]–[777,1412] | 1468 | Visible; pulsarlo abre el formulario. |

Se verificó que el botón queda íntegro por encima de la navegación. Al terminar se restauraron resolución 1080×2400 y fuente 100 %. No se modificaron ajustes del teléfono físico conectado.

Evidencia estructurada: [tamaño normal](evidence/android-visual-2026-10-16/cta-default.json), [pantalla pequeña](evidence/android-visual-2026-10-16/cta-small.json).

## Offline y actualización sin pérdida de datos

1. Se registró una línea base con dos eventos, dos participantes marcados y dos checks.
2. Se instaló la nueva APK con `adb install -r`, sin desinstalar, limpiar datos ni cambiar la base SQLite.
3. Se abrió la nueva versión con modo avión, Wi-Fi y datos desactivados. La foto y el vector se renderizaron sin red.
4. Se creó `VISUAL03` sin red, ID `308ef0df-ecf1-460a-a91b-e3693c4ad8be`.
5. Se forzó cierre del proceso y se reabrió: los tres IDs coinciden, incluidos ambos registros anteriores.
6. Valeria y Mateo permanecen marcados; ficha/protocolo y equipo mantienen sus checks.

La capa de datos, esquema, hook y dominio conservan los mismos hashes previos; no se ejecutó una migración nueva. La prueba no acredita sincronización remota, Bókun, WhatsApp, satélite o rescate. Los eventos siguen locales.

[IDs antes/después](evidence/android-visual-2026-10-16/event-persistence.json), [línea base](evidence/android-visual-2026-10-16/baseline.json), [estado de red](evidence/android-visual-2026-10-16/network.txt).

## Fotografía y atribución

Fotografía de **McKay Savage**, obtenida de Wikimedia Commons bajo **CC BY 2.0**. Se incluye el JPEG original sin modificar; solo cambia su encuadre visual mediante `resizeMode="cover"`. Fuente, autor y licencia figuran en Conexiones y en `mobile/assets/PHOTO-CREDITS.md`. [Ficha de origen](https://commons.wikimedia.org/wiki/File:Peru_-_Salkantay_Trek_091_-_Salkantay_(7339855088).jpg), [licencia](https://creativecommons.org/licenses/by/2.0/).

SHA1 original verificado: `4741AA44000CD50746A3DA47AF475F7B48CDD435`. La imagen y los créditos se incluyen localmente; los enlaces de referencia no son necesarios para mostrarla.

## Archivos modificados

- `mobile/src/ui/GuideScreen.tsx`: composiciones fotográficas, acción fija y atribución.
- `mobile/src/ui/GuideVisuals.tsx`: fotografía local y vector de ruta reutilizables.
- `mobile/assets/salkantay.jpg`, `mobile/assets/PHOTO-CREDITS.md`: imagen y licencia.
- `design-plans/guide-visual-refinement.md`: contrato visual y validación seleccionados.

No se añadieron dependencias, servicios de mapas, credenciales ni llamadas de red para renderizar las pantallas.

## Build y verificaciones

Lint, TypeScript y siete pruebas de dominio/SQLite aprobados. Build Android release x86_64: `BUILD SUCCESSFUL` (38 tareas ejecutadas, 529 actualizadas). Se conservó una copia en `artifacts/android/salida-lista-visual-demo-emulator-x86_64.apk`, **solo para emulador x86_64**, no para un teléfono ARM.

SHA256 APK: `57746FADCBDDC2C6F4B7F7AD247E1A9ACB57C2F9D2933B06E1A4618CF15600CC`.

La app quedó abierta en En ruta en el emulador, sin red. Continúa siendo un prototipo con datos ficticios; las limitaciones de seguridad/integración y alertas de dependencias documentadas anteriormente no se consideran resueltas por este cambio visual.

## Key Learnings:

1. Una foto incluida mediante require conserva la identidad visual incluso en un arranque sin conexión.
2. Una acción fuera del contenedor desplazable puede mantenerse visible sin superponerla al contenido.
