'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { useI18n } from '@/lib/i18n';
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

// ─── Icons for nav items ─────────────────────────────────────
const platformIcons = [Zap, TrendingUp, MessageCircle, BarChart2];
const aboutIcons = [Star, BookOpen];
const aboutIcons2 = [FileText, Shield, Mail];

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
  const { t } = useI18n();

  // Build link arrays from translations
  const platformLinks: LinkItem[] = t.nav.platformLinks.map((link, i) => ({
    title: link.title,
    href: '#features',
    icon: platformIcons[i],
    description: link.description,
  }));

  const aboutLinks: LinkItem[] = t.nav.aboutLinks.map((link, i) => ({
    title: link.title,
    href: i === 0 ? '#testimonials' : '#how-it-works',
    icon: aboutIcons[i],
    description: link.description,
  }));

  const aboutLinks2: LinkItem[] = t.nav.aboutLinks2.map((title, i) => ({
    title,
    href: '#',
    icon: aboutIcons2[i],
  }));

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
            <img src="/img/logo.jpg" alt="Logo" className="h-8 w-auto object-contain" />
            <span
              className="text-xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #f59e0b 60%, #d97706 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              SINYAL COHIBA
            </span>
          </Link>

          {/* Desktop NavigationMenu */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>

              {/* Platform dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-gray-300">
                  {t.nav.platform}
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
                      {t.nav.dropdownNote}{' '}
                      <Link href="/register" className="text-amber-400 font-medium hover:underline">
                        {t.nav.dropdownCta}
                      </Link>
                    </p>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Tentang dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-gray-300">
                  {t.nav.about}
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
                  {t.nav.pricing}
                </NavigationMenuLink>
              </NavigationMenuItem>

            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* ── Right: Language Toggle + CTA buttons + mobile toggle ── */}
        <div className="flex items-center gap-2">
          {/* Language toggle — always visible */}
          <LanguageToggle className="hidden sm:flex" />

          <Link
            href="/login"
            className="hidden md:inline-flex text-sm text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-md hover:bg-brand-card"
          >
            {t.nav.login}
          </Link>
          <Link href="/register" className="hidden md:inline-flex">
            <Button size="sm" className="rounded-full px-5 text-sm font-semibold">
              {t.nav.startNow}
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
          {/* Language toggle — mobile */}
          <div className="flex justify-end mb-2">
            <LanguageToggle />
          </div>

          {/* Platform section */}
          <div>
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-gray-500">
              {t.nav.platform}
            </p>
            {platformLinks.map((link) => (
              <MobileListItem key={link.title} {...link} onClick={() => setOpen(false)} />
            ))}
          </div>

          {/* About section */}
          <div>
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-gray-500">
              {t.nav.about}
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
            <span>{t.nav.pricing}</span>
            <ArrowRight className="h-4 w-4 text-gray-500" />
          </a>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-2 border-t border-brand-border pt-4">
          <Link href="/login" onClick={() => setOpen(false)}>
            <Button variant="outline" className="w-full">{t.nav.login}</Button>
          </Link>
          <Link href="/register" onClick={() => setOpen(false)}>
            <Button className="w-full font-bold flex items-center justify-center gap-2">
              <Rocket className="h-4 w-4" strokeWidth={2} />
              {t.nav.freeTrial}
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
