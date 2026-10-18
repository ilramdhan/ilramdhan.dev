import { useRef, useState, type ChangeEvent } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Field } from '@/components/ui/Field';
import { acceptAttribute, IMAGE_MIME_TYPES, uploadFile, type UploadFolder } from '@/lib/upload';

const DEFAULT_HINT =
  'Markdown + GFM (tables, task lists). Images: upload with Insert image, or paste any image URL — GitHub blob links are converted automatically.';

interface Props {
  label: string;
  description?: string;
  error?: string | null;
  text: { name: string; value: string; className: string };
  folder: UploadFolder;
  placeholder: string;
  rows: number;
  onValue: (next: string) => void;
  /** Called with true when an upload starts and false when it ends (the form blocks saving). */
  onUploading?: (active: boolean) => void;
}

/** Markdown textarea with an "Insert image" button that uploads and inserts `![alt](url)`. */
export function MarkdownField({
  label,
  description,
  error,
  text,
  folder,
  placeholder,
  rows,
  onValue,
  onUploading,
}: Props) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length === 0) return;
    // Capture the cursor now: focus may move while uploading.
    const area = areaRef.current;
    const current = area?.value ?? text.value;
    const pos = area?.selectionStart ?? current.length;
    const end = area?.selectionEnd ?? pos;
    setUploading(true);
    onUploading?.(true);
    const lines: string[] = [];
    for (const file of files) {
      try {
        const { publicUrl } = await uploadFile(file, folder, IMAGE_MIME_TYPES);
        const alt = file.name.replace(/\.[^.]+$/, '').replace(/[[\]]/g, '');
        lines.push(`![${alt}](${publicUrl})`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Image upload failed');
      }
    }
    setUploading(false);
    onUploading?.(false);
    if (lines.length === 0) return;
    const before = current.slice(0, pos);
    const after = current.slice(end);
    const lead =
      before === '' ? '' : before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n';
    const trail = after.startsWith('\n\n') ? '' : after.startsWith('\n') ? '\n' : '\n\n';
    onValue(`${before}${lead}${lines.join('\n\n')}${trail}${after}`);
  }

  return (
    <div>
      <Field label={label} error={error} description={description ?? DEFAULT_HINT}>
        <textarea {...text} ref={areaRef} placeholder={placeholder} rows={rows} />
      </Field>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn-secondary text-sm"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 motion-safe:animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          Insert image
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          accept={acceptAttribute(IMAGE_MIME_TYPES)}
          onChange={(e) => void onPick(e)}
          aria-label="Insert image"
        />
        <span role="status" aria-live="polite" className="text-xs text-slate-500">
          {uploading ? 'Uploading images…' : ''}
        </span>
      </div>
    </div>
  );
}
