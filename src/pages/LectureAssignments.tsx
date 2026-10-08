import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FileText, ArrowRight, Loader2, AlertCircle, Calendar, X, ExternalLink, Image as ImageIcon } from "lucide-react";
import { motion } from "motion/react";

type LectureAssignment = {
  id: string;
  lecture_id: string;
  title: string;
  assignment_image_url: string | null;
  answer_image_url: string | null;
  created_at?: string;
};

type Lecture = {
  id: string;
  title: string;
  lecture_number?: number;
};

export default function LectureAssignmentsPage() {
  const { lectureId } = useParams<{ lectureId: string }>();
  const navigate = useNavigate();
  
  const [assignments, setAssignments] = useState<LectureAssignment[]>([]);
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // حالة الواجب المحدد لعرضه في النافذة المنبثقة (Modal)
  const [selectedAssignment, setSelectedAssignment] = useState<LectureAssignment | null>(null);

  useEffect(() => {
    const fetchAssignmentsData = async () => {
      if (!lectureId) return;
      try {
        setLoading(true);

        // جلب تفاصيل المحاضرة
        const { data: lectureData, error: lectureError } = await supabase
          .from("lectures")
          .select("id, title, lecture_number")
          .eq("id", lectureId)
          .single();

        if (lectureError) throw lectureError;
        setLecture(lectureData);

        // جلب الواجبات الخاصة بالمحاضرة
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from("lecture_assignments")
          .select("*")
          .eq("lecture_id", lectureId)
          .order("created_at", { ascending: false });

        if (assignmentsError) {
          console.warn("Could not fetch assignments:", assignmentsError.message);
          setAssignments([]);
        } else {
          setAssignments(assignmentsData || []);
        }

      } catch (err: any) {
        console.error("Error fetching assignments:", err);
        setError("حدث خطأ أثناء جلب الواجبات: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignmentsData();
  }, [lectureId]);

  // دالة جلب الرابط الصحيح من بكت lecture-pdfs
  const getPublicImageUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    let cleanPath = path;
    // إذا كان المسار يبدأ بـ assignments/ أو أي مجلد فرعي داخل البكت
    if (path.includes("/")) {
      const parts = path.split("/");
      // إذا كان العنصر الأول هو اسم مجلد فرعي وليس بكت، نحتفظ به، أو نتعامل معه كمسار نظيف
      if (parts[0] === "assignments" || parts[0] === "assignment_answers") {
        cleanPath = path;
      } else {
        cleanPath = parts.slice(1).join("/");
      }
    }

    try {
      const { data } = supabase.storage.from("lecture-pdfs").getPublicUrl(cleanPath);
      return data.publicUrl;
    } catch (e) {
      return path;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 size={40} className="animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  if (error && !lecture) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 text-slate-900 dark:text-white" dir="rtl">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-600 dark:text-red-400">
          <AlertCircle size={40} className="mx-auto mb-2" />
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="mt-4 inline-block rounded-xl bg-slate-200 dark:bg-slate-800 px-6 py-2 text-slate-800 dark:text-white cursor-pointer">
            العودة للخلف
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      dir="rtl"
      className="space-y-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white min-h-screen p-4 sm:p-8 max-w-6xl mx-auto transition-colors duration-300"
    >
      {/* زر العودة */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors w-fit cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl shadow-md"
      >
        <ArrowRight size={16} />
        <span>العودة إلى تفاصيل المحاضرة</span>
      </button>

      {/* رأس الصفحة */}
      <div className="flex items-center gap-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 shadow-xl">
        <div className="flex h-18 w-18 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-3xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-inner">
          <FileText size={40} />
        </div>
        <div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Calendar size={16} /> قسم الواجبات والمهام المطلوبة
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{lecture?.title || "واجبات المحاضرة"}</h1>
        </div>
      </div>

      {/* قائمة الواجبات */}
      {assignments.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {assignments.map((assignment) => {
            const imageUrl = getPublicImageUrl(assignment.assignment_image_url);
            return (
              <div 
                key={assignment.id}
                onClick={() => setSelectedAssignment(assignment)}
                className="group flex flex-col justify-between rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-lg hover:border-indigo-500/50 transition-all cursor-pointer"
              >
                <div>
                  {imageUrl ? (
                    <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <img src={imageUrl} alt={assignment.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="mb-4 flex h-36 w-full items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400">
                      <ImageIcon size={32} />
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">{assignment.title}</h3>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-4">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    تم الإضافة: {new Date(assignment.created_at || "").toLocaleDateString("ar-EG")}
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline mr-auto">
                    عرض التفاصيل والصورة ←
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-16 text-center shadow-xl">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-inner">
            <FileText size={36} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">لا توجد واجبات مضافة لهذه المحاضرة حالياً</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">سيتم إدراج الواجبات والمهام من قبل إدارة المادة قريباً.</p>
        </div>
      )}

      {/* نافذة التفاصيل المنبثقة (Modal) */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">تفاصيل الواجب</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{selectedAssignment.title}</h2>
              </div>
              <button 
                onClick={() => setSelectedAssignment(null)} 
                className="rounded-2xl p-2.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-6">
              {selectedAssignment.assignment_image_url ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-lg">
                  <img 
                    src={getPublicImageUrl(selectedAssignment.assignment_image_url) || ""} 
                    alt={selectedAssignment.title} 
                    className="w-full h-auto max-h-[450px] object-contain mx-auto" 
                  />
                </div>
              ) : (
                <p className="text-center text-sm text-slate-500 py-6">لا توجد صورة مرفقة مع هذا الواجب.</p>
              )}

              {selectedAssignment.answer_image_url && (
                <div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">صورة الحل أو المرفقات الإضافية:</h4>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-lg p-2">
                    <img 
                      src={getPublicImageUrl(selectedAssignment.answer_image_url) || ""} 
                      alt="حل الواجب" 
                      className="w-full h-auto max-h-[300px] object-contain mx-auto" 
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              {selectedAssignment.assignment_image_url && (
                <a 
                  href={getPublicImageUrl(selectedAssignment.assignment_image_url) || "#"} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 px-5 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  <ExternalLink size={14} />
                  <span>فتح الصورة بحجمها الأصلي</span>
                </a>
              )}
              <button 
                onClick={() => setSelectedAssignment(null)}
                className="rounded-2xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white hover:bg-indigo-700 transition-all cursor-pointer shadow-md"
              >
                إغلاق النافذة
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}