# Probar SalidaLista en el Redmi Android 14 sin perder datos

**Objetivo:** instalar el APK de prueba y comprobar en el celular el arranque, el guardado local y, por separado, el GPS real. No es una certificación de producción, rescate ni seguimiento permanente.

## Qué está listo y qué sigue pendiente

| Elemento | Estado al preparar esta guía |
|---|---|
| Lint, TypeScript y ocho pruebas automatizadas | Reportados como aprobados en el proyecto; no sustituyen pruebas del teléfono |
| Compilación del APK actual | Aprobada: release 1.0.1 (2), build local completado en 31m38s |
| Firma, versión, bundle JS y dos arquitecturas | PASS: verificación estática del APK final, firma v2, ARM64 y x86_64 |
| Instalación en Redmi Android 14 ARM64 | Autorizada por el usuario; pendiente de reconectar USB (dejó de detectarse al terminar el build) |
| Datos locales después de forzar detención | Pendiente de prueba en el teléfono |
| GPS real, precisión y adquisición al aire libre | **Pendiente: no certificado** |
| Conectores Bókun, envío WhatsApp y atención de emergencias | No demostrados por esta prueba local |
| Dependencias | 28 alertas de auditoría reportadas: ocho moderadas y veinte altas, pendientes de resolver/evaluar |

Los datos del emulador **no se transfieren** al Redmi. El paquete no existe actualmente en el celular según la comprobación previa: la primera instalación parte sin esos registros. No importar información privada para esta prueba.

## 1. Verificar el archivo antes de instalar

APK generado (86.077.015 bytes, aproximadamente 82,1 MiB): `D:\proyectos\react_test\artifacts\android\SalidaLista-1.0.1-Android.apk`.

SHA-256: `71a61d78c34880057586c11cd9dd53c3a726413c0104ec44aeccd175e2cb40b2`.

Evidencia estática: [apk-verification.json](evidence/android-device-apk-2026-10-16/apk-verification.json). Esta comprobación NO certifica GPS real ni estabilidad de ejecución. Firma de prueba, mínimo declarado API24, target36; el celular detectado usa API34 y ARM64.

Desde PowerShell en la raíz del proyecto, con `JAVA_HOME` apuntando a JDK 21:

```powershell
& .\mobile\scripts\verify-android-apk.ps1 `
  -ApkPath 'D:\proyectos\react_test\artifacts\android\SalidaLista-1.0.1-Android.apk' `
  -OutputDir 'D:\proyectos\react_test\docs\evidence\android-device-apk-2026-10-16'
```

Si es necesario, pasar `-SdkPath` y `-JavaHome` explícitos. El SDK debe tener Build Tools `37.0.0`. Cada ejecución escribe una subcarpeta `run-...` nueva con `evidence.json` y logs; no toca el APK, Android generado ni el teléfono.

| Comprobación estática | Esperado |
|---|---|
| Firma | `apksigner verify --verbose --print-certs` termina con código cero |
| Identidad | `com.salidalista.mobile`, versión `1.0.1`, código `2` |
| Arquitecturas nativas | `arm64-v8a` para Redmi y `x86_64` para emulador |
| Bibliotecas | Núcleo nativo no vacío en ambas ABI y paridad de módulos presentes |
| JS embebido | `assets/index.android.bundle` no vacío: no depender de Metro para entregar el bundle |
| Integridad | SHA-256 y tamaño del archivo final registrados |

**Detenerse si el script termina con error.** Una firma válida no acredita identidad de producción ni funcionamiento de las bibliotecas. Este APK tiene firma de prueba, no distribución Play Store. Nunca desactivar Play Protect para instalarlo.

## 2. Instalar sin borrar nada

La instalación por USB está autorizada; la realiza el responsable técnico, sin desinstalar ni borrar datos. Mantener el celular desbloqueado y aceptar personalmente la autorización de depuración si aparece.

