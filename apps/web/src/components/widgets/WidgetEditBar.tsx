import { Icon } from '../icons';
import { PlusIcon } from '../icons/library';

type WidgetEditBarProps = {
    readonly isDirty: boolean;
    readonly onAdd: () => void;
    readonly onCancel: () => void;
    readonly onSave: () => void;
};

/**
 * Floating bar pinned to the bottom of the screen while the dashboard is in edit mode.
 * It stays in the content column (position: sticky), not over the sidebar.
 */
export default function WidgetEditBar({ isDirty, onAdd, onCancel, onSave }: WidgetEditBarProps) {
    return (
        <div className="widget-edit-bar" role="toolbar" aria-label="Edit mode">
            <p className="widget-edit-bar-status" aria-live="polite">
                <span className={`widget-edit-bar-dot ${isDirty ? "is-dirty" : ""}`} aria-hidden="true" />
                {isDirty ? "Unsaved changes" : "Editing layout"}
            </p>

            <span className="widget-edit-bar-separator" aria-hidden="true" />

            <button type="button" className="btn btn-ghost" onClick={onAdd}>
                <Icon icon={PlusIcon} size="custom" className="h-4 w-4" iconWeight="bold" />
                Add widget
            </button>
            <button type="button" className="btn btn-ghost" onClick={onCancel}>
                Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={onSave} disabled={!isDirty}>
                Save
            </button>
        </div>
    );
}
