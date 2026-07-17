'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ICONS } from '@/lib/icons';
import { ThemeToggle } from '@/components/theme-toggle';
import Image from 'next/image';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#demo', label: 'Live Demo' },
  { href: '#customize', label: 'Customize' },
  { href: '#privacy', label: 'Privacy' },
  { href: '#download', label: 'Download' }
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'glass-subtle border-b-0' : 'bg-transparent'
      )}
      role="banner"
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="#"
            className="flex items-center gap-2 text-xl font-bold gradient-primary"
            aria-label="Ollama Pet Home"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center overflow-hidden">
              <Image src="/logo.png" alt="Ollama Pet Logo" width={24} height={24} className="w-6 h-6 object-contain" />
            </div>
            <span className="hidden sm:block">Ollama Pet</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(link.href);
                }}
              >
                {link.label}
              </Link>
            ))}

            <div className="flex items-center gap-3 ml-4">
              <ThemeToggle />
              <Button
                variant="outline"
                className="hidden sm:flex items-center gap-2 px-4 py-2 glass hover:bg-primary/10 hover:text-primary transition-colors"
                asChild
              >
                <a href="https://github.com/AMV0027/ollama-pet" target="_blank" rel="noopener noreferrer">
                  <ICONS.GitHub className="h-4 w-4" />
                  <span className="font-medium">GitHub</span>
                </a>
              </Button>

              <Button size="lg" className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                <a href="#download">
                  <ICONS.Monitor className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-muted-foreground hover:text-primary"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <ICONS.Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent className="w-full sm:max-w-sm p-0 glass-strong">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <Link
                href="#"
                className="flex items-center gap-2 text-xl font-bold gradient-primary"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setMobileMenuOpen(false);
                }}
              >
                <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center overflow-hidden">
                  <Image src="/logo.png" alt="Ollama Pet Logo" width={24} height={24} className="w-6 h-6 object-contain" />
                </div>
                <span>Ollama Pet</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="text-muted-foreground hover:text-primary"
              >
                <ICONS.X className="h-6 w-6" />
              </Button>
            </div>

            <nav className="flex-1 p-4 space-y-2" aria-label="Mobile navigation">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(link.href);
                  }}
                >
                  <span className="w-6 h-6 flex items-center justify-center">
                    <ICONS.ChevronRight className="h-4 w-4" />
                  </span>
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="flex-1 min-w-0" asChild>
                  <a href="https://github.com/AMV0027/ollama-pet" target="_blank" rel="noopener noreferrer">
                    <ICONS.GitHub className="mr-2 h-4 w-4" />
                    GitHub
                  </a>
                </Button>
                <Button variant="outline" className="flex-1 min-w-0" asChild>
                  <a href="https://twitter.com/ollamapet" target="_blank" rel="noopener noreferrer">
                    <ICONS.Twitter className="mr-2 h-4 w-4" />
                    X
                  </a>
                </Button>
                <Button variant="outline" className="flex-1 min-w-0" asChild>
                  <a href="https://discord.gg/ollama-pet" target="_blank" rel="noopener noreferrer">
                    <ICONS.Discord className="mr-2 h-4 w-4" />
                    Discord
                  </a>
                </Button>
              </div>
              <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                <a href="#download">
                  <ICONS.Monitor className="mr-2 h-4 w-4" />
                  Download Ollama Pet
                </a>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}