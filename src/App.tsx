import { useEffect, useState } from "react";
import { HashRouter as Router, Routes, Route, Navigate, Outlet, useNavigate, useLocation, useParams } from "react-router-dom";
import { supabase } from "./lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { Loader2, ChevronLeft } from "lucide-react";
import OneSignal from "react-onesignal";

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
  const [isDark, setIsDark] = useState(false);
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
    const root = window.document.documentElement;

    const theme = localStorage.getItem("theme");
    const darkCheck = theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    if (darkCheck) {
      root.classList.add("dark");
      setIsDark(true);
    } else {
      root.classList.remove("dark");
      setIsDark(false);
    }

    const savedColor = localStorage.getItem("colorTheme") || "indigo";
    root.setAttribute("data-theme-color", savedColor);

    const interval = setInterval(() => {
      const currentDark = root.classList.contains("dark");
      if (currentDark !== isDark) {
        setIsDark(currentDark);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isDark, location]);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-white relative">
      <Header
        darkMode={isDark}
        onMenu={() => setMenuOpen(true)}
        onNotifications={() => navigate("/notifications")}
      />
      <main className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {!menuOpen && (
        <button
          onClick={() => setMenuOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-slate-900/80 hover:bg-slate-900 text-white py-4 px-1.5 rounded-l-2xl shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 flex items-center justify-center cursor-pointer border-y border-l border-slate-700/50"
          aria-label="فتح القائمة"
        >
          <ChevronLeft size={20} className="animate-pulse" />
        </button>
      )}

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
    const savedColor = localStorage.getItem("colorTheme") || "indigo";
    window.document.documentElement.setAttribute("data-theme-color", savedColor);

    // تهيئة الإشعارات باستخدام App ID الخاص بك
    try {
      OneSignal.init({
        appId: "cdce7558-a5ac-4dbe-b2e7-5cd86ef012f4",
        allowLocalhostAsSecureOrigin: true,
        slidedown: {
          enabled: true,
          autoPrompt: true,
          timeDelay: 1,
        }
      });
    } catch (e) {
      console.error("OneSignal init error:", e);
    }

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
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

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
    </Router>
  );
}