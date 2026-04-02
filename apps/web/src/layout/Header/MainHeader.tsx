import './MainHeader.css'
import IconButton from '@/components/icons/IconButton'

type headerProps = {
    categorieName: string;
    date: Date;
}

function eventClickTest() {
    console.log("zdz");
}

export default function MainHeader({categorieName, date} : headerProps) {

    return (
        <header className='flex'>
            <IconButton onClick={eventClickTest} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            <div className='flex flex-wrap align-middle justify-center'>
                <h2 className='font-bold'>{categorieName}</h2>
                <p className=''>{date.getDate()}</p>
            </div>
            <div>
                <IconButton onClick={eventClickTest} d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </div>
            <div>
                <IconButton onClick={eventClickTest} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </div>
            <div>

            </div>
        </header>
    )
}