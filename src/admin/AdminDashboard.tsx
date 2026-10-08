import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { 
  BookOpen, 
  Users, 
  Megaphone, 
  Calendar, 
  Gamepad2, 
  LayoutTemplate, 
  ArrowRight, 
  Loader2, 
  ShieldAlert,
  Home,
  FileText
} from "lucide-react";

export default function AdminDashboard() {
  const [counts, setCounts] = useState({
    subjects: 0,
    students: 0,
    announcements: 0,
    schedule: 0,
    entertainment: 0,
    featured: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      try {
        setLoading(true);
        const [subRes, profRes, annRes, schRes, entRes, featRes] = await Promise.all([
          supabase.from("subjects").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
          supabase.from("announcements").select("id", { count: "exact", head: true }),
          supabase.from("schedule").select("id", { count: "exact", head: true }),
          supabase.from("entertainment").select("id", { count: "exact", head: true }),
          supabase.from("featured_content").select("id", { count: "exact", head: true }),
        ]);

        setCounts({
          subjects: subRes.count || 0,
          students: profRes.count || 0,
          announcements: annRes.count || 0,
          schedule: schRes.count || 0,
          entertainment: entRes.count || 0,
          featured: featRes.count || 0,
        });
      } catch (err) {
        console.error("Error fetching admin stats:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCounts();
  }, []);

  const adminCards = [
    {
      title: "إدارة المواد الدراسية",
      description: "إضافة وتعديل وحذف المواد التعليمية",
      icon: BookOpen,
      count: counts.subjects,
      path: "/admin/subjects",
      color: "from-blue-600 to-indigo-600"
    },
    {
      title: "إدارة المحاضرات",
      description: "إدارة المحاضرات وملفات الـ PDF المرتبطة",
      icon: FileText,
      count: "محتوى",
      path: "/admin/lectures",
      color: "from-violet-600 to-purple-600"
    },
    {
      title: "إدارة الطلاب",
      description: "متابعة حسابات الطلاب وصلاحياتهم",
      icon: Users,
      count: counts.students,
      path: "/admin/students",
      color: "from-emerald-600 to-teal-600"
    },
    {
      title: "إدارة التبليغات",
      description: "نشر وإدارة الإعلانات الرسمية للطلاب",
      icon: Megaphone,
      count: counts.announcements,
      path: "/admin/announcements",
      color: "from-amber-600 to-orange-600"
    },
    {
      title: "الجدول الأسبوعي",
      description: "تحديث مواعيد المحاضرات والجدول الدراسي",
      icon: Calendar,
      count: counts.schedule,
      path: "/admin/schedule",
      color: "from-pink-600 to-rose-600"
    },
    {
      title: "المحتوى الترفيهي",
      description: "إدارة الروابط والمقالات والبرامج المفيدة",
      icon: Gamepad2,
      count: counts.entertainment,
      path: "/admin/entertainment",
      color: "from-indigo-600 to-cyan-600"
    },
    {
      title: "المحتوى المميز (السلايدر)",
      description: "التحكم بالعناصر البارزة في الواجهة الرئيسية",
      icon: LayoutTemplate,
      count: counts.featured,
      path: "/admin/featured",
      color: "from-fuchsia-600 to-pink-600"
    },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">لوحة تحكم المسؤول (Admin Dashboard)</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">إدارة محتوى بوابة جامعة الكوفة بالكامل</p>
            </div>
          </div>

          <Link
            to="/"
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-6 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Home size={18} />
            <span>العودة للبوابة الرئيسية</span>
          </Link>
        </header>

        {/* Content Grid */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 size={36} className="animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {adminCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <Link
                  key={idx}
                  to={card.path}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="absolute top-0 right-0 h-2 w-full bg-gradient-to-r opacity-80 group-hover:opacity-100 transition-opacity" style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }} />
                  
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.color} text-white shadow-md`}>
                        <Icon size={24} />
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {card.count} عنصر
                      </span>
                    </div>

                    <h3 className="mb-2 text-lg font-bold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {card.description}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-indigo-600 dark:border-slate-800 dark:text-indigo-400">
                    <span>إدارة القسم</span>
                    <ArrowRight size={18} className="transition-transform group-hover:-translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}