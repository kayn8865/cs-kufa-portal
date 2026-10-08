import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { BookOpen, ChevronLeft, FolderOpen } from "lucide-react";
import { motion } from "motion/react";

type Subject = {
  id: string;
  name: string;
  code?: string;
  description?: string;
  image_url?: string | null;
  semester?: string;
};

type SubjectsPageProps = {
  onSelectSubject?: (subjectId: string) => void;
};

export default function SubjectsPage({ onSelectSubject }: SubjectsPageProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubjects() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("subjects")
          .select("*")
          .order("name", { ascending: true });

        if (error) throw error;
        if (data) {
          setSubjects(data);
        }
      } catch (err) {
        console.error("Error fetching subjects:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSubjects();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8 bg-slate-950 text-white min-h-screen p-4 sm:p-8"
    >
      {/* رأس الصفحة */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">المواد الدراسية</h1>
          <p className="text-sm text-slate-400 max-w-xl">
            استعرض كافة المواد الدراسية الخاصة بقسم علوم الحاسوب، وتابع المحاضرات والملفات المتاحة لكل مادة.
          </p>
        </div>
      </div>

      {/* محتوى المواد */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
            <span>جاري تحميل المواد الدراسية...</span>
          </div>
        </div>
      ) : subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900 p-12 text-center shadow-xl">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FolderOpen size={32} />
          </div>
          <h3 className="text-lg font-bold text-white">لا توجد مواد مضافة حالياً</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm">
            لم يتم العثور على مواد دراسية في قاعدة البيانات. يمكنك إضافتها عبر لوحة التحكم الخاصة بالمسؤول.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-xl hover:border-indigo-500/50 transition-all duration-300"
            >
              {/* عرض صورة المادة إذا توفرت */}
              {sub.image_url ? (
                <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                  <img
                    src={sub.image_url}
                    alt={sub.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                  {sub.code && (
                    <span className="absolute top-3 left-3 rounded-xl border border-slate-800 bg-slate-950/80 backdrop-blur-md px-3 py-1 text-xs font-mono font-semibold text-slate-300">
                      {sub.code}
                    </span>
                  )}
                </div>
              ) : null}

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  {!sub.image_url && (
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                        <BookOpen size={24} />
                      </div>
                      {sub.code && (
                        <span className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1 text-xs font-mono font-semibold text-slate-400">
                          {sub.code}
                        </span>
                      )}
                    </div>
                  )}

                  <h3 className="text-lg font-bold text-white mb-2">{sub.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {sub.description || "مادة دراسية ضمن منهج قسم علوم الحاسوب في جامعة الكوفة."}
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (onSelectSubject) onSelectSubject(sub.id);
                  }}
                  className="mt-6 flex items-center justify-between rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 text-xs font-bold text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer shadow-inner"
                >
                  <span>استعراض محتوى المادة</span>
                  <ChevronLeft size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}