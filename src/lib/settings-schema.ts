import { z } from "zod";

export const sectionIdSchema = z.enum([
  "hero",
  "audience",
  "services",
  "projects",
  "urgency_banner",
  "contact_banner",
  "testimonials",
  "faq",
]);

const baseItemSchema = z.object({
  enabled: z.boolean().default(true),
  order: z.number().int().default(100),
});

const heroBadgeSchema = baseItemSchema.extend({
  text: z.string().trim().min(1),
  icon: z.string().trim().optional(),
});

const heroStatSchema = baseItemSchema.extend({
  value: z.string().trim().min(1),
  label: z.string().trim().min(1),
});

const sectionSchema = z.object({
  id: sectionIdSchema,
  enabled: z.boolean().default(true),
  order: z.number().int().default(100),
  data: z.record(z.string(), z.unknown()).default({}),
});

export const settingsSchema = z
  .object({
    colors: z
      .object({
        primary: z.string().optional(),
        secondary: z.string().optional(),
        background: z.string().optional(),
        text: z.string().optional(),
      })
      .default({}),
    typography: z
      .object({
        font: z.string().optional(),
        fontFamily: z.string().optional(),
        baseSize: z.string().optional(),
        lineHeight: z.string().optional(),
      })
      .default({}),
    branding: z
      .object({
        logoUrl: z.string().url().optional(),
        logoNavUrl: z.string().url().optional(),
        logoFooterUrl: z.string().url().optional(),
        faviconUrl: z.string().url().optional(),
        hideNavLogo: z.boolean().optional(),
        contact: z
          .object({
            whatsapp: z.string().trim().optional(),
            email: z.string().trim().optional(),
            address: z.string().trim().optional(),
          })
          .optional(),
      })
      .default({}),
    content: z.object({
      hero: z
        .object({
          title: z.string().optional(),
          subtitle: z.string().optional(),
          cta: z
            .object({
              primary_text: z.string().optional(),
              primary_url: z.string().optional(),
            })
            .optional(),
        })
        .default({}),
      services: z
        .array(
          z.object({
            title: z.string().optional(),
            description: z.string().optional(),
          }),
        )
        .default([]),
      faqs: z
        .array(
          z.object({
            question: z.string().optional(),
            answer: z.string().optional(),
          }),
        )
        .default([]),
      sections: z.array(sectionSchema).default([]),
    }),
  })
  .superRefine((value, ctx) => {
    const sections = value.content.sections;

    for (const section of sections) {
      if (!section.enabled) continue;
      const data = section.data;

      if (Array.isArray(data.badges)) {
        data.badges.forEach((badge, i) => {
          const parsed = heroBadgeSchema.safeParse(badge);
          if (!parsed.success) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["content", "sections", sections.indexOf(section), "data", "badges", i],
              message: "Invalid badge format",
            });
          }
        });
      }

      if (Array.isArray(data.stats)) {
        data.stats.forEach((stat, i) => {
          const parsed = heroStatSchema.safeParse(stat);
          if (!parsed.success) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["content", "sections", sections.indexOf(section), "data", "stats", i],
              message: "Invalid stat format",
            });
          }
        });
      }
    }
  });

export type SettingsPayload = z.infer<typeof settingsSchema>;
