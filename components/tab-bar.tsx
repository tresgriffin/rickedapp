"use client";

interface Tab {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
}

export default function TabBar({ tabs, activeId, onChange }: TabBarProps) {
  return (
    <div className="flex border-b border-gray-200 bg-[#fffbfa]">
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${
              isActive
                ? "text-[#0d3c54] border-b-2 border-[#0d3c54]"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
