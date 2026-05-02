"use client";
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamic import để tránh SSR
const KanbanBoard = dynamic(
  () => import('@/components/KanbanBoard'),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    ),
  }
);

export default function KanbanBoardWrapper({ tasks, token, onTaskUpdate }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <KanbanBoard tasks={tasks} token={token} onTaskUpdate={onTaskUpdate} />;
}