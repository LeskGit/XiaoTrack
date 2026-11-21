import { useState, type SubmitEvent } from 'react';
import { Link, Navigate, useLocation, type Location } from 'react-router';
import { AuthStatus, useAuth } from '@/app/providers/auth';
import { ApiError } from '@/shared/api';
import { AuthDomain, MainDomain } from '@/shared/types';

/** Same state as the login page: set by `RequireAuth`, forwarded by the link between the two pages. */
type AuthLocationState = { from?: Location } | null;

export default function Register() {
    const { status, register } = useAuth();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const from = (location.state as AuthLocationState)?.from?.pathname ?? `/${MainDomain.DomainDashboard}`;

    if (status === AuthStatus.Checking) {
        return null;
    }

    // Already logged in, or just registered (register logs in right after, decision D): leave the page
    if (status === AuthStatus.Authenticated) {
        return <Navigate to={from} replace />;
    }

    const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorMessage(null);
        setIsSubmitting(true);

        try {
            await register({ email, password });
        } catch (error) {
            setErrorMessage(
                error instanceof ApiError && error.status === 409
                    ? 'This email is already in use'
                    : 'Something went wrong, please try again',
            );
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
                    <h1 className="text-heading font-semibold text-ink">Create an account</h1>
                    <p className="text-label text-ink-muted">Start tracking with XiaoTrack</p>
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
                        autoComplete="new-password"
                        required
                        minLength={8}
                        maxLength={128}
                        aria-describedby="password-hint"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="field"
                    />
                    <span id="password-hint" className="text-caption text-ink-muted">At least 8 characters</span>
                </label>

                <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating your account…' : 'Create account'}
                </button>

                <p className="text-center text-label text-ink-muted">
                    Already have an account?{' '}
                    <Link to={`/${AuthDomain.DomainLogin}`} state={location.state} className="font-medium text-accent hover:underline">
                        Log in
                    </Link>
                </p>
            </form>
        </main>
    );
}
