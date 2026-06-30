'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

interface ResizableFormTableLayoutProps {
  formPanel: React.ReactNode;
  tablePanel: React.ReactNode;
  showForm?: boolean;
  defaultFormWidthPx?: number;
  maxFormPercent?: number;
  minFormPercent?: number;
}

export function ResizableFormTableLayout({
  formPanel,
  tablePanel,
  showForm = true,
  defaultFormWidthPx = 450,
  maxFormPercent = 30,
  minFormPercent = 10,
}: ResizableFormTableLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [formWidth, setFormWidth] = useState(defaultFormWidthPx);
  const containerWidth = useRef(0);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidth.current = entry.contentRect.width;
      }
    });
    observer.observe(el);
    setMounted(true);
    return () => observer.disconnect();
  }, []);

  const getMinWidth = useCallback(() => {
    return containerWidth.current ? (containerWidth.current * minFormPercent) / 100 : 0;
  }, [minFormPercent]);

  const getMaxWidth = useCallback(() => {
    return containerWidth.current ? (containerWidth.current * maxFormPercent) / 100 : Infinity;
  }, [maxFormPercent]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      startX.current = e.clientX;
      startWidth.current = formWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [formWidth],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      const maxW = getMaxWidth();
      const minW = getMinWidth();
      const newWidth = Math.max(minW, Math.min(maxW, startWidth.current + delta));
      setFormWidth(newWidth);
    },
    [getMinWidth, getMaxWidth],
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div ref={containerRef} className="flex flex-1 min-h-0 gap-2" suppressHydrationWarning>
      <div
        style={{
          width: showForm ? (mounted ? formWidth : defaultFormWidthPx) : 0,
          flexShrink: 0,
          maxWidth: showForm ? `${maxFormPercent}%` : '0%',
          opacity: showForm ? 1 : 0,
          padding: showForm ? undefined : 0,
          border: showForm ? undefined : 'none',
          margin: showForm ? undefined : 0,
        }}
        className="bg-muted/20 border border-border/50 rounded-xl flex flex-col overflow-hidden shadow-sm transition-all duration-300 ease-in-out"
        suppressHydrationWarning
      >
        <div className={showForm ? 'flex-1 flex flex-col min-h-0' : 'hidden'}>{formPanel}</div>
      </div>
      {showForm && (
        <div
          onMouseDown={handleMouseDown}
          className="relative flex w-3 shrink-0 items-center justify-center cursor-col-resize bg-transparent hover:bg-border/50 rounded transition-colors group"
          title="Seret untuk mengubah ukuran"
          suppressHydrationWarning
        >
          <div className="z-10 flex h-8 w-1.5 items-center justify-center rounded-sm border bg-border opacity-30 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-3 w-3" />
          </div>
        </div>
      )}
      <div
        className="flex-1 min-w-0 bg-card border border-border/50 rounded-xl flex flex-col overflow-hidden shadow-sm transition-all duration-300 ease-in-out"
        suppressHydrationWarning
      >
        {tablePanel}
      </div>
    </div>
  );
}
