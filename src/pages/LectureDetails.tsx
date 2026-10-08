import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FileText, Video, HelpCircle, CheckSquare, ArrowRight, Loader2, AlertCircle, Calendar, BookOpen, Download } from "lucide-react";
import { motion } from "motion/react";

type Lecture = {
  id: string;
  subject_id: string;
  title: string;
  description?: string;
  lecture_number: number;
  pdf_url?: string | null;
  file_url?: string | null;
  video_url?: string | null;
  created_at?: string;
  subject_image_url?: string | null;
};

type LectureDetailPageProps = {
  lectureId?: string;
  onBack?: () => void;
};

export default function LectureDetailPage({ lectureId: propLectureId, onBack }: LectureDetailPageProps) {
  const { lectureId: paramLectureId } = useParams<{ lectureId: string }>();
  const lectureId = propLectureId || paramLectureId;
  const navigate = useNavigate();

  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjectName, setSubjectName] = useState<string>("المادة الدراسية");

  useEffect(() => {
    const fetchLectureDetails = async () => {
      if (!lectureId) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("lectures")
          .select(`
            *,
            subjects (
              name,
              image_url
            )
          `)
          .eq("id", lectureId)
          .single();

        if (error) throw error;

        if (data) {
          const mappedLecture: Lecture = {
            ...data,
            subject_image_url: data.subjects?.image_url,
          };
          setLecture(mappedLecture);
          if (data.subjects?.name) {
            setSubjectName(data.subjects.name);
          }
        }
      } catch (err: any) {
        setError("حدث خطأ أثناء جلب تفاصيل المحاضرة: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLectureDetails();
  }, [lectureId]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const getFileUrl = (url: string) => {
    return url.startsWith("http") 
      ? url 
      : supabase.storage.from("lecture-pdfs").getPublicUrl(url).data.publicUrl;
  };

  // دالة تحميل ملف الـ PDF مباشرة
  const handleDownloadPdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const fileLink = lecture?.pdf_url || lecture?.file_url;
    if (!fileLink) return;

    try {
      const url = getFileUrl(fileLink);
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${lecture?.title || "lecture"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(getFileUrl(fileLink), "_blank");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Loader2 size={40} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error || !lecture) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 text-white" dir="rtl">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-400">
          <AlertCircle size={40} className="mx-auto mb-2" />
          <p>{error || "المحاضرة غير موجودة"}</p>
          <button onClick={handleBack} className="mt-4 inline-block rounded-xl bg-slate-800 px-6 py-2 text-white cursor-pointer">
            العودة للخلف
          </button>
        </div>
      </div>
    );
  }

  const fileLink = lecture.pdf_url || lecture.file_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      dir="rtl"
      className="space-y-8 bg-slate-950 text-white min-h-screen p-4 sm:p-8 max-w-6xl mx-auto"
    >
      <div className="flex flex-col gap-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors w-fit cursor-pointer bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl shadow-md"
        >
          <ArrowRight size={16} />
          <span>العودة للخلف</span>
        </button>

        {/* رأس الصفحة مع خلفية صورة المادة */}
        <div
          className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-xl min-h-[200px] flex flex-col justify-end"
          style={
            lecture.subject_image_url
              ? {
                  backgroundImage: `linear-gradient(to top, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.6)), url(${lecture.subject_image_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-3 text-slate-400">
              <BookOpen size={16} />
              <span className="text-sm font-medium">{subjectName}</span>
              {lecture.lecture_number && (
                <span className="rounded-full bg-indigo-500/20 px-3 py-0.5 text-xs text-indigo-300 border border-indigo-500/30">
                  المحاضرة رقم {lecture.lecture_number}
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">{lecture.title}</h1>
            <p className="text-sm text-slate-300 max-w-xl line-clamp-2">
              {lecture.description || "لا توجد تفاصيل إضافية لهذه المحاضرة."}
            </p>
            {lecture.created_at && (
              <div className="flex items-center gap-1.5 pt-2 text-xs text-slate-400">
                <Calendar size={14} />
                <span>{new Date(lecture.created_at).toLocaleDateString('ar-IQ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* البطاقات الأربع */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        
        {/* 1. كارت ملف الـ PDF */}
        <div 
          onClick={() => {
            if (fileLink) {
              window.open(getFileUrl(fileLink), "_blank");
            } else {
              alert("لا يوجد ملف PDF مرفق لهذه المحاضرة.");
            }
          }}
          className="group flex cursor-pointer items-center justify-between rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-lg hover:border-indigo-500/50 transition-all"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">ملف الـ PDF</h3>
              <p className="text-sm text-slate-400 mt-0.5">عرض أو تحميل ملزمة المحاضرة</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {fileLink && (
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-md cursor-pointer"
              >
                <Download size={15} />
                <span>تنزيل</span>
              </button>
            )}
            <ArrowRight size={20} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </div>
        </div>

        {/* 2. كارت فيديوهات الشرح (ينقل لواجهة الفيديوهات) */}
        <div 
          onClick={() => navigate(`/lectures/${lecture.id}/videos`)}
          className="group flex cursor-pointer items-center justify-between rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-lg hover:border-indigo-500/50 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
              <Video size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">فيديوهات الشرح</h3>
              <p className="text-sm text-slate-400 mt-0.5">مشاهدة فيديوهات الشرح</p>
            </div>
          </div>
          <ArrowRight size={20} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
        </div>

        {/* 3. كارت الأسئلة (ينقل لواجهة الأسئلة) */}
        <div 
          onClick={() => navigate(`/lectures/${lecture.id}/questions`)}
          className="group flex cursor-pointer items-center justify-between rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-lg hover:border-amber-500/50 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <HelpCircle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">الأسئلة</h3>
              <p className="text-sm text-slate-400 mt-0.5">أسئلة وتدريبات مع صور الحلول</p>
            </div>
          </div>
          <ArrowRight size={20} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
        </div>

        {/* 4. كارت الواجبات (ينقل لواجهة الواجبات) */}
        <div 
          onClick={() => navigate(`/lectures/${lecture.id}/assignments`)}
          className="group flex cursor-pointer items-center justify-between rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-lg hover:border-emerald-500/50 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckSquare size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">الواجبات</h3>
              <p className="text-sm text-slate-400 mt-0.5">التكليفات والواجبات الخاصة بالمحاضرة</p>
            </div>
          </div>
          <ArrowRight size={20} className="text-slate-500 group-hover:text-emerald-400 transition-colors" />
        </div>

      </div>
    </motion.div>
  );
}