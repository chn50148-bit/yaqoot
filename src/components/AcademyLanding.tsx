import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  ChevronDown,
  Clock,
  Globe,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { Course, CoursePlan, Teacher } from '../types';
import type { PortalEntryMode } from './Navbar';
import { TeachersSection } from './TeachersSection';

interface AcademyLandingProps {
  courses: Course[];
  teachers: Teacher[];
  plans: CoursePlan[];
  onStartTrial: (options?: { planId?: string }) => void;
  onEnrollNow: (options?: { planId?: string }) => void;
  onOpenPortal: (mode: PortalEntryMode) => void;
}

const WHY_CHOOSE_US = [
  {
    icon: Award,
    title: 'Ijazah-Certified Scholars',
    body: 'Every instructor is vetted for Tajweed accuracy, Sanad credentials, and calm pedagogical communication.',
  },
  {
    icon: Users,
    title: 'Dedicated 1-on-1 Attention',
    body: 'Private live sessions ensure personalized Makharij correction and steady memorization pace without classroom distraction.',
  },
  {
    icon: Globe,
    title: 'Global Timezone Flexibility',
    body: 'Schedule classes around school and work across UK, North America, Europe, Gulf, and Pakistan timezones.',
  },
  {
    icon: ShieldCheck,
    title: 'Structured Academy Oversight',
    body: 'Administrators coordinate teacher matching, verified Google Meet classrooms, and transparent tuition billing.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'How does the 3-day free trial work?',
    answer:
      'Your 72-hour free trial begins immediately when you register a student account—no credit card is required upfront. You can view your live countdown in the Student Dashboard and attend trial classes via Google Meet. Once the 3-day window ends, the dashboard locks automatically until you enroll in a monthly plan.',
  },
  {
    question: 'How are classes scheduled across different timezones?',
    answer:
      'All sessions are conducted 1-on-1 over Google Meet and coordinated by our Academy Administration across UK, North America, Europe, Gulf, and Pakistan timezones. Once scheduled, your exact class date, time, duration, and verified Google Meet joining link appear inside your Student Dashboard.',
  },
  {
    question: 'Which payment methods do you accept, and how does verification work?',
    answer:
      'We accept JazzCash, EasyPaisa, Bank Transfer (IBFT/Wire), and PayPal. After selecting your monthly plan (Noorani Qaida, Tajweed, Hifz, or Qirat) and submitting your sender details and Transaction ID, your payment enters Pending Verification. Once our Admin confirms the transfer, your dashboard and live classes unlock immediately.',
  },
  {
    question: 'Who assigns my Quran teacher, and are female teachers available?',
    answer:
      'Yes—our Ijazah-certified faculty includes both male and female scholars fluent in English, Arabic, and Urdu. To ensure the best pedagogical fit for age, Tajweed level, and language preference, the Academy Administrator personally matches and assigns your scholar, and you may request a change anytime.',
  },
  {
    question: 'What happens if my 3-day trial expires before I submit payment?',
    answer:
      'Your account, preferred course, and teacher assignment remain safely saved. Live class links are simply paused on Day 4 until you submit a monthly plan payment and Admin verification is completed.',
  },
  {
    question: 'Can children and adults enroll in different programs?',
    answer:
      'Yes. Children typically begin with Noorani Qaida ($39/mo) before advancing to Tajweed ($55/mo), Hifz ($79/mo), or Qirat ($69/mo), while adult learners may start directly in the level suited to their evaluation during the 3-day trial.',
  },
];

