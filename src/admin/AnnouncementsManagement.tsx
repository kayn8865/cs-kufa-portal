import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Plus, Trash2, ArrowRight, Loader2, AlertCircle, X, Image as ImageIcon, Calendar, Clock, BookOpen, CheckSquare, ShieldAlert, Megaphone } from "lucide-react";

type Announcement = {
  id: string;
  type: "exam" | "assignment" | "management" | "announcement";
  title: string;
  description: string | null;
  image_url: string | null;
  exam_date: string | null;
  exam_time: string | null;
  due_date: string | null;
  created_at?: string;
};

export default function AnnouncementsManagement() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal إضافة إعلان/تبليغ
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [type, setType] = useState<"exam" | "assignment" | "management" | "announcement">("announcement");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [examDate, setExamDate] = useState("");
  const [examTime, setExamTime] = useState("");
  const [dueDate, setDueDate] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // معاينة الصور الكبيرة
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // نظام الحلفان الصارم للحذف
  const [deleteStep, setDeleteStep] = useState<"confirm" | "swear" | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Announcement | null>(null);
  const [swearInput, setSwearInput] = useState("");
  const [swearError, setSwearError] = useState("");

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. جلب الإعلانات والتبليغات العادية والواجبات والإدارة من جدول announcements
      const { data: annData, error: annError } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (annError) throw annError;

      // 2. جلب الامتحانات من جدول exams ودمجها مع القائمة لتعرض في عمود تبليغات الامتحانات
      const { data: examsData, error: examsError } = await supabase
        .from("exams")
        .select("*, subjects(name)")
        .order("exam_date", { ascending: true });

      if (examsError) throw examsError;

      // تحويل بيانات الامتحانات لتتطابق مع هيكل الـ Announcement لتسهيل عرضها
      const formattedExams: Announcement[] = (examsData || []).map((ex: any) => ({
        id: ex.id,
        type: "exam",
        title: ex.subjects?.name ? `امتحان ${ex.subjects.name} (${ex.exam_type})` : `امتحان (${ex.exam_type})`,
        description: ex.notes || "لا توجد ملاحظات إضافية",
        image_url: null,
        exam_date: ex.exam_date,
        exam_time: ex.start_time,
        due_date: null,
        created_at: ex.created_at
      }));

      setAnnouncements([...(annData || []), ...formattedExams]);
    } catch (err: any) {
      setError("حدث خطأ أثناء جلب التبليغات: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const uploadImageToStorage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `announcements/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("lecture-pdfs")
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      return filePath;
    } catch (err: any) {
      alert("خطأ أثناء رفع الصورة: " + err.message);
      return null;
    }
  };

  const handleAddAnnouncement = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setUploadingFile(true);

    try {
      if (type === "exam") {
        // التحقق من صيغة الوقت لكي تتوافق تماماً مع متطلبات قاعدة البيانات (type time)
        let formattedTime = examTime.trim();
        if (formattedTime.length === 5) {
          formattedTime += ":00"; // تحويل 14:00 إلى 14:00:00
        }

        const { data: subjectsList } = await supabase.from("subjects").select("id").limit(1);
        const defaultSubjectId = subjectsList && subjectsList.length > 0 ? subjectsList[0].id : null;

        const examRecord = {
          subject_id: defaultSubjectId,
          exam_type: title || "رسمي",
          exam_date: examDate,
          start_time: formattedTime || "09:00:00",
          location: description || "قاعة الامتحان",
          notes: description || null
        };

        const { error: examInsertError } = await supabase.from("exams").insert([examRecord]);
        if (examInsertError) throw examInsertError;
        alert("تم إضافة الامتحان بنجاح وتفعيل العد التنازلي له في الصفحة الرئيسية!");
      } else {
        let imgPath = null;
        if (imageFile) {
          imgPath = await uploadImageToStorage(imageFile);
        }

        const newRecord: any = {
          type,
          title,
          description: description.trim() ? description.trim() : null,
          image_url: imgPath,
          due_date: type === "assignment" && dueDate ? dueDate : null,
        };

        const { error: insertError } = await supabase.from("announcements").insert([newRecord]);
        if (insertError) throw insertError;
        alert("تم نشر التبليغ بنجاح!");
      }

      setIsAddModalOpen(false);
      setTitle("");
      setDescription("");
      setImageFile(null);
      setExamDate("");
      setExamTime("");
      setDueDate("");
      setType("announcement");

      fetchAnnouncements();
    } catch (err: any) {
      alert("خطأ أثناء الحفظ: " + err.message);
    } finally {
      setSubmitting(false);
      setUploadingFile(false);
    }
  };

  const initiateDelete = (item: Announcement) => {
    setItemToDelete(item);
    setDeleteStep("confirm");
    setSwearInput("");
    setSwearError("");
  };

  const handleFirstConfirm = (yes: boolean) => {
    if (!yes) {
      setDeleteStep(null);
      setItemToDelete(null);
    } else {
      setDeleteStep("swear");
    }
  };

  const handleFinalDeleteAction = async () => {
    if (swearInput.trim() !== "والله") {
      setSwearError("أنت ليش تجذب ما حلف يعني ما متأكد!");
      return;
    }

    if (!itemToDelete) return;

    try {
      const targetTable = itemToDelete.type === "exam" ? "exams" : "announcements";
      const { error } = await supabase.from(targetTable).delete().eq("id", itemToDelete.id);
      
      if (error) throw error;
      setDeleteStep(null);
      setItemToDelete(null);
      fetchAnnouncements();
    } catch (err: any) {
      alert("خطأ أثناء الحذف: " + err.message);
    }
  };

  const getPublicImageUrl = (path: string | null) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return supabase.storage.from("lecture-pdfs").getPublicUrl(path).data.publicUrl;
  };

  const generalAnnouncements = announcements.filter(a => a.type === "announcement");
  const managementAnnouncements = announcements.filter(a => a.type === "management");
  const assignmentAnnouncements = announcements.filter(a => a.type === "assignment");
  const examAnnouncements = announcements.filter(a => a.type === "exam");

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
              <ArrowRight size={22} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">إدارة التبليغات والإعلانات</h1>
              <p className="text-sm text-slate-400">عرض مبوب ومرتب حسب الأقسام (إعلانات، إدارة، واجبات، امتحانات)</p>
            </div>
          </div>

          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 cursor-pointer">
            <Plus size={20} />
            <span>نشر تبليغ جديد</span>
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
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            
            <div className="flex flex-col rounded-3xl border border-slate-800 bg-[#111827] p-4 shadow-lg">
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-800">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Megaphone size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">الإعلانات العامة</h3>
                  <span className="text-[10px] text-slate-400">{generalAnnouncements.length} إعلان</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
                {generalAnnouncements.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-8">لا توجد إعلانات عامة</p>
                ) : (
                  generalAnnouncements.map((item) => renderAnnouncementCard(item, getPublicImageUrl, initiateDelete, setPreviewImage))
                )}
              </div>
            </div>

            <div className="flex flex-col rounded-3xl border border-slate-800 bg-[#111827] p-4 shadow-lg">
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-800">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">تبليغات الإدارة</h3>
                  <span className="text-[10px] text-slate-400">{managementAnnouncements.length} تبليغ</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
                {managementAnnouncements.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-8">لا توجد تبليغات إدارية</p>
                ) : (
                  managementAnnouncements.map((item) => renderAnnouncementCard(item, getPublicImageUrl, initiateDelete, setPreviewImage))
                )}
              </div>
            </div>

            <div className="flex flex-col rounded-3xl border border-slate-800 bg-[#111827] p-4 shadow-lg">
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-800">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <CheckSquare size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">تبليغات الواجبات</h3>
                  <span className="text-[10px] text-slate-400">{assignmentAnnouncements.length} واجب</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
                {assignmentAnnouncements.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-8">لا توجد تبليغات واجبات</p>
                ) : (
                  assignmentAnnouncements.map((item) => renderAnnouncementCard(item, getPublicImageUrl, initiateDelete, setPreviewImage))
                )}
              </div>
            </div>

            <div className="flex flex-col rounded-3xl border border-slate-800 bg-[#111827] p-4 shadow-lg">
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-800">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">تبليغات الامتحانات</h3>
                  <span className="text-[10px] text-slate-400">{examAnnouncements.length} امتحان</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
                {examAnnouncements.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-8">لا توجد تبليغات امتحانات</p>
                ) : (
                  examAnnouncements.map((item) => renderAnnouncementCard(item, getPublicImageUrl, initiateDelete, setPreviewImage))
                )}
              </div>
            </div>

          </div>
        )}

        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">نشر تبليغ أو إعلان جديد</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 cursor-pointer"><X size={20} /></button>
              </div>

              <form onSubmit={handleAddAnnouncement} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">نوع التبليغ / الإعلان</label>
                  <select 
                    value={type} 
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-white outline-none focus:border-indigo-500"
                  >
                    <option value="announcement">📢 إعلان عام</option>
                    <option value="exam">📝 تبليغ امتحان (يُفعل العد التنازلي بالرئيسية)</option>
                    <option value="assignment">📋 تبليغ واجب</option>
                    <option value="management">🏛️ تبليغ إدارة</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    {type === "exam" ? "نوع أو عنوان الامتحان (مثل: نهائي / شهري)" : type === "assignment" ? "اسم الواجب" : "عنوان التبليغ"}
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-white outline-none focus:border-indigo-500" 
                    placeholder="اكتب العنوان هنا..." 
                  />
                </div>

                {type === "exam" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-2 block text-xs font-medium text-slate-300">تاريخ الامتحان</label>
                      <input 
                        type="date" 
                        required 
                        value={examDate} 
                        onChange={(e) => setExamDate(e.target.value)} 
                        className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3 text-white outline-none focus:border-indigo-500 text-xs" 
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-medium text-slate-300">وقت البدء (صيغة رقمية 24 ساعة)</label>
                      <input 
                        type="time" 
                        required 
                        value={examTime} 
                        onChange={(e) => setExamTime(e.target.value)} 
                        className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3 text-white outline-none focus:border-indigo-500 text-xs" 
                      />
                    </div>
                  </div>
                )}

                {type === "assignment" && (
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-300">موعد التسليم النهائي</label>
                    <input 
                      type="date" 
                      required 
                      value={dueDate} 
                      onChange={(e) => setDueDate(e.target.value)} 
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-white outline-none focus:border-indigo-500 text-xs" 
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    {type === "exam" ? "القاعة أو الملاحظات" : "الوصف أو التفاصيل"}
                  </label>
                  <textarea 
                    rows={3} 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-white outline-none focus:border-indigo-500" 
                    placeholder={type === "exam" ? "اسم القاعة أو الملاحظات..." : "محتوى التبليغ أو التعليمات..."} 
                  />
                </div>

                {type !== "exam" && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">رفع صورة (اختياري)</label>
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900 p-4 hover:border-indigo-500">
                      <ImageIcon size={20} className="text-indigo-400" />
                      <span className="text-sm font-medium text-slate-300">{imageFile ? imageFile.name : "اختر صورة للإعلان"}</span>
                      <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="hidden" />
                    </label>
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-2xl border border-slate-800 px-6 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800 cursor-pointer">إلغاء</button>
                  <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer">
                    {submitting && <Loader2 size={18} className="animate-spin" />}
                    <span>{uploadingFile ? "جاري الرفع..." : "نشر التبليغ"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {previewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md" onClick={() => setPreviewImage(null)}>
            <div className="relative max-w-4xl max-h-[90vh]">
              <button onClick={() => setPreviewImage(null)} className="absolute -top-12 right-0 rounded-xl bg-slate-800 p-2 text-white hover:bg-slate-700 cursor-pointer">
                <X size={24} />
              </button>
              <img src={previewImage} alt="معاينة تكبير" className="max-h-[85vh] max-w-full rounded-2xl object-contain border border-slate-800 shadow-2xl" />
            </div>
          </div>
        )}

        {deleteStep === "swear" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-2xl text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">قسم الحذف المؤكد</h3>
              <p className="text-sm text-slate-400 mb-4">إذا متأكد من حذف هذا التبليغ، احلف بالله واكتب كلمة <span className="font-bold text-indigo-400">والله</span> في الحقل أدناه:</p>

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
                <button onClick={() => setDeleteStep(null)} className="flex-1 rounded-2xl border border-slate-800 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800 cursor-pointer">
                  إلغاء
                </button>
                <button onClick={handleFinalDeleteAction} className="flex-1 rounded-2xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 cursor-pointer">
                  تم / تأكيد
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteStep === "confirm" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-2xl text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">تأكيد الحذف</h3>
              <p className="text-sm text-slate-400 mb-6">أنت متأكد تريد حذف هذا التبليغ؟</p>
              
              <div className="flex gap-3">
                <button onClick={() => handleFirstConfirm(false)} className="flex-1 rounded-2xl border border-slate-800 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800 cursor-pointer">
                  لا
                </button>
                <button onClick={() => handleFirstConfirm(true)} className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 shadow-lg shadow-red-600/20 cursor-pointer">
                  نعم
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function renderAnnouncementCard(
  item: Announcement, 
  getPublicImageUrl: (path: string | null) => string, 
  initiateDelete: (item: Announcement) => void, 
  setPreviewImage: (url: string) => void
) {
  const imgUrl = getPublicImageUrl(item.image_url);

  return (
    <div key={item.id} className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm hover:border-slate-700 transition-all">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-white text-sm line-clamp-1">{item.title}</h4>
          <button onClick={() => initiateDelete(item)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors shrink-0 cursor-pointer" title="حذف">
            <Trash2 size={13} />
          </button>
        </div>

        {item.description && (
          <p className="text-xs text-slate-300 mb-3 whitespace-pre-wrap leading-relaxed line-clamp-3">{item.description}</p>
        )}

        {item.type === "exam" && (
          <div className="mb-3 rounded-xl bg-slate-950 p-2.5 text-[11px] space-y-1 text-slate-300 border border-slate-800">
            {item.exam_date && (
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-rose-400" />
                <span>التاريخ: {item.exam_date}</span>
              </div>
            )}
            {item.exam_time && (
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-rose-400" />
                <span>الوقت: {item.exam_time}</span>
              </div>
            )}
          </div>
        )}

        {item.type === "assignment" && item.due_date && (
          <div className="mb-3 rounded-xl bg-slate-950 p-2.5 text-[11px] flex items-center gap-1.5 text-slate-300 border border-slate-800">
            <Calendar size={13} className="text-emerald-400" />
            <span>التسليم: {item.due_date}</span>
          </div>
        )}

        {imgUrl && (
          <div 
            onClick={() => setPreviewImage(imgUrl)}
            className="relative mb-3 aspect-video w-full cursor-pointer overflow-hidden rounded-xl bg-slate-950 border border-slate-800"
          >
            <img src={imgUrl} alt="صورة التبليغ" className="h-full w-full object-cover hover:scale-105 transition-transform" />
          </div>
        )}
      </div>

      <span className="text-[9px] text-slate-500 pt-2 border-t border-slate-800/60 block">
        {new Date(item.created_at || "").toLocaleString("ar-IQ", { dateStyle: "short", timeStyle: "short" })}
      </span>
    </div>
  );
}