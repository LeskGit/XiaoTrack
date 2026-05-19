import CategorySidebar from "./CategorySidebar"
import { TrendingUpDownIcon, HamIcon, DumbellIcon, BookCheckIcon, CalendarCheckIcon, NoteBookPenIcon } from "@/components/icons/library"

export default function MainSidebar() {

    return (
        <div className="flex flex-col shadow-sm">
            <CategorySidebar title='Overview' icon={TrendingUpDownIcon} className="mt-4"/>
            <CategorySidebar title='Nutrition' icon={HamIcon}/>
            <CategorySidebar title='Workouts' icon={DumbellIcon}/>
            <CategorySidebar title='Habits' icon={BookCheckIcon}/>
            <CategorySidebar title='Planning' icon={CalendarCheckIcon}/>
            <CategorySidebar title='Notes' icon={NoteBookPenIcon} className="md-4"/>
        </div>
    )
}