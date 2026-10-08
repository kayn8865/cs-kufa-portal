import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";

import Header from "./components/Header";
import SideMenu from "./components/SideMenu";
import type { Page } from "./components/SideMenu";

import HomePage from "./pages/HomePage";
import SubjectsPage from "./pages/SubjectsPage";
import LecturesPage from "./pages/LecturesPage";
import LectureDetailsPage from "./pages/LectureDetailsPage";
import NotificationsPage from "./pages/NotificationsPage";

function App() {
  const [page, setPage] = useState<Page>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [selectedSubject, setSelectedSubject] = useState("web");
  const [selectedSubjectName, setSelectedSubjectName] =
    useState("برمجة الويب");

  const [selectedLecture, setSelectedLecture] =
    useState("lecture-1");
  const [selectedLectureTitle, setSelectedLectureTitle] =
    useState("مقدمة في المادة");

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      darkMode
    );
  }, [darkMode]);

  const navigate = (newPage: Page) => {
    setPage(newPage);
    setMenuOpen(false);
  };

  const handleSelectSubject = (subjectId: string) => {
    setSelectedSubject(subjectId);

    const subjectNames: Record<string, string> = {
      web: "برمجة الويب",
      game: "برمجة الألعاب",
      database: "قواعد البيانات",
      programming: "البرمجة",
      design: "التصميم",
      other: "مواد أخرى",
    };

    setSelectedSubjectName(
      subjectNames[subjectId] ?? "المادة الدراسية"
    );

    setPage("lectures");
  };

  const handleOpenSubject = () => {
    setPage("subjects");
  };

  const handleSelectLecture = (lectureId: string) => {
    setSelectedLecture(lectureId);

    const lectureTitles: Record<string, string> = {
      "lecture-1": "مقدمة في المادة",
      "lecture-2": "المحاضرة الثانية",
      "lecture-3": "المحاضرة الثالثة",
    };

    setSelectedLectureTitle(
      lectureTitles[lectureId] ?? "المحاضرة"
    );

    setPage("lecture-details");
  };

  const handleOpenLecture = () => {
    setPage("lectures");
  };

  return (
    <div
      dir="rtl"
      className={`min-h-screen transition-colors duration-300 ${
        darkMode
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      <Header
        darkMode={darkMode}
        onMenu={() => setMenuOpen(true)}
        onNotifications={() =>
          navigate("notifications")
        }
      />

      <main className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {page === "home" && (
            <HomePage
              key="home"
              onSubjects={() => navigate("subjects")}
            />
          )}

          {page === "subjects" && (
            <SubjectsPage
              key="subjects"
              onSelectSubject={handleSelectSubject}
            />
          )}

          {page === "lectures" && (
            <LecturesPage
              key="lectures"
              subjectName={selectedSubjectName}
              onSelectLecture={handleSelectLecture}
              onBack={handleOpenSubject}
            />
          )}

          {page === "lecture-details" && (
            <LectureDetailsPage
              key="lecture-details"
              lectureTitle={selectedLectureTitle}
              onBack={handleOpenLecture}
            />
          )}

          {page === "notifications" && (
            <NotificationsPage
              key="notifications"
            />
          )}
        </AnimatePresence>
      </main>

      <SideMenu
        open={menuOpen}
        page={page}
        onClose={() => setMenuOpen(false)}
        onNavigate={navigate}
      />
    </div>
  );
}

export default App;