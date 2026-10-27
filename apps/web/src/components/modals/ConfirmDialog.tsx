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

const buttonBase = "min-h-10 rounded-lg px-4 py-2 text-sm font-medium transition-colors";
const declineButton = `${buttonBase} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`;
const confirmButton = `${buttonBase} bg-blue-600 text-white hover:bg-blue-700`;
const destructiveButton = `${buttonBase} bg-red-600 text-white hover:bg-red-700`;

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
            <p className="text-sm leading-relaxed text-gray-600">{message}</p>

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