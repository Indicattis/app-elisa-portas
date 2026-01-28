

## Plano: Integracao Vite + Capacitor + Bitrise

### Objetivo
Configurar o projeto para build nativo mobile (iOS/Android) com CI/CD automatizado via Bitrise.

---

### Etapa 1: Configurar Capacitor no Projeto

**Arquivos a criar:**

1. **`capacitor.config.ts`** - Configuracao principal do Capacitor
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.9eb1bc327d674330b27a36a057f315d7',
  appName: 'app-elisa-portas',
  webDir: 'dist',
  server: {
    // Para desenvolvimento com hot-reload
    url: 'https://9eb1bc32-7d67-4330-b27a-36a057f315d7.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
```

**Dependencias a adicionar no `package.json`:**
```json
{
  "@capacitor/core": "^6.0.0",
  "@capacitor/cli": "^6.0.0",
  "@capacitor/ios": "^6.0.0",
  "@capacitor/android": "^6.0.0"
}
```

---

### Etapa 2: Criar Configuracao Bitrise

**Arquivo:** `bitrise.yml`

```yaml
format_version: "11"
default_step_lib_source: https://github.com/bitrise-io/bitrise-steplib.git

project_type: other

workflows:
  # Workflow para Android
  android:
    steps:
      - activate-ssh-key@4: {}
      - git-clone@8: {}
      - nvm@1:
          inputs:
            - node_version: "20"
      - npm@1:
          title: Install dependencies
          inputs:
            - command: install
      - npm@1:
          title: Build Vite app
          inputs:
            - command: run build
      - script@1:
          title: Capacitor Sync Android
          inputs:
            - content: |
                #!/bin/bash
                set -ex
                npx cap sync android
      - android-build@1:
          inputs:
            - project_location: android
            - module: app
            - variant: Release
      - deploy-to-bitrise-io@2: {}

  # Workflow para iOS
  ios:
    steps:
      - activate-ssh-key@4: {}
      - git-clone@8: {}
      - nvm@1:
          inputs:
            - node_version: "20"
      - npm@1:
          title: Install dependencies
          inputs:
            - command: install
      - npm@1:
          title: Build Vite app
          inputs:
            - command: run build
      - script@1:
          title: Capacitor Sync iOS
          inputs:
            - content: |
                #!/bin/bash
                set -ex
                npx cap sync ios
      - cocoapods-install@2:
          inputs:
            - source_root_path: ios/App
      - xcode-archive@5:
          inputs:
            - project_path: ios/App/App.xcworkspace
            - scheme: App
            - distribution_method: app-store
      - deploy-to-bitrise-io@2: {}

  # Workflow completo (Android + iOS)
  deploy_all:
    before_run:
      - android
      - ios

trigger_map:
  - push_branch: main
    workflow: deploy_all
  - pull_request_source_branch: "*"
    workflow: android

app:
  envs:
    - PROJECT_LOCATION: android
    - MODULE: app
    - VARIANT: Release
```

---

### Etapa 3: Scripts NPM para Capacitor

**Adicionar ao `package.json`:**
```json
{
  "scripts": {
    "cap:sync": "cap sync",
    "cap:android": "cap open android",
    "cap:ios": "cap open ios",
    "build:mobile": "npm run build && cap sync"
  }
}
```

---

### Etapa 4: Configurar .gitignore

**Adicionar ao `.gitignore`:**
```
# Capacitor
/android/
/ios/
*.keystore
*.jks
```

> **Nota:** As pastas `android/` e `ios/` sao geradas pelo Capacitor e geralmente nao sao commitadas, pois o Bitrise as regenera durante o build.

---

### Etapa 5: Documentacao (README)

**Criar:** `docs/MOBILE_BUILD.md`

Documento explicando:
- Como configurar Bitrise
- Variaveis de ambiente necessarias
- Como fazer deploy manual
- Troubleshooting comum

---

### Fluxo de CI/CD

```text
+------------------+     +------------------+     +------------------+
|   Push para      | --> |     Bitrise      | --> |   App Stores     |
|   GitHub/main    |     |   Workflow       |     |   (iOS/Android)  |
+------------------+     +------------------+     +------------------+
                              |
                              v
                    +------------------+
                    | 1. git clone     |
                    | 2. npm install   |
                    | 3. npm run build |
                    | 4. cap sync      |
                    | 5. Build nativo  |
                    | 6. Deploy        |
                    +------------------+
```

---

### Passos Pos-Implementacao (Manual)

Apos criar os arquivos, voce precisara:

1. **Exportar para GitHub** (se ainda nao fez)
2. **No Bitrise:**
   - Criar conta em bitrise.io
   - Conectar repositorio GitHub
   - Adicionar variaveis de ambiente:
     - `ANDROID_KEYSTORE_PASSWORD`
     - `ANDROID_KEY_ALIAS`
     - `ANDROID_KEY_PASSWORD`
     - Certificados iOS (provisioning profiles)
3. **Localmente (opcional para teste):**
   ```bash
   git pull
   npm install
   npx cap add android
   npx cap add ios
   npm run build
   npx cap sync
   ```

---

### Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `capacitor.config.ts` | Criar - configuracao Capacitor |
| `bitrise.yml` | Criar - workflows CI/CD |
| `package.json` | Modificar - adicionar deps e scripts |
| `.gitignore` | Modificar - ignorar pastas nativas |
| `docs/MOBILE_BUILD.md` | Criar - documentacao |

---

### Secao Tecnica

**Dependencias Capacitor:**
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init app-elisa-portas app.lovable.9eb1bc327d674330b27a36a057f315d7 --web-dir dist
```

**Variaveis de Ambiente Bitrise (Secrets):**
- `BITRISEIO_ANDROID_KEYSTORE_URL` - URL do keystore
- `BITRISEIO_ANDROID_KEYSTORE_PASSWORD`
- `BITRISEIO_ANDROID_KEYSTORE_ALIAS`
- `BITRISEIO_ANDROID_KEYSTORE_PRIVATE_KEY_PASSWORD`
- Para iOS: certificados e provisioning profiles via Code Signing

