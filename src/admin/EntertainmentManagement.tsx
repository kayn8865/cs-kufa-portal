import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Gamepad2, Plus, Edit3, Trash2, ArrowRight, Loader2, AlertCircle, X, ExternalLink, Globe, Video, Tv, FileText } from "lucide-react";

type EntertainmentItem = {
  id: string;
  title: string;
  description: string;
  content_type: string;
  image_url: string;
  url: string;
};

export default function EntertainmentManagement() {
  const [items, setItems] = useState<EntertainmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EntertainmentItem | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState("Website");
  const [imageUrl, setImageUrl] = useState("");
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("entertainment").select("*");
      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      setError("حدث خطأ أثناء جلب المحتوى.");
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
    setContentType("Website");
    setImageUrl("");
    setUrl("");
    setIsModalOpen(true);
  };

  const openEditModal = (item: EntertainmentItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description);
    setContentType(item.content_type || "Website");
    setImageUrl(item.image_url || "");
    setUrl(item.url);
    setIsModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const itemData = {
        title,
        description,
        content_type: contentType,
        image_url: imageUrl,
        url,
      };

      if (editingItem) {
        const { error } = await supabase.from("entertainment").update(itemData).eq("id", editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("entertainment").insert([itemData]);
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
      const { error } = await supabase.from("entertainment").delete().eq("id", id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert("خطأ أثناء الحذف: " + err.message);
    }
  };

  // دالة صغيرة لاختيار الأيقونة المناسبة لنوع المحتوى
  const renderContentIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "video":
        return <Video size={16} />;
      case "program":
        return <Tv size={16} />;
      case "article":
        return <FileText size={16} />;
      default:
        return <Globe size={16} />;
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950 text-right">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition-colors">
              <ArrowRight size={22} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">إدارة المحتوى الترفيهي والمفيد</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">إدارة الروابط والبرامج والمقالات المفيدة للطلاب</p>
            </div>
          </div>

          <button onClick={openAddModal} className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer">
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
            <Gamepad2 size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">لا توجد عناصر ترفيهية مضافة حالياً</h3>
          </div>
        ) : (
          /* شبكة عرض العناصر بشكل كروت مميزة تحتوي الصورة والعنوان والوصف */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.id} className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                {/* صورة المحتوى مع التظليل والبادج */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <Gamepad2 size={48} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                  
                  {/* شارة نوع المحتوى */}
                  <span className="absolute top-4 right-4 flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/80 backdrop-blur-md px-3 py-1 text-xs font-semibold text-indigo-300 shadow-md">
                    {renderContentIcon(item.content_type)}
                    <span>{item.content_type}</span>
                  </span>
                </div>

                {/* التفاصيل (العنوان والوصف تحت الصورة) */}
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-3">
                      {item.description || "لا يوجد وصف محدد لهذا المحتوى."}
                    </p>
                  </div>

                  {/* الروابط والأزرار في أسفل الكارت */}
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800/80">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                    >
                      <ExternalLink size={14} />
                      <span>زيارة الرابط</span>
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition-colors cursor-pointer"
                        title="تعديل"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 transition-colors cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* نافذة الإضافة والتعديل */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{editingItem ? "تعديل العنصر" : "إضافة عنصر جديد"}</h3>
                <button onClick={() => setIsModalOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"><X size={20} /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">العنوان</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">الوصف</label>
                  <textarea rows={3} required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">نوع المحتوى (Content Type)</label>
                  <select value={contentType} onChange={(e) => setContentType(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                    <option value="Website">موقع (Website)</option>
                    <option value="Video">فيديو (Video)</option>
                    <option value="Program">برنامج (Program)</option>
                    <option value="Article">مقال (Article)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">رابط العنصر (URL)</label>
                  <input type="url" required value={url} onChange={(e) => setUrl(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white" dir="ltr" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">رابط الصورة (Image URL)</label>
                  <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white" dir="ltr" />
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer">إلغاء</button>
                  <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer">
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