export function AcademyLanding({
  courses,
  teachers,
  plans,
  onStartTrial,
  onEnrollNow,
  onOpenPortal,
}: AcademyLandingProps) {
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setContactError(null);
    setContactSuccess(null);
    setContactLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          phone: contactPhone,
          message: contactMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setContactError(data.error || 'Unable to send message.');
        return;
      }
      setContactSuccess(data.message);
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactMessage('');
    } catch {
      setContactError('Network error while submitting inquiry.');
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <main id="top">
      {/* 1. Hero & Introduction to Yaqoot Wal Marjan */}
      <section className="bg-[#093628] text-white">
        <div className="mx-auto max-w-7xl px-6 pb-14 pt-12 lg:pb-16 lg:pt-16">
          <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="text-xs font-semibold tracking-wide text-[#D6B87C]">
                Yaqoot Wal Marjan · Online Islamic &amp; Quran Academy
              </p>
              <h1 className="mt-4 font-display text-[clamp(2.5rem,4.3vw,4rem)] font-bold leading-[1.06] tracking-tight text-white [text-wrap:balance]">
                Learn Quran Online with Certified Scholars
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85">
                Yaqoot Wal Marjan offers live 1-on-1 Noorani Qaida, Tajweed, Hifz, and
                Qirat classes from home. Begin with a 3-day free trial, meet your
                assigned scholar via Google Meet, and enroll monthly when ready.
              </p>

              {/* Primary Hero Actions */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onStartTrial()}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#D6B87C] px-6 py-3 text-sm font-bold text-[#093628] transition-colors hover:bg-[#E2C994] whitespace-nowrap shrink-0"
                >
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => onEnrollNow()}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 whitespace-nowrap shrink-0"
                >
                  Enroll Now
                </button>
              </div>

              {/* Portal Access Bar: Student Login, Staff Login, Admin Login */}
              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/15 pt-5 text-xs">
                <span className="font-medium text-white/70">Portals:</span>
                <button
                  type="button"
                  onClick={() => onOpenPortal('student-login')}
                  className="rounded-md border border-white/25 px-3 py-1.5 font-semibold text-white transition-colors hover:bg-white/15 whitespace-nowrap shrink-0"
                >
                  Student Login
                </button>
                <button
                  type="button"
                  onClick={() => onOpenPortal('teacher-login')}
                  className="rounded-md border border-white/25 px-3 py-1.5 font-semibold text-white transition-colors hover:bg-white/15 whitespace-nowrap shrink-0"
                >
                  Staff Login
                </button>
                <button
                  type="button"
                  onClick={() => onOpenPortal('admin-login')}
                  className="rounded-md border border-[#D6B87C]/50 px-3 py-1.5 font-semibold text-[#D6B87C] transition-colors hover:bg-[#D6B87C]/15 whitespace-nowrap shrink-0"
                >
                  Admin Login
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-full min-h-[280px] overflow-hidden rounded-2xl border border-white/15 bg-[#06261C]">
                {!heroImgFailed ? (
                  <img
                    src="/src/assets/images/hero_quran_study_1795605516747.jpg"
                    alt="Open Quran resting on a handcrafted wooden stand in warm natural study light"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="h-full w-full object-cover lg:h-full"
                  />
                ) : (
                  <div className="flex h-full min-h-[320px] flex-col items-center justify-center bg-[#06261C] p-8 text-center">
                    <BookOpen className="h-12 w-12 text-[#D6B87C]" aria-hidden="true" />
                    <p className="mt-4 font-display text-2xl font-semibold text-white">
                      Yaqoot Wal Marjan Study Room
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-6 border-t border-white/15 pt-7 lg:grid-cols-4">
            <div>
              <p className="font-mono text-2xl font-semibold text-[#D6B87C] tabular-nums">
                03 Days
              </p>
              <p className="mt-1 text-xs text-white/75">
                Complimentary trial before paid enrollment
              </p>
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold text-[#D6B87C] tabular-nums">
                1-on-1
              </p>
              <p className="mt-1 text-xs text-white/75">
                Live Google Meet classes with scholars
              </p>
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold text-[#D6B87C] tabular-nums">
                {teachers.length} Scholars
              </p>
              <p className="mt-1 text-xs text-white/75">
                Male &amp; female Ijazah-certified faculty
              </p>
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold text-[#D6B87C] tabular-nums">
                {courses.length} Programs
              </p>
              <p className="mt-1 text-xs text-white/75">
                Noorani Qaida, Tajweed, Hifz &amp; Qirat
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. About Us Section */}
      <section id="about" className="border-b border-[#D4CBB8] bg-white py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold tracking-wide text-[#093628]">
              About Yaqoot Wal Marjan
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#111815] sm:text-4xl [text-wrap:balance]">
              Preserving authentic Quranic recitation for modern families worldwide
            </h2>
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-[#3C4641] lg:col-span-7">
            <p>
              Inspired by the Quranic imagery of rubies and coral in Surah Ar-Rahman,
              <strong className="text-[#111815]"> Yaqoot Wal Marjan</strong> connects
              dedicated students of all ages with qualified male and female Quran
              teachers from Al-Azhar and recognized Islamic seminaries.
            </p>
            <p>
              Every student receives individualized pacing managed directly by our
              academic administration—from initial 3-day trial evaluation through
              long-term Tajweed, Hifz, and Qirat mastery via reliable scheduled Google
              Meet sessions.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Courses Section */}
      <section id="courses" className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wide text-[#093628]">
            Structured Curriculum
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#111815] sm:text-4xl [text-wrap:balance]">
            Specialized Quran programs for children and adults
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 border-t border-[#D4CBB8] pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="rounded-xl border border-[#D4CBB8] bg-white p-6"
            >
              <h3 className="font-display text-2xl font-bold text-[#093628]">
                {course.number} {course.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#3C4641]">
                {course.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Teachers Showcase (Hover for credentials) */}
      <TeachersSection teachers={teachers} />

      {/* 5. Free Trial Section */}
      <section className="border-t border-[#D4CBB8] bg-[#093628] py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#D6B87C]">
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span>3-Day Free Trial Program</span>
            </div>
            <h2 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl [text-wrap:balance]">
              Experience live 1-on-1 Quran classes free for 3 days
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              Register as a student to start your 72-hour trial immediately. Attend
              trial sessions scheduled by our administration, and enroll in a monthly
              plan whenever you are ready to continue.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={() => onStartTrial()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#D6B87C] px-6 py-3 text-sm font-bold text-[#093628] hover:bg-[#E2C994] whitespace-nowrap"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onOpenPortal('student-login')}
              className="inline-flex items-center gap-2 rounded-lg border border-white/35 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 whitespace-nowrap"
            >
              Student Login
            </button>
          </div>
        </div>
      </section>

      {/* 6. Pricing & Plans Section */}
      <section
        id="pricing"
        className="border-t border-[#D4CBB8] bg-[#F3EDE2] py-20 lg:py-24"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-[#093628]">
              Pricing &amp; Plans
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#111815] sm:text-4xl [text-wrap:balance]">
              Monthly tuition plans for every Quran program
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan, idx) => {
              const featured = idx === 1;
              return (
                <div
                  key={plan.id}
                  className={`flex flex-col justify-between rounded-xl border p-6 ${
                    featured
                      ? 'border-[#093628] bg-[#093628] text-white'
                      : 'border-[#D4CBB8] bg-white text-[#111815]'
                  }`}
                >
                  <div>
                    <h3
                      className={`font-display text-3xl font-bold ${
                        featured ? 'text-white' : 'text-[#111815]'
                      }`}
                    >
                      {plan.name}
                    </h3>

                    <div className="mt-4 flex items-baseline gap-1.5">
                      <span className="font-mono text-4xl font-semibold tabular-nums">
                        ${plan.priceUsd}
                      </span>
                      <span
                        className={`text-xs ${
                          featured ? 'text-white/75' : 'text-[#525B56]'
                        }`}
                      >
                        {plan.billingCycle}
                      </span>
                    </div>

                    <ul className="mt-6 space-y-3 border-t border-current/15 pt-5 text-sm">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5">
                          <Check
                            className={`mt-0.5 h-4 w-4 shrink-0 ${
                              featured ? 'text-[#D6B87C]' : 'text-[#093628]'
                            }`}
                            aria-hidden="true"
                          />
                          <span className={featured ? 'text-white/90' : 'text-[#3C4641]'}>
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEnrollNow({ planId: plan.id })}
                    className={`mt-8 w-full rounded-lg px-5 py-3 text-sm font-semibold transition-colors ${
                      featured
                        ? 'bg-[#D6B87C] text-[#093628] hover:bg-[#E2C994]'
                        : 'bg-[#093628] text-white hover:bg-[#06261C]'
                    }`}
                  >
                    Enroll Now
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Why Choose Us Section */}
      <section className="border-t border-[#D4CBB8] bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-[#093628]">
              Why Choose Yaqoot Wal Marjan
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#111815] sm:text-4xl [text-wrap:balance]">
              Built on scholarly integrity, consistency, and personal care
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_CHOOSE_US.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-xl border border-[#D4CBB8] bg-[#FAF8F4] p-6"
                >
                  <Icon className="h-6 w-6 text-[#093628]" aria-hidden="true" />
                  <h3 className="mt-4 font-display text-2xl font-bold text-[#111815]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#3C4641]">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. Frequently Asked Questions */}
      <section
        id="faq"
        className="border-t border-[#D4CBB8] bg-[#F3EDE2] py-20 lg:py-24"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold tracking-wide text-[#093628]">
              Frequently Asked Questions
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#111815] sm:text-4xl [text-wrap:balance]">
              Clarity on free trials, scheduling, and tuition payment
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#3C4641]">
              Everything parents and adult learners ask before beginning 1-on-1
              Quran lessons at Yaqoot Wal Marjan.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onStartTrial()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#093628] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#06261C] whitespace-nowrap"
              >
                Start 3-Day Free Trial
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onEnrollNow()}
                className="inline-flex items-center gap-2 rounded-lg border border-[#093628] px-5 py-3 text-sm font-semibold text-[#093628] transition-colors hover:bg-[#093628]/8 whitespace-nowrap"
              >
                Enroll Now
              </button>
            </div>
          </div>

          <div className="space-y-3 lg:col-span-7">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              const panelId = `faq-panel-${idx}`;
              const buttonId = `faq-button-${idx}`;

              return (
                <div
                  key={item.question}
                  className="overflow-hidden rounded-xl border border-[#C8BEA8] bg-white transition-colors"
                >
                  <h3>
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-[#FAF8F4]"
                    >
                      <span className="font-display text-xl font-bold text-[#111815] sm:text-2xl">
                        <span className="mr-2.5 font-mono text-xs font-semibold text-[#8A611C] tabular-nums">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        {item.question}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-[#093628] transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </h3>
                  {isOpen && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="border-t border-[#EAE2D3] px-6 pb-5 pt-3.5 text-sm leading-relaxed text-[#3C4641]"
                    >
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. Contact Section */}
      <section
        id="contact"
        className="border-t border-[#D4CBB8] bg-[#EAE2D3] py-20 lg:py-24"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold tracking-wide text-[#093628]">
              Contact &amp; Admissions
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#111815] sm:text-4xl [text-wrap:balance]">
              Have questions about courses, schedules, or family enrollment?
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#3C4641]">
              Send an inquiry directly to the Yaqoot Wal Marjan admissions office. Our
              administrators respond promptly with schedule availability.
            </p>

            <div className="mt-8 space-y-3 text-sm text-[#111815]">
              <p className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-[#093628] shrink-0" aria-hidden="true" />
                <span>admissions@yaqootwalmarjan.com</span>
              </p>
              <p className="flex items-center gap-3 font-mono tabular-nums">
                <Phone className="h-4 w-4 text-[#093628] shrink-0" aria-hidden="true" />
                <span>+92 300 0000000 (WhatsApp / Admissions)</span>
              </p>
              <p className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-[#093628] shrink-0" aria-hidden="true" />
                <span>Global Online Campus · Google Meet Classrooms</span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#C8BEA8] bg-white p-7 lg:col-span-7 lg:p-8">
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-xs font-semibold text-[#111815]"
                  >
                    Your Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Full name"
                    className="mt-1.5 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#111815] focus:border-[#093628] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-xs font-semibold text-[#111815]"
                  >
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1.5 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#111815] focus:border-[#093628] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact-phone"
                  className="block text-xs font-semibold text-[#111815]"
                >
                  Phone / WhatsApp (Optional)
                </label>
                <input
                  id="contact-phone"
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+92 / +44 / +1..."
                  className="mt-1.5 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#111815] focus:border-[#093628] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-xs font-semibold text-[#111815]"
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  required
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Share student age, preferred course, or timezone..."
                  className="mt-1.5 w-full rounded-lg border border-[#C8BEA8] bg-[#FAF8F4] px-3.5 py-2.5 text-sm text-[#111815] focus:border-[#093628] focus:outline-none"
                />
              </div>

              {contactError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800"
                >
                  {contactError}
                </div>
              )}

              {contactSuccess && (
                <div
                  role="status"
                  className="rounded-lg border border-[#093628]/30 bg-[#093628]/10 px-3.5 py-2.5 text-xs font-semibold text-[#093628]"
                >
                  {contactSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={contactLoading}
                className="rounded-lg bg-[#093628] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#06261C] disabled:opacity-60"
              >
                {contactLoading ? 'Sending Inquiry...' : 'Send Inquiry'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
