import HMenuIcon from '../../assets/img/icons/menu.png'
import UserIcon from '../../assets/img/icons/utilisateur.png'
import NotificationIcon from '../../assets/img/icons/notification.png'

type headerProps = {
    categorieName: string;
    date: Date;
}

export default function Header({categorieName, date} : headerProps) {
    return (
        <header className='flex flex-nowrap align-middle justify-center'>
            <img src={HMenuIcon} className="fill-black-50"></img>
            <div className='flex flex-wrap align-middle justify-center'>
                <h2 className='font-bold'>{categorieName}</h2>
                <p className=''>{date.getDate()}</p>
            </div>
            <div>
                <img src={NotificationIcon} className="fill-black-50"></img>
            </div>
            <div>
                <img src={UserIcon} className="fill-blue-50"></img>
            </div>
            <div>

            </div>
        </header>
    )
}