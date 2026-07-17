'use client';

import Link from 'next/link';
import { ICONS } from '@/lib/icons';
import commonData from '@/content/en/common.json';
import Image from 'next/image';

const BrainIcon = ICONS.Brain;
const GitHubIcon = ICONS.GitHub;
const TwitterIcon = ICONS.Twitter;
const DiscordIcon = ICONS.Discord;
const MailIcon = ICONS.Mail;

export function Footer() {
  return (
    <footer className="relative border-t bg-card/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6" aria-label="Ollama Pet Home">
              <span className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center overflow-hidden">
                <Image src="/logo.png" alt="Ollama Pet Logo" width={32} height={32} className="w-8 h-8 object-contain" />
              </span>
              <span className="font-bold text-xl gradient-primary">Ollama Pet</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              {commonData.footer.description}
            </p>
            <div className="flex gap-4">
              <a
                href="https://github.com/AMV0027/ollama-pet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/70 hover:text-primary hover:-translate-y-1 transition-all"
                aria-label="GitHub"
              >
                <GitHubIcon className="h-6 w-6" />
              </a>
              <a
                href="https://twitter.com/ollamapet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/70 hover:text-primary hover:-translate-y-1 transition-all"
                aria-label="X (Twitter)"
              >
                <TwitterIcon className="h-6 w-6" />
              </a>
              <a
                href="https://discord.gg/ollama-pet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/70 hover:text-primary hover:-translate-y-1 transition-all"
                aria-label="Discord"
              >
                <DiscordIcon className="h-6 w-6" />
              </a>
              <a
                href="mailto:hello@ollama-pet.dev"
                className="text-foreground/70 hover:text-primary hover:-translate-y-1 transition-all"
                aria-label="Email"
              >
                <MailIcon className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Product */}
          <nav aria-label="Product links">
            <h3 className="font-semibold text-foreground mb-4">Product</h3>
            <ul className="space-y-3">
              <li><Link href="#features" className="text-muted-foreground hover:text-primary transition-colors text-sm">Features</Link></li>
              <li><Link href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors text-sm">How It Works</Link></li>
              <li><Link href="#demo" className="text-muted-foreground hover:text-primary transition-colors text-sm">Live Demo</Link></li>
              <li><Link href="#customize" className="text-muted-foreground hover:text-primary transition-colors text-sm">Customization</Link></li>
              <li><Link href="#download" className="text-muted-foreground hover:text-primary transition-colors text-sm">Download</Link></li>
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Company links">
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-3">
              <li><a href="https://github.com/AMV0027/ollama-pet" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors text-sm">GitHub</a></li>
              <li><a href="#privacy" className="text-muted-foreground hover:text-primary transition-colors text-sm">Privacy</a></li>
              <li><a href="https://github.com/AMV0027/ollama-pet/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors text-sm">{commonData.footer.license}</a></li>
              <li><a href="https://github.com/AMV0027/ollama-pet/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors text-sm">Contributing</a></li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} Ollama Pet. Open source and free.
          </p>
          <p className="text-muted-foreground text-sm">
            {commonData.footer.madeWith}
          </p>
        </div>
      </div>
    </footer>
  );
}