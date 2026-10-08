import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase"; 
import { FileText, Download, Video, FolderOpen, ArrowRight, Calendar, BookOpen } from "lucide-react";
import { motion } from "motion/react";

type Lecture = {
  id: string;
  subject_id?: string;
  title: string;
  description?: string;
  image_url?: string | null;
  file_url?: string | null;
  video_url?: string | null;
  created_at?: string;
};

type LecturesPageProps = {
  subjectId?: string;
  lectureTitle?: string;
  subjectName?: string;
  onSelectLecture?: (lectureId: string) => void;
  onBack: () => void;
};

export default function LecturesPage({ 
  subjectId: propSubjectId, 
  onSelectLecture,
  onBack 
}: LecturesPageProps) {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [subjectName, setSubjectName] = useState<string>("المادة الدراسية");
  const [loading, setLoading] = useState(true);

  const currentPath = window.location.pathname;
  const pathParts = currentPath.split("/");
  const urlSubjectId = pathParts[pathParts.indexOf("subjects") + 1] || propSubjectId;

  useEffect(() => {
    async function fetchSubjectAndLectures() {
      try {
        setLoading(true);

        const targetId = propSubjectId || urlSubjectId;

        if (targetId) {
          const { data: subData } = await supabase
            .from("subjects")
            .select("name")
            .eq("id", targetId)
            .single();

          if (subData && subData.name) {
            setSubjectName(subData.name);
          }

          const { data: matchedLectures, error: lecError } = await supabase
            .from("lectures")
            .select("*")
            .eq("subject_id", targetId)
            .order("created_at", { ascending: false });

          if (lecError) throw lecError;
          setLectures(matchedLectures || []);
        } else {
          const { data: allLectures } = await supabase
            .from("lectures")
            .select("*")
            .order("created_at", { ascending: false });

          setLectures(allLectures || []);
        }
      } catch (err) {
        console.error("Error fetching lectures:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSubjectAndLectures();
  }, [propSubjectId, urlSubjectId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 bg-slate-950 text-white min-h-screen p-4 sm:p-8 max-w-5xl mx-auto"
    >
      {/* زر الرجوع وعنوان المادة */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors w-fit cursor-pointer bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl shadow-md"
        >
          <ArrowRight size={16} />
          <span>العودة إلى المواد الدراسية</span>
        </button>

        <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-5 py-2.5 rounded-2xl shadow-lg">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BookOpen size={18} />
          </div>
          <span className="text-base font-bold text-white tracking-wide">
            {subjectName}
          </span>
        </div>
      </div>

      {/* محتوى المحاضرات */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
            <span>جاري تحميل المحاضرات...</span>
          </div>
        </div>
      ) : lectures.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900 p-12 text-center shadow-xl">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FolderOpen size={32} />
          </div>
          <h3 className="text-lg font-bold text-white">لا توجد محاضرات مضافة لهذه المادة حالياً</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm">
            لم يتم إضافة ملفات أو محاضرات لهذه المادة حتى الآن.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {lectures.map((lec, index) => (
            <div
              key={lec.id || index}
              className="group flex flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-xl hover:border-indigo-500/50 transition-all duration-300"
            >
              {lec.image_url && (
                <div 
                  onClick={() => onSelectLecture && onSelectLecture(lec.id)}
                  className="relative h-52 w-full overflow-hidden bg-slate-950 cursor-pointer"
                >
                  <img
                    src={lec.image_url}
                    alt={lec.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                  <span className="absolute top-4 right-4 rounded-xl border border-slate-800 bg-slate-950/80 backdrop-blur-md px-3 py-1 text-xs font-mono font-semibold text-indigo-300">
                    محاضرة #{index + 1}
                  </span>
                </div>
              )}

              <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 flex-1">
                <div 
                  onClick={() => onSelectLecture && onSelectLecture(lec.id)}
                  className="flex items-start gap-4 flex-1 cursor-pointer"
                >
                  {!lec.image_url && (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <FileText size={24} />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    {!lec.image_url && (
                      <span className="text-xs font-mono text-indigo-400 font-semibold">
                        المحاضرة #{index + 1}
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-white hover:text-indigo-400 transition-colors">{lec.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                      {lec.description || "لا توجد تفاصيل إضافية لهذه المحاضرة."}
                    </p>
                    {lec.created_at && (
                      <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                        <Calendar size={13} />
                        <span>{new Date(lec.created_at).toLocaleDateString('ar-IQ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end shrink-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  {lec.video_url && (
                    <a
                      href={lec.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 text-xs font-bold text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all shadow-inner cursor-pointer"
                    >
                      <Video size={16} />
                      <span>مشاهدة الفيديو</span>
                    </a>
                  )}

                  {lec.file_url && (
                    <a
                      href={lec.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
                    >
                      <Download size={16} />
                      <span>تحميل الملف</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}