import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import { Sparkles, Video, FileText, HelpCircle, ClipboardList, Clock } from "lucide-react";

type ActivityItem = {
  id: string;
  title: string;
  subject?: string;
  type: "lecture" | "assignment" | "question" | "entertainment";
  created_at: string;
  image_url?: string;
  url?: string;
};

export default function RecentUpdates() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentActivities() {
      setLoading(true);
      try {
        // حساب تاريخ قبل 48 ساعة من الآن
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

        // 1. جلب المحاضرات الحديثة
        const { data: lectures } = await supabase
          .from("lectures")
          .select("id, title, subject_name, created_at, file_url")
          .gte("created_at", fortyEightHoursAgo);

        // 2. جلب الواجبات الحديثة
        const { data: assignments } = await supabase
          .from("assignments")
          .select("id, title, subject_name, created_at")
          .gte("created_at", fortyEightHoursAgo);

        // 3. جلب الأسئلة الحديثة
        const { data: questions } = await supabase
          .from("questions")
          .select("id, title, subject_name, created_at")
          .gte("created_at", fortyEightHoursAgo);

        // 4. جلب المحتوى الترفيهي الحديث
        const { data: entertainment } = await supabase
          .from("entertainment")
          .select("id, title, type, image_url, url, created_at")
          .gte("created_at", fortyEightHoursAgo);

        // دمج وتنسيق كل البيانات في مصفوفة واحدة
        const allItems: ActivityItem[] = [
          ...(lectures || []).map((item: any) => ({
            id: item.id,
            title: item.title,
            subject: item.subject_name,
            type: "lecture" as const,
            created_at: item.created_at,
            url: item.file_url
          })),
          ...(assignments || []).map((item: any) => ({
            id: item.id,
            title: item.title,
            subject: item.subject_name,
            type: "assignment" as const,
            created_at: item.created_at
          })),
          ...(questions || []).map((item: any) => ({
            id: item.id,
            title: item.title,
            subject: item.subject_name,
            type: "question" as const,
            created_at: item.created_at
          })),
          ...(entertainment || []).map((item: any) => ({
            id: item.id,
            title: item.title,
            subject: `محتوى ترفيهي (${item.type})`,
            type: "entertainment" as const,
            created_at: item.created_at,
            image_url: item.image_url,
            url: item.url
          })),
        ];

        // ترتيب العناصر حسب الأحدث (من الأقرب للآن إلى الأقدم)
        allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setActivities(allItems);
      } catch (err) {
        console.error("Error fetching recent activities:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRecentActivities();
  }, []);

  // إذا لم تكن هناك أي إضافات خلال آخر 48 ساعة، لا تعرض شيئاً أو اعرض رسالة لطيفة
  if (!loading && activities.length === 0) {
    return null; 
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "lecture": return <FileText className="text-blue-500" size={18} />;
      case "assignment": return <ClipboardList className="text-amber-500" size={18} />;
      case "question": return <HelpCircle className="text-purple-500" size={18} />;
      case "entertainment": return <Video className="text-rose-500" size={18} />;
      default: return <Sparkles className="text-indigo-500" size={18} />;
    }
  };

  const getBadgeText = (type: string) => {
    switch (type) {
      case "lecture": return "محاضرة جديدة";
      case "assignment": return "واجب جديد";
      case "question": return "سؤال جديد";
      case "entertainment": return "محتوى ترفيهي";
      default: return "تحديث";
    }
  };

  return (
    <div className="my-6 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white p-6 shadow-sm dark:border-indigo-950 dark:from-slate-900 dark:to-indigo-950/20">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">آخر التحديثات (خلال 48 ساعة)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">تابع أحدث المحاضرات والواجبات والمواد المضافة فوراً</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-24 items-center justify-center">
          <p className="text-sm text-slate-400 animate-pulse">جاري جلب أحدث الإضافات...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {getIcon(item.type)}
                    {getBadgeText(item.type)}
                  </span>
                  {item.subject && (
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      {item.subject}
                    </span>
                  )}
                </div>

                {item.image_url && (
                  <div className="mb-3 h-32 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                    <img src={item.image_url} alt={item.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  </div>
                )}

                <h4 className="mb-2 font-bold text-slate-900 dark:text-white line-clamp-2">
                  {item.title}
                </h4>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/60">
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock size={12} />
                  {new Date(item.created_at).toLocaleDateString("ar-IQ", { hour: '2-digit', minute: '2-digit' })}
                </span>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    عرض الملف / الرابط ←
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}