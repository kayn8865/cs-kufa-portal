import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FileText, Video, HelpCircle, CheckSquare, ArrowRight, Loader2, AlertCircle } from "lucide-react";

type Lecture = {
  id: string;
  subject_id: string;
  title: string;
  lecture_number: number;
  pdf_url: string | null;
};

export default function LectureDetailsAdmin() {
  const { lectureId } = useParams<{ lectureId: string }>();
  const navigate = useNavigate();
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLectureDetails = async () => {
      if (!lectureId) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("lectures")
          .select("*")
          .eq("id", lectureId)
          .single();

        if (error) throw error;
        setLecture(data);
      } catch (err: any) {
        setError("حدث خطأ أثناء جلب تفاصيل المحاضرة: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLectureDetails();
  }, [lectureId]);

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
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-400">
          <AlertCircle size={40} className="mx-auto mb-2" />
          <p>{error || "المحاضرة غير موجودة"}</p>
          <Link to={-1 as any} className="mt-4 inline-block rounded-xl bg-slate-800 px-6 py-2 text-white">
            العودة للخلف
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8 text-white">
      <div className="mx-auto max-w-4xl">
        {/* رأس الصفحة */}
        <header className="mb-8 flex items-center justify-between rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Link 
              to={`/admin/subjects/${lecture.subject_id}/lectures`} 
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <ArrowRight size={22} />
            </Link>
            <div>
              <span className="text-xs font-bold text-indigo-400">المحاضرة رقم {lecture.lecture_number}</span>
              <h1 className="text-2xl font-bold text-white">{lecture.title}</h1>
            </div>
          </div>
        </header>

        {/* الكارتات الأربعة الأساسية */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          
          {/* 1. كارت ملف الـ PDF */}
          <div 
            onClick={() => {
              if (lecture.pdf_url) {
                const publicUrl = lecture.pdf_url.startsWith("http") 
                  ? lecture.pdf_url 
                  : supabase.storage.from("lecture-pdfs").getPublicUrl(lecture.pdf_url).data.publicUrl;
                window.open(publicUrl, "_blank");
              } else {
                alert("لا يوجد ملف PDF مرفق لهذه المحاضرة.");
              }
            }}
            className="group flex cursor-pointer items-center justify-between rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-lg hover:border-indigo-500/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">ملف الـ PDF</h3>
                <p className="text-sm text-slate-400 mt-0.5">عرض أو تحميل ملزمة المحاضرة</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </div>

          {/* 2. كارت الفيديوهات */}
          <div 
            onClick={() => navigate(`/admin/lectures/${lecture.id}/videos`)}
            className="group flex cursor-pointer items-center justify-between rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-lg hover:border-indigo-500/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
                <Video size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">فيديوهات الشرح</h3>
                <p className="text-sm text-slate-400 mt-0.5">إدارة وتشغيل فيديوهات يوتيوب</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </div>

          {/* 3. كارت الأسئلة (مربوط بالمسار الصحيح) */}
          <div 
            onClick={() => navigate(`/admin/lectures/${lecture.id}/questions`)}
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

          {/* 4. كارت الواجبات (مربوط بالمسار الصحيح) */}
          <div 
            onClick={() => navigate(`/admin/lectures/${lecture.id}/assignments`)}
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
      </div>
    </div>
  );
}