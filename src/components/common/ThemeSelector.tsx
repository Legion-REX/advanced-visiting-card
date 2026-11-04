import React from 'react';
import { MiniWebsiteThemeId } from '../../types';
import { THEME_LIST, getMiniWebsiteTheme } from '../../utils/themes';
import { Check, Sparkles, Palette } from 'lucide-react';

interface ThemeSelectorProps {
  selectedThemeId?: MiniWebsiteThemeId;
  onSelectTheme: (themeId: MiniWebsiteThemeId) => void;
  variant?: 'full-cards' | 'compact-chips' | 'floating-bar';
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  selectedThemeId = 'royal-indigo',
  onSelectTheme,
  variant = 'full-cards',
}) => {
  if (variant === 'compact-chips') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {THEME_LIST.map((th) => {
          const isSelected = th.id === selectedThemeId;
          return (
            <button
              key={th.id}
              type="button"
              onClick={() => onSelectTheme(th.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all border ${
                isSelected
                  ? 'glass-panel ring-2 ring-indigo-500 text-slate-900 dark:text-white shadow-md'
                  : 'glass-card text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-white/60 dark:border-white/10'
              }`}
            >
              <span className="flex items-center -space-x-1">
                {th.previewColors.map((color, idx) => (
                  <span
                    key={idx}
                    className="w-2.5 h-2.5 rounded-full border border-white/40"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </span>
              <span>{th.name}</span>
              {isSelected && <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'floating-bar') {
    return (
      <div className="glass-panel p-2 rounded-2xl shadow-xl border border-white/70 dark:border-white/15 flex items-center gap-1.5 overflow-x-auto max-w-full hide-scrollbar">
        <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap flex-shrink-0">
          <Palette className="w-3.5 h-3.5 text-indigo-500" />
          <span>Themes:</span>
        </div>
        {THEME_LIST.map((th) => {
          const isSelected = th.id === selectedThemeId;
          return (
            <button
              key={th.id}
              type="button"
              onClick={() => onSelectTheme(th.id)}
              title={`${th.name} - ${th.badge}`}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all flex-shrink-0 ${
                isSelected
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-white/60 dark:ring-white/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-800/40'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full ring-1 ring-white/60 flex-shrink-0"
                style={{ backgroundColor: th.previewColors[0] }}
              />
              <span className="whitespace-nowrap">
                {th.name.includes('Rose Gold')
                  ? 'Rose Gold'
                  : th.name.includes('Obsidian')
                  ? 'Obsidian Noir'
                  : th.name.includes('Executive')
                  ? 'Executive Royal'
                  : th.name.includes('Emerald')
                  ? 'Emerald Luxe'
                  : th.name.includes('Cyberpunk')
                  ? 'Cyberpunk'
                  : th.name.split('&')[0].trim()}
              </span>
              {isSelected && <Check className="w-3 h-3 text-emerald-500 ml-0.5 flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    );
  }

  // Default: full-cards
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {THEME_LIST.map((th) => {
        const isSelected = th.id === selectedThemeId;
        return (
          <div
            key={th.id}
            onClick={() => onSelectTheme(th.id)}
            className={`cursor-pointer rounded-2xl p-4 transition-all relative overflow-hidden group border ${
              isSelected
                ? 'glass-panel ring-2 ring-indigo-500 dark:ring-indigo-400 shadow-xl scale-[1.01]'
                : 'glass-card border-white/60 dark:border-white/10 hover:border-indigo-300/50 dark:hover:border-indigo-500/30 hover:shadow-lg'
            }`}
          >
            {/* Top Color Swatch Strip */}
            <div
              className="h-2 rounded-full mb-3 w-full"
              style={{
                background: `linear-gradient(90deg, ${th.previewColors[0]} 0%, ${th.previewColors[1]} 50%, ${th.previewColors[2]} 100%)`,
              }}
            />

            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  {th.name}
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </h4>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {th.badge}
                </span>
              </div>

              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'border-slate-300 dark:border-slate-600 group-hover:border-indigo-400'
                }`}
              >
                {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3 line-clamp-2">
              {th.tagline}
            </p>

            {/* Mini Sample Preview Bar */}
            <div className="pt-2 border-t border-white/50 dark:border-white/10 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Palette:</span>
                <div className="flex items-center -space-x-1">
                  {th.previewColors.map((col, i) => (
                    <span
                      key={i}
                      className="w-3.5 h-3.5 rounded-full ring-1 ring-white dark:ring-slate-900"
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTheme(th.id);
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                  isSelected
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                    : 'text-indigo-600 dark:text-indigo-400 hover:underline'
                }`}
              >
                {isSelected ? 'Applied Theme' : 'Select Theme'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
