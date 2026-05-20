
import { Outlet } from 'react-router-dom';

export default function MainContent() {
    return (
        <div className="grid shadow-md">
            <Outlet />
        </div>
    )
}