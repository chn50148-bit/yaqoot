import { useCallback, useEffect, useState } from 'react';
import { AcademyLanding } from './components/AcademyLanding';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthPortal } from './components/AuthPortal';
import { Footer } from './components/Footer';
import { Navbar, type PortalEntryMode } from './components/Navbar';
import { StudentDashboard } from './components/StudentDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import type { Course, CoursePlan, StudentUser, Teacher } from './types';

export default function App() {
  const [view, setView] = useState<'academy' | 'portal'>('academy');
  const [portalMode, setPortalMode] = useState<PortalEntryMode>('student-register');
  const [portalIntent, setPortalIntent] = useState<'trial' | 'enroll'>('trial');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<StudentUser | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [plans, setPlans] = useState<CoursePlan[]>([]);
  const [preselectedPlanId, setPreselectedPlanId] = useState<string | null>(null);

  const loadPublicCatalog = useCallback(() => {
    Promise.all([
      fetch('/api/courses').then((r) => r.json()),
      fetch('/api/teachers').then((r) => r.json()),
      fetch('/api/plans').then((r) => r.json()),
    ])
      .then(([cData, tData, pData]) => {
        if (Array.isArray(cData.courses)) setCourses(cData.courses);
        if (Array.isArray(tData.teachers)) setTeachers(tData.teachers);
        if (Array.isArray(pData.plans)) setPlans(pData.plans);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadPublicCatalog();
  }, [loadPublicCatalog]);

  const handleNavigateSection = useCallback(
    (sectionId: string) => {
      if (view !== 'academy') {
        setView('academy');
        window.setTimeout(() => {
          if (sectionId === 'top') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
          }
        }, 60);
      } else if (sectionId === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    [view]
  );

  const handleOpenPortal = useCallback(
    (mode: PortalEntryMode, options?: { intent?: 'trial' | 'enroll' }) => {
      setPortalMode(mode);
      setPortalIntent(options?.intent || 'trial');
      setView('portal');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const handleStartTrial = useCallback((options?: { planId?: string }) => {
    if (options?.planId) setPreselectedPlanId(options.planId);
    setPortalMode('student-register');
    setPortalIntent('trial');
    setView('portal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleEnrollNow = useCallback(
    (options?: { planId?: string }) => {
      if (options?.planId) setPreselectedPlanId(options.planId);
      setPortalMode(currentUser?.role === 'student' ? 'student-login' : 'student-register');
      setPortalIntent('enroll');
      setView('portal');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [currentUser]
  );

  const handleAuthenticated = useCallback((token: string, user: StudentUser) => {
    setAuthToken(token);
    setCurrentUser(user);
    setView('portal');
  }, []);

  const handleLogout = useCallback(() => {
    setAuthToken(null);
    setCurrentUser(null);
    setPortalMode('student-login');
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#F3EDE2] text-[#111815]">
      <Navbar
        currentView={view}
        user={currentUser}
        onNavigateSection={handleNavigateSection}
        onOpenPortal={handleOpenPortal}
      />

      <div className="flex-1">
        {view === 'academy' ? (
          <AcademyLanding
            courses={courses}
            teachers={teachers}
            plans={plans}
            onStartTrial={handleStartTrial}
            onEnrollNow={handleEnrollNow}
            onOpenPortal={handleOpenPortal}
          />
        ) : !authToken || !currentUser ? (
          <AuthPortal
            mode={portalMode}
            intent={portalIntent}
            courses={courses}
            onSwitchMode={setPortalMode}
            onAuthenticated={handleAuthenticated}
            onBackToAcademy={() => setView('academy')}
          />
        ) : currentUser.role === 'admin' ? (
          <AdminDashboard
            token={authToken}
            plans={plans}
            onCatalogChanged={loadPublicCatalog}
            onLogout={handleLogout}
            onBackToAcademy={() => setView('academy')}
          />
        ) : currentUser.role === 'teacher' ? (
          <TeacherDashboard
            token={authToken}
            onLogout={handleLogout}
            onBackToAcademy={() => setView('academy')}
          />
        ) : (
          <StudentDashboard
            token={authToken}
            initialIntent={portalIntent}
            preselectedPlanId={preselectedPlanId}
            onLogout={handleLogout}
            onBackToAcademy={() => setView('academy')}
          />
        )}
      </div>

      <Footer
        courses={courses}
        onNavigateSection={handleNavigateSection}
        onStartTrial={() => handleStartTrial()}
        onEnrollNow={() => handleEnrollNow()}
        onOpenPortal={(mode) => handleOpenPortal(mode)}
      />
    </div>
  );
}
