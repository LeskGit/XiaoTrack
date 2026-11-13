import type { WidgetInstance } from "@/components/widgets/widgets.types"
import WidgetGrid from "@/components/widgets/WidgetGrid"
import { useEffect, useState } from "react";
import type { WidgetType } from "@/components/widgets/catalog";
import { createInstance } from "@/components/widgets/engine/instance";
import WidgetToolbar from "@/components/widgets/WidgetToolbar";
import WidgetEditBar from "@/components/widgets/WidgetEditBar";
import Modal from '@/components/modals/Modal';
import { ModalPlacement, ModalSize } from "@/components/modals/modal.types";
import WidgetPalette from "@/components/widgets/palette/WidgetPalette";
import { Icon } from "@/components/icons";
import { PlusIcon } from "@/components/icons/library";
import { useBlocker } from "react-router";
import ConfirmDialog from "@/components/modals/ConfirmDialog";
import { localLayoutStorage } from "@/components/widgets/storage/localLayoutStorage";
import { compactLayout } from "@/components/widgets/engine/compact";


type EmptyDashboardProps = {
    readonly onStart: () => void;
};

function EmptyDashboard({ onStart }: EmptyDashboardProps) {
    return (
        <section
            aria-labelledby="empty-dashboard-title"
            className="empty-dashboard flex min-h-[440px] flex-col items-center justify-center gap-4 rounded-lg border-[1.5px] border-dashed border-line-strong bg-surface px-6 py-16 text-center"
        >
            <div aria-hidden="true" className="empty-dashboard-art mb-2 grid w-33 grid-cols-3 auto-rows-[28px] gap-1.5">
                <div className="col-span-2 rounded-sm border border-line bg-surface" />
                <div className="rounded-sm border border-line bg-surface" />
                <div className="col-span-3 flex items-center justify-center rounded-sm border-[1.5px] border-dashed border-accent-line bg-accent-soft text-accent-strong">
                    <Icon icon={PlusIcon} size="sm" />
                </div>
            </div>

            <h2 id="empty-dashboard-title" className="text-heading font-semibold text-ink">
                Your dashboard is empty
            </h2>
            <p className="max-w-sm text-body text-ink-soft">
                Add widgets from the palette to start building your dashboard. You can remove them at any time.
            </p>

            <button
                type="button"
                onClick={onStart}
                className="empty-dashboard-cta btn btn-primary btn-lg mt-2"
            >
                <Icon icon={PlusIcon} size="sm" />
                Add your first widget
            </button>
        </section>
    );
}

export default function Dashboard() {

    const [savedWidgets, setSavedWidgets] = useState<WidgetInstance[]>([]);
    const [draftWidgets, setDraftWidgets] = useState<WidgetInstance[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const isDirty: boolean = savedWidgets !== draftWidgets;

    const blocker = useBlocker(isEditing && isDirty);

    useEffect(() => {
        localLayoutStorage.load().then((loaded) => {
            setSavedWidgets(loaded);
            setIsLoading(false);                                   
        });
    }, []);


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

    const onSave = async () => {
        try {
            await localLayoutStorage.save(draftWidgets);
        } catch (error) {
            console.error("[layout] save failed", error);
            return;
        }

        setSavedWidgets(draftWidgets);
        setIsEditing(false);
        setIsPaletteOpen(false);
    }

    const onAddWidget = (type: WidgetType) => {
        setDraftWidgets((prev) => {
            if (prev.some((w) => w.type === type)) return prev;
            const compactedLayout: WidgetInstance[] = compactLayout([...prev, createInstance(type, prev)]);
            return compactedLayout;
        })
    }

    const onRemoveWidget = (id: string) => {
        setDraftWidgets((prev) => {
            return compactLayout(prev.filter((w) => w.id !== id));
        })
    }

    const onDropWidget = (layout: WidgetInstance[]) => {
        setDraftWidgets(layout);
    }
    
    const onStart = () => {
        onEdit();
        onAdd();
    }

    const isEmpty: boolean = !isEditing && savedWidgets.length === 0;

    if (isLoading) {
        return <div className="h-full w-full" aria-busy="true" />;
    }

    return (

        <div className="min-h-full w-full">
            <WidgetGrid
                widgets={isEditing ? draftWidgets : savedWidgets}
                onRemoveWidget={onRemoveWidget}
                onDropWidget={onDropWidget}
                isEditing={isEditing}
                emptyState={isEmpty ? <EmptyDashboard onStart={onStart} /> : undefined}
                toolbar={<WidgetToolbar isEditing={isEditing} onEdit={onEdit} />}
                footer={isEditing && <WidgetEditBar
                    isDirty={isDirty}
                    onAdd={onAdd}
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