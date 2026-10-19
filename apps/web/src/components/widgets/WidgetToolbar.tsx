import {EditPenIcon} from '@/components/icons/library'
import { Icon } from '../icons';

type WidgetToolbarProps = {
    readonly isEditing: boolean;
    readonly isDirty: boolean;
    readonly onEdit: () => void;
    readonly onCancel: () => void;
    readonly onSave: () => void;
    readonly onAdd: () => void;
};

const buttonBase = "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors";
const secondaryButton = `${buttonBase} bg-white border border-gray-300 text-gray-700 hover:bg-gray-50`;
const primaryButton = `${buttonBase} bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed`;

export default function WidgetToolbar({ isEditing, isDirty, onEdit, onCancel, onSave, onAdd }: WidgetToolbarProps) {
    return (
        <div className="widget-toolbar" role="toolbar" aria-label="Dashboard actions">
            {isEditing ? (
                <>
                    <button type="button" className={secondaryButton} onClick={onAdd}>Add widget</button>
                    <button type="button" className={secondaryButton} onClick={onCancel}>Cancel</button>
                    <button type="button" className={primaryButton} onClick={onSave} disabled={!isDirty}>Save</button>
                </>
            ) : (
                <div className="flex">
                    <button type="button" className={`${secondaryButton} inline-flex items-center gap-1.5`} onClick={onEdit}>
                        <Icon icon={EditPenIcon} size="sm" />
                        Edit widgets
                    </button>
                </div>
            )}
        </div>
    );
}