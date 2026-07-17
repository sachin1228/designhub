import { Route, Switch, Router as WouterRouter } from 'wouter';
import LoginPage from '@/pages/LoginPage';

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <p className="font-mono text-[11px] uppercase tracking-wider text-foreground-subtle">
          404
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-foreground">
          Page not found
        </h1>
        <a
          href="/"
          className="mt-4 inline-block font-body text-sm text-accent transition-colors hover:text-accent-hover"
        >
          Back to home
        </a>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/login" component={LoginPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Router />
    </WouterRouter>
  );
}

export default App;
