
import { Outlet } from 'react-router-dom';

export default function MainContent() {
    return (
        <div className="@container/content grid shadow-md">
            <Outlet />
        </div>
    )
}