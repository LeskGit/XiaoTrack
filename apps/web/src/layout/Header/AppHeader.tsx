import { Icon } from "@/components/icons"
import RisingArrow from '@/assets/icons/rising-arrow.svg?react'

export default function AppHeader() {
    return (
        <div className="flex items-center gap-5 shadow-sm p-3">
            <Icon icon={RisingArrow} size="lg" className='bg-linear-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg text-white [&>svg]:drop-shadow-[1px_1px_0_black] p-1' />
            <div className="flex justify-center items-center">
                <h2  className='bg-linear-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent font-bold text-2xl'>XiaoTrack</h2>
            </div>
        </div>
    )
}