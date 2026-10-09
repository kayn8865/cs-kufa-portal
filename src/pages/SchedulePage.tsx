import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Loader2, AlertCircle, BookOpen } from "lucide-react";
import PageContainer from "../components/PageContainer";

type ScheduleItem = {
  id: string;
  day_of_week: number;
  subject_id: string | null;
  start_time: string;
  end_time: string | null;
  location: string | null;
  notes: string | null;
  subjects?: { name: string } | null;
};

const daysMap = [
  { value: 0, label: "الأحد" },
  { value: 1, label: "الإثنين" },
  { value: 2, label: "الثلاثاء" },
  { value: 3, label: "الأربعاء" },
  { value: 4, label: "الخميس" },
  { value: 5, label: "الجمعة" },
  { value: 6, label: "السبت" },
];

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSchedule() {
      try {
        setLoading(true);
        setError(null);

        // جلب الجدول مع اسم المادة مرتباً حسب اليوم ثم وقت البدء
        const { data, error } = await supabase
          .from("schedule")
          .select("*, subjects(name)")
          .order("day_of_week", { ascending: true })
          .order("start_time", { ascending: true });

        if (error) throw error;
        setSchedule(data || []);
      } catch (err: any) {
        console.error("Error fetching schedule:", err.message);
        setError("حدث خطأ أثناء جلب الجدول. يرجى المحاولة لاحقاً.");
      } finally {
        setLoading(false);
      }
    }

    fetchSchedule();
  }, []);

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? "م" : "ص";
    const formattedHours = h % 12 || 12;
    return `${formattedHours}:${minutes} ${ampm}`;
  };

  // تجميع المواد حسب أيام الأسبوع لعرض كل يوم في بطاقة واحدة مستقلة
  const groupedSchedule = daysMap.map(day => {
    const items = schedule.filter(item => item.day_of_week === day.value);
    return { ...day, items };
  }).filter(group => group.items.length > 0);

  return (
    <PageContainer
      title="الجدول الأسبوعي"
      description="مواعيد المحاضرات والامتحانات الخاصة بك"
      icon={<Calendar size={24} />}
    >
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <Loader2 size={32} className="animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-slate-500 dark:text-slate-400">جاري تحميل الجدول...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-500/20 dark:bg-red-500/10">
          <AlertCircle size={48} className="mb-4 text-red-500" />
          <h3 className="mb-2 text-lg font-bold text-red-700 dark:text-red-400">عذراً، حدث خطأ</h3>
          <p className="text-red-600 dark:text-red-500">{error}</p>
        </div>
      ) : groupedSchedule.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Calendar size={48} className="mb-4 text-slate-300 dark:text-slate-600" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">لا يوجد جدول متاح</h3>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            لم يتم رفع أي محاضرات أو امتحانات في الجدول حتى الآن.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          {groupedSchedule.map((group, index) => (
            <motion.section
              key={group.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-slate-900 dark:text-white">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <Calendar size={20} />
                </span>
                يوم {group.label}
              </h2>

              <div className="flex flex-col gap-4">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950/50"
                  >
                    <div className="flex items-start gap-4 sm:items-center">
                      <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 shadow-sm dark:bg-indigo-500/10 dark:text-indigo-400">
                        <BookOpen size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">
                          {item.subjects?.name || "مادة دراسية"}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                          {item.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={14} className="text-rose-500" />
                              {item.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700 sm:flex-col sm:items-end sm:gap-1 dark:text-slate-300">
                      <Clock size={16} className="opacity-70 text-indigo-500" />
                      <div dir="ltr" className="flex items-center gap-1 text-right">
                        <span>{formatTime(item.end_time)}</span>
                        <span>-</span>
                        <span>{formatTime(item.start_time)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          ))}
        </div>
      )}
    </PageContainer>
  );
}