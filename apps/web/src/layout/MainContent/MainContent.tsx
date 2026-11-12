import { Outlet } from 'react-router-dom';

export default function MainContent() {
    return (
        // min-h-0 + overflow-y-auto: this is the element that scrolls, never the window
        <main className="@container/content grid min-h-0 content-start overflow-y-auto">
            <Outlet />
        </main>
    )
}
