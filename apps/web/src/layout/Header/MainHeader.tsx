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
const headerButton = "h-10 w-10 rounded-full text-gray-600 transition-colors hover:bg-accent-soft hover:text-accent-strong";

export default function MainHeader() {

    const date = new Date();
    const routeData = useMatches().at(-1);
    const title = (routeData?.handle as {title? : string})?.title;

    return (
        <header className="flex h-16 items-center border-b border-line bg-glass px-4 backdrop-blur-xl">
            <nav className="flex w-full items-center justify-between">
                <div className="flex items-center gap-3">
                    <IconButton icon={Menu} className="h-5 w-5" size="custom" iconWeight="regular" onClick={eventClickTest} ariaLabel="Menu" classNameBtn={headerButton} />
                    <div className="flex flex-col justify-center leading-tight">
                        <h2 className="text-[0.9375rem] font-semibold text-gray-900">{title}</h2>
                        <p className="text-xs text-gray-500 first-letter:uppercase">
                            {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Notifications: the dot uses the brand gradient */}
                    <span className="relative">
                        <IconButton icon={Bell} className="h-5 w-5" size="custom" iconWeight="regular" onClick={eventClickTest} ariaLabel="Notifications" classNameBtn={headerButton} />
                        <span className="bg-brand pointer-events-none absolute top-2 right-2.5 h-2 w-2 rounded-full ring-2 ring-white" aria-hidden="true" />
                    </span>

                    <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />

                    {/* Profile: avatar in a thin brand-gradient ring */}
                    <button type="button" className="flex items-center gap-3 rounded-full py-1 pr-3 pl-1 transition-colors hover:bg-accent-soft">
                        <span className="bg-brand rounded-full p-[2px]">
                            <Avatar src={DefaultAvatar} size="custom" className="h-8 w-8 overflow-hidden rounded-full ring-2 ring-white [&>img]:h-full [&>img]:w-full [&>img]:object-cover" />
                        </span>
                        <span className="flex flex-col items-start leading-tight">
                            <span className="text-sm font-medium text-gray-900">XiaoPang</span>
                            <span className="text-xs text-gray-500">Admin</span>
                        </span>
                    </button>
                </div>
            </nav>
        </header>
    )
}