En MIUI/HyperOS puede aparecer una autorización adicional de instalación por USB. Si el fabricante la bloquea, no cambiar políticas de seguridad ni desactivar Play Protect: el usuario puede autorizar la opción pertinente o instalar manualmente el archivo verificado desde el teléfono. No continuar ante una alerta inesperada sin revisarla.

No introducir cuentas, números ni permisos ajenos a la prueba. Guardar evidencia sin IMEI, seriales USB, contactos personales o mensajes privados.

## 3. Primer arranque y mapa offline

1. Abrir SalidaLista y confirmar que la pantalla responde sin Metro ni servidor de desarrollo.
2. Abrir el recorrido de demostración Salkantay y su mapa.
3. Comprobar la marca/imagen local y los iconos. La marca es un recurso generado local; el prompt de diseño está en `D:\proyectos\react_test\docs\design\04-brand-icon-prompt.txt`. Los iconos usan Lucide 1.58 con SVG, no fuentes descargadas.
4. Registrar versión visible, fecha/hora y cualquier error real. No marcar esta sección aprobada hasta probar el APK instalado.

**Cobertura cartográfica de esta demostración:** Salkantay, caja `[oeste, sur, este, norte] = [-72.65, -13.45, -72.52, -13.30]`. No es un mapa completo de Perú ni navegación de emergencia.

## 4. GPS real: hacerlo fuera, no bajo techo

**El usuario controla los ajustes.** El agente no cambia ubicación ni red celular por su cuenta.

1. En el Redmi, el usuario activa **Ubicación** y concede a SalidaLista **Ubicación precisa → Solo mientras se usa la app**.
2. No seleccionar una aplicación de ubicación simulada ni usar coordenadas de prueba como evidencia real.
3. Salir a un lugar seguro al aire libre, con cielo despejado. No esperar una adquisición fiable dentro del edificio.
4. En la pantalla de ruta, tocar **Activar GPS**. Mantener la app en primer plano y esperar inicialmente entre dos y tres minutos; esto es una pauta de prueba, no un tiempo máximo garantizado.
5. Anotar coordenadas, hora de captura, precisión reportada y si se reciben nuevas posiciones. Si no hay fix, registrar **Pendiente/sin adquisición**, no sustituirlo con un punto inventado.
6. Tocar **Centrar en mí** solo después de recibir una posición real.

### Si el celular está en Lima u otra zona fuera de Salkantay

Es correcto obtener coordenadas reales y ver **Fuera del área**. El mapa no debe fingir calles locales ni centrar como si tuviera cartografía de esa zona. La app no centrará fuera de la cobertura prevista. La prueba del GPS y la visualización del mapa Salkantay son dos comprobaciones separadas.

**Background:** el GPS de esta versión se detiene al dejar la app en segundo plano; al regresar hay que activarlo de nuevo. Lo guardado sí debe persistir. No anunciar seguimiento continuo con pantalla bloqueada o tras forzar detención.

## 5. Guardado local en modo avión

No hace falta GPS para validar la persistencia. La posición del evento es opcional; si no existe, registrar esa ausencia claramente.

1. El usuario activa modo avión, apaga Wi-Fi y confirma que los datos móviles están apagados; mantiene Ubicación activa si desea probar un fix. Revisar ajustes reales, no confiar solo en el icono de avión.
2. Abrir el recorrido demo y crear el evento **PRUEBA-AVION-01** usando el flujo disponible.
3. Registrar su **ID real**, fecha/hora, conteo y presencia observada. No confundir el nombre de prueba con el ID generado.
4. Desde **Ajustes → Apps → SalidaLista**, tocar **Forzar detención**. **No tocar Borrar datos/Borrar almacenamiento ni Desinstalar.**
5. Abrir otra vez SalidaLista, todavía en modo avión.
6. Comprobar los mismos IDs, fechas, conteos y estados de presencia. Anotar diferencias o errores; no asumir éxito solo porque se ve el recorrido.
7. Si se desea continuar GPS, activarlo de nuevo en primer plano. El usuario restaura la conectividad cuando termine.

