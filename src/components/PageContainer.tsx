import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { motion } from "motion/react";

type PageContainerProps = {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
  backButton?: boolean;
  onBack?: () => void;
};

export default function PageContainer({
  title,
  description,
  icon,
  children,
  backButton = false,
  onBack,
}: PageContainerProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: -15,
      }}
    >
      <div className="mb-7 flex items-center gap-4">
        {backButton && (
          <button
            onClick={onBack}
            className="rounded-xl border border-slate-200 p-3 text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ChevronRight size={20} />
          </button>
        )}

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          {icon}
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {title}
          </h1>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>

      {children}
    </motion.div>
  );
}