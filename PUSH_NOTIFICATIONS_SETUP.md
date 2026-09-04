# Configuração das notificações push

O código do aplicativo e da API já está preparado. Para o Firebase autorizar o envio aos celulares Android, faça uma única configuração externa:

1. No console do Firebase, crie ou abra o projeto do SchoolSync.
2. Adicione um aplicativo Android usando o identificador `io.ionic.starter`.
3. Baixe o arquivo `google-services.json` e coloque-o em `android/app/google-services.json`.
4. Em **Configurações do projeto > Contas de serviço**, gere uma chave privada da conta de serviço.
5. Converta o arquivo JSON da chave para Base64 e cadastre no Render as variáveis:
   - `FIREBASE_ENABLED=true`
   - `FIREBASE_PROJECT_ID` com o ID do projeto Firebase
   - `FIREBASE_CREDENTIALS_BASE64` com o conteúdo da chave convertido para Base64
6. Publique novamente a API. No aplicativo, execute `npm run build` e `npx cap sync android` antes de gerar a nova versão no Android Studio.

Nunca coloque a chave privada da conta de serviço dentro do repositório. O arquivo `google-services.json` identifica o aplicativo Android, mas não substitui a credencial privada usada pela API.
