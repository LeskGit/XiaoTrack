import Modal from "./Modal";
import { ModalPlacement, ModalSize } from "./modal.types";

type ConfirmDialogProps = {
    readonly isOpen: boolean;
    readonly title: string;
    readonly message: string;
    readonly confirmLabel?: string;
    readonly declineLabel?: string;
    readonly isDestructive?: boolean;
    readonly onConfirm: () => void;
    readonly onDecline: () => void;
};

// Shared buttons (index.css, charter §4). A dialog sits over a screen that already has its primary
// action, so the confirm button is the flat accent, not the gradient.
const declineButton = "btn btn-secondary";
const confirmButton = "btn btn-accent";
const destructiveButton = "btn btn-danger";

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = "Confirm",
    declineLabel = "Cancel",
    isDestructive = false,
    onConfirm,
    onDecline,
}: ConfirmDialogProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onDecline}
            title={title}
            placement={ModalPlacement.Center}
            size={ModalSize.Small}
            closeModalButton={false}
            closeOnBackdropClick={false}
        >
            <p className="text-body text-ink-soft">{message}</p>

            <div className="mt-6 flex justify-end gap-2">
                <button type="button" className={declineButton} onClick={onDecline}>
                    {declineLabel}
                </button>
                <button
                    type="button"
                    className={isDestructive ? destructiveButton : confirmButton}
                    onClick={onConfirm}
                >
                    {confirmLabel}
                </button>
            </div>
        </Modal>
    );
}