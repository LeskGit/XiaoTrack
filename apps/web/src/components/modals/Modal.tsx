import { IconButton } from "../icons";
import { PlusIcon } from "../icons/library";
import { placementClasses, sizeClasses, type ModalProps } from "./modal.types";
import { useEffect, useRef, type MouseEvent } from "react";


export default function Modal({isOpen, onClose, title, children, placement = "center", size = "md", classname, closeOnBackdropClick = true}: ModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const pressedOnBackdrop = useRef(false);
    
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (isOpen && !dialog.open) dialog.showModal();
        if (!isOpen && dialog.open) dialog.close();
    }, [isOpen])

    const dialogClasses = [
        "shadow-xl backdrop:bg-black/30",   
        placementClasses[placement],           
        sizeClasses[size],                      
        classname,                              
    ].join(" ");

    const handleMouseDown = (e: MouseEvent<HTMLDialogElement>) => {
        pressedOnBackdrop.current = e.target === e.currentTarget;
    }

    const handleClick = (e: MouseEvent<HTMLDialogElement>) => {
        if (!closeOnBackdropClick) return;
        if (pressedOnBackdrop.current && e.target === e.currentTarget) onClose();
    }

    return (
        <dialog 
            ref={dialogRef} 
            onClose={onClose} 
            className={dialogClasses}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
        >
        <div className="flex h-full flex-col p-6">
            <header className="mb-4 flex items-center justify-between gap-4">
                <h2 id="modal-title" className="text-lg font-semibold">{title}</h2>
                <IconButton
                    icon={PlusIcon}
                    size="sm"
                    onClick={onClose}
                    ariaLabel="Close"
                    className="rotate-45"
                    classNameBtn="h-8 w-8 shrink-0 rounded-lg text-gray-500 hover:bg-gray-100"
                />
            </header>
            {children}
        </div>
        </dialog>
    )
}