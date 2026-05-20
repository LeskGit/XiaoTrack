import CategorySidebar from "./CategorySidebar"
import { TrendingUpDownIcon, HamIcon, DumbellIcon, BookCheckIcon, CalendarCheckIcon, NoteBookPenIcon } from "@/components/icons/library"

export default function MainSidebar() {

    const categories = [
        {id: "dashboard", title: "Dashboard", icon: TrendingUpDownIcon, to: "/dashboard"},
        {id: "nutrition", title: "Nutrition", icon: HamIcon, to: "/nutrition"},
        {id: "workouts", title: "Workouts", icon: DumbellIcon, to: "/workouts"},
        {id: "planning", title: "Planning", icon: CalendarCheckIcon, to: "/planning"},
        {id: "habits", title: "Habits", icon: BookCheckIcon, to: "/habits"},
        {id: "notes", title: "Notes", icon: NoteBookPenIcon, to: "/notes"}
    ]

    return (
        <div className="flex flex-col shadow-sm pt-6 pb-2">
            <ul>
                {categories.map((category) => <li key={category.id}><CategorySidebar {...category} /></li>)}
            </ul>
        </div>
    )
}