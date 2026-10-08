import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  MapPin,
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

type HomePageProps = {
  onSubjects: () => void;
};

export default function HomePage({
  onSubjects,
}: HomePageProps) {
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [slide, setSlide] = useState(0);
  const [subjectsCount, setSubjectsCount] = useState(0);
  
  // قائمة الامتحانات القادمة كلها
  const [examsList, setExamsList] = useState<ExamItem[]>([]);
  const [timeLeft, setTimeLeft] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });
  const [examStatus, setExamStatus] = useState<"upcoming" | "ongoing" | "ended">("upcoming");

  useEffect(() => {
    async function fetchHomeData() {
      try {
        // 1. جلب السلايدر النشط
        const { data: featData } = await supabase
          .from("featured_content")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (featData && featData.length > 0) {
          setSlides(featData);
        }

        // 2. جلب عدد المواد الدراسية الحقيقي
        const { count } = await supabase
          .from("subjects")
          .select("id", { count: "exact", head: true });
        
        setSubjectsCount(count || 0);

        // 3. جلب جميع الامتحانات المستقبلية مرتبة من الأقرب للأبعد
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: examsData, error: examsError } = await supabase
          .from("exams")
          .select("*")
          .gte("exam_date", todayStr)
          .order("exam_date", { ascending: true })
          .order("start_time", { ascending: true });

        if (examsError) {
          console.error("خطأ بجلب الامتحانات:", examsError.message);
        }

        if (examsData && examsData.length > 0) {
          setExamsList(examsData);
        } else {
          // إذا لم توجد امتحانات مستقبلية، جلب أحدث الامتحانات كبديل
          const { data: fallbackExams } = await supabase
            .from("exams")
            .select("*")
            .order("exam_date", { ascending: false })
            .limit(3);
          if (fallbackExams) setExamsList(fallbackExams);
        }
      } catch (err) {
        console.error("Error fetching home data:", err);
      }
    }

    fetchHomeData();
  }, []);

  // نظام العد التنازلي لأقرب امتحان (العنصر الأول في القائمة)
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

        const examDurationMs = 2 * 60 * 60 * 1000; // افتراض مدة الامتحان ساعتين

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

      {/* قسم المواد الدراسية وامتحانات العد التنازلي */}
      <section className="grid gap-5 lg:grid-cols-3">
        {/* المواد الدراسية */}
        <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <BookOpen size={24} />
            </div>

            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                المواد الدراسية
              </p>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {subjectsCount} مواد متاحة
              </h3>
            </div>
          </div>

          <button
            onClick={onSubjects}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-bold text-white transition hover:bg-indigo-700 cursor-pointer shadow-md"
          >
            عرض المواد
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* قسم الامتحانات القادمة والعد التنازلي للأقرب */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 lg:col-span-2 space-y-6">
          {nearestExam ? (
            <>
              {/* الامتحان الأقرب (مع العد التنازلي في المقدمة) */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-2xl p-3 ${examStatus === 'ongoing' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 animate-pulse' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
                      <Clock size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">أقرب امتحان (العد التنازلي)</span>
                        {examStatus === 'ongoing' && (
                          <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                            جاري الآن ⚡
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                        {nearestExam.exam_type}
                      </h3>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-xl">
                    <Calendar size={14} /> {nearestExam.exam_date}
                  </span>
                </div>

                {/* مربعات العد التنازلي */}
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  <CountdownBox label="أيام" value={timeLeft.days} />
                  <CountdownBox label="ساعة" value={timeLeft.hours} />
                  <CountdownBox label="دقيقة" value={timeLeft.minutes} />
                  <CountdownBox label="ثانية" value={timeLeft.seconds} />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-200/60 dark:border-slate-700">
                  <span>الوقت: {nearestExam.start_time || "غير محدد"}</span>
                  {nearestExam.location && (
                    <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                      <MapPin size={13} /> القاعة: {nearestExam.location}
                    </span>
                  )}
                </div>
              </div>

              {/* باقي الامتحانات القادمة (إن وجدت امتحان ثاني أو ثالث) */}
              {examsList.length > 1 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">امتحانات أخرى قادمة ({examsList.length - 1}):</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {examsList.slice(1, 3).map((ex) => (
                      <div key={ex.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 flex items-center justify-between shadow-xs">
                        <div>
                          <h5 className="font-bold text-slate-900 dark:text-white text-sm">{ex.exam_type}</h5>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                            <Calendar size={12} className="text-indigo-500" /> {ex.exam_date}
                          </span>
                        </div>
                        {ex.start_time && (
                          <span className="rounded-xl bg-slate-200 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            {ex.start_time.substring(0, 5)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <Clock size={36} className="mb-2 opacity-40" />
              <p className="text-sm font-bold">لا توجد امتحانات قريبة مسجلة حالياً</p>
              <p className="text-xs text-slate-500 mt-1">تابع لوحة الإعلانات لمعرفة المواعيد فور إضافتها.</p>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}

function CountdownBox({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
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