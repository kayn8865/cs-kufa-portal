import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  Activity,
  Video,
  FileText,
  HelpCircle,
  ClipboardList,
  ExternalLink,
  Box,
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
  subject_id?: string;
};

type HomePageProps = {
  onSubjects: () => void;
};

export default function HomePage({ onSubjects }: HomePageProps) {
  const navigate = useNavigate();
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [slide, setSlide] = useState(0);
  const [subjectsCount, setSubjectsCount] = useState(0);

  const [examsList, setExamsList] = useState<ExamItem[]>([]);
  const [timeLeft, setTimeLeft] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });
  const [examStatus, setExamStatus] = useState<"upcoming" | "ongoing" | "ended">("upcoming");

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  const [cubeFace, setCubeFace] = useState(0);
  const [showAllModal, setShowAllModal] = useState(false);

  useEffect(() => {
    async function fetchHomeData() {
      try {
        // جلب المحتوى الترفيهي لعرضه في السلايدر العلوي كبديل أو دمج
        const { data: entData } = await supabase
          .from("entertainment")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        if (entData && entData.length > 0) {
          const formattedSlides: SlideItem[] = entData.map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description || "استكشف أحدث المحتويات الترفيهية والتعليمية المضافة.",
            image_url: item.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
            button_text: "مشاهدة المحتوى",
            button_url: item.link_url || item.url || "/entertainment",
          }));
          setSlides(formattedSlides);
        } else {
          // Fallback في حال لم يتوفر محتوى ترفيهي
          setSlides([
            {
              id: "1",
              title: "بوابة علوم الحاسوب",
              description: "مرحباً بك في بوابة جامعة الكوفة - قسم علوم الحاسوب.",
              image_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
              button_text: "استكشف المواد",
              button_url: "/subjects",
            }
          ]);
        }

        const { count } = await supabase
          .from("subjects")
          .select("id", { count: "exact", head: true });
        setSubjectsCount(count || 0);

        const todayStr = new Date().toISOString().split("T")[0];
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

        const [lecturesRes, videosRes, assignmentsRes, questionsRes, entertainmentRes] = await Promise.all([
          supabase.from("lectures").select("*").order("created_at", { ascending: false }).limit(10),
          supabase.from("lecture_videos").select("*").order("created_at", { ascending: false }).limit(10),
          supabase.from("lecture_assignments").select("*").order("created_at", { ascending: false }).limit(10),
          supabase.from("lecture_questions").select("*").order("created_at", { ascending: false }).limit(10),
          supabase.from("entertainment").select("*").order("created_at", { ascending: false }).limit(10),
        ]);

        const allItems: ActivityItem[] = [
          ...(lecturesRes.data || []).map((item: any) => ({
            id: item.id,
            title: item.title || "محاضرة جديدة",
            lecture_number: item.lecture_number || item.number,
            type: "lecture" as const,
            created_at: item.created_at || new Date().toISOString(),
            url: item.file_url,
            subject_id: item.subject_id,
            image_url: item.image_url || item.thumbnail_url
          })),
          ...(videosRes.data || []).map((item: any) => ({
            id: item.id,
            title: item.title || "فيديو تعليمي جديد",
            lecture_number: item.lecture_number || item.number,
            type: "video" as const,
            created_at: item.created_at || new Date().toISOString(),
            url: item.video_url || item.url,
            subject_id: item.subject_id,
            image_url: item.thumbnail_url || item.image_url
          })),
          ...(assignmentsRes.data || []).map((item: any) => ({
            id: item.id,
            title: item.title || "واجب جديد",
            type: "assignment" as const,
            created_at: item.created_at || new Date().toISOString(),
            subject_id: item.subject_id,
            image_url: item.assignment_image_url || item.image_url
          })),
          ...(questionsRes.data || []).map((item: any) => ({
            id: item.id,
            title: item.title || "سؤال جديد",
            type: "question" as const,
            created_at: item.created_at || new Date().toISOString(),
            subject_id: item.subject_id,
            image_url: item.image_url
          })),
          ...(entertainmentRes.data || []).map((item: any) => ({
            id: item.id,
            title: item.title || "محتوى ترفيهي",
            type: "entertainment" as const,
            created_at: item.created_at || new Date().toISOString(),
            image_url: item.image_url,
            url: item.link_url || item.url
          })),
        ];

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const recentItems = allItems.filter((item) => new Date(item.created_at) >= oneWeekAgo);
        recentItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setActivities(recentItems);
      } catch (err) {
        console.error("Error fetching home data:", err);
      } finally {
        setLoadingActivities(false);
      }
    }

    fetchHomeData();
  }, []);

  // تقليب وجوه المكعب تلقائياً بحد أقصى 6 عناصر
  useEffect(() => {
    const cubeCount = Math.min(activities.length, 6);
    if (cubeCount <= 1) return;
    const cubeTimer = setInterval(() => {
      setCubeFace((prev) => (prev + 1) % cubeCount);
    }, 4000);
    return () => clearInterval(cubeTimer);
  }, [activities.length]);

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
          const days = Math.floor(diff / (1000 * 60 * 60 * 24)).toString().padStart(2, "0");
          const hours = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, "0");
          const minutes = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, "0");
          const seconds = Math.floor((diff / 1000) % 60).toString().padStart(2, "0");
          setTimeLeft({ days, hours, minutes, seconds });
        } else if (diff <= 0 && Math.abs(diff) < examDurationMs) {
          setExamStatus("ongoing");
          const remainingTime = examDurationMs - Math.abs(diff);
          const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24).toString().padStart(2, "0");
          const minutes = Math.floor((remainingTime / 1000 / 60) % 60).toString().padStart(2, "0");
          const seconds = Math.floor((remainingTime / 1000) % 60).toString().padStart(2, "0");
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
    button_url: "/subjects",
  };

  const nearestExam = examsList.length > 0 ? examsList[0] : null;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "lecture": return <FileText className="text-blue-500" size={18} />;
      case "video": return <Video className="dynamic-text" size={18} />;
      case "assignment": return <ClipboardList className="text-amber-500" size={18} />;
      case "question": return <HelpCircle className="text-purple-500" size={18} />;
      case "entertainment": return <Video className="text-rose-500" size={18} />;
      default: return <Activity className="text-emerald-500" size={18} />;
    }
  };

  const getActivityBadgeText = (type: string) => {
    switch (type) {
      case "lecture": return "محاضرة جديدة";
      case "video": return "فيديو تعليمي";
      case "assignment": return "واجب جديد";
      case "question": return "سؤال جديد";
      case "entertainment": return "محتوى ترفيهي";
      default: return "نشاط جديد";
    }
  };

  const handleExplore = (item: ActivityItem) => {
    setShowAllModal(false);
    if (item.type === "entertainment") {
      navigate("/entertainment");
    } else if (item.subject_id) {
      navigate(`/subjects/${item.subject_id}`);
    } else if (item.url && (item.type === "lecture" || item.type === "video")) {
      window.open(item.url, "_blank");
    } else {
      onSubjects();
    }
  };

  const cubeActivities = activities.slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-7"
    >
      {/* السلايدر العلوي يعرض المحتوى الترفيهي */}
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
                <span className="mb-3 inline-flex rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 text-xs backdrop-blur-md">
                  محتوى ترفيهي مميز
                </span>
                <h2 className="text-2xl font-bold sm:text-4xl">{current.title}</h2>
                <p className="mt-3 text-sm text-white/90 sm:text-base">{current.description}</p>
                <button
                  onClick={() => {
                    if (current.button_url) {
                      if (current.button_url.startsWith("http")) {
                        window.open(current.button_url, "_blank");
                      } else {
                        navigate(current.button_url);
                      }
                    }
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

      {/* قسم المكعب ثلاثي الأبعاد - أحدث ما تم إضافته للموقع */}
      <section className="rounded-3xl border border-slate-200 dynamic-soft-bg p-6 shadow-xl dark:border-slate-800">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl dynamic-bg text-white shadow-lg">
              <Box size={24} className="animate-spin" style={{ animationDuration: "12s" }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">أخر ما تم إضافته للموقع</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">يعرض أحدث 6 إضافات تمت خلال الأيام الـ 7 الماضية</p>
            </div>
          </div>
        </div>

        {loadingActivities ? (
          <div className="py-16 text-center text-slate-400 animate-pulse">جاري تحميل أحدث الإضافات...</div>
        ) : cubeActivities.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-bold">لا توجد إضافات جديدة هذا الأسبوع.</div>
        ) : (
          <div className="relative flex flex-col items-center justify-center py-4">
            <div className="w-full max-w-xl h-[240px] sm:h-[220px] perspective-[1200px] flex items-center justify-center">
              <div 
                className="w-full h-full relative transition-transform duration-700 ease-in-out"
                style={{
                  transformStyle: "preserve-3d",
                  transform: `rotateX(${cubeFace * -90}deg)`
                }}
              >
                {cubeActivities.slice(0, 6).map((item, index) => {
                  const rotateX = index * 90;
                  return (
                    <div
                      key={item.id}
                      className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between backface-hidden border-2 dynamic-border bg-slate-900"
                      style={{
                        transform: `rotateX(${rotateX}deg) translateZ(110px)`,
                      }}
                    >
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.title} 
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />

                      <div className="relative z-10 p-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-bold text-white">
                            {getActivityIcon(item.type)}
                            {getActivityBadgeText(item.type)}
                          </span>
                          <span className="text-xs text-white/80 font-medium flex items-center gap-1 backdrop-blur-sm bg-black/30 px-2 py-0.5 rounded-lg">
                            <Clock size={12} /> {new Date(item.created_at).toLocaleDateString("ar-IQ")}
                          </span>
                        </div>

                        <h4 className="text-base sm:text-lg font-black text-white line-clamp-2 mt-2 drop-shadow-md">
                          {item.title}
                        </h4>

                        {item.lecture_number && (
                          <p className="text-xs text-white/80 mt-1 font-semibold">
                            المحاضرة رقم: {item.lecture_number}
                          </p>
                        )}
                      </div>

                      <div className="relative z-10 p-5 pt-0 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-white/70">
                          الإضافة {index + 1} من {cubeActivities.length}
                        </span>

                        <button
                          onClick={() => handleExplore(item)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-900 transition hover:scale-105 cursor-pointer shadow-lg"
                        >
                          استكشاف العنصر
                          <ExternalLink size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6">
              {cubeActivities.slice(0, 6).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCubeFace(idx)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    cubeFace === idx ? "w-8 dynamic-bg" : "w-2.5 bg-slate-300 dark:bg-slate-700"
                  }`}
                  aria-label={`وجه المكعب ${idx + 1}`}
                />
              ))}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowAllModal(true)}
                className="inline-flex items-center gap-2 rounded-2xl border dynamic-border bg-white dark:bg-slate-900 px-6 py-3 text-xs font-bold dynamic-text shadow-sm transition hover:opacity-80 cursor-pointer"
              >
                إظهار كافة الإضافات (خلال آخر 7 أيام)
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* نافذة المودال لعرض كافة إضافات الأسبوع */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">جميع إضافات الأسبوع</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">قائمة كاملة بكل ما تم إضافته خلال آخر 7 أيام مع معاينة المحتوى</p>
              </div>
              <button
                onClick={() => setShowAllModal(false)}
                className="rounded-full bg-slate-100 dark:bg-slate-800 p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {activities.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:shadow-md transition gap-4"
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <span className="text-xs font-black text-slate-400 w-5 shrink-0">#{idx + 1}</span>
                    
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.title} 
                        className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700" 
                      />
                    ) : (
                      <div className="p-3 rounded-xl dynamic-soft-bg shrink-0">
                        {getActivityIcon(item.type)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold dynamic-text px-2 py-0.5 rounded-md dynamic-soft-bg mb-1">
                        {getActivityBadgeText(item.type)}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{item.title}</h4>
                      <span className="text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString("ar-IQ")}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleExplore(item)}
                    className="flex items-center gap-1 text-xs font-bold dynamic-text px-3.5 py-2 rounded-xl border dynamic-border hover:opacity-80 shrink-0 cursor-pointer shadow-sm"
                  >
                    استكشاف <ExternalLink size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => setShowAllModal(false)}
                className="rounded-2xl dynamic-bg px-6 py-2.5 text-xs font-bold text-white shadow-md cursor-pointer"
              >
                إغلاق القائمة
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function CountdownBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 p-3 text-center border border-slate-200/80 dark:border-slate-700 shadow-inner">
      <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-wider">
        {value}
      </div>
      <div className="mt-0.5 text-[10px] sm:text-xs font-bold text-slate-400">{label}</div>
    </div>
  );
}