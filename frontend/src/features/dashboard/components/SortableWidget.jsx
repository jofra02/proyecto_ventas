import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import WidgetWrapper from './WidgetWrapper';

export const SortableWidget = ({ id, component: Component, componentProps, label, onRemove, isEditable, className }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={className}>
            <WidgetWrapper
                onRemove={onRemove}
                isEditable={isEditable}
                label={label}
                className="h-full bg-white shadow-sm border border-border rounded-xl"
                // Pass drag handle props to the wrapper
                dragHandleProps={{ ...attributes, ...listeners }}
            >
                <Component {...(componentProps || {})} />
            </WidgetWrapper>
        </div>
    );
};
