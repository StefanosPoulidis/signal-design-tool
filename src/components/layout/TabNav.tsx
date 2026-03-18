import type { ModuleId } from '../../lib/types';

interface Tab {
  id: ModuleId;
  label: string;
  shortLabel: string;
}

const TABS: Tab[] = [
  { id: 'landing', label: 'About', shortLabel: 'About' },
  { id: 'simulator', label: 'Should You Signal?', shortLabel: 'Signal?' },
  { id: 'ide', label: 'IDE Channels', shortLabel: 'IDE' },
  { id: 'scoreline', label: 'Multi-Level Design', shortLabel: 'Levels' },
  { id: 'archetypes', label: 'Operator Types', shortLabel: 'Types' },
  { id: 'game', label: 'Decision Game', shortLabel: 'Game' },
  { id: 'deployment', label: 'Deployment Guide', shortLabel: 'Deploy' },
  { id: 'governance', label: 'Governance', shortLabel: 'Gov.' },
];

interface TabNavProps {
  active: ModuleId;
  onSelect: (id: ModuleId) => void;
}

export function TabNav({ active, onSelect }: TabNavProps) {
  return (
    <nav className="bg-white border-b border-gray-200 overflow-x-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-0 min-w-max">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => onSelect(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                active === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
