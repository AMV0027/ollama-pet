import { z } from 'zod';

// Schemas
const HeroSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  ctaPrimary: z.string(),
  ctaSecondary: z.string(),
  sprite: z.string(),
  scrollHint: z.string()
});

const FeatureSchema = z.object({
  icon: z.string(),
  title: z.string(),
  description: z.string()
});

const FeaturesSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  features: z.array(FeatureSchema),
  sprite: z.string()
});

const TechItemSchema = z.object({
  name: z.string(),
  category: z.string(),
  icon: z.string()
});

const TechSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  technologies: z.array(TechItemSchema),
  sprite: z.string()
});

const StepSchema = z.object({
  number: z.number(),
  title: z.string(),
  description: z.string()
});

const HowItWorksSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  steps: z.array(StepSchema),
  sprite: z.string()
});

const ConversationSchema = z.object({
  user: z.string(),
  assistant: z.string(),
  delay: z.number()
});

const DemoSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  conversations: z.array(ConversationSchema),
  sprite: z.string()
});

const PersonalitySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string()
});

const CustomizationSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  options: z.object({
    personalities: z.array(PersonalitySchema),
    models: z.array(z.string()),
    themes: z.array(z.string()),
    positions: z.array(z.string())
  }),
  sprite: z.string()
});

const PrivacyPointSchema = z.object({
  icon: z.string(),
  title: z.string(),
  description: z.string()
});

const PrivacySchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  points: z.array(PrivacyPointSchema),
  sprite: z.string()
});

const PlatformSchema = z.object({
  name: z.string(),
  subtitle: z.string(),
  icon: z.string(),
  downloadUrl: z.string(),
  command: z.string()
});

const DownloadSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  platforms: z.array(PlatformSchema),
  requirements: z.array(z.string()),
  sprite: z.string()
});

const CommonSchema = z.object({
  nav: z.object({
    features: z.string(),
    tech: z.string(),
    howItWorks: z.string(),
    demo: z.string(),
    customize: z.string(),
    privacy: z.string(),
    download: z.string()
  }),
  hero: z.object({
    ctaPrimary: z.string(),
    ctaSecondary: z.string()
  }),
  footer: z.object({
    description: z.string(),
    github: z.string(),
    discord: z.string(),
    twitter: z.string(),
    license: z.string(),
    madeWith: z.string()
  }),
  demo: z.object({
    startChat: z.string(),
    typing: z.string(),
    placeholder: z.string(),
    send: z.string()
  })
});

// Type exports
export type HeroContent = z.infer<typeof HeroSchema>;
export type FeaturesContent = z.infer<typeof FeaturesSchema>;
export type TechContent = z.infer<typeof TechSchema>;
export type HowItWorksContent = z.infer<typeof HowItWorksSchema>;
export type DemoContent = z.infer<typeof DemoSchema>;
export type CustomizationContent = z.infer<typeof CustomizationSchema>;
export type PrivacyContent = z.infer<typeof PrivacySchema>;
export type DownloadContent = z.infer<typeof DownloadSchema>;
export type CommonContent = z.infer<typeof CommonSchema>;

// Content loader - in production this would be server-side
// For now we use dynamic imports
export async function getContent() {
  const [hero, features, tech, howItWorks, demo, customization, privacy, download, common] = await Promise.all([
    import('@/content/en/hero.json').then(m => HeroSchema.parse(m.default)),
    import('@/content/en/features.json').then(m => FeaturesSchema.parse(m.default)),
    import('@/content/en/tech.json').then(m => TechSchema.parse(m.default)),
    import('@/content/en/how-it-works.json').then(m => HowItWorksSchema.parse(m.default)),
    import('@/content/en/demo.json').then(m => DemoSchema.parse(m.default)),
    import('@/content/en/customization.json').then(m => CustomizationSchema.parse(m.default)),
    import('@/content/en/privacy.json').then(m => PrivacySchema.parse(m.default)),
    import('@/content/en/download.json').then(m => DownloadSchema.parse(m.default)),
    import('@/content/en/common.json').then(m => CommonSchema.parse(m.default))
  ]);

  return { hero, features, tech, howItWorks, demo, customization, privacy, download, common };
}

// Synchronous version for client components (requires next.config.ts to include content)
export function getContentSync() {
  // This will be populated by a build-time script or server component
  return null;
}