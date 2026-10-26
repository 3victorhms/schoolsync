# SchoolSync

O SchoolSync é um app pra turma organizar junto as atividades da escola. A turma cria uma sala, todo mundo cadastra as atividades e provas, e cada aluno acompanha os prazos num calendário, divide os trabalhos em grupo e controla o próprio boletim.

Funciona no Android e no navegador (https://ppschoolsync.netlify.app). A API fica no repositório `schoolsync-api`.

## Funcionalidades

- Cadastro, login (com e-mail e senha ou com a conta Google) e recuperação de senha por código no e-mail
- Salas com matérias e divisão do ano (bimestre, trimestre ou semestre), com as datas e os pontos de cada período
- Entrada na sala por código ou link de convite, lista de membros e troca de líder
- Atividades com matéria, período, data de entrega e pontos (os pontos de uma matéria não passam do máximo do período)
- Caderno com o status de cada atividade (não iniciada, em andamento, concluída)
- Agenda e calendário no Início, com aviso de semana pesada
- Comentários e respostas nas atividades
- Grupos com divisão de tarefas, prazos e progresso
- Boletim com as notas das atividades e notas avulsas, a situação de cada matéria em relação à meta de 60% e exportação em PDF
- Notificações no app e no celular, com lembrete antes do prazo (1, 3 ou 7 dias)
- Tema claro, escuro ou igual ao do sistema
- Painel do administrador pra ver os usuários, trocar o perfil e ligar o modo manutenção

## Tecnologias

- Angular 20 e Ionic 8, em TypeScript e SCSS
- Capacitor 8 (Android), com os plugins Preferences, Push Notifications, Filesystem, Share, Clipboard, Haptics, Keyboard e Status Bar
- `@capgo/capacitor-social-login` pro login com Google
- Firebase Cloud Messaging para o push
- jsPDF para o boletim em PDF
- Jasmine e Karma nos testes

## Como rodar

Precisa do Node.js 22.

```bash
npm install
npm start          # abre em http://localhost:4200
npm test           # testes no Karma
```

O endereço da API fica em `src/environments/environment.ts` (e no `environment.prod.ts` pra versão publicada).

## Login com o Google

O botão só aparece quando `googleClientId` está preenchido nos dois arquivos de `environment`. Pra configurar, no [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. Em **Tela de permissão OAuth**, escolher *Externo* e colocar o nome do app e o e-mail de suporte. Enquanto o app estiver em teste, só os e-mails adicionados em *Usuários de teste* conseguem entrar.
2. Criar uma credencial **ID do cliente OAuth** do tipo *Aplicativo da Web*:
   - Origens JavaScript: `https://ppschoolsync.netlify.app`, `http://localhost:4200` e `http://localhost:8100`
   - URIs de redirecionamento: as mesmas, terminando em `/login`
3. Criar mais uma credencial do tipo *Android* pra cada chave que assina o APK (a de debug e a de release), com o pacote `br.cefetmg.schoolsync` e o SHA-1 da chave. O SHA-1 sai com `./gradlew signingReport` dentro de `android/`.
4. Colocar o client ID *da Web* (não o do Android) em `googleClientId` e na variável `GOOGLE_CLIENT_IDS` da API.

Depois de mudar o `environment`, rodar de novo `npm run build` e `npx cap sync android`.

## Gerar o APK

Precisa do Android Studio. O `google-services.json` do Firebase fica em `android/app` (o passo a passo está no `PUSH_NOTIFICATIONS_SETUP.md`).

```bash
npm install
npm run build
npx cap sync android
npx cap open android
```

Depois é só ir em **Build > Generate Signed App Bundle / APK** no Android Studio. O identificador do app é `br.cefetmg.schoolsync`.

A versão web é publicada pelo Netlify, que faz o `npm install` e o build sozinho.

## Autores

Projeto feito pelos alunos Victor Hugo Mendes Soares e Marcos Daniel Vieira Benedito com fins acadêmicos CEFET-MG Campus Timóteo
