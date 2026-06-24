# 📱 Guia de Configuração - Sistema Financeiro

## ⚙️ Pré-requisitos

### Windows, macOS e Linux:

1. **Flutter SDK**
   - Download: https://flutter.dev/docs/get-started/install
   - Adicione Flutter ao seu PATH

2. **Android SDK** (para Android/APK)
   - Incluso no Android Studio
   - Download: https://developer.android.com/studio

3. **Dart** (geralmente incluso com Flutter)

### Verificar instalação:

```bash
flutter --version
dart --version
flutter doctor
```

## 🚀 Primeiros Passos

### 1. Clonar o repositório

```bash
git clone https://github.com/Uncolinos/sistema-financeiro.git
cd sistema-financeiro
```

### 2. Instalar dependências

```bash
flutter pub get
```

### 3. Gerar arquivos necessários

```bash
flutter pub run build_runner build
```

Se receber erros, tente:
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

### 4. Listar dispositivos disponíveis

```bash
flutter devices
```

## 📱 Rodando no Android

### Opção 1: Emulador

```bash
# Listar emuladores disponíveis
emulator -list-avds

# Iniciar um emulador
emulator -avd seu_emulador_aqui

# Rodar o app
flutter run
```

### Opção 2: Dispositivo físico

```bash
# Conecte seu Android via USB com Debug ativado
# Verifique a conexão:
flutter devices

# Execute:
flutter run
```

## 📦 Gerar APK

### APK de Release (tamanho otimizado)

```bash
flutter build apk --release
```

**Arquivo gerado:** `build/app/outputs/flutter-apk/app-release.apk`

### APK Split por Arquitetura (recomendado)

```bash
flutter build apk --release --split-per-abi
```

**Arquivos gerados:**
- `app-armeabi-v7a-release.apk` (ARM 32-bit)
- `app-arm64-v8a-release.apk` (ARM 64-bit)
- `app-x86_64-release.apk` (x86 64-bit)

### Copiar APK para seu telefone

```bash
# Windows
adb push build/app/outputs/flutter-apk/app-release.apk C:\

# macOS/Linux
adb push build/app/outputs/flutter-apk/app-release.apk ~/Downloads/
```

## 🌐 Rodando na Web

### Desenvolvimento

```bash
flutter run -d chrome
```

### Build para Web (Deploy)

```bash
flutter build web
```

**Arquivos gerados:** `build/web/`

Para servir localmente:
```bash
cd build/web
python -m http.server 8000
```

Acesse: `http://localhost:8000`

## 🔍 Troubleshooting

### ❌ "Flutter not found"
```bash
# Adicione ao PATH do seu sistema
export PATH="$PATH:/path/to/flutter/bin"
```

### ❌ "Android licenses not accepted"
```bash
flutter doctor --android-licenses
# Digite 'y' para aceitar todas as licenças
```

### ❌ "Gradle build failed"
```bash
flutter clean
flutter pub get
flutter pub run build_runner build
flutter run
```

### ❌ "Erro ao gerar APK"
```bash
# Limpe tudo
flutter clean

# Instale novamente
flutter pub get

# Tente gerar APK novamente
flutter build apk --release
```

### ❌ "Hive database error"
```bash
# Regenere os arquivos
flutter pub run build_runner build --delete-conflicting-outputs
```

## 📁 Estrutura de diretórios

```
sistema-financeiro/
├── android/          # Configuração Android
├── ios/              # Configuração iOS
├── web/              # Configuração Web
├── lib/              # Código Dart/Flutter
│   ├── main.dart
│   ├── models/
│   ├── providers/
│   └── screens/
├── pubspec.yaml      # Dependências
└── README.md         # Este arquivo
```

## 🎯 Próximas etapas

1. ✅ Rodar o app localmente
2. ✅ Gerar APK para Android
3. ✅ Testar no seu telefone
4. ✅ Implementar novos recursos
5. ✅ Deploy na Play Store

## 📚 Recursos úteis

- Flutter Docs: https://flutter.dev/docs
- Dart Docs: https://dart.dev/guides
- Material Design: https://material.io/design
- Android Docs: https://developer.android.com/docs

## 💬 Suporte

Se encontrar problemas:

1. Verifique `flutter doctor` 
2. Tente `flutter clean` + `flutter pub get`
3. Confira as dependências no `pubspec.yaml`
4. Regenere arquivos com `build_runner build`

---

**Sucesso! Seu app está pronto para rodar!** 🎉
