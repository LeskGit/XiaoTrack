import "./MainHeader.css"
import { IconButton } from "@/components/icons"
import { Avatar } from "@/components/avatar"
import DefaultAvatar from "@/assets/img/avatar/dog.png"

type headerProps = {
    categorieName: string;
    date: Date;
}

function eventClickTest() {
    console.log("zdz");
}

export default function MainHeader({categorieName, date} : headerProps) {

    return (
        <header className="flex">
            <IconButton onClick={eventClickTest} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            <div className="flex flex-wrap align-middle justify-center">
                <h2 className="font-bold">{categorieName}</h2>
                <p className="">{date.getDate()}</p>
            </div>
            <div>
                <IconButton onClick={eventClickTest} d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </div>
            <div>
                <Avatar src={DefaultAvatar} />
            </div>
        </header>
    )
}