// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // endereço da API usado pelos services e pelo interceptor. pra testar com a API local troca por 'http://localhost:8080'
  apiUrl: 'https://schoolsync-api-kvfx.onrender.com',
  // endereço da versão web, usado no link de convite das salas
  webUrl: 'https://ppschoolsync.netlify.app',
  // client id "Aplicativo da Web" do Google Cloud (é público, pode ficar no código).
  // vazio = o botão "Continuar com o Google" n aparece
  googleClientId: '956777039074-4vb5lrndudfhlavddf83de908obpc066.apps.googleusercontent.com'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
