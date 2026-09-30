import type { WidgetInstance } from "@/components/widgets/widgets.types"
import WidgetGrid from "@/components/widgets/WidgetGrid"

export default function Dashboard() {

    const widgets: WidgetInstance[] = ([
        {id: "1", type: "nutrition.dailyKcal", size: {width:2, height:1}, position: {x:0, y:0} },
        {id: "2", type: "nutrition.dailyKcal", size: {width:2, height:1}, position: {x:0, y:5} },
        {id: "3", type: "nutrition.dailyKcal", size: {width:2, height:1}, position: {x:6, y:8} },
        {id: "4", type: "nutrition.dailyKcal", size: {width:2, height:1}, position: {x:8, y:1} },
        {id: "5", type: "nutrition.dailyKcal", size: {width:2, height:1}, position: {x:2, y:0} },
        {id: "6", type: "nutrition.dailyKcal", size: {width:2, height:1}, position: {x:6, y:0} },
        {id: "7", type: "nutrition.dailyKcal", size: {width:2, height:1}, position: {x:4, y:2} },
        
    ]);


    return (
        <WidgetGrid widgets={widgets} />
    )
}