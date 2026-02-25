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

const ctaUrlSchema = z
  .string()
  .trim()
  .refine((value) => /^(tel:|https?:\/\/|#)/i.test(value), "CTA URL must start with tel:, http(s):// or #");

const ctaSchema = z.object({
  text: z.string().trim().min(1),
  url: ctaUrlSchema,
});

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

      if (section.id === "hero") {
        if (typeof data.title !== "string" || !data.title.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["content", "sections", sections.indexOf(section), "data", "title"],
            message: "Hero requires title when enabled",
          });
        }
        if (data.cta_primary) {
          const parsed = ctaSchema.safeParse(data.cta_primary);
          if (!parsed.success) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["content", "sections", sections.indexOf(section), "data", "cta_primary"],
              message: "Hero cta_primary is invalid",
            });
          }
        }
      }

      if (["services", "projects", "testimonials", "faq"].includes(section.id)) {
        const items = Array.isArray(data.items) ? data.items : [];
        if (items.length < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["content", "sections", sections.indexOf(section), "data", "items"],
            message: `${section.id} requires at least one item when enabled`,
          });
        }
      }

      if (section.id === "urgency_banner") {
        if (typeof data.title !== "string" || !data.title.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["content", "sections", sections.indexOf(section), "data", "title"],
            message: "urgency_banner requires title",
          });
        }
        if (data.cta_primary) {
          const parsed = ctaSchema.safeParse(data.cta_primary);
          if (!parsed.success) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["content", "sections", sections.indexOf(section), "data", "cta_primary"],
              message: "urgency_banner cta_primary is invalid",
            });
          }
        }
      }

      if (section.id === "contact_banner") {
        if (typeof data.title !== "string" || !data.title.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["content", "sections", sections.indexOf(section), "data", "title"],
            message: "contact_banner requires title",
          });
        }
      }

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

