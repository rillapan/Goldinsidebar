'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shuffle, AlertTriangle, BellOff,
  Zap, BarChart3, BellRing,
  CheckCircle2, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

// ── Icon mapping (index-matched to problems/solutions arrays) ──
const PROBLEM_ICONS = [
  <Shuffle  key="p1" className="w-7 h-7" strokeWidth={1.8} />,
  <AlertTriangle key="p2" className="w-7 h-7" strokeWidth={1.8} />,
  <BellOff  key="p3" className="w-7 h-7" strokeWidth={1.8} />,
];

const SOLUTION_ICONS = [
  <Zap      key="s1" className="w-7 h-7" strokeWidth={1.8} />,
  <BarChart3 key="s2" className="w-7 h-7" strokeWidth={1.8} />,
  <BellRing key="s3" className="w-7 h-7" strokeWidth={1.8} />,
];

// Real trading / finance images from Unsplash
const SOLUTION_IMAGES = [
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80',
];

const AUTO_PLAY_MS = 4500;

export function PainSolutionSection() {
  const { t } = useI18n();
  const ps = t.problemSolution;

  const [tab, setTab]           = useState<'problem' | 'solution'>('problem');
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  const items = tab === 'problem' ? ps.problems : ps.solutions;

  // Auto-advance with progress bar
  useEffect(() => {
    setProgress(0);
    setActiveIdx(0);
  }, [tab]);

  useEffect(() => {
    const totalTicks = AUTO_PLAY_MS / 100;
    let ticks = 0;

    const id = setInterval(() => {
      ticks += 1;
      if (ticks >= totalTicks) {
        ticks = 0;
        setProgress(0);
        setActiveIdx((i) => {
          const next = i + 1;
          if (next >= items.length) {
            setTab((t) => (t === 'problem' ? 'solution' : 'problem'));
            return 0;
          }
          return next;
        });
      } else {
        setProgress((ticks / totalTicks) * 100);
      }
    }, 100);
    return () => clearInterval(id);
  }, [items.length, tab]);

  const handleTabChange = (next: 'problem' | 'solution') => {
    setTab(next);
    setActiveIdx(0);
    setProgress(0);
  };

  const handleCardClick = (idx: number) => {
    setActiveIdx(idx);
    setProgress(0);
  };

  return (
    <section className="relative py-20 px-4 overflow-hidden">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-dark via-[#0b0a10] to-brand-dark" />
      <div className="pointer-events-none absolute -left-40 top-1/3 w-[500px] h-[500px] rounded-full bg-red-900/8 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-1/4 w-[400px] h-[400px] rounded-full bg-amber-600/8 blur-[120px]" />

      <div className="relative max-w-6xl mx-auto">

        {/* ── Section header ── */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-gray-500 text-sm uppercase tracking-widest mb-3">{ps.header}</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white font-display mb-4">{ps.title}</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-base leading-relaxed">{ps.subtitle}</p>
        </motion.div>

        {/* ── Toggle buttons ── */}
        <div className="flex justify-center gap-3 mb-10">
          {(['problem', 'solution'] as const).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={[
                  'min-w-[130px] px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300',
                  active && t === 'problem'
                    ? 'bg-red-500/15 border border-red-500/40 text-red-300'
                    : active && t === 'solution'
                    ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300'
                    : 'bg-transparent border border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300',
                ].join(' ')}
              >
                {t === 'problem' ? ps.problemsLabel : ps.solutionsLabel}
              </button>
            );
          })}
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid lg:grid-cols-2 gap-6 items-start">

          {/* LEFT — Card list */}
          <div className="space-y-4">
            {items.map((item, idx) => {
              const isActive = idx === activeIdx;
              const icon = tab === 'problem' ? PROBLEM_ICONS[idx] : SOLUTION_ICONS[idx];
              const points = 'painPoints' in item ? item.painPoints : item.benefits;
              const accentColor = tab === 'problem' ? 'red' : 'amber';

              return (
                <motion.div
                  key={`${tab}-${idx}`}
                  initial={{ opacity: 0.45 }}
                  animate={{ opacity: isActive ? 1 : 0.45 }}
                  transition={{ duration: 0.4 }}
                  onClick={() => handleCardClick(idx)}
                  className="cursor-pointer"
                >
                  <div className={[
                    'rounded-xl border p-5 transition-all duration-300',
                    isActive && accentColor === 'red'
                      ? 'border-red-500/35 bg-red-950/20 shadow-[0_0_20px_rgba(239,68,68,0.08)]'
                      : isActive && accentColor === 'amber'
                      ? 'border-amber-500/35 bg-amber-950/15 shadow-[0_0_20px_rgba(245,158,11,0.08)]'
                      : 'border-gray-800/60 bg-brand-card/30 hover:border-gray-700',
                  ].join(' ')}>
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={[
                        'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
                        accentColor === 'red'
                          ? 'bg-red-900/30 border border-red-800/40 text-red-400'
                          : 'bg-amber-900/25 border border-amber-800/35 text-amber-400',
                      ].join(' ')}>
                        {icon}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold mb-1.5 leading-snug">{item.title}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed mb-3">{item.description}</p>

                        {isActive && (
                          <ul className="space-y-2">
                            {points.map((pt, i) => (
                              <motion.li
                                key={i}
                                className="flex items-start gap-2 text-sm"
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08 }}
                              >
                                <CheckCircle2 className={[
                                  'w-4 h-4 mt-0.5 flex-shrink-0',
                                  accentColor === 'red' ? 'text-red-400' : 'text-amber-400',
                                ].join(' ')} strokeWidth={2} />
                                <span className="text-gray-300">{pt}</span>
                              </motion.li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {isActive && (
                      <div className="mt-4 h-0.5 bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          className={accentColor === 'red' ? 'h-full bg-red-500' : 'h-full bg-amber-500'}
                          style={{ width: `${progress}%` }}
                          transition={{ duration: 0.1 }}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* RIGHT — Preview panel */}
          <div className="lg:sticky lg:top-8">
            <AnimatePresence mode="wait">

              {/* Problem panel */}
              {tab === 'problem' && (
                <motion.div
                  key={`problem-${activeIdx}`}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.4 }}
                  className="rounded-2xl border border-red-900/30 bg-gradient-to-br from-red-950/30 via-brand-card/20 to-brand-dark p-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-red-900/30 border border-red-800/40 flex items-center justify-center text-red-400">
                      {PROBLEM_ICONS[activeIdx]}
                    </div>
                    <div>
                      <span className="text-red-400 text-xs font-bold uppercase tracking-widest block mb-0.5">{ps.problemTag}</span>
                      <h3 className="text-white font-bold text-lg leading-snug">{ps.problems[activeIdx].title}</h3>
                    </div>
                  </div>

                  <p className="text-gray-400 text-base leading-relaxed mb-6">{ps.problems[activeIdx].description}</p>

                  <div className="space-y-3">
                    {ps.problems[activeIdx].painPoints.map((pt, i) => (
                      <motion.div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-lg bg-red-950/20 border border-red-900/20"
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className="w-6 h-6 rounded-full bg-red-900/40 border border-red-800/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-red-400 text-xs font-bold">{i + 1}</span>
                        </div>
                        <span className="text-gray-300 text-sm leading-relaxed">{pt}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Solution panel — image with overlay */}
              {tab === 'solution' && (
                <motion.div
                  key={`solution-${activeIdx}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.45 }}
                  className="rounded-2xl overflow-hidden border border-amber-900/25 shadow-2xl"
                >
                  {/* Image */}
                  <div className="relative aspect-video">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={SOLUTION_IMAGES[activeIdx]}
                      alt={ps.solutions[activeIdx].imageAlt}
                      className="w-full h-full object-cover"
                      style={{ filter: 'brightness(0.55) saturate(1.1)' }}
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e17] via-[#0a0e17]/60 to-transparent" />

                    {/* Overlay content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex items-center gap-2 text-amber-400 mb-2">
                        {SOLUTION_ICONS[activeIdx]}
                        <span className="text-xs font-bold uppercase tracking-widest">{ps.solutionTag}</span>
                      </div>
                      <h3 className="text-white text-xl font-bold font-display mb-1">
                        {ps.solutions[activeIdx].title}
                      </h3>
                      <p className="text-gray-300 text-sm leading-relaxed mb-4">
                        {ps.solutions[activeIdx].description}
                      </p>
                      <Link
                        href="#pricing"
                        className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm font-semibold transition-colors group"
                      >
                        {ps.learnMore}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2} />
                      </Link>
                    </div>
                  </div>

                  {/* Benefits strip below image */}
                  <div className="bg-brand-card/60 border-t border-amber-900/20 px-6 py-4">
                    <ul className="space-y-2">
                      {ps.solutions[activeIdx].benefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
                          <span className="text-gray-300">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
