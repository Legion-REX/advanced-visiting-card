import React, { useState, useMemo } from 'react';
import { INDUSTRY_GROUPS, ALL_INDUSTRIES } from '../../data/industries';
import { Search, ChevronDown, Check, Briefcase } from 'lucide-react';

interface IndustrySelectProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  required?: boolean;
  className?: string;
  showSearchAssistant?: boolean;
  label?: string;
  helperText?: string;
}

export const IndustrySelect: React.FC<IndustrySelectProps> = ({
  value,
  onChange,
  id,
  name,
  required = false,
  className = '',
  showSearchAssistant = true,
  label,
  helperText,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Filter industries if user types in search box
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return ALL_INDUSTRIES.filter((ind) => ind.toLowerCase().includes(q)).slice(0, 10);
  }, [searchQuery]);

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="block font-medium text-slate-700 dark:text-slate-300">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
            95+ Industries Available
          </span>
        </div>
      )}

      {/* Main Select Element with optgroups */}
      <div className="relative">
        <select
          id={id}
          name={name}
          required={required}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setSearchQuery('');
            setIsSearching(false);
          }}
          className={`w-full glass-input pr-10 appearance-none cursor-pointer text-slate-800 dark:text-slate-100 font-medium ${className}`}
        >
          {!value && <option value="">-- Select Your Industry (95+ Options) --</option>}
          
          {INDUSTRY_GROUPS.map((group) => (
            <optgroup
              key={group.groupName}
              label={`── ${group.groupName.toUpperCase()} (${group.items.length}) ──`}
              className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 py-1"
            >
              {group.items.map((item) => (
                <option
                  key={item}
                  value={item}
                  className="font-normal text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 py-1 pl-4"
                >
                  {item}
                </option>
              ))}
            </optgroup>
          ))}
          
          <optgroup label="── OTHER / GENERAL ──">
            <option value="General Service Provider / Other">General Service Provider / Other</option>
          </optgroup>
        </select>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {/* Optional Quick Search Assistant bar */}
      {showSearchAssistant && (
        <div className="pt-1">
          {!isSearching ? (
            <button
              type="button"
              onClick={() => setIsSearching(true)}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
            >
              <Search className="w-3 h-3" />
              <span>Can't find your category? Search among 95+ industries</span>
            </button>
          ) : (
            <div className="p-2.5 rounded-2xl glass-card border border-indigo-200/60 dark:border-indigo-800/40 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type keyword: cloth, salon, kids, food, doctor..."
                  className="w-full text-xs bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsSearching(false);
                    setSearchQuery('');
                  }}
                  className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1.5 py-0.5 rounded"
                >
                  Close
                </button>
              </div>

              {/* Instant Search Results */}
              {searchQuery.trim() && (
                <div className="max-h-44 overflow-y-auto space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  {searchResults.length > 0 ? (
                    searchResults.map((result) => {
                      const isSelected = value === result;
                      return (
                        <button
                          key={result}
                          type="button"
                          onClick={() => {
                            onChange(result);
                            setSearchQuery('');
                            setIsSearching(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white font-semibold'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                          }`}
                        >
                          <span className="truncate">{result}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0 ml-1" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="py-2 text-center text-slate-400 text-xs">
                      No matching industry found. Select "General Service Provider / Other" or scroll the dropdown list.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {helperText && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{helperText}</p>
      )}
    </div>
  );
};
