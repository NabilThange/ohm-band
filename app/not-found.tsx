import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">404</h1>
            <p className="mt-4 text-base text-muted-foreground">The page or project you requested could not be found.</p>
            <div className="mt-6">
                <Link
                    href="/"
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    Back to Workspace
                </Link>
            </div>
        </div>
    );
}
