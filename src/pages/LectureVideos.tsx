import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Video, ArrowRight, Loader2, AlertCircle, Play, ExternalLink, BookOpen, X } from "lucide-react";
import { motion } from "motion/react";

type LectureVideo = {
  id: string;
  lecture_id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  created_at?: string;
};

type Lecture = {
  id: string;
  title: string;
  lecture_number?: number;
};

// دالة لاستخراج معرف يوتيوب وتحويل الرابط إلى Embed ليعمل داخل التطبيق
const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return "";
  let videoId = "";
  if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0];
  } else if (url.includes("watch?v=")) {
    videoId = url.split("watch?v=")[1]?.split("&")[0];
  } else if (url.includes("embed/")) {
    videoId = url.split("embed/")[1]?.split("?")[0];
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
};

// دالة لجلب الصورة المصغرة (Thumbnail) الكبيرة الخاصة بفيديو يوتيوب تلقائياً
const getYouTubeThumbnail = (url: string) => {
  if (!url) return "";
  let videoId = "";
  if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0];
  } else if (url.includes("watch?v=")) {
    videoId = url.split("watch?v=")[1]?.split("&")[0];
  } else if (url.includes("embed/")) {
    videoId = url.split("embed/")[1]?.split("?")[0];
  }
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
};

export default function LectureVideosPage() {
  const { lectureId } = useParams<{ lectureId: string }>();
  const navigate = useNavigate();
  
  const [videos, setVideos] = useState<LectureVideo[]>([]);
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // مشغل الفيديو الداخلي السينمائي للطالب
  const [activeVideoPlayer, setActiveVideoPlayer] = useState<LectureVideo | null>(null);

  useEffect(() => {
    const fetchVideosData = async () => {
      if (!lectureId) return;
      try {
        setLoading(true);

        const { data: lectureData, error: lectureError } = await supabase
          .from("lectures")
          .select("id, title, lecture_number")
          .eq("id", lectureId)
          .single();

        if (lectureError) throw lectureError;
        setLecture(lectureData);

        const { data: videosData, error: videosError } = await supabase
          .from("lecture_videos")
          .select("*")
          .eq("lecture_id", lectureId)
          .order("created_at", { ascending: false });

        if (videosError) {
          console.warn("Could not fetch lecture videos:", videosError.message);
          setVideos([]);
        } else {
          setVideos(videosData || []);
        }

      } catch (err: any) {
        console.error("Error fetching videos:", err);
        setError("حدث خطأ أثناء جلب الفيديوهات: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVideosData();
  }, [lectureId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Loader2 size={40} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error && !lecture) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 text-white" dir="rtl">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-400">
          <AlertCircle size={40} className="mx-auto mb-2" />
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="mt-4 inline-block rounded-xl bg-slate-800 px-6 py-2 text-white cursor-pointer">
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
      className="space-y-8 bg-slate-950 text-white min-h-screen p-4 sm:p-8 max-w-6xl mx-auto"
    >
      {/* زر العودة */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors w-fit cursor-pointer bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl shadow-md"
      >
        <ArrowRight size={16} />
        <span>العودة إلى تفاصيل المحاضرة</span>
      </button>

      {/* رأس الصفحة مع أيقونة فيديو بارزة */}
      <div className="flex items-center gap-5 rounded-3xl border border-slate-800 bg-[#111827] p-6 sm:p-8 shadow-xl">
        <div className="flex h-18 w-18 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-3xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
          <Video size={40} />
        </div>
        <div>
          <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
            <BookOpen size={16} /> فيديوهات الشرح الخاصة بالمحاضرة
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">{lecture?.title || "فيديوهات المحاضرة"}</h1>
        </div>
      </div>

      {/* قائمة الفيديوهات بشبكة متناسقة */}
      {videos.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {videos.map((vid) => {
            const thumbnailUrl = getYouTubeThumbnail(vid.youtube_url);
            return (
              <div 
                key={vid.id}
                className="group flex flex-col justify-between rounded-3xl border border-slate-800 bg-[#111827] p-5 shadow-lg hover:border-indigo-500/50 transition-all"
              >
                <div>
                  {/* عرض الصورة المصغرة الكبيرة للفيديو مع زر التشغيل */}
                  <div 
                    onClick={() => setActiveVideoPlayer(vid)}
                    className="relative mb-4 aspect-video w-full cursor-pointer overflow-hidden rounded-2xl bg-slate-900 border border-slate-800"
                  >
                    {thumbnailUrl ? (
                      <img src={thumbnailUrl} alt={vid.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-600">
                        <Video size={36} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center group-hover:bg-slate-950/20 transition-colors">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                        <Play size={26} className="fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{vid.title}</h3>
                  <p className="text-xs text-slate-400 mb-4 line-clamp-2">{vid.description || "لا يوجد وصف لهذا الفيديو."}</p>
                </div>

                <button 
                  onClick={() => setActiveVideoPlayer(vid)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600/20 py-3 text-xs font-bold text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                >
                  <Play size={15} className="fill-current" />
                  <span>تشغيل الفيديو داخل المنصة</span>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-800 bg-[#111827] p-16 text-center shadow-xl">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
            <Play size={36} />
          </div>
          <h3 className="text-xl font-bold text-white">لا توجد فيديوهات مضافة لهذه المحاضرة حالياً</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">سيتم إضافة فيديوهات الشرح من قبل إدارة المواد قريباً.</p>
        </div>
      )}

      {/* نافذة مشغل الفيديو السينمائي الداخلي (Modal) مع دعم ملء الشاشة الكامل */}
      {activeVideoPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-4xl rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{activeVideoPlayer.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{activeVideoPlayer.description}</p>
              </div>
              <button 
                onClick={() => setActiveVideoPlayer(null)} 
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 cursor-pointer"
              >
                <X size={22} />
              </button>
            </div>

            {/* مشغل الـ Iframe المدمج مع الصلاحيات الكاملة لملء الشاشة */}
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black border border-slate-800 shadow-inner">
              <iframe
                src={getYouTubeEmbedUrl(activeVideoPlayer.youtube_url)}
                title={activeVideoPlayer.title}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
              ></iframe>
            </div>

            <div className="mt-4 flex items-center justify-between pt-2">
              <a 
                href={activeVideoPlayer.youtube_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:underline"
              >
                <ExternalLink size={14} />
                <span>فتح الفيديو مباشرة في يوتيوب</span>
              </a>
              <button 
                onClick={() => setActiveVideoPlayer(null)}
                className="rounded-2xl bg-slate-800 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-700 cursor-pointer"
              >
                إغلاق المشغل
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}