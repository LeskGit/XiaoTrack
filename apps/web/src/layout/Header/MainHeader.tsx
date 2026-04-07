import { IconButton } from "@/components/icons"
import { Avatar } from "@/components/avatar"
import DefaultAvatar from "@/assets/img/avatar/dog.png"
import type { MainheaderProps } from "../layout.types";
import { Icon } from "@/components/icons";

function eventClickTest() {
    console.log("zdz");
}

export default function MainHeader({categorieName, date} : MainheaderProps) {

    return (
        <header className="flex col-span-6 justify-between items-center p-3 shadow-md">
            <div className="flex items-center gap-5">
                <Icon classNameSvg='p-2' size="lg" className='bg-linear-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg m-2' xmlns="http://www.w3.org/2000/svg" strokeWidth={0.2} stroke='black' fill='white' d="M21.0001 6c0.0587 0 0.116 0.00593 0.1719 0.01562 0.0071 0.00124 0.0144 0.00154 0.0215 0.00293 0.0158 0.00311 0.0313 0.00787 0.0469 0.01172 0.0169 0.00418 0.034 0.00763 0.0507 0.0127 0.0491 0.01491 0.0961 0.0347 0.1416 0.05664 0.0415 0.01995 0.0821 0.04234 0.1211 0.06836 0.1116 0.0744 0.2074 0.17028 0.2813 0.28223 0.0451 0.06842 0.0799 0.1415 0.1064 0.21679 0.0048 0.01338 0.0105 0.02641 0.0147 0.04004 0.0062 0.02029 0.0107 0.04096 0.0156 0.06152 0.0176 0.07438 0.0283 0.15168 0.0283 0.23145v4c0 0.5523 -0.4477 1 -1 1s-1 -0.4477 -1 -1V9.41406L15.6212 13.793c-1.1715 1.1713 -3.0706 1.1713 -4.2422 0l-1.1718 -1.1719c-0.39052 -0.3903 -1.02362 -0.3903 -1.41411 0L3.95715 17.457c-0.39051 0.3905 -1.02353 0.3905 -1.41406 0 -0.39052 -0.3905 -0.39052 -1.0235 0 -1.414l4.83594 -4.836c1.17154 -1.1713 3.07067 -1.1713 4.24217 0l1.1719 1.1719c0.3905 0.3903 1.0236 0.3903 1.4141 0L18.5861 8h-1.586c-0.5523 0 -1 -0.44772 -1 -1s0.4477 -1 1 -1z" />
                <div className="flex justify-center items-center">
                    <h1  className='bg-linear-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent font-bold text-2xl'>XiaoTrack</h1>
                </div>
            </div>
            <div className="flex gap-5">
                <IconButton className="w-8 h-8" size="custom" onClick={eventClickTest} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                <div className="flex flex-col justify-center">
                    <h1 className="font-bold">{categorieName}</h1>
                    <h4 className="">{date.toLocaleDateString('fr-FR')}</h4>
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