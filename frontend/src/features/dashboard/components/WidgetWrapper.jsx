import React from 'react';
import { X, GripHorizontal } from 'lucide-react';

const WidgetWrapper = ({
    children,
    style,
    className,
    onRemove,
    isEditable,
    label,
    ...props
}) => {
    return (
        <div
            style={{ ...style }}
            className={`${className || ''} relative group flex flex-col h-full rounded-xl transition-all duration-200 ${isEditable ? 'border-2 border-dashed border-primary/50 bg-blue-50/10' : ''}`}
            {...props}
        >
            {isEditable && (
                <div className="absolute -top-3 -right-3 z-50 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={onRemove}
                        className="p-1.5 bg-red-100 text-red-600 rounded-full shadow-sm hover:bg-red-200 border border-red-200"
                    >
                        <X size={14} strokeWidth={3} />
                    </button>
                    {/* Drag Handle - accepts connection props from dnd-kit */}
                    <div
                        className="draggable-handle p-1.5 bg-white text-gray-500 rounded-full shadow-sm border border-gray-200 cursor-move"
                        {...(props.dragHandleProps || {})}
                    >
                        <GripHorizontal size={14} />
                    </div>
                </div>
            )}

            {/* Widget Content - ensuring full height */}
            <div className="h-full w-full overflow-hidden">
                {children}
            </div>

            {/* Invisible overlay while dragging to prevent iframes/charts from capturing mouse events */}
            {isEditable && <div className="absolute inset-0 z-40 bg-transparent" />}
        </div>
    );
};

export default WidgetWrapper;
