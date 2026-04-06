import { IconButton } from "@/components/icons"
import { Avatar } from "@/components/avatar"
import DefaultAvatar from "@/assets/img/avatar/dog.png"
import type { MainheaderProps } from "../layout.types";

function eventClickTest() {
    console.log("zdz");
}

export default function MainHeader({categorieName, date} : MainheaderProps) {

    return (
        <header className="flex justify-between items-center p-3 shadow-md">
            <div className="flex gap-5">
                <IconButton className="w-8 h-8" size="custom" onClick={eventClickTest} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                <div className="flex flex-col justify-center items-center">
                    <h1 className="font-bold">{categorieName}</h1>
                    <h4 className="">{date.getDate()}</h4>
                </div>
            </div>
            <div className="flex justify-center items-center gap-5">
                <IconButton className="w-8 h-8" size="custom" onClick={eventClickTest} d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                <Avatar src={DefaultAvatar} size="md" />
                <div className="flex flex-col">
                    <h1>XiaoPang</h1>
                    <p className="text-sm font-light">Admin</p>
                </div>
            </div>
        </header>
    )
}