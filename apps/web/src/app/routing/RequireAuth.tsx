import { Navigate, Outlet, useLocation } from 'react-router';
import { AuthStatus, useAuth } from '@/app/providers/auth';
import { AuthDomain } from '@/shared/types';

/** Pathless route: guards every child route. Waits for the session check, then lets through or sends to /login. */
export default function RequireAuth() {
    const { status } = useAuth();
    const location = useLocation();

    // GET /auth/me has not answered yet: neither redirect nor render the app
    if (status === AuthStatus.Checking) {
        return (
            <div className="grid h-dvh place-items-center text-label text-ink-muted" role="status">
                Checking your session…
            </div>
        );
    }

    // Not logged in: go to /login and remember where we were heading (decision B)
    if (status === AuthStatus.Anonymous) {
        return <Navigate to={`/${AuthDomain.DomainLogin}`} replace state={{ from: location }} />;
    }

    // Logged in: render the matching child route
    return <Outlet />;
}
