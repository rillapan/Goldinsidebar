'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { createPortal } from 'react-dom';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { LucideIcon } from 'lucide-react';
import {
  Zap,
  TrendingUp,
  MessageCircle,
  Bell,
  Star,
  BookOpen,
  FileText,
  Shield,
  Mail,
  BarChart2,
  ArrowRight,
  Rocket,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────
type LinkItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

// ─── GoldMind AI nav content ────────────────────────────────
const platformLinks: LinkItem[] = [
  {
    title: 'AI Signal Engine',
    href: '#features',
    description: 'Sinyal BUY/SELL XAUUSD real-time dengan Entry, SL, TP',
    icon: Zap,
  },
  {
    title: 'Daily Market Bias',
    href: '#features',
    description: 'Analisa fundamental harian otomatis pukul 07.00 WIB',
    icon: TrendingUp,
  },
  {
    title: 'AI Chat Assistant',
    href: '#features',
    description: 'Tanya AI tentang kondisi pasar kapan saja',
    icon: MessageCircle,
  },
  {
    title: 'Analytics & Win Rate',
    href: '#features',
    description: 'Lacak performa sinyal dan statistik akurasi real-time',
    icon: BarChart2,
  },
];

const aboutLinks: LinkItem[] = [
  {
    title: 'Testimoni Member',
    href: '#testimonials',
    description: 'Kata 850+ trader Indonesia yang sudah bergabung',
    icon: Star,
  },
  {
    title: 'Cara Kerja',
    href: '#how-it-works',
    description: 'Bagaimana AI kami menganalisa XAUUSD setiap 5 menit',
    icon: BookOpen,
  },
];

const aboutLinks2: LinkItem[] = [
  { title: 'Syarat & Ketentuan', href: '#', icon: FileText },
  { title: 'Kebijakan Privasi',  href: '#', icon: Shield },
  { title: 'Hubungi Kami',       href: '#', icon: Mail },
];

// ─── useScroll hook ──────────────────────────────────────────
function useScroll(threshold: number) {
  const [scrolled, setScrolled] = React.useState(false);

  const onScroll = React.useCallback(() => {
    setScrolled(window.scrollY > threshold);
  }, [threshold]);

  React.useEffect(() => {
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  React.useEffect(() => { onScroll(); }, [onScroll]);

  return scrolled;
}

// ─── Header ─────────────────────────────────────────────────
export function Header() {
  const [open, setOpen] = React.useState(false);
  const scrolled = useScroll(10);

  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-transparent transition-all duration-300',
        scrolled && 'border-brand-border bg-brand-dark/90 backdrop-blur-xl shadow-lg shadow-black/20',
      )}
    >
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 lg:px-6">

        {/* ── Left: Logo + Desktop Nav ── */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-[0_0_14px_rgba(245,158,11,0.4)]">
              <Zap className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span
              className="text-xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #f59e0b 60%, #d97706 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              GoldMind AI
            </span>
          </Link>

          {/* Desktop NavigationMenu */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>

              {/* Platform dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-gray-300">
                  Platform
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-brand-card p-1.5">
                  <ul className="grid w-[480px] grid-cols-2 gap-1.5 rounded-lg border border-brand-border bg-brand-darker p-2 shadow-xl">
                    {platformLinks.map((item, i) => (
                      <li key={i}>
                        <ListItem {...item} />
                      </li>
                    ))}
                  </ul>
                  <div className="px-2 py-2">
                    <p className="text-xs text-gray-500">
                      Win rate 87% dari 1.240+ sinyal.{' '}
                      <Link href="/register" className="text-amber-400 font-medium hover:underline">
                        Mulai free trial →
                      </Link>
                    </p>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Tentang dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-gray-300">
                  Tentang
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-brand-card p-1.5">
                  <div className="grid w-[400px] grid-cols-2 gap-2">
                    <ul className="rounded-lg border border-brand-border bg-brand-darker p-2 shadow-xl space-y-1">
                      {aboutLinks.map((item, i) => (
                        <li key={i}>
                          <ListItem {...item} />
                        </li>
                      ))}
                    </ul>
                    <ul className="space-y-1 p-3">
                      {aboutLinks2.map((item, i) => (
                        <li key={i}>
                          <NavigationMenuLink
                            href={item.href}
                            className="flex flex-row items-center gap-x-2 rounded-md p-2 hover:bg-brand-card/60 text-gray-400 hover:text-white transition-colors"
                          >
                            <item.icon className="text-gray-400 h-4 w-4 flex-shrink-0" />
                            <span className="text-sm font-medium">{item.title}</span>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Simple links */}
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="#pricing"
                  className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-brand-card hover:text-white rounded-md transition-colors cursor-pointer"
                >
                  Harga
                </NavigationMenuLink>
              </NavigationMenuItem>

            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* ── Right: CTA buttons + mobile toggle ── */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden md:inline-flex text-sm text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-md hover:bg-brand-card"
          >
            Login
          </Link>
          <Link href="/register" className="hidden md:inline-flex">
            <Button size="sm" className="rounded-full px-5 text-sm font-semibold">
              Mulai Sekarang
            </Button>
          </Link>

          {/* Mobile hamburger */}
          <Button
            size="icon"
            variant="outline"
            onClick={() => setOpen(!open)}
            className="md:hidden border-brand-border"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label="Toggle menu"
          >
            <MenuToggleIcon open={open} className="h-5 w-5 text-white" duration={300} />
          </Button>
        </div>
      </nav>

      {/* ════════════ MOBILE MENU (portal) ════════════ */}
      <MobileMenu open={open} className="flex flex-col justify-between gap-4">
        <div className="flex flex-col gap-3 overflow-y-auto">
          {/* Platform section */}
          <div>
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-gray-500">
              Platform
            </p>
            {platformLinks.map((link) => (
              <MobileListItem key={link.title} {...link} onClick={() => setOpen(false)} />
            ))}
          </div>

          {/* Tentang section */}
          <div>
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-gray-500">
              Tentang
            </p>
            {aboutLinks.map((link) => (
              <MobileListItem key={link.title} {...link} onClick={() => setOpen(false)} />
            ))}
            {aboutLinks2.map((link) => (
              <a
                key={link.title}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-gray-400 hover:bg-brand-card hover:text-white transition-colors"
              >
                <link.icon className="h-4 w-4 flex-shrink-0 text-gray-500" />
                <span>{link.title}</span>
                <ArrowRight className="ml-auto h-3.5 w-3.5 text-gray-600" />
              </a>
            ))}
          </div>

          {/* Simple links */}
          <a
            href="#pricing"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between border-t border-brand-border pt-3 text-base font-medium text-white"
          >
            <span>Harga</span>
            <ArrowRight className="h-4 w-4 text-gray-500" />
          </a>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-2 border-t border-brand-border pt-4">
          <Link href="/login" onClick={() => setOpen(false)}>
            <Button variant="outline" className="w-full">Login</Button>
          </Link>
          <Link href="/register" onClick={() => setOpen(false)}>
            <Button className="w-full font-bold flex items-center justify-center gap-2">
              <Rocket className="h-4 w-4" strokeWidth={2} />
              Mulai Free Trial 7 Hari
            </Button>
          </Link>
        </div>
      </MobileMenu>
    </header>
  );
}

// ─── MobileMenu (portal) ────────────────────────────────────
type MobileMenuProps = React.ComponentProps<'div'> & { open: boolean };

function MobileMenu({ open, children, className, ...props }: MobileMenuProps) {
  if (!open || typeof window === 'undefined') return null;

  return createPortal(
    <div
      id="mobile-menu"
      className="fixed top-16 right-0 bottom-0 left-0 z-40 flex flex-col border-t border-brand-border bg-brand-dark/97 backdrop-blur-xl md:hidden"
    >
      <div
        className={cn('size-full overflow-hidden p-5', className)}
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

// ─── ListItem (desktop dropdown) ────────────────────────────
function ListItem({
  title,
  description,
  icon: Icon,
  className,
  href,
  ...props
}: React.ComponentProps<typeof NavigationMenuLink> & LinkItem) {
  return (
    <NavigationMenuLink
      className={cn(
        'flex w-full flex-row gap-x-3 rounded-lg p-2.5 hover:bg-brand-card/80 hover:text-white text-gray-300 transition-colors cursor-pointer',
        className,
      )}
      href={href}
      {...props}
      asChild
    >
      <a href={href}>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-brand-border bg-brand-dark shadow-sm">
          <Icon className="h-5 w-5 text-amber-400" />
        </div>
        <div className="flex flex-col items-start justify-center">
          <span className="text-sm font-medium text-white">{title}</span>
          {description && (
            <span className="text-xs text-gray-500 leading-snug mt-0.5">{description}</span>
          )}
        </div>
      </a>
    </NavigationMenuLink>
  );
}

// ─── MobileListItem ──────────────────────────────────────────
function MobileListItem({
  title,
  description,
  icon: Icon,
  href,
  onClick,
}: LinkItem & { onClick?: () => void }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-brand-card transition-colors"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-brand-border bg-brand-dark">
        <Icon className="h-4 w-4 text-amber-400" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-white">{title}</span>
        {description && (
          <span className="text-xs text-gray-500">{description}</span>
        )}
      </div>
      <ArrowRight className="ml-auto h-4 w-4 flex-shrink-0 text-gray-600" />
    </a>
  );
}
