# Build Mobile com Capacitor + Bitrise

Este documento explica como configurar e usar o pipeline de CI/CD para builds nativos iOS e Android.

## Arquitetura

```
+------------------+     +------------------+     +------------------+
|   Push para      | --> |     Bitrise      | --> |   App Stores     |
|   GitHub/main    |     |   Workflow       |     |   (iOS/Android)  |
+------------------+     +------------------+     +------------------+
```

## Pré-requisitos

### Para desenvolvimento local
- Node.js 20+
- Android Studio (para Android)
- Xcode (para iOS, apenas macOS)

### Para CI/CD (Bitrise)
- Conta no Bitrise (bitrise.io)
- Repositório conectado ao GitHub
- Certificados de assinatura configurados

## Configuração Inicial

### 1. Exportar para GitHub
Se ainda não fez, exporte o projeto para o GitHub usando o botão "Export to GitHub" no Lovable.

### 2. Configurar Bitrise

1. Acesse [bitrise.io](https://bitrise.io) e crie uma conta
2. Clique em "Add new app"
3. Conecte seu repositório GitHub
4. Selecione o branch `main`
5. O Bitrise detectará automaticamente o `bitrise.yml`

### 3. Configurar Variáveis de Ambiente (Secrets)

No Bitrise, vá em **Workflow > Secrets** e adicione:

#### Android
| Variável | Descrição |
|----------|-----------|
| `BITRISEIO_ANDROID_KEYSTORE_URL` | URL do arquivo keystore |
| `BITRISEIO_ANDROID_KEYSTORE_PASSWORD` | Senha do keystore |
| `BITRISEIO_ANDROID_KEYSTORE_ALIAS` | Alias da chave |
| `BITRISEIO_ANDROID_KEYSTORE_PRIVATE_KEY_PASSWORD` | Senha da chave privada |

#### iOS
Configure via **Code Signing** no Bitrise:
- Upload do certificado de distribuição (.p12)
- Upload dos provisioning profiles
- Configure o Apple Developer Team ID

## Workflows Disponíveis

### `android`
Build apenas para Android. Gera APK/AAB de Release.

### `ios`
Build apenas para iOS. Gera IPA para App Store.

### `deploy_all`
Executa ambos os workflows (Android + iOS).

## Triggers Automáticos

| Evento | Workflow |
|--------|----------|
| Push para `main` | `deploy_all` |
| Pull Request | `android` |

## Desenvolvimento Local

### Setup inicial
```bash
# Clone o repositório
git clone <seu-repo>
cd <seu-repo>

# Instale dependências
npm install

# Adicione as plataformas nativas
npx cap add android
npx cap add ios
```

### Build e sync
```bash
# Build do Vite + sync do Capacitor
npm run build
npx cap sync

# Ou use o script combinado (se configurado)
npm run build:mobile
```

### Abrir no IDE nativo
```bash
# Android Studio
npx cap open android

# Xcode
npx cap open ios
```

### Executar no dispositivo/emulador
```bash
# Android
npx cap run android

# iOS
npx cap run ios
```

## Hot Reload em Desenvolvimento

O `capacitor.config.ts` está configurado para hot-reload apontando para o preview do Lovable:

```typescript
server: {
  url: 'https://9eb1bc32-7d67-4330-b27a-36a057f315d7.lovableproject.com?forceHideBadge=true',
  cleartext: true
}
```

> **Nota:** Para build de produção, remova ou comente a seção `server` no `capacitor.config.ts`.

## Troubleshooting

### Erro: "Android SDK not found"
Certifique-se de que o Android Studio está instalado e o `ANDROID_HOME` está configurado.

### Erro: "No signing certificate"
Configure os certificados no Bitrise via Code Signing ou adicione manualmente no Xcode.

### Erro: "CocoaPods install failed"
```bash
cd ios/App
pod install --repo-update
```

### Build local não reflete mudanças
```bash
npm run build
npx cap sync
```

## Estrutura de Arquivos

```
├── capacitor.config.ts    # Configuração do Capacitor
├── bitrise.yml            # Workflows do Bitrise
├── android/               # Projeto Android (gerado)
├── ios/                   # Projeto iOS (gerado)
└── dist/                  # Build do Vite (web)
```

> **Nota:** As pastas `android/` e `ios/` são geradas pelo Capacitor e não devem ser commitadas. O Bitrise as regenera durante o build.

## Links Úteis

- [Documentação Capacitor](https://capacitorjs.com/docs)
- [Documentação Bitrise](https://devcenter.bitrise.io/)
- [Capacitor + Bitrise Guide](https://capacitorjs.com/docs/guides/ci-cd)
