import { Menu } from "lucide-react";

type HeaderProps = {
  darkMode?: boolean;
  onMenu: () => void;
  onNotifications?: () => void;
};

export default function Header({
  onMenu,
}: HeaderProps) {
  return (
    <div className="fixed top-4 right-4 z-40">
      <button
        onClick={onMenu}
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white shadow-xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-md transition-all hover:scale-105 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 cursor-pointer"
        title="إظهار القائمة"
      >
        <Menu size={22} />
      </button>
    </div>
  );
}