import {
  BookOpen,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Youtube,
} from 'lucide-react';
import type { Course } from '../types';
import type { PortalEntryMode } from './Navbar';

interface FooterProps {
  courses: Course[];
  onNavigateSection: (sectionId: string) => void;
  onStartTrial: () => void;
  onEnrollNow: () => void;
  onOpenPortal: (mode: PortalEntryMode) => void;
}

const SOCIAL_LINKS = [
  {
    name: 'Facebook',
    href: 'https://facebook.com',
    icon: Facebook,
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com',
    icon: Instagram,
  },
  {
    name: 'YouTube',
    href: 'https://youtube.com',
    icon: Youtube,
  },
];

export function Footer({
  courses,
  onNavigateSection,
  onStartTrial,
  onEnrollNow,
  onOpenPortal,
}: FooterProps) {
  return (
    <footer className="border-t border-[#06261C] bg-[#07261C] text-white">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand & Contact Info */}
          <div>
            <button
              type="button"
              onClick={() => onNavigateSection('top')}
              className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6B87C] rounded-sm"
            >
              <BookOpen className="h-5 w-5 text-[#D6B87C]" aria-hidden="true" />
              <span className="font-display text-2xl font-bold text-white">
                Yaqoot Wal Marjan
              </span>
            </button>

            <p className="mt-4 text-sm leading-relaxed text-white/75">
              Dedicated 1-on-1 online Quran education with certified male and female
              scholars. Serving students worldwide via scheduled Google Meet sessions.
            </p>

            <div className="mt-5 space-y-2.5 text-xs text-white/85">
              <a
                href="mailto:admissions@yaqootwalmarjan.com"
                className="flex items-center gap-2.5 hover:text-[#D6B87C] transition-colors"
              >
                <Mail className="h-3.5 w-3.5 text-[#D6B87C] shrink-0" aria-hidden="true" />
                <span>admissions@yaqootwalmarjan.com</span>
              </a>
              <a
                href="tel:+923000000000"
                className="flex items-center gap-2.5 font-mono tabular-nums hover:text-[#D6B87C] transition-colors"
              >
                <Phone className="h-3.5 w-3.5 text-[#D6B87C] shrink-0" aria-hidden="true" />
                <span>+92 300 0000000</span>
              </a>
              <p className="flex items-center gap-2.5 text-white/75">
                <MapPin className="h-3.5 w-3.5 text-[#D6B87C] shrink-0" aria-hidden="true" />
                <span>Global Online Campus · 24/7 Scheduling</span>
              </p>
            </div>
          </div>

          {/* Column 2: Quick Links & Courses */}
          <div>
            <h3 className="font-display text-xl font-semibold text-[#D6B87C]">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/80">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateSection('about')}
                  className="hover:text-white transition-colors"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateSection('courses')}
                  className="hover:text-white transition-colors"
                >
                  Quran Courses
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateSection('teachers')}
                  className="hover:text-white transition-colors"
                >
                  Certified Teachers
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateSection('pricing')}
                  className="hover:text-white transition-colors"
                >
                  Pricing &amp; Plans
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateSection('faq')}
                  className="hover:text-white transition-colors"
                >
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateSection('contact')}
                  className="hover:text-white transition-colors"
                >
                  Contact Admissions
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Academy Portals */}
          <div>
            <h3 className="font-display text-xl font-semibold text-[#D6B87C]">
              Academy Portals
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/80">
              <li>
                <button
                  type="button"
                  onClick={onStartTrial}
                  className="hover:text-white transition-colors"
                >
                  Start Free Trial
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onEnrollNow}
                  className="hover:text-white transition-colors"
                >
                  Enroll Now
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPortal('student-login')}
                  className="hover:text-white transition-colors"
                >
                  Student Login
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPortal('teacher-login')}
                  className="hover:text-white transition-colors"
                >
                  Staff Login
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPortal('admin-login')}
                  className="hover:text-white transition-colors"
                >
                  Admin Login
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Social Media & Programs */}
          <div>
            <h3 className="font-display text-xl font-semibold text-[#D6B87C]">
              Connect With Us
            </h3>
            <div className="mt-4 flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Yaqoot Wal Marjan on ${social.name}`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-white transition-colors hover:border-[#D6B87C] hover:bg-[#D6B87C] hover:text-[#07261C]"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                );
              })}
            </div>

            <div className="mt-6 border-t border-white/15 pt-4">
              <p className="text-xs font-semibold text-[#D6B87C]">Programs</p>
              <p className="mt-1.5 text-xs leading-relaxed text-white/75">
                {courses.length > 0
                  ? courses.map((c) => c.title).join(' · ')
                  : 'Noorani Qaida · Tajweed · Hifz · Qirat'}
              </p>
            </div>
          </div>
        </div>

        {/* Copyright Notice */}
        <div className="mt-12 flex flex-col gap-3 border-t border-white/15 pt-8 text-xs text-white/65 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 Yaqoot Wal Marjan. All rights reserved.</p>
          <p>JazzCash · EasyPaisa · Bank Transfer · PayPal</p>
        </div>
      </div>
    </footer>
  );
}
