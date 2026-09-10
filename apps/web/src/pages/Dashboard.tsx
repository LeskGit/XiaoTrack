import type { WidgetInstance } from "@/components/widgets/catalog"
import WidgetGrid from "@/components/widgets/WidgetGrid"
import { useEffect, useState } from "react"

export default function Dashboard() {

    const [widgets, setWidgets] = useState<WidgetInstance[]>([
        {id: 1, type: "nutrition.dailyKcal", position: 0 },
        {id: 1, type: "nutrition.dailyKcal", position: 0 },
        {id: 1, type: "nutrition.dailyKcal", position: 0 },
        {id: 1, type: "nutrition.dailyKcal", position: 0 },
        {id: 1, type: "nutrition.dailyKcal", position: 0 },
        {id: 1, type: "nutrition.dailyKcal", position: 0 },
        {id: 1, type: "nutrition.dailyKcal", position: 0 },
    ]);


    return (
        <WidgetGrid widgets={widgets} />
    )
}