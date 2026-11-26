import { GraduationCap } from 'lucide-react';
import { useState } from 'react';
import type { Teacher } from '../types';

interface TeachersSectionProps {
  teachers: Teacher[];
}

export function TeachersSection({ teachers }: TeachersSectionProps) {
  const [activeTouchId, setActiveTouchId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  return (
    <section
      id="teachers"
      className="border-t border-[#D4CBB8] bg-[#EAE2D3] py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-[#093628]">
              Certified Faculty
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#111815] sm:text-4xl [text-wrap:balance]">
              Learn directly from Ijazah-certified male and female scholars
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-[#3C4641]">
            Move your cursor over any teacher portrait to view their qualifications,
            experience, languages, specialty, and availability.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {teachers.map((teacher) => {
            const isRevealed = activeTouchId === teacher.id;
            const imgFailed = Boolean(failedImages[teacher.id]);

            return (
              <article
                key={teacher.id}
                tabIndex={0}
                onClick={() =>
                  setActiveTouchId((prev) => (prev === teacher.id ? null : teacher.id))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveTouchId((prev) =>
                      prev === teacher.id ? null : teacher.id
                    );
                  }
                }}
                aria-label={`${teacher.name}, ${teacher.title}. Hover or select for full credentials.`}
                className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border border-[#C8BEA8] bg-[#DFD6C5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#093628]"
              >
                {!imgFailed ? (
                  <img
                    src={teacher.photoUrl}
                    alt={`${teacher.name} — ${teacher.title}`}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [teacher.id]: true }))
                    }
                    className="h-full w-full object-cover object-top transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#EAE2D3] to-[#D6CCB8] p-6 text-center">
                    <GraduationCap
                      className="h-10 w-10 text-[#093628]"
                      aria-hidden="true"
                    />
                    <span className="mt-3 font-display text-xl font-bold text-[#111815]">
                      {teacher.name}
                    </span>
                    <span className="mt-1 text-xs text-[#3C4641]">{teacher.title}</span>
                  </div>
                )}

                <div
                  className={`pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-5 text-white transition-opacity duration-200 ${
                    isRevealed
                      ? 'opacity-0'
                      : 'opacity-100 group-hover:opacity-0 group-focus-within:opacity-0'
                  }`}
                >
                  <h3 className="font-display text-2xl font-semibold leading-tight text-white">
                    {teacher.name}
                  </h3>
                  <p className="mt-1 text-xs text-white/85">
                    {teacher.specialty} · {teacher.experienceYears} yrs exp.
                  </p>
                </div>

                <div
                  className={`absolute inset-0 flex flex-col justify-between bg-[#07261C]/95 p-5 text-white transition-all duration-200 ease-out ${
                    isRevealed
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto'
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold text-[#D6B87C]">
                      {teacher.experienceYears} Years Experience · {teacher.availability}
                    </p>
                    <h3 className="mt-1.5 font-display text-2xl font-semibold leading-tight text-white">
                      {teacher.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-white/80">{teacher.title}</p>

                    <div className="my-3 h-px bg-white/15" />

                    <dl className="space-y-2.5 text-xs leading-relaxed">
                      <div>
                        <dt className="font-semibold text-[#D6B87C]">Qualifications</dt>
                        <dd className="mt-0.5 text-white/95">{teacher.qualifications}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-[#D6B87C]">Languages</dt>
                        <dd className="mt-0.5 text-white/95">
                          {teacher.languages.join(' · ')}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-[#D6B87C]">Biography</dt>
                        <dd className="mt-0.5 line-clamp-3 text-white/90">
                          {teacher.bio}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <p className="border-t border-white/15 pt-3 text-[11px] font-medium text-white/75">
                    Assigned by Yaqoot Wal Marjan Administration
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
