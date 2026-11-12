import { Icon } from "@/components/icons";
import { AlertIcon } from "@/components/icons/library";

type WidgetErrorProps = {
    readonly message: string;
};

export default function WidgetError({ message }: WidgetErrorProps) {
    return (
        <div className="widget-error" role="alert">
            <Icon icon={AlertIcon} size="custom" className="h-5 w-5 shrink-0" />
            <p className="widget-error-message">{message}</p>
        </div>
    );
}
