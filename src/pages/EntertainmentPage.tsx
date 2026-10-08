import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import { Gamepad2, Video, Globe, FileText, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import PageContainer from "../components/PageContainer";

type EntertainmentItem = {
  id: string;
  title: string;
  description: string;
  type: "Video" | "Website" | "Program" | "Article";
  image_url: string;
  url: string;
};

export default function EntertainmentPage() {
  const [items, setItems] = useState<EntertainmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEntertainment() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("entertainment_items")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching entertainment:", error);
        setError("حدث خطأ أثناء جلب المحتوى. يرجى المحاولة لاحقاً.");
      } else {
        setItems(data || []);
      }
      setLoading(false);
    }

    fetchEntertainment();
  }, []);

  const getIconForType = (type: string) => {
    switch (type) {
      case "Video": return <Video size={20} />;
      case "Website": return <Globe size={20} />;
      case "Program": return <Gamepad2 size={20} />;
      case "Article": return <FileText size={20} />;
      default: return <ExternalLink size={20} />;
    }
  };

  return (
    <PageContainer
      title="المحتوى الترفيهي والمفيد"
      description="مجموعة من الروابط، البرامج، والمقالات المختارة لتطوير مهاراتك والترفيه عنك."
      icon={<Gamepad2 size={24} />}
    >
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <Loader2 size={32} className="animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-slate-500 dark:text-slate-400">جاري تحميل المحتوى...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-500/20 dark:bg-red-500/10">
          <AlertCircle size={48} className="mb-4 text-red-500" />
          <h3 className="mb-2 text-lg font-bold text-red-700 dark:text-red-400">عذراً، حدث خطأ</h3>
          <p className="text-red-600 dark:text-red-500">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Gamepad2 size={48} className="mb-4 text-slate-300 dark:text-slate-600" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">لا يوجد محتوى حالياً</h3>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            لم يتم إضافة أي محتوى ترفيهي أو مفيد حتى الآن.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <motion.a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-600">
                    {getIconForType(item.type)}
                  </div>
                )}
                <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-indigo-600 shadow-sm backdrop-blur-sm dark:bg-slate-900/90 dark:text-indigo-400">
                  {getIconForType(item.type)}
                  <span>{item.type}</span>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="mb-2 text-lg font-bold leading-tight text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {item.description}
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>زيارة الرابط</span>
                  <ExternalLink size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </PageContainer>
  );
}