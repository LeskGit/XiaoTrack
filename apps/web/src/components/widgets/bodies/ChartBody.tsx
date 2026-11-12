import { useId, type CSSProperties } from "react";
import type { BodyProps, WidgetArchetype } from "../widgets.types";

type ChartBodyProps = BodyProps<typeof WidgetArchetype.ArchetypeChart>;

type Point = { readonly x: number; readonly y: number };

// Small vertical margin (in %) so the line never touches the top or bottom edge
const PADDING_Y = 8;

/**
 * Points → coordinates in a 100×100 box (x left to right, y top to bottom).
 * The lowest value sits at the bottom, the highest at the top. A flat series is drawn in the middle.
 */
function toCoordinates(values: readonly number[]): Point[] {
    const min: number = Math.min(...values);
    const max: number = Math.max(...values);
    const range: number = max - min;
    const lastIndex: number = Math.max(values.length - 1, 1);

    return values.map((value, i) => ({
        x: (i / lastIndex) * 100,
        y: range === 0 ? 50 : PADDING_Y + (1 - (value - min) / range) * (100 - 2 * PADDING_Y),
    }));
}

/**
 * Simple line chart drawn in SVG, without a library.
 * The data contract is only { points }: no axes and no labels yet.
 */
export default function ChartBody({ data }: ChartBodyProps) {
    const gradientId: string = useId();

    if (data.points.length === 0) {
        return <p className="chart-body-empty">No data yet</p>;
    }

    const coords: Point[] = toCoordinates(data.points);
    const line: string = coords.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    // The same line, closed along the bottom edge: the filled area under the curve
    const area: string = `${line} L 100 100 L 0 100 Z`;
    const last: Point = coords[coords.length - 1];
    const lastValue: number = data.points[data.points.length - 1];

    return (
        <div className="chart-body">
            <p className="chart-body-latest">
                {new Intl.NumberFormat("en").format(lastValue)}
                <span className="chart-body-latest-label">latest</span>
            </p>
            <div className="chart-body-plot">
                {/* preserveAspectRatio="none": the chart stretches to any widget size */}
                <svg className="chart-body-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path d={area} fill={`url(#${gradientId})`} />
                    {/* non-scaling-stroke: the line keeps its thickness when the SVG is stretched */}
                    <path d={line} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
                {/* In HTML, not in the SVG: a circle would be stretched into an ellipse */}
                <span
                    className="chart-body-dot"
                    style={{ "--dot-x": `${last.x}%`, "--dot-y": `${last.y}%` } as CSSProperties}
                />
            </div>
        </div>
    );
}
