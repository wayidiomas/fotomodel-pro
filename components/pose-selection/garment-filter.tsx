'use client';

import * as React from 'react';
import { GARMENT_CATEGORY_GROUPS } from '@/lib/generation-flow/garment-categories';

interface GarmentFilterProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

export const GarmentFilter: React.FC<GarmentFilterProps> = ({
  selectedCategories,
  onCategoryChange,
}) => {
  // Filtro nasce COLAPSADO por padrão (usuário pode expandir)
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Track which groups are expanded (all collapsed by default)
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter(c => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  };

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const clearAll = () => {
    onCategoryChange([]);
  };

  // Count selections per group
  const getGroupSelectionCount = (groupId: string) => {
    const group = GARMENT_CATEGORY_GROUPS.find(g => g.id === groupId);
    if (!group) return 0;

    return group.categories.filter(cat =>
      selectedCategories.includes(cat.value)
    ).length;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header com botão para expandir/colapsar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 group"
        >
          <h3 className="font-inter font-semibold text-sm text-[#111827]">
            Tipo de Roupa
          </h3>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`transition-transform duration-200 text-gray-500 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {selectedCategories.length > 0 && (
          <button
            onClick={clearAll}
            className="font-inter font-medium text-xs text-[#6b7280] hover:text-[#111827] transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Selection count indicator */}
      {selectedCategories.length > 0 && (
        <div className="text-xs text-[#6b7280] font-inter">
          {selectedCategories.length} {selectedCategories.length === 1 ? 'categoria selecionada' : 'categorias selecionadas'}
        </div>
      )}

      {/* Collapsible content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="max-h-[520px] overflow-y-auto pr-2 -mr-2">
          <div className="flex flex-col gap-2">
            {GARMENT_CATEGORY_GROUPS.map((group) => {
              const isGroupExpanded = expandedGroups.has(group.id);
              const selectionCount = getGroupSelectionCount(group.id);

              return (
                <div key={group.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-inter font-semibold text-sm text-[#111827]">
                        {group.label}
                      </span>
                      {selectionCount > 0 && (
                        <span className="bg-[#20202a] text-white rounded-full px-2 py-0.5 text-xs font-semibold">
                          {selectionCount}
                        </span>
                      )}
                    </div>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`transition-transform duration-200 text-gray-600 ${
                        isGroupExpanded ? 'rotate-180' : ''
                      }`}
                    >
                      <path
                        d="M4 6L8 10L12 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {/* Group Categories */}
                  <div
                    className={`transition-all duration-200 ease-in-out ${
                      isGroupExpanded ? 'max-h-96' : 'max-h-0'
                    } overflow-hidden`}
                  >
                    <div className="p-2 space-y-1">
                      {group.categories.map((category) => {
                        const isSelected = selectedCategories.includes(category.value);

                        return (
                          <button
                            key={category.value}
                            onClick={() => toggleCategory(category.value)}
                            className={`
                              group relative w-full px-3 py-2 rounded-md font-inter font-medium text-sm text-left
                              transition-all duration-200 border
                              ${
                                isSelected
                                  ? 'bg-[#20202a] border-[#20202a] text-white shadow-sm'
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm'
                              }
                            `}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span>{category.label}</span>

                              {/* Check icon for selected state */}
                              <div
                                className={`
                                  flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center
                                  transition-all duration-200
                                  ${
                                    isSelected
                                      ? 'bg-white/20'
                                      : 'bg-transparent group-hover:bg-gray-100'
                                  }
                                `}
                              >
                                {isSelected && (
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 12 12"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="text-white"
                                  >
                                    <path
                                      d="M2 6L4.5 8.5L10 3"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Custom scrollbar styling */}
      <style jsx>{`
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
};
