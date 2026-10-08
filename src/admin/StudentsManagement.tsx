import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Users, Search, Trash2, ArrowRight, Loader2, AlertCircle, UserCheck, Mail, Phone, Plus, Shield, ShieldAlert, X, KeyRound, Hash } from "lucide-react";

type Profile = {
  id: string;
  student_number?: string;
  full_name: string;
  email: string;
  password?: string;
  phone: string | null;
  role: "admin" | "student";
  created_at?: string;
};

export default function StudentsManagement() {
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal إضافة طالب جديد
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [studentNumber, setStudentNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // نظام الحلفان الصارم للحذف
  const [deleteStep, setDeleteStep] = useState<"confirm" | "swear" | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Profile | null>(null);
  const [swearInput, setSwearInput] = useState("");
  const [swearError, setSwearError] = useState("");

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setStudents(data || []);
    } catch (err: any) {
      setError("حدث خطأ أثناء جلب قائمة الطلاب: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAddStudent = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // إدخال مباشر لبيانات الطالب في جدول profiles بعد فك قيد الـ Foreign Key
      const { error: insertError } = await supabase.from("profiles").insert([
        {
          student_number: studentNumber.trim(),
          full_name: fullName,
          email: email.trim(),
          password: password,
          phone: phone.trim() ? phone.trim() : null,
          role: isAdmin ? "admin" : "student",
        },
      ]);

      if (insertError) throw insertError;

      setIsAddModalOpen(false);
      setStudentNumber("");
      setFullName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setIsAdmin(false);
      fetchStudents();
      alert("تمت إضافة الطالب وحساب الدخول بنجاح تام!");
    } catch (err: any) {
      alert("خطأ أثناء الحفظ: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAdminStatus = async (student: Profile) => {
    const newRole = student.role === "admin" ? "student" : "admin";
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", student.id);

      if (error) throw error;
      fetchStudents();
      alert("تم تحديث الصلاحية بنجاح!");
    } catch (err: any) {
      alert("خطأ أثناء تحديث الصلاحية: " + err.message);
    }
  };

  const initiateDelete = (student: Profile) => {
    setStudentToDelete(student);
    setDeleteStep("confirm");
    setSwearInput("");
    setSwearError("");
  };

  const handleFirstConfirm = (yes: boolean) => {
    if (!yes) {
      setDeleteStep(null);
      setStudentToDelete(null);
    } else {
      setDeleteStep("swear");
    }
  };

  const handleFinalDeleteAction = async () => {
    if (swearInput.trim() !== "والله") {
      setSwearError("أنت ليش تجذب ما حلف يعني ما متأكد!");
      return;
    }

    if (!studentToDelete) return;

    try {
      const { error } = await supabase.from("profiles").delete().eq("id", studentToDelete.id);
      if (error) throw error;
      setDeleteStep(null);
      setStudentToDelete(null);
      fetchStudents();
    } catch (err: any) {
      alert("خطأ أثناء الحذف: " + err.message);
    }
  };

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.student_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
              <ArrowRight size={22} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">إدارة الطلاب والمسؤولين</h1>
              <p className="text-sm text-slate-400">إضافة حسابات دخول مباشرة وبدون قيود الـ Auth</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 w-full sm:w-64">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input 
                type="text" 
                placeholder="ابحث بالاسم، البريد أو الرقم الجامعي..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-500"
              />
            </div>

            <button onClick={() => setIsAddModalOpen(true)} className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 w-full sm:w-auto shrink-0">
              <Plus size={18} />
              <span>إضافة طالب جديد</span>
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 size={36} className="animate-spin text-indigo-400" />
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-400">
            <AlertCircle size={36} className="mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-[#111827] p-12 text-center shadow-sm">
            <Users size={48} className="mx-auto mb-4 text-slate-600" />
            <h3 className="text-lg font-bold text-white">لا توجد نتائج مطابقة أو لا يوجد طلاب مسجلين حالياً</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredStudents.map((student) => {
              const isAdmin = student.role === "admin";
              return (
                <div key={student.id} className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-[#111827] p-5 shadow-lg">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl shrink-0 ${isAdmin ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                          {isAdmin ? <Shield size={22} /> : <UserCheck size={22} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-base">{student.full_name}</h3>
                            {isAdmin && (
                              <span className="rounded-lg bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">مسؤول (Admin)</span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500">الرقم الجامعي: {student.student_number || "غير متوفر"}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => initiateDelete(student)} 
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" 
                        title="حذف الطالب"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="space-y-2 mt-4 pt-4 border-t border-slate-800/60 text-xs text-slate-300">
                      <div className="flex items-center gap-2 truncate">
                        <Mail size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">{student.email}</span>
                      </div>
                      {student.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-slate-400 shrink-0" />
                          <span>{student.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">تغيير الصلاحية:</span>
                    <button 
                      onClick={() => toggleAdminStatus(student)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                        isAdmin 
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                          : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
                      }`}
                    >
                      {isAdmin ? "إلغاء المسؤولية" : "ترقية لمسؤول"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal إضافة طالب جديد */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">إضافة طالب جديد</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800"><X size={20} /></button>
              </div>

              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">الرقم الجامعي</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required 
                      value={studentNumber} 
                      onChange={(e) => setStudentNumber(e.target.value)} 
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 pr-11 text-white outline-none focus:border-indigo-500" 
                      placeholder="مثال: 20261001" 
                    />
                    <Hash size={18} className="absolute right-3.5 top-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">الاسم الكامل</label>
                  <input 
                    type="text" 
                    required 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-white outline-none focus:border-indigo-500" 
                    placeholder="مثال: أحمد علي" 
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">البريد الإلكتروني</label>
                  <input 
                    type="text" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-white outline-none focus:border-indigo-500" 
                    placeholder="student@example.com" 
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">كلمة المرور</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      required 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 pr-11 text-white outline-none focus:border-indigo-500" 
                      placeholder="كلمة المرور للدخول" 
                    />
                    <KeyRound size={18} className="absolute right-3.5 top-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">رقم الهاتف (اختياري)</label>
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-white outline-none focus:border-indigo-500" 
                    placeholder="07700000000" 
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input 
                    type="checkbox" 
                    id="isAdminCheck"
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                    className="h-5 w-5 rounded-lg border-slate-700 bg-slate-900 text-indigo-600 accent-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="isAdminCheck" className="text-sm font-medium text-slate-300 cursor-pointer">
                    منح صلاحية مسؤول (Admin) لهذا الحساب
                  </label>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-2xl border border-slate-800 px-6 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800">إلغاء</button>
                  <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
                    {submitting && <Loader2 size={18} className="animate-spin" />}
                    <span>حفظ الطالب</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* نافذة الحلفان الثانية للتاكيد الصارم للحذف */}
        {deleteStep === "swear" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-2xl text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">قسم الحذف المؤكد</h3>
              <p className="text-sm text-slate-400 mb-4">إذا متأكد من حذف حساب الطالب، احلف بالله واكتب كلمة <span className="font-bold text-indigo-400">والله</span> في الحقل أدناه:</p>

              <input
                type="text"
                value={swearInput}
                onChange={(e) => {
                  setSwearInput(e.target.value);
                  setSwearError("");
                }}
                placeholder="اكتب: والله"
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-3.5 text-center text-white outline-none focus:border-indigo-500 mb-2"
              />

              {swearError && (
                <p className="text-xs font-bold text-red-400 mb-4 animate-bounce">{swearError}</p>
              )}

              <div className="flex gap-3 mt-4">
                <button onClick={() => setDeleteStep(null)} className="flex-1 rounded-2xl border border-slate-800 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800">
                  إلغاء
                </button>
                <button onClick={handleFinalDeleteAction} className="flex-1 rounded-2xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20">
                  تم / تأكيد
                </button>
              </div>
            </div>
          </div>
        )}

        {/* نافذة التأكيد الأولى بالحذف */}
        {deleteStep === "confirm" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-2xl text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
                <ShieldAlert size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">تأكيد حذف الطالب</h3>
              <p className="text-sm text-slate-400 mb-6">أنت متأكد تريد حذف حساب الطالب "{studentToDelete?.full_name}"؟</p>
              
              <div className="flex gap-3">
                <button onClick={() => handleFirstConfirm(false)} className="flex-1 rounded-2xl border border-slate-800 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800">
                  لا
                </button>
                <button onClick={() => handleFirstConfirm(true)} className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 shadow-lg shadow-red-600/20">
                  نعم
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}