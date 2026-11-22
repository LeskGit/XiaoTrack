import { useState, type SubmitEvent } from 'react';
import { Link, Navigate, useLocation, type Location } from 'react-router';
import { AuthStatus, useAuth } from '@/app/providers/auth';
import { getErrorMessage } from '@/shared/errors';
import { AuthDomain, MainDomain } from '@/shared/types';

/** What `RequireAuth` puts in `location.state` when it sends us here. Absent if /login was opened directly. */
type AuthLocationState = { from?: Location } | null;

export default function Login() {
    const { status, login } = useAuth();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // The page RequireAuth bounced us from, or the dashboard
    const from = (location.state as AuthLocationState)?.from?.pathname ?? `/${MainDomain.DomainDashboard}`;

    // Session check still running: render nothing rather than a form that may vanish
    if (status === AuthStatus.Checking) {
        return null;
    }

    // Already logged in, or just logged in by the form below: leave the page (decision C)
    if (status === AuthStatus.Authenticated) {
        return <Navigate to={from} replace />;
    }

    const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault(); // no page reload: we send the request ourselves
        setErrorMessage(null);
        setIsSubmitting(true);

        try {
            await login({ email, password });
            // Success: the context switches to 'authenticated', this page re-renders and the check above redirects
        } catch (error) {
            // Wording comes from the central catalog (shared/errors/errorMessages.ts)
            setErrorMessage(getErrorMessage(error, 'login'));
            setIsSubmitting(false);
        }
    };

    return (
        <main className="grid min-h-dvh place-items-center px-4">
            <form
                onSubmit={handleSubmit}
                className="flex w-full max-w-sm flex-col gap-5 rounded-lg border border-line bg-surface p-6 shadow-card"
            >
                <div className="flex flex-col gap-1">
                    <h1 className="text-heading font-semibold text-ink">Log in</h1>
                    <p className="text-label text-ink-muted">Welcome back to XiaoTrack</p>
                </div>

                {errorMessage !== null && (
                    <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-label text-danger-strong">
                        {errorMessage}
                    </p>
                )}

                <label className="flex flex-col gap-1.5">
                    <span className="text-label font-medium text-ink-soft">Email</span>
                    <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="field"
                    />
                </label>

                <label className="flex flex-col gap-1.5">
                    <span className="text-label font-medium text-ink-soft">Password</span>
                    <input
                        type="password"
                        name="password"
                        autoComplete="current-password"
                        required
                        maxLength={128}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="field"
                    />
                </label>

                <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
                    {isSubmitting ? 'Logging in…' : 'Log in'}
                </button>

                <p className="text-center text-label text-ink-muted">
                    No account yet?{' '}
                    {/* Forward the state: `from` survives a detour through the register page */}
                    <Link to={`/${AuthDomain.DomainRegister}`} state={location.state} className="font-medium text-accent hover:underline">
                        Create one
                    </Link>
                </p>
            </form>
        </main>
    );
}
