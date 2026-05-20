interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabGroupProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export default function TabGroup({ tabs, activeTab, onTabChange }: TabGroupProps) {
  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2.5 text-sm transition-colors relative ${
            activeTab === tab.id
              ? 'text-green-400 font-medium'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === tab.id ? 'bg-green-600/20 text-green-400' : 'bg-gray-700 text-gray-400'
            }`}>
              {tab.count}
            </span>
          )}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}
