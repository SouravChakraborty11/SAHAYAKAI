export const applyTheme = (theme: string) => {
  const root = document.documentElement;
  root.classList.remove('dark', 'light');

  if (theme === 'system') {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark');
    } else {
      root.classList.add('light'); // Although we don't have .light specifically, it removes .dark
    }
  } else if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.add('light');
  }
};
