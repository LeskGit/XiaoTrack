import { IconButton } from "@/components/icons"
import { Avatar } from "@/components/avatar"
import DefaultAvatar from "@/assets/img/avatar/dog.png"
import Bell from '@/assets/icons/bell.svg?react'
import Menu from '@/assets/icons/menu.svg?react'
import { useMatches } from "react-router-dom"

function eventClickTest() {
    console.log("zdz");
}

export default function MainHeader() {

    const date = new Date();
    const routeData = useMatches().at(-1);
    const title = (routeData?.handle as {title? : string})?.title;

    return (
        <header className="p-3 shadow-md">
            <nav className="nav flex justify-between items-center">
                <div className="flex items-center gap-5">
                    <IconButton icon={Menu} className="w-8 h-8" size="custom" onClick={eventClickTest} />
                    <div className="flex flex-col justify-center">
                        <h2 className="font-bold">{title}</h2>
                        <h4 className="">{date.toLocaleDateString('fr-FR')}</h4>
                    </div>
                </div>
                <div className="flex justify-center items-center gap-5">
                    <IconButton icon={Bell} className="w-8 h-8" size="custom" onClick={eventClickTest} />
                    <Avatar src={DefaultAvatar} size="md" />
                    <div className="flex flex-col justify-center">
                        <span>XiaoPang</span>
                        <p className="text-sm font-light">Admin</p>
                    </div>
                </div>
            </nav>
        </header>
    )
}