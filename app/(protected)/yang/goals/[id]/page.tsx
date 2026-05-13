'use client';

import { use } from 'react';
import GoalsDock from '@/components/yang/GoalsDock';
import GoalView from '@/components/yang/GoalView';

export default function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="h-[calc(100vh-0px)] flex">
      <GoalsDock />
      <div className="flex-1 overflow-y-auto">
        <GoalView goalId={id} />
      </div>
    </div>
  );
}
