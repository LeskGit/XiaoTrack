import { EditPenIcon } from '@/components/icons/library'
import { Icon } from '../icons';

type WidgetToolbarProps = {
    readonly isEditing: boolean;
    readonly onEdit: () => void;
};

/**
 * Top of the dashboard. Outside edit mode: the "Edit widgets" button.
 * In edit mode the actions move to the floating WidgetEditBar, and a hint takes their place.
 */
export default function WidgetToolbar({ isEditing, onEdit }: WidgetToolbarProps) {
    return (
        <div className="widget-toolbar" role="toolbar" aria-label="Dashboard actions">
            {isEditing ? (
                <p key="hint" className="widget-toolbar-hint">
                    Drag a widget by its title bar to move it. The others make room.
                </p>
            ) : (
                <button key="edit" type="button" className="btn btn-secondary" onClick={onEdit}>
                    <Icon icon={EditPenIcon} size="custom" className="h-4 w-4" />
                    Edit widgets
                </button>
            )}
        </div>
    );
}
