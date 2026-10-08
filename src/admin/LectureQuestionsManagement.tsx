import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { HelpCircle, Plus, Trash2, Edit3, ArrowRight, Loader2, AlertCircle, X, Image as ImageIcon } from "lucide-react";

type LectureQuestion = {
  id: string;
  lecture_id: string;
  title: string;
  question_image_url: string | null;
  answer_image_url: string | null;
  created_at?: string;
};

type Lecture = {
  id: string;
  title: string;
  lecture_number: number;
};

export default function LectureQuestionsManagement() {
  const { lectureId } = useParams<{ lectureId: string }>();
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [questions, setQuestions] = useState<LectureQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal إضافة سؤال
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Modal تعديل سؤال
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<LectureQuestion | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editQuestionFile, setEditQuestionFile] = useState<File | null>(null);
  const [editAnswerFile, setEditAnswerFile] = useState<File | null>(null);

  // معاينة الصور الكبيرة (Zoom Modal)
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // نظام الحلفان الصارم للحذف
  const [deleteStep, setDeleteStep] = useState<"confirm" | "swear" | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<LectureQuestion | null>(null);
  const [swearInput, setSwearInput] = useState("");
  const [swearError, setSwearError] = useState("");

  const fetchLectureAndQuestions = async () => {
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

      const { data: qData, error: qError } = await supabase
        .from("lecture_questions")
        .select("*")
        .eq("lecture_id", lectureId)
        .order("created_at", { ascending: false });

      if (qError) throw qError;
      setQuestions(qData || []);
    } catch (err: any) {
      setError("حدث خطأ أثناء جلب الأسئلة: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLectureAndQuestions();
  }, [lectureId]);

  const uploadImageToStorage = async (file: File, folder: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("lecture-pdfs") // نستخدم نفس الباكت أو باكت مخصص للصور
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      return filePath;
    } catch (err: any) {
      alert("خطأ أثناء رفع الصورة: " + err.message);
      return null;
    }
  };

  const handleAddQuestion = async (e: FormEvent) => {
    e.preventDefault();
    if (!lectureId) return;
    setSubmitting(true);
    setUploadingFiles(true);

    try {
      let qImgPath = null;
      let aImgPath = null;

      if (questionFile) {
        qImgPath = await uploadImageToStorage(questionFile, "questions");
      }
      if (answerFile) {
        aImgPath = await uploadImageToStorage(answerFile, "answers");
      }

      const { error } = await supabase.from("lecture_questions").insert([
        {
          lecture_id: lectureId,
          title,
          question_image_url: qImgPath,
          answer_image_url: aImgPath,
        },
      ]);

      if (error) throw error;

      setIsAddModalOpen(false);
      setTitle("");
      setQuestionFile(null);
      setAnswerFile(null);
      fetchLectureAndQuestions();
      alert("تم إضافة السؤال وصورة الحل بنجاح!");
    } catch (err: any) {
      alert("خطأ أثناء الحفظ: " + err.message);
    } finally {
      setSubmitting(false);
      setUploadingFiles(false);
    }
  };

  const openEditModal = (q: LectureQuestion) => {
    setEditingQuestion(q);
    setEditTitle(q.title);
    setEditQuestionFile(null);
    setEditAnswerFile(null);
    setIsEditModalOpen(true);
  };

  const handleEditQuestion = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    setSubmitting(true);
    setUploadingFiles(true);

    try {
      let qImgPath = editingQuestion.question_image_url;
      let aImgPath = editingQuestion.answer_image_url;

      if (editQuestionFile) {
        const newQPath = await uploadImageToStorage(editQuestionFile, "questions");
        if (newQPath) qImgPath = newQPath;
      }
      if (editAnswerFile) {
        const newAPath = await uploadImageToStorage(editAnswerFile, "answers");
        if (newAPath) aImgPath = newAPath;
      }

      const { error } = await supabase
        .from("lecture_questions")
        .update({
          title: editTitle,
          question_image_url: qImgPath,
          answer_image_url: aImgPath,
        })
        .eq("id", editingQuestion.id);

      if (error) throw error;

      setIsEditModalOpen(false);
      setEditingQuestion(null);
      fetchLectureAndQuestions();
      alert("تم تعديل السؤال بنجاح!");
    } catch (err: any) {
      alert("خطأ أثناء التعديل: " + err.message);
    } finally {
      setSubmitting(false);
      setUploadingFiles(false);
    }
  };

  const initiateDelete = (q: LectureQuestion) => {
    setQuestionToDelete(q);
    setDeleteStep("confirm");
    setSwearInput("");
    setSwearError("");
  };

  const handleFirstConfirm = (yes: boolean) => {
    if (!yes) {
      setDeleteStep(null);
      setQuestionToDelete(null);
    } else {
      setDeleteStep("swear");
    }
  };

  const handleFinalDeleteAction = async () => {
    if (swearInput.trim() !== "والله") {
      setSwearError("أنت ليش تجذب ما حلف يعني ما متأكد!");
      return;
    }

    if (!questionToDelete) return;

    try {
      const { error } = await supabase.from("lecture_questions").delete().eq("id", questionToDelete.id);
      if (error) throw error;
      setDeleteStep(null);
      setQuestionToDelete(null);
      fetchLectureAndQuestions();
    } catch (err: any) {
      alert("خطأ أثناء الحذف: " + err.message);
    }
  };

  const getPublicImageUrl = (path: string | null) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return supabase.storage.from("lecture-pdfs").getPublicUrl(path).data.publicUrl;
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
                إدارة أسئلة محاضرة: <span className="text-amber-400">{lecture?.title || "..."}</span>
              </h1>
              <p className="text-sm text-slate-400">إضافة وتعديل وحذف الأسئلة مع صور الأسئلة والحلول</p>
            </div>
          </div>

          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-600/20 hover:bg-amber-700">
            <Plus size={20} />
            <span>إضافة سؤال جديد</span>
          </button>
        </header>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 size={36} className="animate-spin text-amber-400" />
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-400">
            <AlertCircle size={36} className="mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-[#111827] p-12 text-center shadow-sm">
            <HelpCircle size={48} className="mx-auto mb-4 text-slate-600" />
            <h3 className="text-lg font-bold text-white">لا توجد أسئلة مسجلة لهذه المحاضرة حالياً</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {questions.map((q) => {
              const qImg = getPublicImageUrl(q.question_image_url);
              const aImg = getPublicImageUrl(q.answer_image_url);

              return (
                <div key={q.id} className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-[#111827] p-5 shadow-lg">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white">{q.title}</h3>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEditModal(q)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors" title="تعديل">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => initiateDelete(q)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="حذف">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {/* معاينة صورة السؤال */}
                      <div>
                        <span className="block text-xs font-medium text-slate-400 mb-1.5">صورة السؤال</span>
                        <div 
                          onClick={() => qImg && setPreviewImage(qImg)}
                          className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center"
                        >
                          {qImg ? (
                            <img src={qImg} alt="السؤال" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-slate-500">لا توجد صورة</span>
                          )}
                        </div>
                      </div>

                      {/* معاينة صورة الحل */}
                      <div>
                        <span className="block text-xs font-medium text-slate-400 mb-1.5">صورة الحل</span>
                        <div 
                          onClick={() => aImg && setPreviewImage(aImg)}
                          className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center"
                        >
                          {aImg ? (
                            <img src={aImg} alt="الحل" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-slate-500">لا توجد صورة</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal إضافة سؤال جديد */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">إضافة سؤال جديد مع الحل</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">عنوان السؤال</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-white outline-none focus:border-amber-500" placeholder="مثال: السؤال الأول (فرع A)" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">صورة السؤال</label>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900 p-4 hover:border-amber-500">
                    <ImageIcon size={20} className="text-amber-400" />
                    <span className="text-sm font-medium text-slate-300">{questionFile ? questionFile.name : "اختر صورة السؤال"}</span>
                    <input type="file" accept="image/*" onChange={(e) => setQuestionFile(e.target.files?.[0] || null)} className="hidden" />
                  </label>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">صورة الإجابة / الحل</label>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900 p-4 hover:border-amber-500">
                    <ImageIcon size={20} className="text-emerald-400" />
                    <span className="text-sm font-medium text-slate-300">{answerFile ? answerFile.name : "اختر صورة الإجابة"}</span>
                    <input type="file" accept="image/*" onChange={(e) => setAnswerFile(e.target.files?.[0] || null)} className="hidden" />
                  </label>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-2xl border border-slate-800 px-6 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800">إلغاء</button>
                  <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-2xl bg-amber-600 px-6 py-3 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50">
                    {submitting && <Loader2 size={18} className="animate-spin" />}
                    <span>{uploadingFiles ? "جاري الرفع..." : "إضافة السؤال"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal تعديل سؤال */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">تعديل السؤال والحل</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800"><X size={20} /></button>
              </div>
              <form onSubmit={handleEditQuestion} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">عنوان السؤال</label>
                  <input type="text" required value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-white outline-none focus:border-amber-500" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">تحديث صورة السؤال (اختياري)</label>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900 p-4 hover:border-amber-500">
                    <ImageIcon size={20} className="text-amber-400" />
                    <span className="text-sm font-medium text-slate-300">{editQuestionFile ? editQuestionFile.name : "اختر صورة سؤال جديدة"}</span>
                    <input type="file" accept="image/*" onChange={(e) => setEditQuestionFile(e.target.files?.[0] || null)} className="hidden" />
                  </label>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">تحديث صورة الإجابة (اختياري)</label>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900 p-4 hover:border-amber-500">
                    <ImageIcon size={20} className="text-emerald-400" />
                    <span className="text-sm font-medium text-slate-300">{editAnswerFile ? editAnswerFile.name : "اختر صورة إجابة جديدة"}</span>
                    <input type="file" accept="image/*" onChange={(e) => setEditAnswerFile(e.target.files?.[0] || null)} className="hidden" />
                  </label>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="rounded-2xl border border-slate-800 px-6 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800">إلغاء</button>
                  <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-2xl bg-amber-600 px-6 py-3 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50">
                    {submitting && <Loader2 size={18} className="animate-spin" />}
                    <span>{uploadingFiles ? "جاري الرفع..." : "حفظ التعديلات"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* نافذة معاينة الصورة بحجم كبير */}
        {previewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md" onClick={() => setPreviewImage(null)}>
            <div className="relative max-w-4xl max-h-[90vh]">
              <button onClick={() => setPreviewImage(null)} className="absolute -top-12 right-0 rounded-xl bg-slate-800 p-2 text-white hover:bg-slate-700">
                <X size={24} />
              </button>
              <img src={previewImage} alt="معاينة تكبير" className="max-h-[85vh] max-w-full rounded-2xl object-contain border border-slate-800 shadow-2xl" />
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
              <p className="text-sm text-slate-400 mb-6">أنت متأكد تريد حذف السؤال "{questionToDelete?.title}"؟</p>
              
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
              <p className="text-sm text-slate-400 mb-4">إذا متأكد، احلف بالله واكتب كلمة <span className="font-bold text-amber-400">والله</span> في الحقل أدناه:</p>

              <input
                type="text"
                value={swearInput}
                onChange={(e) => {
                  setSwearInput(e.target.value);
                  setSwearError("");
                }}
                placeholder="اكتب: والله"
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-center text-white outline-none focus:border-amber-500 mb-2"
              />

              {swearError && (
                <p className="text-xs font-bold text-red-400 mb-4 animate-bounce">{swearError}</p>
              )}

              <div className="flex gap-3 mt-4">
                <button onClick={() => setDeleteStep(null)} className="flex-1 rounded-2xl border border-slate-800 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800">
                  إلغاء
                </button>
                <button onClick={handleFinalDeleteAction} className="flex-1 rounded-2xl bg-amber-600 py-3 text-sm font-bold text-white hover:bg-amber-700 shadow-lg shadow-amber-600/20">
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