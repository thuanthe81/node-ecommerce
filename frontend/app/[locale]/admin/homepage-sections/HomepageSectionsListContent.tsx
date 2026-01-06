'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getContents, deleteContent, updateContent, Content } from '@/lib/content-api';
import { SvgDragHandle } from '@/components/Svgs';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable row component
function SortableRow({
  section,
  onDelete,
  getLayoutLabel,
}: {
  section: Content;
  onDelete: (id: string, title: string) => void;
  getLayoutLabel: (layout?: string) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-gray-50 ${isDragging ? 'bg-blue-50' : ''}`}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            aria-label="Drag to reorder"
          >
            <SvgDragHandle
              className="w-5 h-5"
              aria-hidden="true"
            />
          </button>
          <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-gray-100 text-gray-800">
            {section.displayOrder}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">
          {section.titleEn}
        </div>
        <div className="text-sm text-gray-500">{section.titleVi}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
          {getLayoutLabel(section.layout)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            section.isPublished
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {section.isPublished ? 'Published' : 'Draft'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {(() => {
          const date = section.updatedAt ? new Date(section.updatedAt) : null;
          return date && !isNaN(date.getTime())
            ? date.toLocaleDateString()
            : 'Invalid date';
        })()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <Link
          href={`/admin/homepage-sections/${section.id}/edit`}
          className="text-blue-600 hover:text-blue-900 mr-4"
        >
          Edit
        </Link>
        <button
          onClick={() => onDelete(section.id, section.titleEn)}
          className="text-red-600 hover:text-red-900"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

export default function HomepageSectionsListContent() {
  const [sections, setSections] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      setLoading(true);
      const data = await getContents('HOMEPAGE_SECTION');
      // Sort by displayOrder to show current order
      const sorted = data.sort((a, b) => a.displayOrder - b.displayOrder);
      setSections(sorted);
    } catch (err: any) {
      setError(err.message || 'Failed to load homepage sections');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);

    // Optimistically update UI
    const newSections = arrayMove(sections, oldIndex, newIndex);
    setSections(newSections);

    // Update displayOrder values on the backend
    try {
      setSaving(true);

      // Update all sections with their new displayOrder
      const updatePromises = newSections.map((section, index) => {
        const newDisplayOrder = index + 1;
        if (section.displayOrder !== newDisplayOrder) {
          return updateContent(section.id, { displayOrder: newDisplayOrder });
        }
        return Promise.resolve(section);
      });

      await Promise.all(updatePromises);

      // Reload to ensure consistency
      await loadSections();
    } catch (err: any) {
      // Revert on error
      setSections(sections);
      alert(err.message || 'Failed to update section order');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await deleteContent(id);
      await loadSections();
    } catch (err: any) {
      alert(err.message || 'Failed to delete section');
    }
  };

  const getLayoutLabel = (layout?: string) => {
    switch (layout) {
      case 'centered':
        return 'Centered';
      case 'image-left':
        return 'Image Left';
      case 'image-right':
        return 'Image Right';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading homepage sections...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Homepage Sections</h1>
        <Link
          href="/admin/homepage-sections/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create New Section
        </Link>
      </div>

      {saving && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          Saving new order...
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Layout
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Updated
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <tbody className="bg-white divide-y divide-gray-200">
                {sections.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No homepage sections found. Create your first section.
                    </td>
                  </tr>
                ) : (
                  sections.map((section) => (
                    <SortableRow
                      key={section.id}
                      section={section}
                      onDelete={handleDelete}
                      getLayoutLabel={getLayoutLabel}
                    />
                  ))
                )}
              </tbody>
            </SortableContext>
          </DndContext>
        </table>
      </div>

      {sections.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          <p>
            <strong>Note:</strong> Drag and drop sections to reorder them. Changes are saved automatically.
          </p>
        </div>
      )}
    </div>
  );
}
