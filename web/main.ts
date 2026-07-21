import { di, Router, Theme, startApp, effect } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { pushContext } from '@basics/core/client/error-report';
import './fonts.css';
// OFL-1.1 §2 requires the licence to accompany the Font Software wherever it is
// redistributed. The woff2 files are served to every visitor, so the licence has
// to be emitted into the build too — this ?url import is what makes Vite do it.
import './assets/fonts/LICENSE.txt?url';
import './theme';
import { Locale } from './i18n';
import { AppComponent } from './app/app.component';

di.get(Theme);
di.get(Locale);
const router = di.get(Router);
const auth = di.get(AuthService);

await startApp(AppComponent, '#app', {
    hot: import.meta.hot,
    onInit: async () => {
        effect(() => {
            pushContext({ type: 'navigation', detail: router.route.get(), timestamp: new Date().toISOString() });
        });
        // Settle the session BEFORE the shell is constructed. `startApp` awaits
        // onInit and only then builds the root, so by the time the route guard
        // in AppComponent first evaluates, `currentUser` is the real answer and
        // not a not-yet-loaded null — which would bounce a signed-in visitor to
        // /login on every cold load.
        //
        // The guard itself deliberately does NOT live here any more. A check at
        // boot only guards boot: it left /login rendering inside the
        // authenticated shell after a Back button or any programmatic
        // navigate (IA 3.17). It is now an effect on route + currentUser in
        // AppComponent, which covers every way either can change, this one
        // included.
        await auth.load();
    },
});
