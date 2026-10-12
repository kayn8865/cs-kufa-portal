import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  MapPin,
  Activity,
  Video,
  FileText,
  HelpCircle,
  ClipboardList,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { supabase } from "../lib/supabase";

type SlideItem = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  button_text: string | null;
  button_url: string | null;
};

type ExamItem = {
  id: string;
  exam_type: string;
  exam_date: string;
  start_time: string | null;
  location: string | null;
  notes: string | null;
};

type ActivityItem = {
  id: string;
  title: string;
  lecture_number?: string | number;
  type: "lecture" | "video" | "assignment" | "question" | "entertainment";
  created_at: string;
  image_url?: string;
  url?: string;
};

type HomePageProps = {
  onSubjects: () => void;
};

export default function HomePage({
  onSubjects,
}: HomePageProps) {
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [slide, setSlide] = useState(0);
  const [subjectsCount, setSubjectsCount] = useState(0);
  
  const [examsList, setExamsList] = useState<ExamItem[]>([]);
  const [timeLeft, setTimeLeft] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });
  const [examStatus, setExamStatus] = useState<"upcoming" | "ongoing" | "ended">("upcoming");

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  
  // حالة التحكم بعرض المزيد أو الأقل
  const [showAllActivities, setShowAllActivities] = useState(false);

  useEffect(() => {
    async function fetchHomeData() {
      try {
        const { data: featData } = await supabase
          .from("featured_content")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (featData && featData.length > 0) {
          setSlides(featData);
        }

        const { count } = await supabase
          .from("subjects")
          .select("id", { count: "exact", head: true });
        
        setSubjectsCount(count || 0);

        const todayStr = new Date().toISOString().split('T')[0];
        const { data: examsData } = await supabase
          .from("exams")
          .select("*")
          .gte("exam_date", todayStr)
          .order("exam_date", { ascending: true });

        if (examsData && examsData.length > 0) {
          setExamsList(examsData);
        } else {
          const { data: fallbackExams } = await supabase
            .from("exams")
            .select("*")
            .order("exam_date", { ascending: false })
            .limit(3);
          if (fallbackExams) setExamsList(fallbackExams);
        }

        // جلب آخر الإضافات من الجداول المختلفة
        const [lecturesRes, videosRes, assignmentsRes, questionsRes, entertainmentRes] = await Promise.all([
          supabase.from("lectures").select("*").order("created_at", { ascending: false }).limit(6),
          supabase.from("lecture_videos").select("*").order("created_at", { ascending: false }).limit(6),
          supabase.from("lecture_assignments").select("*").order("created_at", { ascending: false }).limit(6),
          supabase.from("lecture_questions").select("*").order("created_at", { ascending: false }).limit(6),
          supabase.from("entertainment").select("*").order("created_at", { ascending: false }).limit(6),
        ]);

        const allItems: ActivityItem[] = [
          ...(lecturesRes.data || []).map((item: any) => ({
            id: item.id,
            title: item.title || "محاضرة جديدة",
            lecture_number: item.lecture_number || item.number,
            type: "lecture" as const,
            created_at: item.created_at || new Date().toISOString(),
            url: item.file_url
          })),
          ...(videosRes.data || []).map((item: any) => ({
            id: item.id,
            title: item.title || "فيديو تعليمي جديد",
            lecture_number: item.lecture_number || item.number,
            type: "video" as const,
            created_at: item.created_at || new Date().toISOString(),
            url: item.video_url || item.url
          })),
          ...(assignmentsRes.data || []).map((item: any) => ({
            id: item.id,
            title: item.title || "واجب جديد",
            type: "assignment" as const,
            created_at: item.created_at || new Date().toISOString(),
          })),
          ...(questionsRes.data || []).map((item: any) => ({
            id: item.id,
            title: item.title || "سؤال جديد",
            type: "question" as const,
            created_at: item.created_at || new Date().toISOString(),
          })),
          ...(entertainmentRes.data || []).map((item: any) => ({
            id: item.id,
            title: item.title || "محتوى ترفيهي",
            type: "entertainment" as const,
            created_at: item.created_at || new Date().toISOString(),
            image_url: item.image_url,
            url: item.url
          })),
        ];

        allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setActivities(allItems);

      } catch (err) {
        console.error("Error fetching home data:", err);
      } finally {
        setLoadingActivities(false);
      }
    }

    fetchHomeData();
  }, []);

  useEffect(() => {
    if (examsList.length === 0) return;
    const nextExam = examsList[0];

    const calculateCountdown = () => {
      try {
        const timeString = nextExam.start_time || "09:00:00";
        const cleanTime = timeString.length === 5 ? timeString + ":00" : timeString;
        const examDateTimeString = `${nextExam.exam_date}T${cleanTime}`;
        const examDate = new Date(examDateTimeString);
        const now = new Date();
        const diff = examDate.getTime() - now.getTime();

        const examDurationMs = 2 * 60 * 60 * 1000;

        if (diff > 0) {
          setExamStatus("upcoming");
          const days = Math.floor(diff / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
          const hours = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
          const minutes = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0');
          const seconds = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
          setTimeLeft({ days, hours, minutes, seconds });
        } else if (diff <= 0 && Math.abs(diff) < examDurationMs) {
          setExamStatus("ongoing");
          const remainingTime = examDurationMs - Math.abs(diff);
          const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
          const minutes = Math.floor((remainingTime / 1000 / 60) % 60).toString().padStart(2, '0');
          const seconds = Math.floor((remainingTime / 1000) % 60).toString().padStart(2, '0');
          setTimeLeft({ days: "00", hours, minutes, seconds });
        } else {
          setExamStatus("ended");
          setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" });
        }
      } catch (e) {
        console.error(e);
      }
    };

    calculateCountdown();
    const timer = setInterval(calculateCountdown, 1000);
    return () => clearInterval(timer);
  }, [examsList]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setSlide((current) => (current + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const current = slides[slide] || {
    title: "بوابة جامعة الكوفة",
    description: "مرحباً بك في بوابة علوم الحاسوب.",
    image_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
    button_text: "استكشف الآن",
    button_url: "/subjects"
  };

  const nearestExam = examsList.length > 0 ? examsList[0] : null;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "lecture": return <FileText className="text-blue-500" size={16} />;
      case "video": return <Video className="dynamic-text" size={16} />;
      case "assignment": return <ClipboardList className="text-amber-500" size={16} />;
      case "question": return <HelpCircle className="text-purple-500" size={16} />;
      case "entertainment": return <Video className="text-rose-500" size={16} />;
      default: return <Activity className="text-emerald-500" size={16} />;
    }
  };

  const getActivityBadgeText = (type: string) => {
    switch (type) {
      case "lecture": return "محاضرة جديدة";
      case "video": return "فيديو تعليمي جديد";
      case "assignment": return "واجب جديد";
      case "question": return "سؤال جديد";
      case "entertainment": return "محتوى ترفيهي";
      default: return "نشاط جديد";
    }
  };

  // تحديد العناصر المعروضة (أول عنصرين أو الكل حسب حالة الزر)
  const displayedActivities = showAllActivities ? activities : activities.slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-7"
    >
      {/* السلايدر */}
      <section className="relative overflow-hidden rounded-3xl shadow-xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative h-[260px] sm:h-[360px]"
          >
            <img
              src={current.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80"}
              alt={current.title}
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/35 to-transparent" />

            <div className="absolute inset-0 flex items-end p-6 sm:p-10">
              <div className="max-w-xl text-white">
                <span className="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur-md">
                  محتوى مميز
                </span>

                <h2 className="text-2xl font-bold sm:text-4xl">
                  {current.title}
                </h2>

                <p className="mt-3 text-sm text-white/90 sm:text-base">
                  {current.description}
                </p>

                <button 
                  onClick={() => {
                    if (current.button_url) window.location.href = current.button_url;
                  }}
                  className="mt-5 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:scale-105 cursor-pointer shadow-md"
                >
                  {current.button_text || "مشاهدة المحتوى"}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {slides.length > 1 && (
          <>
            <button
              onClick={() => setSlide((slide - 1 + slides.length) % slides.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-md transition hover:bg-black/50 cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={() => setSlide((slide + 1) % slides.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-md transition hover:bg-black/50 cursor-pointer"
            >
              <ChevronRight size={20} />
            </button>

            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSlide(index)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    slide === index ? "w-7 bg-white" : "w-2 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* المواد الدراسية والامتحانات */}
      <section className="grid gap-5 lg:grid-cols-3">
        <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl dynamic-soft-bg dynamic-text p-3">
              <BookOpen size={24} />
            </div>

            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">المواد الدراسية</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{subjectsCount} مواد متاحة</h3>
            </div>
          </div>

          <button
            onClick={onSubjects}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl dynamic-bg py-3 font-bold text-white transition hover:opacity-90 cursor-pointer shadow-md"
          >
            عرض المواد
            <ChevronLeft size={18} />
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 lg:col-span-2 space-y-6">
          {nearestExam ? (
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-2xl p-3 ${examStatus === 'ongoing' ? 'bg-emerald-50 text-emerald-600 animate-pulse' : 'bg-red-50 text-red-600'}`}>
                    <Clock size={22} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">أقرب امتحان</span>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                      {nearestExam.exam_type}
                    </h3>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold dynamic-text dynamic-soft-bg px-3 py-1.5 rounded-xl">
                  <Calendar size={14} /> {nearestExam.exam_date}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                <CountdownBox label="أيام" value={timeLeft.days} />
                <CountdownBox label="ساعة" value={timeLeft.hours} />
                <CountdownBox label="دقيقة" value={timeLeft.minutes} />
                <CountdownBox label="ثانية" value={timeLeft.seconds} />
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-bold">لا توجد امتحانات قريبة مسجلة</p>
            </div>
          )}
        </div>
      </section>

      {/* قسم آخر الأحداث والنشاطات */}
      <section className="rounded-3xl border border-slate-200 dynamic-soft-bg p-6 shadow-xl dark:border-slate-800">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl dynamic-bg text-white shadow-lg">
              <Activity size={24} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">آخر الأحداث والنشاطات</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">آخر المحاضرات، الفيديوهات، والملفات المضافة للموقع</p>
            </div>
          </div>
          <span className="rounded-full dynamic-soft-bg dynamic-text px-3 py-1 text-xs font-bold">
            {activities.length} عناصر
          </span>
        </div>

        {loadingActivities ? (
          <div className="py-10 text-center text-slate-400 animate-pulse">جاري جلب آخر الأحداث...</div>
        ) : activities.length === 0 ? (
          <div className="py-10 text-center text-slate-400">لا توجد أي نشاطات حالياً.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayedActivities.map((item, index) => (
                <motion.div
                  key={item.id + index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {getActivityIcon(item.type)}
                        {getActivityBadgeText(item.type)}
                      </span>
                    </div>

                    {item.image_url && (
                      <div className="mb-3 h-32 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                        <img src={item.image_url} alt={item.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      </div>
                    )}

                    <h4 className="mb-1 font-bold text-slate-900 dark:text-white line-clamp-1 text-sm sm:text-base">
                      {item.title}
                    </h4>

                    {item.lecture_number && (
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-bold text-slate-700 dark:text-slate-300">
                          المحاضرة رقم {item.lecture_number}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/60">
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock size={12} />
                      {new Date(item.created_at).toLocaleDateString("ar-IQ")}
                    </span>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold dynamic-text hover:underline"
                      >
                        عرض الرابط ←
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* زر عرض المزيد / إخفاء إذا كان عدد الأنشطة أكثر من 2 */}
            {activities.length > 2 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowAllActivities(!showAllActivities)}
                  className="inline-flex items-center gap-2 rounded-2xl border dynamic-border bg-white px-6 py-2.5 text-xs font-bold dynamic-text shadow-sm transition hover:opacity-80 dark:bg-slate-900 cursor-pointer"
                >
                  {showAllActivities ? (
                    <>
                      إخفاء بعض الأحداث
                      <ChevronUp size={16} />
                    </>
                  ) : (
                    <>
                      عرض المزيد من الأحداث ({activities.length - 2} إضافية)
                      <ChevronDown size={16} />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </motion.div>
  );
}

function CountdownBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 text-center border border-slate-200/80 dark:border-slate-700 shadow-inner">
      <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-wider">
        {value}
      </div>
      <div className="mt-0.5 text-[10px] sm:text-xs font-bold text-slate-400">
        {label}
      </div>
    </div>
  );
}