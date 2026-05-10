import { IconButton, Icon } from "@/components/icons"
import { Avatar } from "@/components/avatar"
import DefaultAvatar from "@/assets/img/avatar/dog.png"
import type { MainheaderProps } from "../layout.types";
import Bell from '@/assets/icons/bell.svg?react'
import Menu from '@/assets/icons/menu.svg?react'

function eventClickTest() {
    console.log("zdz");
}

export default function MainHeader({categorieName, date} : MainheaderProps) {
    return (
        <header className="p-3 shadow-md justify-center items-center">
            <nav className="nav flex justify-between items-center">
                <div className="flex gap-5">
                    <IconButton icon={Menu} className="w-8 h-8" size="custom" onClick={eventClickTest} />
                    <div className="flex flex-col justify-center">
                        <h1 className="font-bold">{categorieName}</h1>
                        <h4 className="">{date.toLocaleDateString('fr-FR')}</h4>
                    </div>
                </div>
                <div className="flex justify-center items-center gap-5">
                    <IconButton icon={Bell} className="w-8 h-8" size="custom" onClick={eventClickTest} />
                    <Avatar src={DefaultAvatar} size="md" />
                    <div className="flex flex-col">
                        <h1>XiaoPang</h1>
                        <p className="text-sm font-light">Admin</p>
                    </div>
                </div>
            </nav>
        </header>
    )
}