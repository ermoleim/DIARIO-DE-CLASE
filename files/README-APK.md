# 📱 Diario de Clase — Guía para generar el APK Android

Esta guía te lleva desde cero hasta tener el `.apk` instalado en tu teléfono.

---

## Resumen de lo que necesitas instalar (una sola vez)

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| Node.js | 18+ LTS | https://nodejs.org |
| Android Studio | Hedgehog+ | https://developer.android.com/studio |
| JDK | 17+ | incluido con Android Studio |

---

## PASO 1 — Instalar Node.js

1. Ve a https://nodejs.org y descarga la versión **LTS** (recomendada).
2. Instala con todas las opciones por defecto.
3. Verifica en la terminal:
   ```bash
   node --version   # debe mostrar v18.x o superior
   npm --version    # debe mostrar 9.x o superior
   ```

---

## PASO 2 — Instalar Android Studio

1. Descarga desde https://developer.android.com/studio
2. Instala y abre Android Studio.
3. Al primer inicio, el asistente instalará automáticamente:
   - Android SDK
   - Android SDK Platform 34
   - Android Virtual Device (emulador)

4. **Configura la variable de entorno ANDROID_HOME:**

   **Windows:**
   - Panel de control → Sistema → Variables de entorno
   - Nueva variable de usuario:
     - Nombre: `ANDROID_HOME`
     - Valor: `C:\Users\TU_USUARIO\AppData\Local\Android\Sdk`
   - Agrega a `PATH`: `%ANDROID_HOME%\platform-tools`

   **Mac/Linux:**
   ```bash
   # Agrega al final de ~/.bashrc o ~/.zshrc:
   export ANDROID_HOME=$HOME/Library/Android/sdk   # Mac
   export ANDROID_HOME=$HOME/Android/Sdk           # Linux
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   source ~/.bashrc   # o ~/.zshrc
   ```

5. Verifica:
   ```bash
   adb --version   # debe mostrar Android Debug Bridge
   ```

---

## PASO 3 — Preparar el proyecto

Abre una terminal en la carpeta donde están los archivos del proyecto (`diario-clase-apk/`).

```bash
# Instalar todas las dependencias de Capacitor
npm install
```

Esto descarga:
- `@capacitor/core`
- `@capacitor/android`
- `@capacitor-community/sqlite`
- `@capacitor/filesystem`
- `@capacitor/share`
- `@capacitor/local-notifications`
- `@capacitor/status-bar`
- `@capacitor/splash-screen`

---

## PASO 4 — Inicializar Capacitor

```bash
# Inicializar Capacitor con la configuración del proyecto
npx cap init "Diario de Clase" "com.diarioclase.profesional" --web-dir www
```

> ⚠️ Si ya existe `capacitor.config.json` (que es el caso), este paso puedes saltarlo.

---

## PASO 5 — Agregar la plataforma Android

```bash
npx cap add android
```

Esto crea la carpeta `android/` con el proyecto nativo de Android Studio.

---

## PASO 6 — Sincronizar los archivos web con Android

```bash
npx cap sync android
```

Este comando:
1. Copia la carpeta `www/` dentro de `android/app/src/main/assets/public/`
2. Instala los plugins nativos (SQLite, Filesystem, etc.) en el proyecto Android
3. Actualiza la configuración del WebView

> **Repite `npx cap sync android` cada vez que modifiques los archivos web.**

---

## PASO 7 — Configurar el plugin SQLite en Android

Abre el archivo `android/app/src/main/java/com/diarioclase/profesional/MainActivity.java` y verifica que tenga este contenido:

```java
package com.diarioclase.profesional;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }
}
```

> Capacitor 6 registra los plugins automáticamente. No necesitas agregar código extra.

---

## PASO 8 — Abrir Android Studio

```bash
npx cap open android
```

Esto abre Android Studio con el proyecto. Espera a que termine la sincronización de Gradle (barra de progreso inferior).

---

## PASO 9 — Generar el APK Debug (para probar)

### Opción A — Desde Android Studio (recomendado la primera vez):

1. Menú: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Espera a que compile (2-5 minutos la primera vez)
3. Aparece una notificación: **"APK(s) generated successfully"**
4. Clic en **"locate"** para abrir la carpeta con el APK
5. El archivo estará en:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Opción B — Desde la terminal:

```bash
cd android
./gradlew assembleDebug          # Linux/Mac
gradlew.bat assembleDebug        # Windows
```

