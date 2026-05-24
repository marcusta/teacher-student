import { di, Router, Theme, startApp, effect } from '@basics/core/client/core';
import { AuthService } from '@basics/core/client/auth';
import { pushContext } from '@basics/core/client/error-report';
import './theme';
import { AppComponent } from './app/app.component';

di.get(Theme);
const router = di.get(Router);
const auth = di.get(AuthService);

await startApp(AppComponent, '#app', {
    hot: import.meta.hot,
    onInit: async () => {
        effect(() => {
            pushContext({ type: 'navigation', detail: router.route.get(), timestamp: new Date().toISOString() });
        });
        await auth.load();
        const route = router.route.get();
        if (!auth.currentUser.get()) {
            if (route !== '/login' && route !== '/register') {
                router.navigate('/login', true);
            }
        } else if (route === '/' || route === '/login' || route === '/register') {
            router.navigate('/home', true);
        }
    },
});
