import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate, useLocation, useParams } from "react-router-dom";
import { supabase } from "./lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

// Components
import Header from "./components/Header";
import SideMenu from "./components/SideMenu";
import type { Page } from "./components/SideMenu";

// Student Pages
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import SubjectsPage from "./pages/SubjectsPage";
import LecturesPage from "./pages/LecturesPage";
import LectureDetailPage from "./pages/LectureDetails";
import LectureVideosPage from "./pages/LectureVideos";
import LectureQuestionsPage from "./pages/LectureQuestions";
import LectureAssignmentsPage from "./pages/LectureAssignments";
import NotificationsPage from "./pages/NotificationsPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import SchedulePage from "./pages/SchedulePage";
import EntertainmentPage from "./pages/EntertainmentPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";

// Admin Pages
import AdminDashboard from "./admin/AdminDashboard";
import StudentsManagement from "./admin/StudentsManagement";
import SubjectsManagement from "./admin/SubjectsManagement";
import LecturesManagement from "./admin/LecturesManagement";
import LectureDetailsAdmin from "./admin/LectureDetailAdmin";
import LectureVideosManagement from "./admin/LectureVideosManagement";
import LectureQuestionsManagement from "./admin/LectureQuestionsManagement";
import LectureAssignmentsManagement from "./admin/LectureAssignmentsManagement";
import AnnouncementsManagement from "./admin/AnnouncementsManagement";
import ScheduleManagement from "./admin/ScheduleManagement";
import FeaturedManagement from "./admin/FeaturedManagement";
import EntertainmentManagement from "./admin/EntertainmentManagement";

function MainLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentPage = (): Page => {
    const path = location.pathname;
    if (path === "/") return "home";
    if (path.startsWith("/subjects")) return "subjects";
    if (path === "/notifications") return "notifications";
    if (path === "/announcements") return "announcements";
    if (path === "/schedule") return "schedule";
    if (path === "/entertainment") return "entertainment";
    if (path === "/profile") return "profile";
    if (path === "/settings") return "settings";
    return "home";
  };

  const handleNavigate = (newPage: Page) => {
    setMenuOpen(false);
    switch (newPage) {
      case "home": navigate("/"); break;
      case "subjects": navigate("/subjects"); break;
      case "notifications": navigate("/notifications"); break;
      case "announcements": navigate("/announcements"); break;
      case "schedule": navigate("/schedule"); break;
      case "entertainment": navigate("/entertainment"); break;
      case "profile": navigate("/profile"); break;
      case "settings": navigate("/settings"); break;
      default: navigate("/");
    }
  };

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    const root = window.document.documentElement;
    if (theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      <Header
        darkMode={document.documentElement.classList.contains("dark")}
        onMenu={() => setMenuOpen(true)}
        onNotifications={() => navigate("/notifications")}
      />
      <main className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <SideMenu
        open={menuOpen}
        page={getCurrentPage()}
        onClose={() => setMenuOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

function HomePageWrapper() {
  const navigate = useNavigate();
  return <HomePage onSubjects={() => navigate("/subjects")} />;
}

function SubjectsPageWrapper() {
  const navigate = useNavigate();
  return <SubjectsPage onSelectSubject={(subjectId) => navigate(`/subjects/${subjectId}`)} />;
}

function LecturesPageWrapper() {
  const navigate = useNavigate();
  const { subjectId } = useParams<{ subjectId: string }>();
  
  return (
    <LecturesPage 
      subjectId={subjectId} 
      onSelectLecture={(lectureId) => navigate(`/lectures/${lectureId}`)} 
      onBack={() => navigate("/subjects")} 
    />
  );
}

function LectureDetailsPageWrapper() {
  const navigate = useNavigate();
  const { lectureId } = useParams<{ lectureId: string }>();

  return (
    <LectureDetailPage 
      lectureId={lectureId || ""} 
      onBack={() => navigate(-1 as any)} 
    />
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 size={40} className="animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* صفحة تسجيل الدخول */}
        <Route path="/login" element={<LoginPage />} />

        {/* مسارات لوحة التحكم للإدارة (محمية بـ session) */}
        <Route path="/admin" element={session ? <AdminDashboard /> : <Navigate to="/login" replace />} />
        <Route path="/admin/students" element={session ? <StudentsManagement /> : <Navigate to="/login" replace />} />
        <Route path="/admin/subjects" element={session ? <SubjectsManagement /> : <Navigate to="/login" replace />} />
        <Route path="/admin/subjects/:subjectId/lectures" element={session ? <LecturesManagement /> : <Navigate to="/login" replace />} />
        
        <Route path="/admin/lectures/:lectureId/details" element={session ? <LectureDetailsAdmin /> : <Navigate to="/login" replace />} />
        <Route path="/admin/lectures/:lectureId/videos" element={session ? <LectureVideosManagement /> : <Navigate to="/login" replace />} />
        <Route path="/admin/lectures/:lectureId/questions" element={session ? <LectureQuestionsManagement /> : <Navigate to="/login" replace />} />
        <Route path="/admin/lectures/:lectureId/assignments" element={session ? <LectureAssignmentsManagement /> : <Navigate to="/login" replace />} />

        <Route path="/admin/announcements" element={session ? <AnnouncementsManagement /> : <Navigate to="/login" replace />} />
        <Route path="/admin/schedule" element={session ? <ScheduleManagement /> : <Navigate to="/login" replace />} />
        <Route path="/admin/entertainment" element={session ? <EntertainmentManagement /> : <Navigate to="/login" replace />} />
        <Route path="/admin/featured" element={session ? <FeaturedManagement /> : <Navigate to="/login" replace />} />

        {/* مسارات بوابة الطلاب والموقع العام (مفتوحة بالكامل مباشرة بدون تسجيل دخول وتجلب البيانات بصورة طبيعية) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePageWrapper />} />
          <Route path="/subjects" element={<SubjectsPageWrapper />} />
          <Route path="/subjects/:subjectId" element={<LecturesPageWrapper />} />
          <Route path="/lectures/:lectureId" element={<LectureDetailsPageWrapper />} />
          
          <Route path="/lectures/:lectureId/videos" element={<LectureVideosPage />} />
          <Route path="/lectures/:lectureId/questions" element={<LectureQuestionsPage />} />
          <Route path="/lectures/:lectureId/assignments" element={<LectureAssignmentsPage />} />

          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/entertainment" element={<EntertainmentPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}