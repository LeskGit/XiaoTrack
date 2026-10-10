type DashboardToolbarProps = {
    readonly isEditing: boolean;
    readonly isDirty: boolean;
    readonly onEdit: () => void;
    readonly onCancel: () => void;
    readonly onSave: () => void;
    readonly onAdd: () => void;
};

const buttonBase = "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors";
const secondary = `${buttonBase} bg-white border border-gray-300 text-gray-700 hover:bg-gray-50`;
const primary = `${buttonBase} bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed`;

export default function DashboardToolbar({ isEditing, isDirty, onEdit, onCancel, onSave, onAdd }: DashboardToolbarProps) {
    return (
        <div className="widget-toolbar justify-end gap-2 mb-3">
            {isEditing ? (
                <>
                    <button type="button" className={secondary} onClick={onAdd}>Add widget</button>
                    <button type="button" className={secondary} onClick={onCancel}>Cancel</button>
                    <button type="button" className={primary} onClick={onSave} disabled={!isDirty}>Save</button>
                </>
            ) : (
                <button type="button" className={secondary} onClick={onEdit}>Edit</button>
            )}
        </div>
    );
}