import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { 
  Home, 
  BookOpen, 
  Megaphone, 
  Calendar, 
  Gamepad2, 
  Settings, 
  ShieldAlert, 
  X,
  ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence, type PanInfo } from "motion/react";

export type Page = 
  | "home" 
  | "subjects" 
  | "notifications" 
  | "announcements" 
  | "schedule" 
  | "entertainment" 
  | "profile" 
  | "settings"
  | "admin";

type SideMenuProps = {
  open: boolean;
  page: Page;
  onClose: () => void;
  onNavigate: (page: Page) => void;
};

export default function SideMenu({ open, page, onClose, onNavigate }: SideMenuProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAdminRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!error && data && data.role === "admin") {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error("Error checking admin role:", err);
      }
    }

    if (open) {
      checkAdminRole();
    }
  }, [open]);

  // إغلاق القائمة عند سحبها نحو اليمين
  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 80 || info.velocity.x > 300) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
          {/* خلفية مظلمة شفافة */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* محتوى القائمة من اليمين مع دعم السحب */}
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            drag="x"
            dragConstraints={{ left: 0, right: 320 }}
            dragElastic={{ left: 0, right: 0.8 }}
            onDragEnd={handleDragEnd}
            className="absolute right-0 top-0 h-full w-80 flex flex-col bg-white shadow-2xl dark:bg-slate-900 z-10 border-l border-slate-100 dark:border-slate-800 touch-pan-y cursor-grab active:cursor-grabbing"
          >
            {/* مؤشر السحب */}
            <div className="w-full flex justify-center pt-2 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>

            {/* رأس القائمة */}
            <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
              <button 
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 text-right">
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">بوابة علوم الحاسوب</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">جامعة الكوفة</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl dynamic-bg text-white font-bold shadow-md shrink-0">
                  UP
                </div>
              </div>
            </div>

            {/* الروابط */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 text-right">
              {isAdmin && (
                <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      onClose();
                      navigate("/admin");
                    }}
                    className="group flex w-full items-center justify-between rounded-2xl dynamic-bg p-4 text-white shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <ChevronLeft size={18} className="transition-transform group-hover:translate-x-1" />
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="block text-sm font-bold">لوحة تحكم المسؤول</span>
                        <span className="block text-xs text-white opacity-90">إدارة محتوى النظام بالكامل</span>
                      </div>
                      <ShieldAlert size={22} className="shrink-0" />
                    </div>
                  </button>
                </div>
              )}

              <button
                onClick={() => onNavigate("home")}
                className={`flex w-full items-center justify-end gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors cursor-pointer ${
                  page === "home" ? "dynamic-bg text-white shadow-md" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <span>الرئيسية</span>
                <Home size={20} />
              </button>

              <button
                onClick={() => onNavigate("subjects")}
                className={`flex w-full items-center justify-end gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors cursor-pointer ${
                  page === "subjects" ? "dynamic-bg text-white shadow-md" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <span>المواد الدراسية</span>
                <BookOpen size={20} />
              </button>

              <button
                onClick={() => onNavigate("announcements")}
                className={`flex w-full items-center justify-end gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors cursor-pointer ${
                  page === "announcements" ? "dynamic-bg text-white shadow-md" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <span>التبليغات</span>
                <Megaphone size={20} />
              </button>

              <button
                onClick={() => onNavigate("schedule")}
                className={`flex w-full items-center justify-end gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors cursor-pointer ${
                  page === "schedule" ? "dynamic-bg text-white shadow-md" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <span>الجدول الأسبوعي</span>
                <Calendar size={20} />
              </button>

              <button
                onClick={() => onNavigate("entertainment")}
                className={`flex w-full items-center justify-end gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors cursor-pointer ${
                  page === "entertainment" ? "dynamic-bg text-white shadow-md" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <span>المحتوى الترفيهي</span>
                <Gamepad2 size={20} />
              </button>

              <button
                onClick={() => onNavigate("settings")}
                className={`flex w-full items-center justify-end gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors cursor-pointer ${
                  page === "settings" ? "dynamic-bg text-white shadow-md" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <span>الإعدادات</span>
                <Settings size={20} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}