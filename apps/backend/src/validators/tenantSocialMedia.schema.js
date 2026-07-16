import { z } from 'zod';

export const upsertTenantSocialMediaSchema = z.object({
  facebookUrl: z.string().url().optional(),
  twitterUrl: z.string().url().optional(),
  instagramUrl: z.string().url().optional(),
  linkedInUrl: z.string().url().optional(),
  youtubeUrl: z.string().url().optional(),
});
