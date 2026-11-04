import React from 'react';

export const GlassBackgroundOrbs: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
    >
      {/* Orb 1: Primary Indigo - Top Left */}
      <div
        className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-transparent blur-3xl opacity-75 dark:opacity-40"
      />

      {/* Orb 2: Purple / Violet - Top Right */}
      <div
        className="absolute top-1/4 -right-28 w-[480px] h-[480px] rounded-full bg-gradient-to-bl from-purple-500/20 via-pink-500/15 to-transparent blur-3xl opacity-75 dark:opacity-40"
      />

      {/* Orb 3: Cyan / Teal - Middle Left */}
      <div
        className="absolute top-2/3 -left-20 w-[420px] h-[420px] rounded-full bg-gradient-to-tr from-cyan-400/15 via-indigo-500/10 to-transparent blur-3xl opacity-60 dark:opacity-35"
      />

      {/* Orb 4: Rose / Pink - Bottom Right */}
      <div
        className="absolute -bottom-24 right-1/4 w-[460px] h-[460px] rounded-full bg-gradient-to-t from-rose-500/15 via-indigo-500/10 to-transparent blur-3xl opacity-60 dark:opacity-30"
      />

      {/* Subtle fine glass grid texture overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] dark:opacity-20" />
    </div>
  );
};
