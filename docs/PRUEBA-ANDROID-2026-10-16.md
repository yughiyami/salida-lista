# Salida Lista — ejecución Android y persistencia offline

**Resultado: app compilada, instalada y abierta en el emulador. Persistencia aprobada en el escenario probado. Fidelidad visual parcial, no réplica de los conceptos.**

## Qué queda abierto para probar

Ventana `Android Emulator - Medium_Phone:5554`, aplicación `Salida Lista`, en Mis salidas. El emulador permanece en modo avión, con Wi-Fi y datos desactivados. No se modificó la conectividad ni se instaló la app en el teléfono físico conectado.

Puedes recorrer Preparar → Participantes → En ruta → Registrar evento → Partes. En algunas pantallas hay que desplazarse para encontrar las acciones inferiores. No hay Metro necesario para abrir esta build.

## Entorno y alcance

| Campo | Valor observado |
|---|---|
| Dispositivo | Android Emulator, Medium_Phone, `emulator-5554`, x86_64 |
| Paquete | `com.salidalista.mobile` |
| Variante | Release local, bundle JavaScript embebido, firma de pruebas; no distribución de tienda |
| Red durante reapertura | `Active default network: none`; avión 1, Wi-Fi 0, datos 0 |
| Datos utilizados | Exclusivamente demostración; Valeria Torres y Mateo Rojas son nombres ficticios |
| No probado | iOS, teléfono físico, GPS de campo, WhatsApp, Bókun, satélite y Nearby |

APK conservada en `D:\proyectos\react_test\artifacts\android\salida-lista-demo-emulator-x86_64.apk`. **Solo x86_64 para este emulador:** no instalarla como si fuera la versión para un teléfono ARM. No es una release de producción.

## Secuencia ejecutada desde la interfaz

1. Abrir la app instalada, no una imagen ni una página web.
2. Marcar dos ítems de preparación: ficha/protocolo locales y equipo verificado.
3. Marcar como presentes a Valeria y Mateo; observar 2/8.
4. Registrar una demora y comprobar que aparece en Partes locales.
5. Activar modo avión y desactivar explícitamente Wi-Fi y datos del emulador.
6. Forzar cierre del proceso y volver a abrir; verificar el mismo evento y las presencias.
7. Crear otro evento, `OFFLINE02`, ya sin red.
8. Forzar otro cierre y reabrir, todavía sin red; comparar ambos IDs y los dos participantes marcados.

Los procesos cambiaron de PID `8781` a `10316` y después a `11292`: no se trató solo de cambiar de pantalla. No se borraron datos ni se reinstaló para reiniciar el ensayo.

### Resultado de persistencia

| Elemento | Resultado |
|---|---|
| Primer evento | Conserva ID `45f1575b-cd46-4b25-b964-618d24e71ec5` y contenido `PRUE`. |
| Evento creado offline | Conserva ID `d78be521-5f29-4d3a-b143-0bc482257942` y contenido `OFFLINE02`. |
| Participantes | Valeria y Mateo siguen marcados después del segundo cierre. |
| Preparación | Ficha/protocolo y equipo siguen marcados; los otros dos ítems siguen sin marcar. |
| Recepción remota | No simulada: ambos eventos continúan locales, sin acuse. |

Se compararon IDs y checkboxes en las jerarquías UI, además de tomar capturas. [Resultado estructurado](evidence/android-2026-10-16/results.json).

## Capturas reales y comparación visual

| Pantalla | Evidencia real | Comparación con el concepto |
|---|---|---|
| Salidas | [Inicio real](evidence/android-2026-10-16/01-home-real.png) | Conserva marfil/verde, tipografía jerárquica y botones; no tiene la foto de montaña ni el logotipo ilustrado. |
| Preparación | [Checklist tras reinicio](evidence/android-2026-10-16/13-checklist-reinicio-offline.png) | Checklist y aviso de guardia presentes; composición más larga y con más texto. |
| Ruta | [Ruta real](evidence/android-2026-10-16/04-ruta-real.png) | Esquema SVG, no mapa topográfico. El botón de registrar queda debajo del primer viewport: mejora UX pendiente. |
| Participantes | [Presencia tras reinicio](evidence/android-2026-10-16/14-participantes-reinicio-offline.png) | Lista con estados persistidos; filas más altas, menos participantes visibles a la vez. |
| Partes | [Dos eventos tras reinicio offline](evidence/android-2026-10-16/12-dos-eventos-reinicio-offline.png) | Comparte paleta/estructura; muestra IDs y límites técnicos de la demo. |

