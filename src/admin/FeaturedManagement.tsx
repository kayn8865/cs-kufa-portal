import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { LayoutTemplate, Plus, Edit3, Trash2, ArrowRight, Loader2, AlertCircle, X } from "lucide-react";

type FeaturedItem = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  button_text: string | null;
  button_url: string | null;
  display_order: number;
  is_active: boolean;
};

export default function FeaturedManagement() {
  const [items, setItems] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FeaturedItem | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [buttonText, setButtonText] = useState("استكشف الآن");
  const [buttonUrl, setButtonUrl] = useState("/subjects");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("featured_content")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      setError("حدث خطأ أثناء جلب المحتوى المميز.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setTitle("");
    setDescription("");
    setImageUrl("");
    setButtonText("استكشف الآن");
    setButtonUrl("/subjects");
    setDisplayOrder("0");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (item: FeaturedItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description || "");
    setImageUrl(item.image_url || "");
    setButtonText(item.button_text || "استكشف الآن");
    setButtonUrl(item.button_url || "/subjects");
    setDisplayOrder(item.display_order.toString());
    setIsActive(item.is_active);
    setIsModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const itemData = {
        title,
        description: description || null,
        image_url: imageUrl || null,
        button_text: buttonText || null,
        button_url: buttonUrl || null,
        display_order: parseInt(displayOrder) || 0,
        is_active: isActive,
      };

      if (editingItem) {
        const { error } = await supabase.from("featured_content").update(itemData).eq("id", editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("featured_content").insert([itemData]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert("خطأ أثناء الحفظ: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    try {
      const { error } = await supabase.from("featured_content").delete().eq("id", id);
      if (error) throw error;
      fetchData();
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">إدارة المحتوى المميز (السلايدر)</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">التحكم بالعناصر البارزة في واجهة التطبيق الرئيسية</p>
            </div>
          </div>

          <button onClick={openAddModal} className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700">
            <Plus size={20} />
            <span>إضافة عنصر جديد</span>
          </button>
        </header>

        {loading ? (
          <div className="flex h-64 items-center justify-center"><Loader2 size={36} className="animate-spin text-indigo-600 dark:text-indigo-400" /></div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-600 dark:border-red-500/20 dark:bg-red-500/10"><AlertCircle size={36} className="mx-auto mb-2" /><p>{error}</p></div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <LayoutTemplate size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">لا توجد عناصر مميزة حالياً</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                    <LayoutTemplate size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${item.is_active ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {item.is_active ? 'مفعل' : 'معطل'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.description || "بدون وصف"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={() => openEditModal(item)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"><Edit3 size={18} /></button>
                  <button onClick={() => handleDelete(item.id)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{editingItem ? "تعديل العنصر" : "إضافة عنصر جديد"}</h3>
                <button onClick={() => setIsModalOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20} /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">العنوان</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">الوصف</label>
                  <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">نص الزر</label>
                    <input type="text" value={buttonText} onChange={(e) => setButtonText(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">رابط الزر</label>
                    <input type="text" value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white" dir="ltr" />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">رابط الصورة (Image URL)</label>
                  <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white" dir="ltr" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">ترتيب الظهور</label>
                    <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">الحالة</label>
                    <select value={isActive ? "true" : "false"} onChange={(e) => setIsActive(e.target.value === "true")} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                      <option value="true">مفعل</option>
                      <option value="false">معطل</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800">إلغاء</button>
                  <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
                    {submitting && <Loader2 size={18} className="animate-spin" />}
                    <span>حفظ</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}