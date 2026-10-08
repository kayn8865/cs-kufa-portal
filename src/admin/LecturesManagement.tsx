import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { FileText, Plus, Trash2, Edit3, ArrowRight, Loader2, AlertCircle, X, Video, Upload } from "lucide-react";

type Lecture = {
  id: string;
  subject_id: string;
  title: string;
  lecture_number: number;
  description: string | null;
  pdf_url: string | null;
  youtube_url: string | null;
  created_at?: string;
};

type Subject = {
  id: string;
  name: string;
};

export default function LecturesManagement() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal إضافة محاضرة
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [lectureNumber, setLectureNumber] = useState(1);
  const [description, setDescription] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Modal تعديل محاضرة
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLectureNumber, setEditLectureNumber] = useState(1);
  const [editDescription, setEditDescription] = useState("");
  const [editPdfFile, setEditPdfFile] = useState<File | null>(null);
  const [editYoutubeUrl, setEditYoutubeUrl] = useState("");

  // نظام الحلفان الصارم للحذف
  const [deleteStep, setDeleteStep] = useState<"confirm" | "swear" | null>(null);
  const [lectureToDelete, setLectureToDelete] = useState<Lecture | null>(null);
  const [swearInput, setSwearInput] = useState("");
  const [swearError, setSwearError] = useState("");

  const fetchSubjectAndLectures = async () => {
    if (!subjectId) return;
    try {
      setLoading(true);
      setError(null);

      const { data: subData, error: subError } = await supabase
        .from("subjects")
        .select("id, name")
        .eq("id", subjectId)
        .single();

      if (subError) throw subError;
      setSubject(subData);

      const { data: lecData, error: lecError } = await supabase
        .from("lectures")
        .select("*")
        .eq("subject_id", subjectId)
        .order("lecture_number", { ascending: true });

      if (lecError) throw lecError;
      setLectures(lecData || []);
    } catch (err: any) {
      setError("حدث خطأ أثناء جلب البيانات: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjectAndLectures();
  }, [subjectId]);

  const openAddModal = () => {
    setTitle("");
    setLectureNumber(lectures.length + 1);
    setDescription("");
    setPdfFile(null);
    setYoutubeUrl("");
    setIsAddModalOpen(true);
  };

  const uploadPdfToStorage = async (file: File): Promise<string | null> => {
    try {
      setUploadingFile(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `lectures/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("lecture-pdfs")
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      return filePath;
    } catch (err: any) {
      alert("خطأ أثناء رفع ملف الـ PDF: " + err.message);
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAddLecture = async (e: FormEvent) => {
    e.preventDefault();
    if (!subjectId) return;
    setSubmitting(true);

    try {
      let uploadedPdfPath = null;
      if (pdfFile) {
        uploadedPdfPath = await uploadPdfToStorage(pdfFile);
      }

      const { error } = await supabase.from("lectures").insert([
        {
          subject_id: subjectId,
          title,
          lecture_number: Number(lectureNumber),
          description: description.trim() ? description.trim() : null,
          pdf_url: uploadedPdfPath,
          youtube_url: youtubeUrl.trim() ? youtubeUrl.trim() : null,
        },
      ]);
      if (error) throw error;

      setIsAddModalOpen(false);
      fetchSubjectAndLectures();
      alert("تم إضافة المحاضرة ورفع الملف بنجاح!");
    } catch (err: any) {
      alert("خطأ أثناء الحفظ: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (e: React.MouseEvent, lecture: Lecture) => {
    e.stopPropagation();
    setEditingLecture(lecture);
    setEditTitle(lecture.title);
    setEditLectureNumber(lecture.lecture_number);
    setEditDescription(lecture.description || "");
    setEditPdfFile(null);
    setEditYoutubeUrl(lecture.youtube_url || "");
    setIsEditModalOpen(true);
  };

  const handleEditLecture = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingLecture) return;
    setSubmitting(true);

    try {
      let uploadedPdfPath = editingLecture.pdf_url;
      if (editPdfFile) {
        const newPath = await uploadPdfToStorage(editPdfFile);
        if (newPath) uploadedPdfPath = newPath;
      }

      const { error } = await supabase
        .from("lectures")
        .update({
          title: editTitle,
          lecture_number: Number(editLectureNumber),
          description: editDescription.trim() ? editDescription.trim() : null,
          pdf_url: uploadedPdfPath,
          youtube_url: editYoutubeUrl.trim() ? editYoutubeUrl.trim() : null,
        })
        .eq("id", editingLecture.id);

      if (error) throw error;

      setIsEditModalOpen(false);
      setEditingLecture(null);
      fetchSubjectAndLectures();
      alert("تم تعديل المحاضرة بنجاح!");
    } catch (err: any) {
      alert("خطأ أثناء التعديل: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const initiateDelete = (e: React.MouseEvent, lecture: Lecture) => {
    e.stopPropagation();
    setLectureToDelete(lecture);
    setDeleteStep("confirm");
    setSwearInput("");
    setSwearError("");
  };

  const handleFirstConfirm = (yes: boolean) => {
    if (!yes) {
      setDeleteStep(null);
      setLectureToDelete(null);
    } else {
      setDeleteStep("swear");
    }
  };

  const handleFinalDeleteAction = async () => {
    if (swearInput.trim() !== "والله") {
      setSwearError("أنت ليش تجذب ما حلف يعني ما متأكد!");
      return;
    }

    if (!lectureToDelete) return;

    try {
      const { error } = await supabase.from("lectures").delete().eq("id", lectureToDelete.id);
      if (error) throw error;
      setDeleteStep(null);
      setLectureToDelete(null);
      fetchSubjectAndLectures();
    } catch (err: any) {
      alert("خطأ أثناء الحذف: " + err.message);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <Link to="/admin/subjects" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
              <ArrowRight size={22} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                محاضرات مادة: <span className="text-indigo-600 dark:text-indigo-400">{subject?.name || "..."}</span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">انقر على أي محاضرة لعرض تفاصيلها (PDF، الفيديوهات، الأسئلة، والواجبات)</p>
            </div>
          </div>

          <button onClick={openAddModal} className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700">
            <Plus size={20} />
            <span>إضافة محاضرة جديدة</span>
          </button>
        </header>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 size={36} className="animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-600 dark:border-red-500/20 dark:bg-red-500/10">
            <AlertCircle size={36} className="mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : lectures.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <FileText size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">لا توجد محاضرات مسجلة لهذه المادة حالياً</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lectures.map((lecture) => (
              <div 
                key={lecture.id} 
                onClick={() => navigate(`/admin/lectures/${lecture.id}/details`)}
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-indigo-500/50 transition-all dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
              >
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                      المحاضرة {lecture.lecture_number}
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => openEditModal(e, lecture)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 transition-colors" title="تعديل المحاضرة">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={(e) => initiateDelete(e, lecture)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 transition-colors" title="حذف المحاضرة">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">{lecture.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{lecture.description || "لا يوجد وصف لهذه المحاضرة."}</p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-500">
                  {lecture.pdf_url && (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                      <FileText size={14} /> PDF
                    </span>
                  )}
                  {lecture.youtube_url && (
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2.5 py-1 rounded-lg">
                      <Video size={14} /> فيديو
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal إضافة محاضرة */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">إضافة محاضرة جديدة</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddLecture} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">عنوان المحاضرة</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white" placeholder="مثال: مقدمة في قواعد البيانات" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">رقم المحاضرة</label>
                  <input type="number" required value={lectureNumber} onChange={(e) => setLectureNumber(Number(e.target.value))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">الوصف (اختياري)</label>
                  <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white" placeholder="ملخص محتوى المحاضرة..." />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">اختر ملف الـ PDF من جهازك</label>
                  <div className="flex items-center gap-3">
                    <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 hover:border-indigo-600 dark:border-slate-700 dark:bg-slate-950">
                      <Upload size={20} className="text-slate-400" />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {pdfFile ? pdfFile.name : "اضغط لاختيار ملف PDF"}
                      </span>
                      <input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} className="hidden" />
                    </label>
                    {pdfFile && (
                      <button type="button" onClick={() => setPdfFile(null)} className="rounded-xl p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">رابط فيديو اليوتيوب الرئيسي (اختياري)</label>
                  <input type="text" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white" placeholder="https://youtube.com/watch?v=..." dir="ltr" />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800">إلغاء</button>
                  <button type="submit" disabled={submitting || uploadingFile} className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
                    {(submitting || uploadingFile) && <Loader2 size={18} className="animate-spin" />}
                    <span>{uploadingFile ? "جاري رفع الملف..." : "إضافة المحاضرة"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal تعديل محاضرة */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">تعديل المحاضرة</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20} /></button>
              </div>
              <form onSubmit={handleEditLecture} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">عنوان المحاضرة</label>
                  <input type="text" required value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">رقم المحاضرة</label>
                  <input type="number" required value={editLectureNumber} onChange={(e) => setEditLectureNumber(Number(e.target.value))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">الوصف</label>
                  <textarea rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">تحديث ملف الـ PDF (اختياري)</label>
                  <div className="flex items-center gap-3">
                    <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 hover:border-indigo-600 dark:border-slate-700 dark:bg-slate-950">
                      <Upload size={20} className="text-slate-400" />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {editPdfFile ? editPdfFile.name : "اختر ملف PDF جديد (اختياري)"}
                      </span>
                      <input type="file" accept="application/pdf" onChange={(e) => setEditPdfFile(e.target.files?.[0] || null)} className="hidden" />
                    </label>
                    {editPdfFile && (
                      <button type="button" onClick={() => setEditPdfFile(null)} className="rounded-xl p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">رابط فيديو اليوتيوب</label>
                  <input type="text" value={editYoutubeUrl} onChange={(e) => setEditYoutubeUrl(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white" dir="ltr" />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800">إلغاء</button>
                  <button type="submit" disabled={submitting || uploadingFile} className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
                    {(submitting || uploadingFile) && <Loader2 size={18} className="animate-spin" />}
                    <span>{uploadingFile ? "جاري رفع الملف..." : "حفظ التعديلات"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* نافذة التأكيد الأولى بالحذف (لا / نعم) */}
        {deleteStep === "confirm" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">تأكيد الحذف</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">أنت متأكد تريد حذف المحاضرة "{lectureToDelete?.title}"؟</p>
              
              <div className="flex gap-3">
                <button onClick={() => handleFirstConfirm(false)} className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">قسم الحذف المؤكد</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">إذا متأكد، احلف بالله واكتب كلمة <span className="font-bold text-indigo-600 dark:text-indigo-400">والله</span> في الحقل أدناه:</p>

              <input
                type="text"
                value={swearInput}
                onChange={(e) => {
                  setSwearInput(e.target.value);
                  setSwearError("");
                }}
                placeholder="اكتب: والله"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-center text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white mb-2"
              />

              {swearError && (
                <p className="text-xs font-bold text-red-500 mb-4 animate-bounce">{swearError}</p>
              )}

              <div className="flex gap-3 mt-4">
                <button onClick={() => setDeleteStep(null)} className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800">
                  إلغاء
                </button>
                <button onClick={handleFinalDeleteAction} className="flex-1 rounded-2xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 shadow-lg shadow-red-600/20">
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