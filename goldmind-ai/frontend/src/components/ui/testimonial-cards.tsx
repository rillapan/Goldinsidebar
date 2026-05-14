"use client";

import * as React from 'react';
import { motion, type PanInfo } from 'motion/react';
import { Star, Check } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

type Position = 'front' | 'middle' | 'back';

interface CardProps {
  id: number;
  testimonial: string;
  author: string;
  role: string;
  position: Position;
  handleShuffle: () => void;
  cardSwipe: string;
  verifiedTrader: string;
}

// ─── Single card ─────────────────────────────────────────────
function TestimonialCard({ handleShuffle, testimonial, position, id, author, role, cardSwipe, verifiedTrader }: CardProps) {
  const dragRef = React.useRef(0);
  const isFront = position === 'front';

  return (
    <motion.div
      style={{
        zIndex: position === 'front' ? 2 : position === 'middle' ? 1 : 0,
      }}
      animate={{
        rotate: position === 'front' ? '-6deg' : position === 'middle' ? '0deg' : '6deg',
        x: position === 'front' ? '0%' : position === 'middle' ? '33%' : '66%',
      }}
      drag={isFront}
      dragElastic={0.35}
      dragListener={isFront}
      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
      onDragStart={(e: PointerEvent) => {
        dragRef.current = e.clientX ?? 0;
      }}
      onDragEnd={(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x < -120) handleShuffle();
        dragRef.current = 0;
      }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className={[
        'absolute left-0 top-0 grid h-[420px] w-[320px] select-none place-content-center',
        'space-y-5 rounded-2xl p-6 shadow-2xl backdrop-blur-xl',
        'border border-white/10 bg-[#0d1120]/80',
        'md:h-[450px] md:w-[350px]',
        isFront ? 'cursor-grab active:cursor-grabbing' : '',
      ].join(' ')}
    >
      {/* ── Avatar + verified badge ── */}
      <div className="relative mx-auto h-28 w-28 md:h-32 md:w-32">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://i.pravatar.cc/128?img=${id + 15}`}
          alt={author}
          className="pointer-events-none h-full w-full rounded-full border-2 border-amber-500/50 object-cover shadow-lg"
        />
        <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 shadow-md">
          <Check className="h-3.5 w-3.5 text-black" strokeWidth={3} />
        </div>
      </div>

      {/* ── Stars ── */}
      <div className="flex justify-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" strokeWidth={1} />
        ))}
      </div>

      {/* ── Quote ── */}
      <p className="text-center text-sm md:text-base italic leading-relaxed text-gray-300">
        &ldquo;{testimonial}&rdquo;
      </p>

      {/* ── Author info ── */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-center text-sm font-bold tracking-wider text-amber-400 uppercase">
          {author}
        </span>
        <span className="text-xs text-gray-500">{role}</span>
        <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-widest text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {verifiedTrader}
        </span>
      </div>

      {/* ── Swipe hint (front card only) ── */}
      {isFront && (
        <p className="text-center text-[10px] text-gray-600">
          {cardSwipe}
        </p>
      )}
    </motion.div>
  );
}

// ─── ShuffleTestimonials — full section export ───────────────
export function ShuffleTestimonials() {
  const { t } = useI18n();
  const testimonialItems = t.testimonials.items;
  const [positions, setPositions] = React.useState<Position[]>(['front', 'middle', 'back']);

  const handleShuffle = () => {
    setPositions((prev) => {
      const next = [...prev];
      next.unshift(next.pop()!);
      return next;
    });
  };

  return (
    <section
      id="testimonials"
      className="relative overflow-hidden py-24 px-8"
    >
      {/* Radial background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/5 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-6xl">
        {/* ── Section heading ── */}
        <div className="mb-20 text-center">
          <span className="mb-3 block text-sm font-semibold uppercase tracking-widest text-amber-400">
            {t.testimonials.tagline}
          </span>
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            {t.testimonials.title1}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, #FFD700 0%, #f59e0b 50%, #d97706 100%)',
              }}
            >
              {t.testimonials.titleGold}
            </span>
          </h2>
          <p className="mx-auto max-w-xl text-gray-400">
            {t.testimonials.subtitle}
          </p>
        </div>

        {/* ── Card stack ── */}
        <div className="grid place-content-center overflow-hidden">
          <div className="relative -ml-[100px] h-[420px] w-[320px] md:-ml-[175px] md:h-[450px] md:w-[350px]">
            {testimonialItems.map((item, i) => (
              <TestimonialCard
                key={i + 1}
                id={i + 1}
                testimonial={item.testimonial}
                author={item.author}
                role={item.role}
                position={positions[i]}
                handleShuffle={handleShuffle}
                cardSwipe={t.testimonials.cardSwipe}
                verifiedTrader={t.testimonials.verifiedTrader}
              />
            ))}
          </div>
        </div>

        {/* ── Swipe instruction ── */}
        <p className="mt-16 text-center text-xs text-gray-600">
          {t.testimonials.swipeHint}
        </p>
      </div>
    </section>
  );
}
