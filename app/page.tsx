'use client';

import { useState } from 'react';
import MainTab from '@/components/tabs/MainTab';
import AggsVersusTab from '@/components/tabs/AggsVersusTab';

type Tab = 'main' | 'aggs';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('main');

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-slate-100">
            DEX Aggregator Performance Comparator
          </h1>
        </div>
      </header>

      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('main')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'main'
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              Main
            </button>
            <button
              onClick={() => setActiveTab('aggs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'aggs'
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              Aggs versus
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'main' && <MainTab />}
        {activeTab === 'aggs' && <AggsVersusTab />}
      </main>
    </div>
  );
}
