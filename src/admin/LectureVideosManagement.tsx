import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Video, Plus, Trash2, Edit3, ArrowRight, Loader2, AlertCircle, X, Play } from "lucide-react";

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
  lecture_number: number;
};

// دالة ذكية لاستخراج معرف يوتيوب وتحويل الرابط إلى Embed ليعمل داخل التطبيق
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

export default function LectureVideosManagement() {
  const { lectureId } = useParams<{ lectureId: string }>();
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [videos, setVideos] = useState<LectureVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal إضافة فيديو
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Modal تعديل فيديو
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<LectureVideo | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editYoutubeUrl, setEditYoutubeUrl] = useState("");

  // مشغل الفيديو الداخلي المكتمل
  const [activeVideoPlayer, setActiveVideoPlayer] = useState<LectureVideo | null>(null);

  // نظام الحلفان الصارم للحذف
  const [deleteStep, setDeleteStep] = useState<"confirm" | "swear" | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<LectureVideo | null>(null);
  const [swearInput, setSwearInput] = useState("");
  const [swearError, setSwearError] = useState("");

  const fetchLectureAndVideos = async () => {
    if (!lectureId) return;
    try {
      setLoading(true);
      setError(null);

      const { data: lecData, error: lecError } = await supabase
        .from("lectures")
        .select("id, title, lecture_number")
        .eq("id", lectureId)
        .single();

      if (lecError) throw lecError;
      setLecture(lecData);

      const { data: vidData, error: vidError } = await supabase
        .from("lecture_videos")
        .select("*")
        .eq("lecture_id", lectureId)
        .order("created_at", { ascending: false });

      if (vidError) throw vidError;
      setVideos(vidData || []);
    } catch (err: any) {
      setError("حدث خطأ أثناء جلب الفيديوهات: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLectureAndVideos();
  }, [lectureId]);

  const openAddModal = () => {
    setTitle("");
    setDescription("");
    setYoutubeUrl("");
    setIsAddModalOpen(true);
  };

  const handleAddVideo = async (e: FormEvent) => {
    e.preventDefault();
    if (!lectureId) return;
    setSubmitting(true);

    try {
      const { error } = await supabase.from("lecture_videos").insert([
        {
          lecture_id: lectureId,
          title,
          description: description.trim() ? description.trim() : null,
          youtube_url: youtubeUrl.trim(),
        },
      ]);
      if (error) throw error;

      setIsAddModalOpen(false);
      fetchLectureAndVideos();
      alert("تم إضافة الفيديو بنجاح!");
    } catch (err: any) {
      alert("خطأ أثناء الحفظ: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (video: LectureVideo) => {
    setEditingVideo(video);
    setEditTitle(video.title);
    setEditDescription(video.description || "");
    setEditYoutubeUrl(video.youtube_url);
    setIsEditModalOpen(true);
  };

  const handleEditVideo = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("lecture_videos")
        .update({
          title: editTitle,
          description: editDescription.trim() ? editDescription.trim() : null,
          youtube_url: editYoutubeUrl.trim(),
        })
        .eq("id", editingVideo.id);

      if (error) throw error;

      setIsEditModalOpen(false);
      setEditingVideo(null);
      fetchLectureAndVideos();
      alert("تم تعديل الفيديو بنجاح!");
    } catch (err: any) {
      alert("خطأ أثناء التعديل: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const initiateDelete = (video: LectureVideo) => {
    setVideoToDelete(video);
    setDeleteStep("confirm");
    setSwearInput("");
    setSwearError("");
  };

  const handleFirstConfirm = (yes: boolean) => {
    if (!yes) {
      setDeleteStep(null);
      setVideoToDelete(null);
    } else {
      setDeleteStep("swear");
    }
  };

  const handleFinalDeleteAction = async () => {
    if (swearInput.trim() !== "والله") {
      setSwearError("أنت ليش تجذب ما حلف يعني ما متأكد!");
      return;
    }

    if (!videoToDelete) return;

    try {
      const { error } = await supabase.from("lecture_videos").delete().eq("id", videoToDelete.id);
      if (error) throw error;
      setDeleteStep(null);
      setVideoToDelete(null);
      fetchLectureAndVideos();
    } catch (err: any) {
      alert("خطأ أثناء الحذف: " + err.message);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Link to={-1 as any} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
              <ArrowRight size={22} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">
                إدارة فيديوهات محاضرة: <span className="text-indigo-400">{lecture?.title || "..."}</span>
              </h1>
              <p className="text-sm text-slate-400">إضافة وتعديل وتشغيل فيديوهات الشرح بمشغل سينمائي متكامل</p>
            </div>
          </div>

          <button onClick={openAddModal} className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700">
            <Plus size={20} />
            <span>إضافة فيديو جديد</span>
          </button>
        </header>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 size={36} className="animate-spin text-indigo-400" />
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-400">
            <AlertCircle size={36} className="mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-[#111827] p-12 text-center shadow-sm">
            <Video size={48} className="mx-auto mb-4 text-slate-600" />
            <h3 className="text-lg font-bold text-white">لا توجد فيديوهات مسجلة لهذه المحاضرة حالياً</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {videos.map((vid) => {
              const thumbnailUrl = getYouTubeThumbnail(vid.youtube_url);
              return (
                <div key={vid.id} className="group flex flex-col justify-between rounded-3xl border border-slate-800 bg-[#111827] p-5 shadow-lg hover:border-indigo-500/50 transition-all">
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
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                          <Play size={22} className="fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-white line-clamp-1">{vid.title}</h3>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEditModal(vid)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors" title="تعديل الفيديو">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => initiateDelete(vid)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="حذف الفيديو">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 mb-4 line-clamp-2">{vid.description || "لا يوجد وصف لهذا الفيديو."}</p>
                  </div>

                  <button 
                    onClick={() => setActiveVideoPlayer(vid)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600/20 py-2.5 text-xs font-bold text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    <Play size={14} className="fill-current" />
                    <span>تشغيل الفيديو داخل المنصة</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal مشغل الفيديو السينمائي الداخلي (مع دعم التكبير الكامل Fullscreen) */}
        {activeVideoPlayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="w-full max-w-4xl rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">{activeVideoPlayer.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{activeVideoPlayer.description}</p>
                </div>
                <button onClick={() => setActiveVideoPlayer(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800">
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

              <div className="mt-4 flex items-center justify-between">
                <a 
                  href={activeVideoPlayer.youtube_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-indigo-400 hover:underline"
                >
                  فتح الفيديو مباشرة في يوتيوب ↗
                </a>
                <button 
                  onClick={() => setActiveVideoPlayer(null)}
                  className="rounded-2xl bg-slate-800 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-700"
                >
                  إغلاق المشغل
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal إضافة فيديو */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">إضافة فيديو جديد للمحاضرة</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddVideo} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">عنوان الفيديو</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-white outline-none focus:border-indigo-500" placeholder="مثال: شرح العمليات الأساسية" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">وصف الفيديو (اختياري)</label>
                  <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-white outline-none focus:border-indigo-500" placeholder="تفاصيل إضافية حول الفيديو..." />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">رابط يوتيوب (Youtube URL)</label>
                  <input type="url" required value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-white outline-none focus:border-indigo-500" placeholder="https://youtube.com/watch?v=..." dir="ltr" />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-2xl border border-slate-800 px-6 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800">إلغاء</button>
                  <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
                    {submitting && <Loader2 size={18} className="animate-spin" />}
                    <span>إضافة الفيديو</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal تعديل فيديو */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">تعديل تفاصيل الفيديو</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800"><X size={20} /></button>
              </div>
              <form onSubmit={handleEditVideo} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">عنوان الفيديو</label>
                  <input type="text" required value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-white outline-none focus:border-indigo-500" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">وصف الفيديو</label>
                  <textarea rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-white outline-none focus:border-indigo-500" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">رابط يوتيوب</label>
                  <input type="url" required value={editYoutubeUrl} onChange={(e) => setEditYoutubeUrl(e.target.value)} className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-white outline-none focus:border-indigo-500" dir="ltr" />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="rounded-2xl border border-slate-800 px-6 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800">إلغاء</button>
                  <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
                    {submitting && <Loader2 size={18} className="animate-spin" />}
                    <span>حفظ التعديلات</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* نافذة التأكيد الأولى بالحذف (لا / نعم) */}
        {deleteStep === "confirm" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-2xl text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">تأكيد الحذف</h3>
              <p className="text-sm text-slate-400 mb-6">أنت متأكد تريد حذف الفيديو "{videoToDelete?.title}"؟</p>
              
              <div className="flex gap-3">
                <button onClick={() => handleFirstConfirm(false)} className="flex-1 rounded-2xl border border-slate-800 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800">
                  لا
                </button>
                <button onClick={() => handleFirstConfirm(true)} className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 shadow-lg shadow-red-600/20">
                  نعم
                </button>
              </div>
            </div>
          </div>
        )}

        {/* نافذة الحلفان الثانية للتاكيد الصارم */}
        {deleteStep === "swear" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-2xl text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">قسم الحذف المؤكد</h3>
              <p className="text-sm text-slate-400 mb-4">إذا متأكد، احلف بالله واكتب كلمة <span className="font-bold text-indigo-400">والله</span> في الحقل أدناه:</p>

              <input
                type="text"
                value={swearInput}
                onChange={(e) => {
                  setSwearInput(e.target.value);
                  setSwearError("");
                }}
                placeholder="اكتب: والله"
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-center text-white outline-none focus:border-indigo-500 mb-2"
              />

              {swearError && (
                <p className="text-xs font-bold text-red-400 mb-4 animate-bounce">{swearError}</p>
              )}

              <div className="flex gap-3 mt-4">
                <button onClick={() => setDeleteStep(null)} className="flex-1 rounded-2xl border border-slate-800 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800">
                  إلغاء
                </button>
                <button onClick={handleFinalDeleteAction} className="flex-1 rounded-2xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20">
                  تم / تأكيد
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}