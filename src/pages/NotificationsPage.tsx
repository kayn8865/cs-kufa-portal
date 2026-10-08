import {
  Bell,
  BookOpen,
  ClipboardList,
} from "lucide-react";
import PageContainer from "../components/PageContainer";

type NotificationItem = {
  id: number;
  title: string;
  description: string;
  date: string;
  isNew?: boolean;
};

const announcements: NotificationItem[] = [
  {
    id: 1,
    title: "إعلان جديد",
    description: "تم نشر إعلان جديد للطلاب.",
    date: "اليوم",
    isNew: true,
  },
  {
    id: 2,
    title: "تنبيه للطلاب",
    description: "يرجى متابعة آخر التحديثات الخاصة بالقسم.",
    date: "أمس",
  },
];

const lectures: NotificationItem[] = [
  {
    id: 1,
    title: "تمت إضافة محاضرة جديدة",
    description: "تم رفع محاضرة جديدة ضمن المواد الدراسية.",
    date: "اليوم",
    isNew: true,
  },
  {
    id: 2,
    title: "محاضرة متوفرة",
    description: "أصبحت إحدى المحاضرات السابقة متوفرة للتحميل.",
    date: "قبل يومين",
  },
];

const assignments: NotificationItem[] = [
  {
    id: 1,
    title: "واجب جديد",
    description: "تمت إضافة واجب جديد، موعد التسليم 15/10/2026.",
    date: "اليوم",
    isNew: true,
  },
  {
    id: 2,
    title: "تذكير بالواجب",
    description: "باقي عدة أيام على موعد تسليم الواجب.",
    date: "قبل 3 أيام",
  },
];

function NotificationSection({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: NotificationItem[];
}) {
  return (
    <section className="flex flex-col">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          {icon}
        </div>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {title}
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold leading-tight text-slate-900 dark:text-white">
                  {item.title}
                </h3>

                {item.isNew && (
                  <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                    جديد
                  </span>
                )}
              </div>

              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {item.description}
              </p>

              <div className="mt-1 flex items-center justify-end">
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  {item.date}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function NotificationsPage() {
  return (
    <PageContainer
      title="الإشعارات"
      description="آخر التحديثات والتنبيهات الخاصة بك"
      icon={<Bell size={24} />}
    >
      {/* Grid container: 1 column on mobile, 3 columns on large screens */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        <NotificationSection
          title="الإعلانات"
          icon={<Bell size={20} />}
          items={announcements}
        />

        <NotificationSection
          title="المحاضرات"
          icon={<BookOpen size={20} />}
          items={lectures}
        />

        <NotificationSection
          title="الواجبات"
          icon={<ClipboardList size={20} />}
          items={assignments}
        />
      </div>
    </PageContainer>
  );
}