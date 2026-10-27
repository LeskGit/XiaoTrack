import type { WidgetInstance } from "@/components/widgets/widgets.types"
import WidgetGrid from "@/components/widgets/WidgetGrid"
import { useState } from "react";
import type { WidgetType } from "@/components/widgets/catalog";
import { createInstance } from "@/components/widgets/engine/instance";
import WidgetToolbar from "@/components/widgets/WidgetToolbar";
import Modal from '@/components/modals/Modal';
import { ModalPlacement, ModalSize } from "@/components/modals/modal.types";
import WidgetPalette from "@/components/widgets/palette/WidgetPalette";
import { Icon } from "@/components/icons";
import { PlusIcon } from "@/components/icons/library";
import { useBlocker } from "react-router";
import ConfirmDialog from "@/components/modals/ConfirmDialog";


type EmptyDashboardProps = {
    readonly onStart: () => void;
};

function EmptyDashboard({ onStart }: EmptyDashboardProps) {
    return (
        <section
            aria-labelledby="empty-dashboard-title"
            className="flex min-h-[440px] flex-col items-center justify-center gap-4 rounded-xl border-[1.5px] border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center"
        >
            <div aria-hidden="true" className="mb-2 grid w-33 grid-cols-3 auto-rows-[28px] gap-1.5">
                <div className="col-span-2 rounded-md border border-gray-200 bg-white" />
                <div className="rounded-md border border-gray-200 bg-white" />
                <div className="col-span-3 flex items-center justify-center rounded-md border-[1.5px] border-dashed border-sky-300 bg-sky-50 text-sky-700">
                    <Icon icon={PlusIcon} size="sm" />
                </div>
            </div>

            <h2 id="empty-dashboard-title" className="text-xl font-semibold text-gray-900">
                Your dashboard is empty
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-gray-600">
                Add widgets from the palette to start building your dashboard. You can remove them at any time.
            </p>

            <button
                type="button"
                onClick={onStart}
                className="empty-dashboard-cta mt-2 min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4.5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
                <Icon icon={PlusIcon} size="sm" />
                Add your first widget
            </button>
        </section>
    );
}

const fixtureTypes: WidgetType[] = [
    "chartExemple",
];

const fixture: WidgetInstance[] = fixtureTypes.reduce<WidgetInstance[]>(
    (acc, type) => [...acc, createInstance(type, acc)],
    [],
);

export default function Dashboard() {

    const [savedWidgets, setSavedWidgets] = useState(fixture);
    const [draftWidgets, setDraftWidgets] = useState(fixture);
    const [isEditing, setIsEditing] = useState(false);
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);

    const isDirty: boolean = savedWidgets !== draftWidgets;

    const blocker = useBlocker(isEditing && isDirty);

    const onAdd = () => {
        setIsPaletteOpen(true);
    }

    const onEdit = () => {
        setDraftWidgets(savedWidgets);
        setIsEditing(true);
    }

    const onCancel = () => {
        setDraftWidgets(savedWidgets);
        setIsEditing(false);
        setIsPaletteOpen(false);
    }

    const onSave = () => {
        setSavedWidgets(draftWidgets);
        setIsEditing(false);
        setIsPaletteOpen(false);
    }

    const onAddWidget = (type: WidgetType) => {
        setDraftWidgets((prev) => {
            if (prev.some((w) => w.type === type)) return prev;
            return [...prev, createInstance(type, prev)];
        })
    }

    const onRemoveWidget = (id: string) => {
        setDraftWidgets((prev) => prev.filter((w) => w.id !== id)); 
    }

    const onStart = () => {
        onEdit();
        onAdd();
    };

    const isEmpty: boolean = !isEditing && savedWidgets.length === 0;

    return (
        <div className="h-full w-full">
            <WidgetGrid
                widgets={isEditing ? draftWidgets : savedWidgets}
                onRemoveWidget={onRemoveWidget}
                isEditing={isEditing}
                emptyState={isEmpty ? <EmptyDashboard onStart={onStart} /> : undefined}
                toolbar={<WidgetToolbar
                    isEditing={isEditing}
                    isDirty={isDirty}
                    onAdd={onAdd}
                    onEdit={onEdit}
                    onCancel={onCancel}
                    onSave={onSave}
                />}
            />
            <Modal
                isOpen={isPaletteOpen} 
                onClose={() => setIsPaletteOpen(false)} 
                title="Widgets Palette" 
                placement={ModalPlacement.Right} 
                size={ModalSize.Large} 
                closeOnBackdropClick={true}>
                <WidgetPalette placedTypes={draftWidgets.map((w) => w.type)} onAdd={onAddWidget} />
            </Modal>
            <ConfirmDialog
                isOpen={blocker.state === "blocked"}
                title="Unsaved changes"
                message="Your changes to the dashboard will be lost if you leave this page."
                confirmLabel="Discard and leave"
                declineLabel="Stay"
                isDestructive
                onConfirm={() => blocker.proceed?.()}
                onDecline={() => blocker.reset?.()}
            />
        </div>
    )
}