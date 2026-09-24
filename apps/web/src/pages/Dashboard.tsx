import type { WidgetInstance } from "@/components/widgets/catalog"
import WidgetGrid from "@/components/widgets/WidgetGrid"
import { useEffect, useState } from "react"

export default function Dashboard() {

    const [widgets, setWidgets] = useState<WidgetInstance[]>([
        {id: 1, type: "nutrition.dailyKcal", size: {width:1, height:1}, position: {x:0, y:0} },
        {id: 2, type: "nutrition.dailyKcal", size: {width:1, height:1}, position: {x:0, y:0} },
        {id: 3, type: "nutrition.dailyKcal", size: {width:1, height:1}, position: {x:0, y:0} },
        {id: 4, type: "nutrition.dailyKcal", size: {width:1, height:1}, position: {x:0, y:0} },
        {id: 5, type: "nutrition.dailyKcal", size: {width:1, height:1}, position: {x:0, y:0} },
        {id: 6, type: "nutrition.dailyKcal", size: {width:1, height:1}, position: {x:0, y:0} },
        {id: 7, type: "nutrition.dailyKcal", size: {width:1, height:1}, position: {x:0, y:0} },
        {id: 8, type: "nutrition.dailyKcal", size: {width:1, height:1}, position: {x:0, y:0} },
    ]);


    return (
        <WidgetGrid widgets={widgets} />
    )
}