import React, { useState } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';

interface LayoutItem {
  id: string;
  type: string;
  content: string;
}

interface DesignerProps {
  initialSchema?: LayoutItem[];
  onSave: (schema: LayoutItem[], html: string) => void;
}

const palette: Omit<LayoutItem, 'id'>[] = [
  { type: 'text', content: '<p>Text</p>' },
  { type: 'score', content: '<div>Score: ____</div>' },
  { type: 'section', content: '<h3>Section Title</h3>' }
];

function SortableItem({ id, content }: { id: string; content: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-2 mb-2 border rounded bg-white cursor-move"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

export function BallotTemplateDesigner({ initialSchema = [], onSave }: DesignerProps) {
  const [layout, setLayout] = useState<LayoutItem[]>(initialSchema);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = layout.findIndex(item => item.id === active.id.toString());
    const newIndex = layout.findIndex(item => item.id === over.id.toString());
    setLayout(arrayMove(layout, oldIndex, newIndex));
  };

  const renderHtml = (items: LayoutItem[]) => items.map(i => i.content).join('');

  return (
    <div className="flex gap-4">
      <div className="w-1/4 border p-2 rounded bg-gray-50">
        <p className="font-semibold mb-2">Components</p>
        {palette.map(p => (
          <div
            key={p.type}
            className="p-2 mb-2 border rounded bg-white cursor-grab"
            {...{
              draggable: true,
              onDragStart: e => {
                e.dataTransfer.setData('application/json', JSON.stringify({ id: p.type }));
              }
            }}
          >
            {p.type}
          </div>
        ))}
      </div>
      <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
        <div
          id="canvas"
          className="flex-1 min-h-[400px] border p-2 rounded"
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            const data = e.dataTransfer.getData('application/json');
            if (data) {
              const { id } = JSON.parse(data);
              const template = palette.find(p => p.type === id);
              if (template) {
                setLayout([...layout, { id: `${id}-${Date.now()}`, ...template }]);
              }
            }
          }}
        >
          <SortableContext items={layout.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {layout.map(item => (
              <SortableItem key={item.id} id={item.id} content={item.content} />
            ))}
          </SortableContext>
        </div>
      </DndContext>
      <div className="w-1/4 flex flex-col gap-2">
        <Button onClick={() => onSave(layout, renderHtml(layout))}>Save Layout</Button>
        <Button variant="outline" onClick={() => setLayout([])}>Clear</Button>
      </div>
    </div>
  );
}

export default BallotTemplateDesigner;
