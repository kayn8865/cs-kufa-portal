import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Plus, Trash2, ArrowRight, Loader2, AlertCircle, X, Image as ImageIcon, Calendar, Clock, BookOpen, CheckSquare, ShieldAlert, Megaphone, Edit3 } from "lucide-react";

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

  // Modal تعديل إعلان/تبليغ
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [editType, setEditType] = useState<"exam" | "assignment" | "management" | "announcement">("announcement");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editExamDate, setEditExamDate] = useState("");
  const [editExamTime, setEditExamTime] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editingSubmitting, setEditingSubmitting] = useState(false);

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

      const { data: annData, error: annError } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (annError) throw annError;

      const { data: examsData, error: examsError } = await supabase
        .from("exams")
        .select("*, subjects(name)")
        .order("exam_date", { ascending: true });

      if (examsError) throw examsError;

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

  const sendPushNotification = async (notificationTitle: string, notificationBody: string) => {
    try {
      // ضع الـ REST API Key الخاص بك هنا بين علامتي التنصيص
      const apiKey = "ضع_هنا_REST_API_KEY_الخاص_بك"; 

      const response = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": `Basic ${apiKey.trim()}`
        },
        body: JSON.stringify({
          app_id: "cdce7558-a5ac-4dbe-b2e7-5cd86ef012f4",
          included_segments: ["Subscribed Users", "Total Subscriptions"],
          headings: { ar: notificationTitle, en: notificationTitle },
          contents: { ar: notificationBody, en: notificationBody },
          url: `${window.location.origin}/#/announcements`
        })
      });

      const result = await response.json();
      console.log("استجابة سيرفر OneSignal:", result);

      if (result.errors) {
        console.error("خطأ من OneSignal:", result.errors);
      }
    } catch (err) {
      console.error("خطأ أثناء إرسال الإشعار:", err);
    }
  };

  const handleAddAnnouncement = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setUploadingFile(true);

    try {
      if (type === "exam") {
        let formattedTime = examTime.trim();
        if (formattedTime.length === 5) {
          formattedTime += ":00";
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

        await sendPushNotification("📝 تبليغ امتحان جديد", title);

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

        const badgeTitleMap: Record<string, string> = {
          announcement: "📢 إعلان عام جديد",
          management: "🏛️ تبليغ إداري جديد",
          assignment: "📋 واجب جديد مطلوب"
        };
        await sendPushNotification(badgeTitleMap[type] || "تنبيه جديد من القسم", title);

        alert("تم نشر التبليغ بنجاح وإرسال الإشعارات للهواتف!");
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

  const initiateEdit = (item: Announcement) => {
    setEditingItem(item);
    setEditType(item.type);
    setEditTitle(item.title);
    setEditDescription(item.description || "");
    setEditImageFile(null);
    setEditExamDate(item.exam_date || "");
    setEditExamTime(item.exam_time || "");
    setEditDueDate(item.due_date || "");
    setIsEditModalOpen(true);
  };

  const handleEditAnnouncement = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setEditingSubmitting(true);

    try {
      if (editingItem.type === "exam" || editType === "exam") {
        let formattedTime = editExamTime.trim();
        if (formattedTime.length === 5) {
          formattedTime += ":00";
        }

        const examRecord = {
          exam_type: editTitle || "رسمي",
          exam_date: editExamDate,
          start_time: formattedTime || "09:00:00",
          location: editDescription || "قاعة الامتحان",
          notes: editDescription || null
        };

        const { error: examUpdateError } = await supabase
          .from("exams")
          .update(examRecord)
          .eq("id", editingItem.id);

        if (examUpdateError) throw examUpdateError;
        alert("تم تحديث الامتحان بنجاح!");
      } else {
        let imgPath = editingItem.image_url;
        if (editImageFile) {
          const uploadedPath = await uploadImageToStorage(editImageFile);
          if (uploadedPath) imgPath = uploadedPath;
        }

        const updatedRecord: any = {
          type: editType,
          title: editTitle,
          description: editDescription.trim() ? editDescription.trim() : null,
          image_url: imgPath,
          due_date: editType === "assignment" && editDueDate ? editDueDate : null,
        };

        const { error: updateError } = await supabase
          .from("announcements")
          .update(updatedRecord)
          .eq("id", editingItem.id);

        if (updateError) throw updateError;
        alert("تم تحديث التبليغ بنجاح!");
      }

      setIsEditModalOpen(false);
      setEditingItem(null);
      fetchAnnouncements();
    } catch (err: any) {
      alert("خطأ أثناء التعديل: " + err.message);
    } finally {
      setEditingSubmitting(false);
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

  const renderAnnouncementCard = (
    item: Announcement,
    getImageUrl: (path: string | null) => string,
    onEdit: (item: Announcement) => void,
    onDelete: (item: Announcement) => void,
    onPreview: (url: string) => void
  ) => {
    const imgUrl = getImageUrl(item.image_url);

    return (
      <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</h4>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onEdit(item)} className="flex h-7 w-7 items-center justify-center rounded-lg dynamic-soft-bg dynamic-text hover:opacity-85 transition-colors cursor-pointer" title="تعديل">
              <Edit3 size={13} />
            </button>
            <button onClick={() => onDelete(item)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer" title="حذف">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {item.description && (
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{item.description}</p>
        )}

        {item.type === "exam" && (
          <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {item.exam_date && (
              <span className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-md">
                <Calendar size={12} className="text-rose-500" /> {item.exam_date}
              </span>
            )}
            {item.exam_time && (
              <span className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-md">
                <Clock size={12} className="text-rose-500" /> {item.exam_time}
              </span>
            )}
          </div>
        )}

        {item.type === "assignment" && item.due_date && (
          <div className="pt-1 text-[11px] text-amber-600 dark:text-amber-400">
            <span>موعد التسليم: {item.due_date}</span>
          </div>
        )}

        {imgUrl && (
          <div 
            onClick={() => onPreview(imgUrl)}
            className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center mt-1"
          >
            <img src={imgUrl} alt="مرفق" className="h-full w-full object-cover" />
          </div>
        )}
      </div>
    );
  };

  const generalAnnouncements = announcements.filter(a => a.type === "announcement");
  const managementAnnouncements = announcements.filter(a => a.type === "management");
  const assignmentAnnouncements = announcements.filter(a => a.type === "assignment");
  const examAnnouncements = announcements.filter(a => a.type === "exam");

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 text-slate-900 dark:text-white transition-colors duration-300">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <ArrowRight size={22} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">إدارة التبليغات والإعلانات</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">عرض مبوب ومرتب حسب الأقسام (إعلانات، إدارة، واجبات، امتحانات)</p>
            </div>
          </div>

          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center justify-center gap-2 rounded-2xl dynamic-bg px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:opacity-95 cursor-pointer">
            <Plus size={20} />
            <span>نشر تبليغ جديد</span>
          </button>
        </header>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 size={36} className="animate-spin dynamic-text" />
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-600 dark:text-red-400">
            <AlertCircle size={36} className="mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            
            <div className="flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 shadow-sm dark:shadow-lg">
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl dynamic-soft-bg dynamic-text">
                  <Megaphone size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">الإعلانات العامة</h3>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{generalAnnouncements.length} إعلان</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
                {generalAnnouncements.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-8">لا توجد إعلانات عامة</p>
                ) : (
                  generalAnnouncements.map((item) => renderAnnouncementCard(item, getPublicImageUrl, initiateEdit, initiateDelete, setPreviewImage))
                )}
              </div>
            </div>

            <div className="flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 shadow-sm dark:shadow-lg">
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">تبليغات الإدارة</h3>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{managementAnnouncements.length} تبليغ</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
                {managementAnnouncements.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-8">لا توجد تبليغات إدارية</p>
                ) : (
                  managementAnnouncements.map((item) => renderAnnouncementCard(item, getPublicImageUrl, initiateEdit, initiateDelete, setPreviewImage))
                )}
              </div>
            </div>

            <div className="flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 shadow-sm dark:shadow-lg">
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckSquare size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">تبليغات الواجبات</h3>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{assignmentAnnouncements.length} واجب</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
                {assignmentAnnouncements.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-8">لا توجد تبليغات واجبات</p>
                ) : (
                  assignmentAnnouncements.map((item) => renderAnnouncementCard(item, getPublicImageUrl, initiateEdit, initiateDelete, setPreviewImage))
                )}
              </div>
            </div>

            <div className="flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 shadow-sm dark:shadow-lg">
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">تبليغات الامتحانات</h3>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{examAnnouncements.length} امتحان</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
                {examAnnouncements.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-8">لا توجد تبليغات امتحانات</p>
                ) : (
                  examAnnouncements.map((item) => renderAnnouncementCard(item, getPublicImageUrl, initiateEdit, initiateDelete, setPreviewImage))
                )}
              </div>
            </div>

          </div>
        )}

        {/* Modal إضافة إعلان */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">نشر تبليغ أو إعلان جديد</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="rounded-xl p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"><X size={20} /></button>
              </div>

              <form onSubmit={handleAddAnnouncement} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">نوع التبليغ / الإعلان</label>
                  <select 
                    value={type} 
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3.5 text-slate-900 dark:text-white outline-none focus:border-[var(--color-primary)]"
                  >
                    <option value="announcement">📢 إعلان عام</option>
                    <option value="exam">📝 تبليغ امتحان (يُفعل العد التنازلي بالرئيسية)</option>
                    <option value="assignment">📋 تبليغ واجب</option>
                    <option value="management">🏛️ تبليغ إدارة</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {type === "exam" ? "نوع أو عنوان الامتحان (مثل: نهائي / شهري)" : type === "assignment" ? "اسم الواجب" : "عنوان التبليغ"}
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3.5 text-slate-900 dark:text-white outline-none focus:border-[var(--color-primary)]" 
                    placeholder="اكتب العنوان هنا..." 
                  />
                </div>

                {type === "exam" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">تاريخ الامتحان</label>
                      <input 
                        type="date" 
                        required 
                        value={examDate} 
                        onChange={(e) => setExamDate(e.target.value)} 
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 text-slate-900 dark:text-white outline-none focus:border-[var(--color-primary)] text-xs" 
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">وقت البدء (صيغة رقمية 24 ساعة)</label>
                      <input 
                        type="time" 
                        required 
                        value={examTime} 
                        onChange={(e) => setExamTime(e.target.value)} 
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 text-slate-900 dark:text-white outline-none focus:border-[var(--color-primary)] text-xs" 
                      />
                    </div>
                  </div>
                )}

                {type === "assignment" && (
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">موعد التسليم النهائي</label>
                    <input 
                      type="date" 
                      required 
                      value={dueDate} 
                      onChange={(e) => setDueDate(e.target.value)} 
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3.5 text-slate-900 dark:text-white outline-none focus:border-[var(--color-primary)] text-xs" 
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {type === "exam" ? "القاعة أو الملاحظات" : "الوصف أو التفاصيل"}
                  </label>
                  <textarea 
                    rows={3} 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3.5 text-slate-900 dark:text-white outline-none focus:border-[var(--color-primary)]" 
                    placeholder={type === "exam" ? "اسم القاعة أو الملاحظات..." : "محتوى التبليغ أو التعليمات..."} 
                  />
                </div>

                {type !== "exam" && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">رفع صورة (اختياري)</label>
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 hover:border-[var(--color-primary)]">
                      <ImageIcon size={20} className="dynamic-text" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{imageFile ? imageFile.name : "اختر صورة للإعلان"}</span>
                      <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="hidden" />
                    </label>
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-2xl border border-slate-200 dark:border-slate-800 px-6 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">إلغاء</button>
                  <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-2xl dynamic-bg px-6 py-3 text-sm font-bold text-white hover:opacity-95 disabled:opacity-50 cursor-pointer">
                    {submitting && <Loader2 size={18} className="animate-spin" />}
                    <span>{uploadingFile ? "جاري الرفع وإرسال الإشعارات..." : "نشر التبليغ"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal تعديل إعلان */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">تعديل معلومات الإعلان / التبليغ</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="rounded-xl p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"><X size={20} /></button>
              </div>

              <form onSubmit={handleEditAnnouncement} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">نوع التبليغ / الإعلان</label>
                  <select 
                    value={editType} 
                    onChange={(e: any) => setEditType(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3.5 text-slate-900 dark:text-white outline-none focus:border-[var(--color-primary)]"
                  >
                    <option value="announcement">📢 إعلان عام</option>
                    <option value="exam">📝 تبليغ امتحان</option>
                    <option value="assignment">📋 تبليغ واجب</option>
                    <option value="management">🏛️ تبليغ إدارة</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">العنوان</label>
                  <input 
                    type="text" 
                    required 
                    value={editTitle} 
                    onChange={(e) => setEditTitle(e.target.value)} 
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3.5 text-slate-900 dark:text-white outline-none focus:border-[var(--color-primary)]" 
                  />
                </div>

                {editType === "exam" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">تاريخ الامتحان</label>
                      <input 
                        type="date" 
                        required 
                        value={editExamDate} 
                        onChange={(e) => setEditExamDate(e.target.value)} 
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 text-slate-900 dark:text-white outline-none focus:border-[var(--color-primary)] text-xs" 
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">وقت البدء</label>
                      <input 
                        type="time" 
                        required 
                        value={editExamTime} 
                        onChange={(e) => setEditExamTime(e.target.value)} 
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 text-slate-900 dark:text-white outline-none focus:border-[var(--color-primary)] text-xs" 
                      />
                    </div>
                  </div>
                )}

                {editType === "assignment" && (
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">موعد التسليم النهائي</label>
                    <input 
                      type="date" 
                      required 
                      value={editDueDate} 
                      onChange={(e) => setEditDueDate(e.target.value)} 
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3.5 text-slate-900 dark:text-white outline-none focus:border-[var(--color-primary)] text-xs" 
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">الوصف أو التفاصيل</label>
                  <textarea 
                    rows={3} 
                    value={editDescription} 
                    onChange={(e) => setEditDescription(e.target.value)} 
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3.5 text-slate-900 dark:text-white outline-none focus:border-[var(--color-primary)]" 
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">تغيير الصورة (اختياري)</label>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 hover:border-[var(--color-primary)]">
                    <ImageIcon size={20} className="dynamic-text" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{editImageFile ? editImageFile.name : "اختر صورة جديدة"}</span>
                    <input type="file" accept="image/*" onChange={(e) => setEditImageFile(e.target.files?.[0] || null)} className="hidden" />
                  </label>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="rounded-2xl border border-slate-200 dark:border-slate-800 px-6 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">إلغاء</button>
                  <button type="submit" disabled={editingSubmitting} className="flex items-center gap-2 rounded-2xl dynamic-bg px-6 py-3 text-sm font-bold text-white hover:opacity-95 disabled:opacity-50 cursor-pointer">
                    {editingSubmitting && <Loader2 size={18} className="animate-spin" />}
                    <span>حفظ التعديلات</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* نافذة الحلفان الصارم عند الحذف */}
        {deleteStep && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400">
                <AlertCircle size={28} />
              </div>

              {deleteStep === "confirm" ? (
                <>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">هل أنت متأكد من حذف هذا العنصر؟</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">لن يمكنك التراجع عن هذه الخطوة بعد إتمامها.</p>
                  <div className="flex justify-center gap-3 pt-2">
                    <button onClick={() => handleFirstConfirm(false)} className="rounded-2xl border border-slate-200 dark:border-slate-800 px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">إلغاء</button>
                    <button onClick={() => handleFirstConfirm(true)} className="rounded-2xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white cursor-pointer">نعم، متأكد</button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">تحقق صارم للحذف!</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">اكتب كلمة <span className="font-bold text-red-500">"والله"</span> في الحقل أدناه لتؤكد أنك متأكد تماماً:</p>
                  <input 
                    type="text" 
                    value={swearInput} 
                    onChange={(e) => setSwearInput(e.target.value)} 
                    placeholder="اكتب كلمة والله هنا" 
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 text-center text-slate-900 dark:text-white text-sm outline-none focus:border-red-500" 
                  />
                  {swearError && <p className="text-xs font-bold text-red-500">{swearError}</p>}
                  <div className="flex justify-center gap-3 pt-2">
                    <button onClick={() => setDeleteStep(null)} className="rounded-2xl border border-slate-200 dark:border-slate-800 px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">تراجع</button>
                    <button onClick={handleFinalDeleteAction} className="rounded-2xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white cursor-pointer">تنفيذ الحذف</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* نافذة معاينة الصورة الكبيرة */}
        {previewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setPreviewImage(null)}>
            <div className="relative max-w-4xl max-h-[90vh]">
              <button onClick={() => setPreviewImage(null)} className="absolute -top-12 left-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 cursor-pointer">
                <X size={24} />
              </button>
              <img src={previewImage} alt="معاينة" className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl" />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}