**Conclusión visual:** dirección coherente, pero no se aprueba como implementación pixel-perfect ni como acabado visual terminado. No se sustituyeron las capturas por las imágenes generadas. No se hizo un rediseño de la UI durante esta prueba.

## Incidencias encontradas y resueltas durante la ejecución

### Compilación nativa Windows

La exportación de JS previa no detectaba límites de rutas del compilador nativo. SDK CMake 3.22.1 incluía Ninja 1.10.2; fallaron rutas de Reanimated y después de código generado de Gesture Handler.

Se incorporó `mobile/plugins/withCmakeObjectPathLimit.js`, registrado en app.json. CNG genera:

```properties
expo.android.cmakeObjectPathMax=240
android.cmakeVersion=3.31.6
```

El límite 240 por sí solo no bastó para todos los targets anidados. Se instaló CMake 3.31.6 en paralelo en el SDK, se verificó Ninja 1.12.1 y se reconstruyó x86_64 correctamente. No se cambiaron versiones de React Native/Reanimated, no se desactivó New Architecture y no se editaron manualmente archivos nativos generados.

Referencias: [propiedades oficiales del plugin Gradle de Expo](https://github.com/expo/expo/blob/main/packages/expo-modules-autolinking/android/expo-gradle-plugin/README.md), [guía oficial Reanimated para Windows](https://docs.swmansion.com/react-native-reanimated/docs/guides/building-on-windows/).

### Tutorial de escritura del emulador

El tutorial del stylus/IME interceptó parte de la entrada automática inicial; por eso el primer registro contiene `PRUE`, no el texto largo que intentaba escribir el ensayo. Se cerró el tutorial desde la pantalla del sistema y se verificó la entrada completa `OFFLINE02` antes de guardar el segundo evento. No se atribuyó erróneamente ese síntoma al almacenamiento SQLite.

## Repetir la compilación local

Desde PowerShell, con las herramientas existentes en este equipo:

```powershell
cd D:\proyectos\react_test\mobile
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot'
$env:ANDROID_HOME='C:\Users\marro\AppData\Local\Android\Sdk'
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
$env:PATH="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
npx expo prebuild --platform android --no-install
.\android\gradlew.bat -p android app:assembleRelease -x lint -x test --configure-on-demand --build-cache -PreactNativeArchitectures=x86_64
```

Las variables se establecen en ese proceso, no globalmente. Java predeterminado del equipo era 8; se usó JDK 21 para este build. Para un teléfono físico se necesita otra arquitectura y su propia prueba, sin asumir equivalencia con el emulador.

Helpers de captura/interacción: `mobile/scripts/android-smoke-helpers.ps1`. Están limitados expresamente a seriales de emulador; rechazan operar sobre un teléfono físico. Las capturas exploratorias intermedias pueden mostrar el tutorial/scroll del ensayo: las evidencias definitivas son las enlazadas en esta tabla.

## Verificaciones adicionales

TypeScript, lint y las siete pruebas de dominio/SQLite pasaron. La última compilación nativa terminó con `BUILD SUCCESSFUL`. La ejecución no resuelve las alertas de auditoría de dependencias ya documentadas, ni convierte el prototipo en una herramienta de seguridad apta para operación real.

## Key Learnings:

1. Pasar Metro/exportación no demuestra que el proyecto nativo compile en Windows.
2. La persistencia se comprobó con cierres de proceso y red activa inexistente, no solo al navegar entre pantallas.
3. La comparación real detectó acciones importantes debajo del primer viewport; el acabado visual sigue pendiente.
