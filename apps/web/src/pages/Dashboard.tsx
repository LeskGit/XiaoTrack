import { Widget, type WidgetInstance } from "@/components/widgets";
import { useState } from "react";



export default function Dashboard() {

    const widgetTest: WidgetInstance = {type: "chart", data: {}, layout: {x: 100,y: 100,w: 100,h: 100}} 
    const [widgets, setWidget] = useState([]);

    return (
        <Widget instance={widgetTest} />
    )
}