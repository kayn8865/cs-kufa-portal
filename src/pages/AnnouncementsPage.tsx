import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Bell, Calendar, Clock, Loader2, AlertCircle, Image as ImageIcon, ExternalLink, X, ShieldAlert, FileText, CheckCircle, Megaphone } from "lucide-react";
import { motion } from "motion/react";

type AnnouncementItem = {
  id: string;
  title: string;
  description: string;
  type?: string;
  image_url?: string | null;
  exam_date?: string | null;
  exam_time?: string | null;
  due_date?: string | null;
  created_at?: string;
};

export default function AnnouncementsPage() {
  const [generalAnnouncements, setGeneralAnnouncements] = useState<AnnouncementItem[]>([]);
  const [adminAnnouncements, setAdminAnnouncements] = useState<AnnouncementItem[]>([]);
  const [assignmentAnnouncements, setAssignmentAnnouncements] = useState<AnnouncementItem[]>([]);
  const [examAnnouncements, setExamAnnouncements] = useState<AnnouncementItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        // 1. جلب الإعلانات، تبليغات الإدارة، والواجبات من جدول announcements
        const { data: annData, error: annError } = await supabase
          .from("announcements")
          .select("*")
          .order("created_at", { ascending: false });

        if (annError) throw annError;

        const items = annData || [];
        
        setGeneralAnnouncements(items.filter(item => item.type === "announcement" || !item.type));
        setAdminAnnouncements(items.filter(item => item.type === "management" || item.type === "admin"));
        setAssignmentAnnouncements(items.filter(item => item.type === "assignment"));

        // 2. جلب الامتحانات مباشرة من جدول exams المستقل
        const { data: examsData, error: examsError } = await supabase
          .from("exams")
          .select("*")
          .order("exam_date", { ascending: true });

        if (examsError) throw examsError;

        // تنسيق بيانات الامتحانات لتعرض في عمود الامتحانات بكل وضوح
        const formattedExams: AnnouncementItem[] = (examsData || []).map((ex: any) => ({
          id: ex.id,
          title: `امتحان (${ex.exam_type || "رسمي"})`,
          description: ex.notes || ex.location || "لا توجد تفاصيل أو ملاحظات إضافية مسجلة لهذا الامتحان.",
          type: "exam",
          image_url: null,
          exam_date: ex.exam_date,
          exam_time: ex.start_time,
          created_at: ex.created_at
        }));

        setExamAnnouncements(formattedExams);

      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError("حدث خطأ أثناء جلب التبليغات: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const getPublicImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    let cleanPath = path;
    if (path.includes("/")) {
      const parts = path.split("/");
      if (["announcements", "news-images", "assignments", "questions", "answers"].includes(parts[0])) {
        cleanPath = path;
      } else {
        cleanPath = parts.slice(1).join("/");
      }
    }

    try {
      const { data } = supabase.storage.from("lecture-pdfs").getPublicUrl(cleanPath);
      return data.publicUrl;
    } catch (e) {
      return path;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 size={40} className="animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 text-slate-900 dark:text-white" dir="rtl">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-600 dark:text-red-400">
          <AlertCircle size={40} className="mx-auto mb-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const renderColumn = (title: string, icon: any, items: AnnouncementItem[], badgeColor: string) => (
    <div className="flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl overflow-hidden min-h-[500px]">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${badgeColor}`}>
            {icon}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{title}</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">{items.length} عنصر</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[70vh]">
        {items.length > 0 ? (
          items.map((item) => {
            const imageUrl = getPublicImageUrl(item.image_url);
            const dateValue = item.exam_date || item.due_date;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedAnnouncement(item)}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 p-5 shadow-sm hover:border-indigo-500/50 transition-all cursor-pointer"
              >
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3 line-clamp-2 whitespace-pre-wrap">{item.description}</p>

                  {imageUrl && (
                    <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <img src={imageUrl} alt={item.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  {dateValue ? (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-indigo-500" /> {dateValue}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-indigo-500" /> {new Date(item.created_at || "").toLocaleDateString("ar-EG")}
                    </span>
                  )}
                  {item.exam_time && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-indigo-500" /> {item.exam_time}
                    </span>
                  )}
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline mr-auto">
                    عرض التفاصيل ←
                  </span>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
            <Bell size={32} className="mb-2 opacity-40" />
            <p className="text-xs">لا توجد تبليغات في هذا القسم</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      dir="rtl"
      className="space-y-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white min-h-screen p-4 sm:p-8 max-w-7xl mx-auto transition-colors duration-300"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-inner">
            <Bell size={32} />
          </div>
          <div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">لوحة الإعلانات والتبليغات الرسمية</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">سجل التبليغات العامة</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {renderColumn("الإعلانات العامة", <Megaphone size={20} className="text-emerald-500" />, generalAnnouncements, "bg-emerald-500/10 border border-emerald-500/20")}
        {renderColumn("تبليغات الإدارة", <CheckCircle size={20} className="text-indigo-500" />, adminAnnouncements, "bg-indigo-500/10 border border-indigo-500/20")}
        {renderColumn("تبليغات الواجبات", <FileText size={20} className="text-amber-500" />, assignmentAnnouncements, "bg-amber-500/10 border border-amber-500/20")}
        {renderColumn("تبليغات الامتحانات", <ShieldAlert size={20} className="text-rose-500" />, examAnnouncements, "bg-rose-500/10 border border-rose-500/20")}
      </div>

      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">تفاصيل التبليغ</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{selectedAnnouncement.title}</h2>
              </div>
              <button 
                onClick={() => setSelectedAnnouncement(null)} 
                className="rounded-2xl p-2.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-5 border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">نص الوصف والتبليغ:</h4>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{selectedAnnouncement.description}</p>
              </div>

              {selectedAnnouncement.image_url && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">المرفقات والصور:</h4>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-lg">
                    <img 
                      src={getPublicImageUrl(selectedAnnouncement.image_url) || ""} 
                      alt={selectedAnnouncement.title} 
                      className="w-full h-auto max-h-[450px] object-contain mx-auto" 
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2">
                {(selectedAnnouncement.exam_date || selectedAnnouncement.due_date) && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-indigo-500" /> التاريخ: {selectedAnnouncement.exam_date || selectedAnnouncement.due_date}
                  </span>
                )}
                {selectedAnnouncement.exam_time && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-indigo-500" /> الوقت: {selectedAnnouncement.exam_time}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              {selectedAnnouncement.image_url && (
                <a 
                  href={getPublicImageUrl(selectedAnnouncement.image_url) || "#"} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 px-5 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  <ExternalLink size={14} />
                  <span>فتح الصورة بحجمها الأصلي</span>
                </a>
              )}
              <button 
                onClick={() => setSelectedAnnouncement(null)}
                className="rounded-2xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white hover:bg-indigo-700 transition-all cursor-pointer shadow-md"
              >
                إغلاق النافذة
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}