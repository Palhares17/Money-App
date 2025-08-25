'use client';

import React, { useRef, useState } from 'react';
import { FilePlus2, UploadCloud, CheckCircle2, X, CircleX } from 'lucide-react';
import { uploadCSV } from '@/utils/uploadCsv';

type Props = {
  onUploadComplete?: (file: File) => void;
  className?: string;
};

export function InputFile({ onUploadComplete, className = '' }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<boolean>(false);

  const handleFiles = (f: FileList | null) => {
    const picked = f?.[0];
    if (!picked) return;

    if (!picked.name.toLowerCase().endsWith('.csv')) {
      alert('Envie um arquivo .csv');
      return;
    }

    setFile(picked);
    setUploading(true);
    setProgress(0);

    uploadCSV(picked, (pct) => setProgress(pct))
      .then((data) => {
        console.log('Upload concluído:', data);
        setUploading(false);
        onUploadComplete?.(picked);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
        alert('Falha ao enviar CSV');
        setUploading(false);
      });
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const reset = () => {
    setFile(null);
    setProgress(0);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={inputRef}
        id="fileInput"
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <label
        htmlFor="fileInput"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={[
          'group relative w-full cursor-pointer rounded-xl border-2 border-dashed',
          dragActive
            ? 'border-blue-500 bg-blue-50/50'
            : 'border-muted-foreground/30 hover:bg-muted/30',
          'p-6 transition-colors',
          'flex flex-col items-center justify-center gap-3 text-center',
        ].join(' ')}
      >
        <div className="flex items-center justify-center rounded-lg p-3">
          {uploading ? <UploadCloud className="h-6 w-6" /> : <FilePlus2 className="h-6 w-6" />}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium">Import CSV</p>
          <p className="text-xs text-muted-foreground">
            Arraste e solte seu arquivo aqui ou{' '}
            <span className="underline">clique para selecionar</span>
          </p>
        </div>

        {/* Barra de progresso */}
        {uploading && (
          <div className="mt-2 w-full max-w-md">
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-blue-500 transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{Math.round(progress)}%</div>
          </div>
        )}
      </label>

      {/* Info do arquivo após upload */}
      {file && !uploading && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-muted-foreground/20 p-3">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium hover:bg-muted"
            aria-label="Remover arquivo"
            title="Remover arquivo"
          >
            <X className="h-4 w-4" />
            Remover
          </button>
        </div>
      )}

      {error && !uploading && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-muted-foreground/20 p-3">
          <div className="flex items-center gap-2 min-w-0">
            <CircleX className="h-4 w-4 text-red-600" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">Erro na leitura arquivo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium hover:bg-muted"
            aria-label="Remover arquivo"
            title="Remover arquivo"
          >
            <X className="h-4 w-4" />
            Remover
          </button>
        </div>
      )}
    </div>
  );
}
