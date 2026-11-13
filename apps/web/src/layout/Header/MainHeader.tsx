import { IconButton } from "@/components/icons"
import { Avatar } from "@/components/avatar"
import DefaultAvatar from "@/assets/img/avatar/dog.png"
import Bell from '@/assets/icons/bell.svg?react'
import Menu from '@/assets/icons/menu.svg?react'
import { useMatches } from "react-router-dom"

function eventClickTest() {
    console.log("zdz");
}

// Round ghost button of the header (menu, notifications)
const headerButton = "btn btn-ghost btn-icon rounded-full";

const avatarClasses = "h-8 w-8 overflow-hidden rounded-full ring-1 ring-line [&>img]:h-full [&>img]:w-full [&>img]:object-cover";

export default function MainHeader() {

    const date = new Date();
    const routeData = useMatches().at(-1);
    const title = (routeData?.handle as {title? : string})?.title;

    return (
        <header className="flex h-16 items-center border-b border-line bg-surface px-4">
            <nav className="flex w-full items-center justify-between">
                <div className="flex items-center gap-3">
                    <IconButton icon={Menu} className="h-5 w-5" size="custom" iconWeight="regular" onClick={eventClickTest} ariaLabel="Menu" classNameBtn={headerButton} />
                    <div className="flex flex-col justify-center">
                        <h2 className="text-title font-semibold text-ink">{title}</h2>
                        <p className="text-caption text-ink-muted first-letter:uppercase">
                            {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Notifications: a flat accent dot (the gradient is kept for the logo and the primary action) */}
                    <span className="relative">
                        <IconButton icon={Bell} className="h-5 w-5" size="custom" iconWeight="regular" onClick={eventClickTest} ariaLabel="Notifications" classNameBtn={headerButton} />
                        <span className="pointer-events-none absolute top-2 right-2 h-2 w-2 rounded-full bg-accent ring-2 ring-surface" aria-hidden="true" />
                    </span>

                    <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />

                    <button type="button" className="flex items-center gap-3 rounded-full py-1 pr-3 pl-1 transition-colors hover:bg-accent-soft">
                        <Avatar src={DefaultAvatar} size="custom" className={avatarClasses} />
                        <span className="flex flex-col items-start">
                            <span className="text-label font-medium text-ink">XiaoPang</span>
                            <span className="text-caption text-ink-muted">Admin</span>
                        </span>
                    </button>
                </div>
            </nav>
        </header>
    )
}