**Qué demuestra:** datos que sobreviven a la detención del proceso en ese teléfono/build. No demuestra envío al guía, central, Bókun, WhatsApp, satélite o servicio de rescate; tampoco sincronización entre dispositivos.

## 6. Hoja de resultados: completar con observaciones reales

| Caso | Estado inicial | Resultado / evidencia que debe completar quien prueba |
|---|---|---|
| APK final y firma | Pendiente | SHA-256, tamaño, ruta de `evidence.json`, salida cero/no cero |
| Instalación USB sin borrar datos | Pendiente | Fecha/hora, resultado; sin seriales privados |
| Arranque sin Metro | Pendiente | Captura o error observado |
| Mapa Salkantay offline | Pendiente | Datos visibles dentro del área, sin afirmar cobertura nacional |
| GPS preciso al aire libre | Pendiente | Hora, precisión, fix obtenido o pendiente; ocultar coordenadas privadas al compartir |
| Fuera del área | Pendiente | Aviso si la posición está fuera; no forzar un punto en Salkantay |
| Evento PRUEBA-AVION-01 | Pendiente | ID, fecha/hora, conteo y presencia antes de detener |
| Reabrir tras Forzar detención | Pendiente | Comparar exactamente esos campos después |
| Reactivar GPS al volver | Pendiente | Observar nuevo fix; sin promesa background |

Usar **Verificado** solo cuando exista observación/evidencia; **Falló** si se reproduce un error y **Pendiente** si no se ejecutó o faltó una condición. El script únicamente puede aprobar la parte estática del APK.

## Si algo falla

- **No abre:** registrar versión, hora y mensaje; no reinstalar/desinstalar como primer intento.
- **Sin GPS:** revisar personalmente permisos, ubicación precisa y cielo visible; mantener el estado pendiente, sin simular resultados.
- **Mapa sin cartografía local:** comprobar si está fuera de la caja Salkantay; no es automáticamente un fallo del GPS.
- **Datos desaparecieron:** no crear nuevos datos que oculten el problema; registrar pasos y detener la prueba de persistencia.
- **Firma/ABI/bundle inválidos:** no instalar ese archivo. El responsable técnico corrige y vuelve a producir evidencia de un APK nuevo.

**Siguiente paso:** el responsable técnico incorpora únicamente los resultados realmente obtenidos. Nada de esta guía convierte la demostración en un sistema de seguridad listo para producción.

## Avance observado en el teléfono — 16 de octubre de 2026

- Instalación USB: **Verificada**, `adb install --no-streaming -r` devolvió `Success`; no se desinstaló ni se borró almacenamiento.
- Versión instalada: **1.0.1**, versionCode **2**.
- Arranque: **Verificado** en el teléfono, sin Metro. La jerarquía corresponde a `com.salidalista.mobile`.
- Interfaz: mapa MapLibre renderizado, iconos SVG visibles y botón Registrar evento fijo visible.
- Ubicación: la pantalla recibió una posición del proveedor del teléfono y reportó precisión estimada de **20 m**. No se inyectaron coordenadas. No se conserva aquí la ubicación privada. Esta observación no acredita adquisición exclusivamente satelital ni una prueba al aire libre.
- Fuera de cobertura: **Verificado** el aviso de posición fuera del paquete Salkantay.
- Conectividad en esa observación: modo avión desactivado, Wi-Fi y datos móviles activados. **Todavía no acredita operación offline en el teléfono**.
- Persistencia de evento/presencia tras detener y reabrir en modo avión: **Pendiente**.
- Se descartaron las capturas de pantalla de esta observación por contener ubicación privada o contenido superpuesto de otra aplicación; no se publican como evidencia visual.

Siguiente prueba: el usuario activa modo avión y apaga Wi-Fi/datos. Luego crear un evento ficticio sin ubicación, registrar su ID y una presencia, detener solo la app y reabrir para comparar. No borrar datos.
