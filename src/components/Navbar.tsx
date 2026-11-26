import { BookOpen, Menu, X } from 'lucide-react';
import { useState } from 'react';
import type { StudentUser } from '../types';

export type PortalEntryMode =
  | 'student-register'
  | 'student-login'
  | 'teacher-login'
  | 'admin-login';

interface NavbarProps {
  currentView: 'academy' | 'portal';
  user: StudentUser | null;
  onNavigateSection: (sectionId: string) => void;
  onOpenPortal: (mode: PortalEntryMode, options?: { intent?: 'trial' | 'enroll' }) => void;
}

export function Navbar({
  currentView,
  user,
  onNavigateSection,
  onOpenPortal,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSectionClick = (sectionId: string) => {
    setMobileOpen(false);
    onNavigateSection(sectionId);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#D4CBB8] bg-[#F3EDE2]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-4">
        <button
          type="button"
          onClick={() => handleSectionClick('top')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#093628] rounded-sm"
        >
          <BookOpen className="h-5 w-5 text-[#093628]" aria-hidden="true" />
          <span className="font-display text-2xl font-bold tracking-tight text-[#111815] whitespace-nowrap shrink-0">
            Yaqoot Wal Marjan
          </span>
        </button>

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#3C4641]"
        >
          <button
            type="button"
            onClick={() => handleSectionClick('about')}
            className="hover:text-[#093628] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            About
          </button>
          <button
            type="button"
            onClick={() => handleSectionClick('courses')}
            className="hover:text-[#093628] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Courses
          </button>
          <button
            type="button"
            onClick={() => handleSectionClick('teachers')}
            className="hover:text-[#093628] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Teachers
          </button>
          <button
            type="button"
            onClick={() => handleSectionClick('pricing')}
            className="hover:text-[#093628] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Pricing
          </button>
          <button
            type="button"
            onClick={() => handleSectionClick('contact')}
            className="hover:text-[#093628] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Contact
          </button>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() =>
              user
                ? onOpenPortal(
                    user.role === 'admin'
                      ? 'admin-login'
                      : user.role === 'teacher'
                      ? 'teacher-login'
                      : 'student-login'
                  )
                : onOpenPortal('student-register', { intent: 'trial' })
            }
            className="hidden sm:inline-flex items-center justify-center rounded-lg bg-[#093628] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#06261C] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#093628] focus-visible:ring-offset-2"
          >
            {user
              ? currentView === 'portal'
                ? 'Dashboard Active'
                : 'Open Dashboard'
              : 'Start Free Trial'}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex md:hidden items-center justify-center rounded-lg border border-[#D4CBB8] p-2 text-[#111815] hover:bg-[#E7DFCE]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#D4CBB8] bg-[#F3EDE2] px-6 py-4 md:hidden">
          <div className="flex flex-col gap-2.5 text-sm font-semibold text-[#111815]">
            <button
              type="button"
              onClick={() => handleSectionClick('about')}
              className="py-1.5 text-left hover:text-[#093628]"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => handleSectionClick('courses')}
              className="py-1.5 text-left hover:text-[#093628]"
            >
              Courses
            </button>
            <button
              type="button"
              onClick={() => handleSectionClick('teachers')}
              className="py-1.5 text-left hover:text-[#093628]"
            >
              Teachers
            </button>
            <button
              type="button"
              onClick={() => handleSectionClick('pricing')}
              className="py-1.5 text-left hover:text-[#093628]"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => handleSectionClick('contact')}
              className="py-1.5 text-left hover:text-[#093628]"
            >
              Contact
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenPortal('student-register', { intent: 'trial' });
              }}
              className="mt-1 inline-flex items-center justify-center rounded-lg bg-[#093628] px-4 py-2.5 text-sm font-semibold text-white"
            >
              {user ? 'Open Dashboard' : 'Start Free Trial'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
