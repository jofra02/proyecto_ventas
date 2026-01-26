import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { WIDGETS, INITIAL_LAYOUT } from '../registry';
import { SortableWidget } from './SortableWidget';
import ErrorBoundary from '../../../components/common/ErrorBoundary';
import { Save, RotateCcw } from 'lucide-react';

const DashboardGrid = ({ dashboardData }) => {
    // We only need the ID to track order in dnd-kit list
    const [items, setItems] = useState(() => {
        return INITIAL_LAYOUT.map(l => l.i);
    });
    const [isEditable, setIsEditable] = useState(false);
    const [activeId, setActiveId] = useState(null);

    console.log("DashboardGrid Rendering. Items:", items);

    // Initial load
    useEffect(() => {
        const saved = localStorage.getItem('dashboard_items');
        if (saved) {
            try { return setItems(JSON.parse(saved)); } catch (e) { }
        }
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setItems((items) => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
        setActiveId(null);
    };

    const saveLayout = () => {
        localStorage.setItem('dashboard_items', JSON.stringify(items));
        setIsEditable(false);
    };

    const resetLayout = () => {
        if (confirm("Reset layout?")) {
            setItems(INITIAL_LAYOUT.map(l => l.i));
            localStorage.removeItem('dashboard_items');
        }
    };

    const removeWidget = (id) => {
        setItems(items => items.filter(i => i !== id));
    };

    const addWidget = (key) => {
        const newId = `${key}_${Date.now()}`;
        setItems(items => [...items, newId]);
    };

    // Helper to resolve widget config
    const getWidgetConfig = (id) => {
        if (!id) return null;
        // Logic to strip suffix like _123456
        let baseKey = id;
        // Try exact match first
        if (WIDGETS[id]) return WIDGETS[id];

        // Try prefix match for duplicates
        for (const key of Object.keys(WIDGETS)) {
            if (id.startsWith(key) && id.length > key.length) {
                return WIDGETS[key];
            }
        }
        return null; // Widget not found in registry
    };

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-4 px-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsEditable(!isEditable)}
                        className={`text-sm px-3 py-1.5 rounded-md border font-medium transition-all ${isEditable ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-secondary border-border hover:border-gray-300'}`}
                    >
                        {isEditable ? 'Done Editing' : 'Customize Layout'}
                    </button>
                    {isEditable && (
                        <>
                            <button onClick={saveLayout} className="text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-border text-sidebar-muted hover:text-success hover:border-success">
                                <Save size={14} /> Save
                            </button>
                            <button onClick={resetLayout} className="text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-border text-sidebar-muted hover:text-danger hover:border-danger">
                                <RotateCcw size={14} /> Reset
                            </button>
                        </>
                    )}
                </div>

                {isEditable && (
                    <div className="flex gap-2">
                        <select
                            className="text-sm border border-border rounded-md px-2 py-1.5 bg-white outline-none focus:border-primary"
                            onChange={(e) => {
                                if (e.target.value) {
                                    addWidget(e.target.value);
                                    e.target.value = "";
                                }
                            }}
                        >
                            <option value="">+ Add Widget</option>
                            {Object.entries(WIDGETS).map(([key, config]) => (
                                <option key={key} value={key}>{config.label}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>



            <ErrorBoundary>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={items} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-10">
                            {items.map((id) => {
                                const config = getWidgetConfig(id);
                                if (!config) return null;

                                // Determine span based on config (simple mapping for now)
                                // We can make this dynamic later
                                // defaultW: 1 -> col-span-1
                                // defaultW: 2 -> col-span-2
                                // defaultW: 3 -> col-span-3
                                // defaultW: 4 -> col-span-4
                                let colSpan = "col-span-1";
                                if (config.defaultW === 2) colSpan = "lg:col-span-2";
                                if (config.defaultW === 3) colSpan = "lg:col-span-3";
                                if (config.defaultW === 4) colSpan = "lg:col-span-4";

                                return (
                                    <SortableWidget
                                        key={id}
                                        id={id}
                                        component={config.component}
                                        componentProps={dashboardData}
                                        label={config.label}
                                        onRemove={() => removeWidget(id)}
                                        isEditable={isEditable}
                                        className={`${colSpan} h-full`}
                                    />
                                );
                            })}
                        </div>
                    </SortableContext>
                </DndContext>
            </ErrorBoundary>
        </div>
    );
};

export default DashboardGrid;