El APK queda en: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## PASO 10 — Instalar el APK en tu teléfono Android

### Opción A — Por USB (más rápido):

1. En tu teléfono Android: **Configuración → Acerca del teléfono → Número de compilación** (toca 7 veces para activar opciones de desarrollador)
2. **Configuración → Opciones de desarrollador → Depuración USB** → Activar
3. Conecta el teléfono al PC con un cable USB y acepta la autorización en el teléfono
4. Ejecuta:
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```
5. La app aparece instalada en tu teléfono.

### Opción B — Por archivo (sin cable):

1. Copia el archivo `app-debug.apk` al teléfono (por WhatsApp, Google Drive, email, etc.)
2. En el teléfono, abre el archivo
3. Si aparece "Instalar aplicaciones desconocidas" → Actívalo para esa fuente
4. Toca **Instalar**

### Opción C — Desde Android Studio con emulador:

1. **Tools → Device Manager → Create Virtual Device**
2. Selecciona Pixel 6, API 34
3. Clic en ▶ Run para instalar y ejecutar en el emulador

---

## PASO 11 — APK Release (para distribución definitiva)

Para un APK firmado listo para compartir con otros:

### Crear keystore (una sola vez):
```bash
keytool -genkey -v -keystore diario-clase.keystore \
  -alias diarioclase -keyalg RSA -keysize 2048 -validity 10000
```

### Generar APK Release:
En Android Studio:
1. **Build → Generate Signed Bundle / APK**
2. Selecciona **APK**
3. Selecciona el keystore creado
4. Build variant: **Release**
5. Clic en **Finish**

El APK firmado queda en: `android/app/build/outputs/apk/release/app-release.apk`

---

## Flujo de trabajo diario (después de la configuración inicial)

```bash
# 1. Edita los archivos web en www/
# 2. Sincroniza con Android
npx cap sync android

# 3. Compila e instala en el teléfono conectado
cd android && ./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

O más simple, desde Android Studio: solo clic en ▶ **Run**.

---

## Solución de problemas frecuentes

| Problema | Solución |
|---|---|
| `ANDROID_HOME not set` | Revisa el Paso 2 y reinicia la terminal |
| `Gradle sync failed` | File → Invalidate Caches → Restart en Android Studio |
| `SDK not found` | Android Studio → SDK Manager → instala Android 14 (API 34) |
| `SQLite no funciona` | Verifica que `@capacitor-community/sqlite` esté en `package.json` y ejecuta `npm install` |
| APK instala pero app en blanco | Abre Chrome en el PC, ve a `chrome://inspect`, conecta el teléfono y revisa la consola |
| `adb: command not found` | Agrega `platform-tools` al PATH (Paso 2) |

---

## Estructura final del proyecto

```
diario-clase-apk/
├── android/                    ← Generado por "npx cap add android"
│   └── app/src/main/assets/public/  ← Copia de www/ (generada por cap sync)
├── www/                        ← TUS archivos web (edita aquí)
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── db.js               ← SQLite (Android) / localStorage (navegador)
│       ├── utils.js
│       ├── ui.js               ← Toast, Modal, Clock
│       ├── services/
│       │   ├── groups.service.js
│       │   ├── classes.service.js
│       │   ├── schedule.service.js
│       │   ├── backup.service.js
│       │   ├── export.service.js
│       │   └── notifications.service.js
│       ├── views/
│       │   ├── home.view.js
│       │   ├── grupos.view.js
│       │   ├── grupo-detalle.view.js
│       │   ├── clase-form.view.js
│       │   ├── horario.view.js
│       │   └── config.view.js
│       └── app.js              ← Router + init
├── capacitor.config.json
├── package.json
└── README-APK.md               ← Esta guía
```

---

## Diferencias entre la versión web y la APK

| Característica | Versión web (file://) | APK Android |
|---|---|---|
| Almacenamiento | localStorage (~5 MB) | SQLite (sin límite) |
| Notificaciones | Solo en pantalla | Notificaciones del sistema Android |
| Exportar archivos | Descarga en navegador | Guarda en Documentos + Compartir |
| Compartir | No disponible | Nativo Android (WhatsApp, email, etc.) |
| Acceso sin internet | ✓ | ✓ |
| Ícono en pantalla | Acceso directo | App nativa con ícono |
| PIN de seguridad | ✓ | ✓ |

---

**Tiempo estimado de configuración inicial: 30-45 minutos**  
**Tiempo de compilación posterior: 30-60 segundos**
