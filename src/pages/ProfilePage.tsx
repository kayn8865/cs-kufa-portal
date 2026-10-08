import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import { User, Mail, Hash, BookOpen, Layers, MapPin, Loader2, AlertCircle } from "lucide-react";
import PageContainer from "../components/PageContainer";

type Profile = {
  id: string;
  full_name: string;
  student_number: string;
  email: string;
  department: string;
  stage: string;
  section: string;
  profile_image: string | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        setError(null);

        // 1. جلب بيانات المستخدم الحالي
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          throw new Error("لا يمكن الوصول إلى بيانات الجلسة الحالية.");
        }

        // 2. جلب الملف الشخصي المرتبط من قاعدة البيانات
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        setProfile(data);
      } catch (err: any) {
        console.error("Error fetching profile:", err.message);
        setError("حدث خطأ أثناء جلب بيانات الملف الشخصي.");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <PageContainer title="الملف الشخصي" description="معلوماتك الأكاديمية والشخصية" icon={<User size={24} />}>
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <Loader2 size={32} className="animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-slate-500 dark:text-slate-400">جاري تحميل البيانات...</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !profile) {
    return (
      <PageContainer title="الملف الشخصي" description="معلوماتك الأكاديمية والشخصية" icon={<User size={24} />}>
        <div className="flex flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-500/20 dark:bg-red-500/10">
          <AlertCircle size={48} className="mb-4 text-red-500" />
          <h3 className="mb-2 text-lg font-bold text-red-700 dark:text-red-400">عذراً، حدث خطأ</h3>
          <p className="text-red-600 dark:text-red-500">{error || "لم يتم العثور على بيانات."}</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="الملف الشخصي"
      description="معلوماتك الأكاديمية والشخصية"
      icon={<User size={24} />}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* بطاقة الصورة والمعلومات الأساسية */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-1"
        >
          <div className="relative mb-6">
            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-indigo-50 bg-indigo-100 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
              {profile.profile_image ? (
                <img
                  src={profile.profile_image}
                  alt={profile.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User size={48} />
              )}
            </div>
            <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-white bg-green-500 dark:border-slate-900"></span>
          </div>

          <h2 className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">
            {profile.full_name}
          </h2>
          <p className="mb-6 font-medium text-indigo-600 dark:text-indigo-400">
            طالب جامعي
          </p>

          <div className="w-full space-y-3 rounded-2xl bg-slate-50 p-4 text-right dark:bg-slate-950">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} className="text-slate-400" />
              <span className="text-slate-600 dark:text-slate-300" dir="ltr">{profile.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin size={16} className="text-slate-400" />
              <span className="text-slate-600 dark:text-slate-300">النجف الأشرف، العراق</span>
            </div>
          </div>
        </motion.div>

        {/* بطاقة التفاصيل الأكاديمية */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2"
        >
          <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <BookOpen size={20} className="text-indigo-600 dark:text-indigo-400" />
            التفاصيل الأكاديمية
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800/50 dark:bg-slate-950">
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                <Hash size={16} />
                الرقم الجامعي
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white" dir="ltr">
                {profile.student_number}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800/50 dark:bg-slate-950">
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                <BookOpen size={16} />
                القسم العلمي
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {profile.department}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800/50 dark:bg-slate-950">
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                <Layers size={16} />
                المرحلة الدراسية
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {profile.stage}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800/50 dark:bg-slate-950">
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                <User size={16} />
                الشعبة
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {profile.section}
              </div>
            </div>
          </div>
          
          <div className="mt-8 rounded-2xl bg-indigo-50 p-4 dark:bg-indigo-500/10">
            <p className="text-sm text-indigo-700 dark:text-indigo-300">
              <span className="font-bold">ملاحظة:</span> الرقم الجامعي والمعلومات الأكاديمية تتم إدارتها من قبل الإدارة. في حال وجود خطأ في البيانات يرجى مراجعة القسم.
            </p>
          </div>
        </motion.div>
      </div>
    </PageContainer>
  );
}