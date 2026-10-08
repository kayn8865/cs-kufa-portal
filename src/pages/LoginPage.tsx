import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Lock, User, Loader2, ArrowRight, AlertCircle, Sparkles, GraduationCap } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. تسجيل الدخول عبر نظام Supabase Auth الرسمي
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) throw authError;

      const userId = authData.user.id;

      // 2. التحقق من صلاحية المستخدم من جدول profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (profileError) {
        // إذا لم يوجد بروفيل، نعتبره طالباً افتراضياً أو نوجهه للصفحة الرئيسية
        navigate("/");
        return;
      }

      // 3. التوجيه بناءً على الصلاحية
      if (profile?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError("خطأ في تسجيل الدخول: تأكد من البريد الإلكتروني وكلمة المرور الصحيحة.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="relative flex min-h-screen items-center justify-center bg-slate-950 p-4 overflow-hidden">
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-[#111827] p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <span>مرحباً بك مجدداً</span>
            <Sparkles size={18} className="text-indigo-400 animate-pulse" />
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">أدخل البريد الإلكتروني وكلمة المرور للمتابعة</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-300">البريد الإلكتروني</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
                <User size={18} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 pr-12 text-sm text-white outline-none focus:border-indigo-500 transition-colors text-right placeholder:text-slate-600"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-300">كلمة المرور</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
                <Lock size={18} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 pr-12 text-sm text-white outline-none focus:border-indigo-500 transition-colors text-right placeholder:text-slate-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <span>تسجيل الدخول</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}