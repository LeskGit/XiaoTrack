/**
 * Placeholder shown while a widget's data loads: grey blocks with a moving shine.
 */
export default function WidgetSkeleton() {
    return (
        <div className="widget-skeleton" role="status" aria-label="Loading">
            <span className="widget-skeleton-bar w-2/3" />
            <span className="widget-skeleton-bar w-1/3" />
        </div>
    );
}
