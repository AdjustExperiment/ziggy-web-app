import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Field {
  id: string;
  label: string;
  type: string;
}

interface DesignerValue {
  schema: { fields: Field[] };
  html: string;
  layout: { fields: Field[] };
}

interface BallotTemplateDesignerProps {
  value: DesignerValue;
  onChange: (value: DesignerValue) => void;
}

export function BallotTemplateDesigner({ value, onChange }: BallotTemplateDesignerProps) {
  const [fields, setFields] = useState<Field[]>(value.schema?.fields || []);
  const [newField, setNewField] = useState({ label: '', type: 'text' });
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    setFields(value.schema?.fields || []);
  }, [value.schema]);

  useEffect(() => {
    const schema = { fields };
    const layout = { fields };
    const html = generateHtml(fields);
    onChange({ schema, layout, html });
  }, [fields, onChange]);

  const addField = () => {
    if (!newField.label.trim()) return;
    setFields([...fields, { id: crypto.randomUUID(), label: newField.label.trim(), type: newField.type }]);
    setNewField({ label: '', type: 'text' });
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const onDragStart = (index: number) => () => setDragIndex(index);
  const onDragOver = (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const newFields = [...fields];
    const [moved] = newFields.splice(dragIndex, 1);
    newFields.splice(index, 0, moved);
    setDragIndex(index);
    setFields(newFields);
  };
  const onDragEnd = () => setDragIndex(null);

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <h4 className="font-medium">Fields</h4>
        <div className="space-y-2">
          {fields.map((field, idx) => (
            <div
              key={field.id}
              draggable
              onDragStart={onDragStart(idx)}
              onDragOver={onDragOver(idx)}
              onDragEnd={onDragEnd}
              className="border p-2 rounded flex items-center justify-between bg-background"
            >
              <span className="text-sm">{field.label} ({field.type})</span>
              <Button size="sm" variant="ghost" onClick={() => removeField(field.id)}>Remove</Button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-2 items-end">
          <div className="col-span-3">
            <Label htmlFor="field-label">Label</Label>
            <Input id="field-label" value={newField.label} onChange={e => setNewField({ ...newField, label: e.target.value })} />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={newField.type} onValueChange={t => setNewField({ ...newField, type: t })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="textarea">Textarea</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addField} className="">Add</Button>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Preview</h4>
        <form className="space-y-4">
          {fields.map(field => (
            <div key={field.id} className="space-y-1">
              <Label>{field.label}</Label>
              {field.type === 'textarea' ? (
                <textarea className="w-full border rounded p-2" />
              ) : (
                <input type={field.type} className="w-full border rounded p-2" />
              )}
            </div>
          ))}
        </form>
      </div>
    </div>
  );
}

function generateHtml(fields: Field[]): string {
  const inputs = fields
    .map(f => {
      if (f.type === 'textarea') {
        return `<label>${f.label}</label><textarea></textarea>`;
      }
      return `<label>${f.label}</label><input type="${f.type}" />`;
    })
    .join('');
  return `<form>${inputs}</form>`;
}

export default BallotTemplateDesigner;
