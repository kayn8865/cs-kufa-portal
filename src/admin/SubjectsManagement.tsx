import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { BookOpen, Plus, Trash2, Edit3, ArrowRight, Loader2, AlertCircle, X, Image as ImageIcon } from "lucide-react";

type Subject = {
  id: string;
  name: string;
  image_url: string | null;
  created_at?: string;
};

export default function SubjectsManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Modal إضافة مادة
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Modal تعديل مادة
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editName, setEditName] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");

  // نظام الحلفان الخطير للحذف
  const [deleteStep, setDeleteStep] = useState<"confirm" | "swear" | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [swearInput, setSwearInput] = useState("");
  const [swearError, setSwearError] = useState("");

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubjects(data || []);
    } catch (err: any) {
      setError("حدث خطأ أثناء جلب المواد الدراسية: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const openAddModal = () => {
    setName("");
    setImageUrl("");
    setIsAddModalOpen(true);
  };

  const handleAddSubject = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from("subjects").insert([
        {
          name,
          image_url: imageUrl.trim() ? imageUrl.trim() : null,
        },
      ]);
      if (error) throw error;

      setIsAddModalOpen(false);
      fetchSubjects();
      alert("تم إضافة المادة بنجاح!");
    } catch (err: any) {
      alert("خطأ أثناء الحفظ: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // فتح نافذة التعديل
  const openEditModal = (e: React.MouseEvent, subject: Subject) => {
    e.stopPropagation();
    setEditingSubject(subject);
    setEditName(subject.name);
    setEditImageUrl(subject.image_url || "");
    setIsEditModalOpen(true);
  };

  const handleEditSubject = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("subjects")
        .update({
          name: editName,
          image_url: editImageUrl.trim() ? editImageUrl.trim() : null,
        })
        .eq("id", editingSubject.id);

      if (error) throw error;

      setIsEditModalOpen(false);
      setEditingSubject(null);
      fetchSubjects();
      alert("تم تعديل المادة بنجاح!");
    } catch (err: any) {
      alert("خطأ أثناء التعديل: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // خطوات الحذف مع الحلفان
  const initiateDelete = (e: React.MouseEvent, subject: Subject) => {
    e.stopPropagation();
    setSubjectToDelete(subject);
    setDeleteStep("confirm");
    setSwearInput("");
    setSwearError("");
  };

  const handleFirstConfirm = (yes: boolean) => {
    if (!yes) {
      setDeleteStep(null);
      setSubjectToDelete(null);
    } else {
      setDeleteStep("swear");
    }
  };

  const handleFinalDeleteAction = async () => {
    if (swearInput.trim() !== "والله") {
      setSwearError("أنت ليش تجذب ما حلف يعني ما متأكد!");
      return;
    }

    if (!subjectToDelete) return;

    try {
      const { error } = await supabase.from("subjects").delete().eq("id", subjectToDelete.id);
      if (error) throw error;
      setDeleteStep(null);
      setSubjectToDelete(null);
      fetchSubjects();
    } catch (err: any) {
      alert("خطأ أثناء الحذف: " + err.message);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
              <ArrowRight size={22} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">إدارة المواد الدراسية</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">إضافة وتعديل المواد وصورها في النظام</p>
            </div>
          </div>

          <button onClick={openAddModal} className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700">
            <Plus size={20} />
            <span>إضافة مادة جديدة</span>
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
        ) : subjects.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <BookOpen size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">لا توجد مواد دراسية مسجلة حالياً</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {subjects.map((subject) => (
              <div 
                key={subject.id} 
                className="group relative flex flex-col items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-indigo-500/50 transition-all dark:border-slate-800 dark:bg-slate-900 text-center"
              >
                {/* أزرار التعديل والحذف فوق الصورة */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                  <button onClick={(e) => openEditModal(e, subject)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 transition-colors" title="تعديل المادة">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={(e) => initiateDelete(e, subject)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 transition-colors" title="حذف المادة">
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* أيقونة أو صورة المادة بحجم كبير وواضح - النقر عليها يأخذك لواجهة المحاضرات */}
                <div 
                  onClick={() => navigate(`/admin/subjects/${subject.id}/lectures`)}
                  className="my-4 flex h-32 w-32 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 shadow-inner overflow-hidden border border-slate-100 dark:border-slate-800 cursor-pointer group-hover:scale-105 transition-transform duration-300"
                  title="انقر لإدارة محاضرات المادة"
                >
                  {subject.image_url ? (
                    <img src={subject.image_url} alt={subject.name} className="h-full w-full object-cover" />
                  ) : (
                    <BookOpen size={56} />
                  )}
                </div>

                {/* اسم المادة تحت الأيقونة - النقر عليه أيضاً يأخذك لصفحة المحاضرات */}
                <h3 
                  onClick={() => navigate(`/admin/subjects/${subject.id}/lectures`)}
                  className="text-xl font-bold text-slate-900 dark:text-white mt-2 mb-1 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {subject.name}
                </h3>
              </div>
            ))}
          </div>
        )}

        {/* Modal إضافة مادة */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">إضافة مادة دراسية جديدة</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddSubject} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">اسم المادة</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white" placeholder="مثال: قواعد البيانات" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">رابط أو مسار الصورة (image_url) - اختياري</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                      <ImageIcon size={20} />
                    </span>
                    <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 pr-12 text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white" placeholder="https://example.com/image.png" dir="ltr" />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800">إلغاء</button>
                  <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
                    {submitting && <Loader2 size={18} className="animate-spin" />}
                    <span>إضافة المادة</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal تعديل مادة */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">تعديل المادة الدراسية</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20} /></button>
              </div>
              <form onSubmit={handleEditSubject} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">اسم المادة</label>
                  <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">رابط أو مسار الصورة (image_url)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                      <ImageIcon size={20} />
                    </span>
                    <input type="text" value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 pr-12 text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white" dir="ltr" />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800">إلغاء</button>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">تأكيد الحذف</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">أنت متأكد تريد حذف المادة "{subjectToDelete?.name}"؟</p>
              
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