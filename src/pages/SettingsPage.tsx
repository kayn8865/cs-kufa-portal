import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { Moon, Sun, LogIn, LogOut, Settings, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // التحقق من حالة الجلسة الحالية (هل مسجل دخول كأدمن أم لا)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // التحقق من وضع الثيم الحالي عند تحميل الصفحة
    const root = document.documentElement;
    const isDark = root.classList.contains("dark") || localStorage.getItem("theme") === "dark";
    setIsDarkMode(isDark);
  }, []);

  // دالة تبديل الثيم الفورية والشاملة لكل التطبيق
  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains("dark")) {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  // دالة تسجيل الخروج
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      dir="rtl"
      className="max-w-4xl mx-auto space-y-6 pb-12"
    >
      {/* عنوان الصفحة */}
      <div className="flex items-center gap-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
          <Settings size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">الإعدادات والتفضيلات</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">تحكم بمظهر التطبيق وحالة الحساب والوصول للوحة التحكم</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* قسم مظهر التطبيق (الثيم) */}
        <div className="flex items-center justify-between rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isDarkMode ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-100 text-slate-700'}`}>
              {isDarkMode ? <Moon size={22} /> : <Sun size={22} />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">مظهر التطبيق</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">التبديل بين الوضع الداكن والوضع الفاتح</p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
          >
            {isDarkMode ? (
              <>
                <Sun size={16} className="text-amber-400" />
                <span>الوضع الفاتح</span>
              </>
            ) : (
              <>
                <Moon size={16} className="text-indigo-500" />
                <span>الوضع الداكن</span>
              </>
            )}
          </button>
        </div>

        {/* قسم إدارة الحساب وتسجيل الدخول / الخروج */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">حالة الحساب والإدارة</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {session ? "أنت مسجل دخولك حالياً بصلاحيات المشرف (الأدمن)" : "أنت تصفح الموقع كزائر عام"}
              </p>
            </div>
          </div>

          {session ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/admin")}
                className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-all cursor-pointer shadow-md"
              >
                لوحة التحكم
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-2xl bg-red-500/10 border border-red-500/20 px-5 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all cursor-pointer shadow-sm"
              >
                <LogOut size={16} />
                <span>تسجيل خروج</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white hover:bg-indigo-700 transition-all cursor-pointer shadow-md w-full sm:w-auto justify-center"
            >
              <LogIn size={16} />
              <span>تسجيل دخول (للإدارة)</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}