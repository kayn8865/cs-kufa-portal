import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { Moon, Sun, LogIn, LogOut, Settings, ShieldCheck, Palette } from "lucide-react";
import { motion } from "motion/react";

const colorThemes = [
  { id: "indigo", name: "بنفسجي", class: "bg-indigo-600" },
  { id: "blue", name: "أزرق ملكي", class: "bg-blue-600" },
  { id: "sky", name: "أزرق سماوي", class: "bg-sky-600" },
  { id: "cyan", name: "سماوي داكن", class: "bg-cyan-600" },
  { id: "teal", name: "تركواز", class: "bg-teal-600" },
  { id: "emerald", name: "أخضر زمردي", class: "bg-emerald-600" },
  { id: "green", name: "أخضر عشبي", class: "bg-green-600" },
  { id: "lime", name: "أخضر ليموني", class: "bg-lime-600" },
  { id: "amber", name: "كهرماني", class: "bg-amber-600" },
  { id: "orange", name: "برتقالي", class: "bg-orange-600" },
  { id: "red", name: "أحمر حماسي", class: "bg-red-600" },
  { id: "rose", name: "وردي", class: "bg-rose-600" },
  { id: "pink", name: "زهري", class: "bg-pink-600" },
  { id: "purple", name: "أرجواني", class: "bg-purple-600" },
  { id: "violet", name: "بنفسجي غامق", class: "bg-violet-600" },
  { id: "slate", name: "رمادي معدني", class: "bg-slate-600" },
  { id: "zinc", name: "زنك رمادي", class: "bg-zinc-600" },
  { id: "teal-dark", name: "تركواز عتيق", class: "bg-teal-900" },
  { id: "gold", name: "ذهبي دافئ", class: "bg-yellow-600" },
  { id: "crimson", name: "قرمزي داكن", class: "bg-red-900" },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState("indigo");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const isDark = root.classList.contains("dark") || localStorage.getItem("theme") === "dark";
    setIsDarkMode(isDark);

    const savedColor = localStorage.getItem("colorTheme") || "indigo";
    setSelectedColor(savedColor);
    root.setAttribute("data-theme-color", savedColor);
  }, []);

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

  const changeColorTheme = (colorId: string) => {
    setSelectedColor(colorId);
    localStorage.setItem("colorTheme", colorId);
    document.documentElement.setAttribute("data-theme-color", colorId);
  };

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
      {/* بطاقة عنوان الصفحة */}
      <div 
        style={{ backgroundColor: "var(--color-bg-soft)", borderColor: "var(--color-primary)" }}
        className="flex items-center gap-4 rounded-3xl border opacity-95 p-6 shadow-sm transition-all"
      >
        <div 
          style={{ backgroundColor: "var(--color-bg-soft)", color: "var(--color-primary)", borderColor: "var(--color-primary)" }}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-colors border"
        >
          <Settings size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">الإعدادات والتفضيلات</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">تحكم بمظهر التطبيق وألوان الواجهات وحالة الحساب</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* بطاقة وضع العرض */}
        <div 
          style={{ backgroundColor: "var(--color-bg-soft)", borderColor: "var(--color-primary)" }}
          className="flex items-center justify-between rounded-3xl border opacity-95 p-6 shadow-sm transition-all"
        >
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isDarkMode ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-100 text-slate-700'}`}>
              {isDarkMode ? <Moon size={22} /> : <Sun size={22} />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">وضع العرض</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">التبديل بين الوضع الداكن والوضع الفاتح</p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
          >
            {isDarkMode ? (
              <>
                <Sun size={16} className="text-amber-400" />
                <span>الوضع الفاتح</span>
              </>
            ) : (
              <>
                <Moon size={16} style={{ color: "var(--color-primary)" }} />
                <span>الوضع الداكن</span>
              </>
            )}
          </button>
        </div>

        {/* بطاقة تخصيص ألوان التطبيق */}
        <div 
          style={{ backgroundColor: "var(--color-bg-soft)", borderColor: "var(--color-primary)" }}
          className="rounded-3xl border opacity-95 p-6 shadow-sm space-y-4 transition-all"
        >
          <div className="flex items-center gap-4">
            <div 
              style={{ backgroundColor: "var(--color-bg-soft)", color: "var(--color-primary)", borderColor: "var(--color-primary)" }}
              className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition-colors border"
            >
              <Palette size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">تخصيص ألوان التطبيق (20 لوناً)</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">اختر اللون الأساسي ليتطابق مع أزرار وخلفيات الموقع</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
            {colorThemes.map((theme) => {
              const isSelected = selectedColor === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => changeColorTheme(theme.id)}
                  style={isSelected ? { backgroundColor: "var(--color-bg-soft)", borderColor: "var(--color-primary)" } : {}}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-slate-900 ${
                    isSelected
                      ? "border-2 ring-2 ring-indigo-500/20 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className={`h-6 w-6 shrink-0 rounded-full ${theme.class} shadow-md`} />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{theme.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* بطاقة حالة الحساب والإدارة */}
        <div 
          style={{ backgroundColor: "var(--color-bg-soft)", borderColor: "var(--color-primary)" }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border opacity-95 p-6 shadow-sm transition-all"
        >
          <div className="flex items-center gap-4">
            <div 
              style={{ backgroundColor: "var(--color-bg-soft)", color: "var(--color-primary)", borderColor: "var(--color-primary)" }}
              className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition-colors border"
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">حالة الحساب والإدارة</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {session ? "أنت مسجل دخولك حالياً بصلاحيات المشرف (الأدمن)" : "أنت تصفح الموقع كزائر عام"}
              </p>
            </div>
          </div>

          {session ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/admin")}
                style={{ backgroundColor: "var(--color-primary)" }}
                className="rounded-2xl px-5 py-2.5 text-xs font-bold text-white transition-all cursor-pointer shadow-md hover:opacity-90"
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
              style={{ backgroundColor: "var(--color-primary)" }}
              className="flex items-center gap-2 rounded-2xl px-6 py-3 text-xs font-bold text-white transition-all cursor-pointer shadow-md w-full sm:w-auto justify-center hover:opacity-90"
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