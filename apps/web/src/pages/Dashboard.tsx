import type { WidgetInstance } from "@/components/widgets/widgets.types"
import WidgetGrid from "@/components/widgets/WidgetGrid"
import { useState } from "react";
import type { WidgetType } from "@/components/widgets/catalog";
import { createInstance } from "@/components/widgets/engine/instance";
import WidgetToolbar from "@/components/widgets/WidgetToolbar";
import Modal from '@/components/modals/Modal';
import { ModalPlacement, ModalSize } from "@/components/modals/modal.types";
import WidgetPalette from "@/components/widgets/palette/WidgetPalette";

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


    return (
        <div className="">
            <WidgetGrid 
                widgets={isEditing ? draftWidgets : savedWidgets}
                onRemoveWidget={onRemoveWidget}
                isEditing={isEditing} 
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
        </div>
    )
}