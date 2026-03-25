```json
{
  "app_name": "Simondu Web (Sistem Monitoring Dumas)",
  "theme": "Modern Bureaucratic / Police Theme",
  "design_personality": "Trustworthy, Authoritative, Efficient, and Clear. The design must reflect the professionalism of the Indonesian Police (Polda Jabar) while providing a modern, fast, and intuitive SaaS-like experience for officers.",
  "color_palette": {
    "primary": {
      "name": "Navy Blue (Biru Propam)",
      "hex": "#1E3A8A",
      "tailwind": "blue-900",
      "usage": "Sidebar background, primary buttons, active states, and key branding elements."
    },
    "accent": {
      "name": "Gold / Yellow",
      "hex": "#EAB308",
      "tailwind": "yellow-500",
      "usage": "Highlights, 'Menunggu' (Waiting) status badges, and important notifications."
    },
    "background": {
      "name": "Off-White",
      "hex": "#F8FAFC",
      "tailwind": "slate-50",
      "usage": "Main application background to reduce eye strain during long shifts."
    },
    "surface": {
      "name": "White",
      "hex": "#FFFFFF",
      "tailwind": "white",
      "usage": "Cards, modals, dropdowns, and form backgrounds."
    },
    "text": {
      "primary": "#0F172A",
      "secondary": "#475569",
      "tailwind_primary": "slate-900",
      "tailwind_secondary": "slate-600"
    },
    "status": {
      "success": {"hex": "#22C55E", "tailwind": "green-500", "condition": "SLA < 14 days"},
      "warning": {"hex": "#EAB308", "tailwind": "yellow-500", "condition": "SLA 14-30 days"},
      "danger": {"hex": "#EF4444", "tailwind": "red-500", "condition": "SLA > 30 days"}
    },
    "gradients": {
      "hero_login": "bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900",
      "restriction": "NEVER use dark/saturated gradient combos (e.g., purple/pink). Gradients are strictly for the login background or subtle decorative headers. Data areas MUST use solid colors."
    }
  },
  "typography": {
    "fonts": {
      "headings": "Chivo, sans-serif",
      "body": "Inter, sans-serif"
    },
    "hierarchy": {
      "h1": "text-3xl sm:text-4xl font-bold tracking-tight text-slate-900",
      "h2": "text-xl sm:text-2xl font-semibold text-slate-800",
      "h3": "text-lg font-medium text-slate-800",
      "body": "text-sm sm:text-base text-slate-600",
      "small": "text-xs text-slate-500"
    }
  },
  "layout": {
    "strategy": "Mobile-First Enterprise Dashboard",
    "desktop": {
      "sidebar": "Fixed left, 260px width, dark navy background (bg-slate-900).",
      "header": "Sticky top, h-16, glassmorphism (bg-white/80 backdrop-blur-md), border-b border-slate-200.",
      "content": "Margin-left 260px, padding 6 (p-6), max-width 7xl."
    },
    "mobile": {
      "bottom_nav": "Fixed bottom, h-16, glassmorphism (bg-white/90 backdrop-blur-md), border-t border-slate-200. Touch targets min 44x44px.",
      "header": "Sticky top, h-14, white background, shadow-sm.",
      "content": "Padding 4 (p-4), padding-bottom 24 (pb-24) to account for bottom nav."
    },
    "cards": "rounded-xl border border-slate-200 bg-white shadow-sm",
    "data_table": "Horizontal scroll on desktop. On mobile, transform rows into a Card View layout for better readability."
  },
  "components_path": {
    "buttons": "src/components/ui/button.js",
    "cards": "src/components/ui/card.js",
    "inputs": "src/components/ui/input.js",
    "select": "src/components/ui/select.js",
    "dialog": "src/components/ui/dialog.js",
    "table": "src/components/ui/table.js",
    "badge": "src/components/ui/badge.js",
    "toast": "src/components/ui/sonner.js"
  },
  "motion": {
    "library": "framer-motion",
    "page_transition": "initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}",
    "modal_popup": "initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}",
    "hover_effects": "hover:shadow-md transition-all duration-200",
    "loading": "Use skeleton loading (animate-pulse) for all data fetching states."
  },
  "image_urls": [
    {
      "url": "https://images.pexels.com/photos/7714695/pexels-photo-7714695.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
      "category": "Login Background",
      "description": "Detailed view of a police officer's uniform showcasing the badge. Use this as a subtle, darkened background image for the login page to establish the law enforcement context."
    }
  ],
  "instructions_to_main_agent": [
    "Use Shadcn UI components exclusively for all interactive elements (buttons, inputs, dialogs, tables). Do not use native HTML elements for these.",
    "Implement Recharts for the Dashboard statistics (bar/area charts). Ensure tooltips and legends are styled to match the theme.",
    "Ensure all interactive elements have a minimum touch target of 44x44px for mobile usability.",
    "Implement a responsive DataTable: standard table on desktop, but map rows to a Card-based layout on mobile screens.",
    "Use Framer Motion for page transitions and modal entrances. Do not over-animate; keep it professional.",
    "Add 'data-testid' attributes to all interactive elements (buttons, links, form inputs) using kebab-case (e.g., data-testid='login-submit-button').",
    "Use Sonner for toast notifications, especially for real-time Supabase updates.",
    "Form inputs must have a clear focus state: focus:ring-2 focus:ring-blue-500 focus:border-transparent.",
    "Ensure high contrast for status badges (Green, Yellow, Red) so they are easily readable by officers in the field."
  ]
}
```

<General UI UX Design Guidelines>  
    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms
    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text
   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json

 **GRADIENT RESTRICTION RULE**
NEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc
NEVER use dark gradients for logo, testimonial, footer etc
NEVER let gradients cover more than 20% of the viewport.
NEVER apply gradients to text-heavy content or reading areas.
NEVER use gradients on small UI elements (<100px width).
NEVER stack multiple gradient layers in the same viewport.

**ENFORCEMENT RULE:**
    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors

**How and where to use:**
   • Section backgrounds (not content backgrounds)
   • Hero section header content. Eg: dark to light to dark color
   • Decorative overlays and accent elements only
   • Hero section with 2-3 mild color
   • Gradients creation can be done for any angle say horizontal, vertical or diagonal

- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**

</Font Guidelines>

- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. 
   
- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.

- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.
   
- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly
    Eg: - if it implies playful/energetic, choose a colorful scheme
           - if it implies monochrome/minimal, choose a black–white/neutral scheme

**Component Reuse:**
	- Prioritize using pre-existing components from src/components/ui when applicable
	- Create new components that match the style and conventions of existing components when needed
	- Examine existing components to understand the project's component patterns before creating new ones

**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component

**Best Practices:**
	- Use Shadcn/UI as the primary component library for consistency and accessibility
	- Import path: ./components/[component-name]

**Export Conventions:**
	- Components MUST use named exports (export const ComponentName = ...)
	- Pages MUST use default exports (export default function PageName() {...})

**Toasts:**
  - Use `sonner` for toasts"
  - Sonner component are located in `/app/src/components/ui/sonner.tsx`

Use 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.
</General UI UX Design Guidelines>