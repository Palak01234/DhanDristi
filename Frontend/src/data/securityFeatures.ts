/**
 * Visual guide data for each security feature check.
 * Used by the denomination detail page to show how-to-verify instructions.
 */

export type ToolNeeded = "eyes" | "light" | "tilt" | "uv" | "touch";
export type Difficulty = "easy" | "medium" | "advanced";

export interface SecurityFeatureGuide {
  /** Short "what to look for" summary. */
  whatToLookFor: string;
  /** Step-by-step verification instructions. */
  howToCheck: string[];
  /** Physical tool required. */
  tool: ToolNeeded;
  /** How easy for a layperson. */
  difficulty: Difficulty;
  /** Remix icon class for the tool. */
  toolIcon: string;
  /** Fun fact or anti-counterfeit note. */
  funFact: string;
}

// Keyed by check ID (matching counterfeitService CHECKS ids)
export const FEATURE_GUIDES: Record<string, SecurityFeatureGuide> = {
  watermark: {
    whatToLookFor: "A hidden portrait or pattern visible only when held to light.",
    howToCheck: [
      "Hold the note up to a bright natural light or a lamp.",
      "Look for a faint ghost image embedded in the paper itself.",
      "The watermark should align perfectly with the printed portrait.",
      "Counterfeit notes have printed watermarks — look for a flat vs. depth effect.",
    ],
    tool: "light",
    difficulty: "easy",
    toolIcon: "ri-sun-line",
    funFact: "Watermarks are formed during paper manufacturing by varying thickness — impossible to replicate by printing.",
  },
  thread: {
    whatToLookFor: "A thin embedded strip running vertically through the note with microtext.",
    howToCheck: [
      "Hold the note up to light — you'll see a dark vertical thread.",
      "Tilt the note slightly to see the thread shift in colour or shine.",
      "Look for microtext (e.g. 'भारत' or 'RBI') along the thread with a magnifier.",
      "A fake thread is often printed on top, not embedded inside the paper.",
    ],
    tool: "light",
    difficulty: "easy",
    toolIcon: "ri-sun-line",
    funFact: "Security threads are woven into the paper during manufacturing at very high cost — a key reason counterfeiting is difficult.",
  },
  ink: {
    whatToLookFor: "A numeral or symbol that shifts colour when the note is tilted.",
    howToCheck: [
      "Hold the note flat and look at the denomination numeral.",
      "Slowly tilt the note up and down.",
      "Watch for a clear colour shift (e.g. green → blue for INR, copper → green for USD).",
      "Static colour = counterfeit. True OVI inks always shift.",
    ],
    tool: "tilt",
    difficulty: "easy",
    toolIcon: "ri-shake-hands-line",
    funFact: "Optically Variable Ink (OVI) contains microscopic metallic flakes at different angles that reflect different wavelengths of light.",
  },
  ribbon: {
    whatToLookFor: "A woven blue ribbon embedded in the note with shifting bell and '100' images.",
    howToCheck: [
      "Find the blue ribbon woven into the note (not printed on top).",
      "Tilt the note side to side — bells and '100s' should move up and down.",
      "Tilt up and down — the images shift left and right.",
      "In a counterfeit, the ribbon is glued or printed flat with no movement.",
    ],
    tool: "tilt",
    difficulty: "easy",
    toolIcon: "ri-shake-hands-line",
    funFact: "The 3-D security ribbon is technically a 'motion security device' — a micro-optic strip impossible to reproduce with standard printing.",
  },
  hologram: {
    whatToLookFor: "A foil patch or strip that displays multiple shifting images.",
    howToCheck: [
      "Locate the gold/silver foil patch on the front of the note.",
      "Tilt the note left-right and up-down.",
      "Multiple images should appear and disappear in the foil as you tilt.",
      "A printed or flat foil sticker is a strong counterfeit indicator.",
    ],
    tool: "tilt",
    difficulty: "easy",
    toolIcon: "ri-shake-hands-line",
    funFact: "Holograms are produced using laser technology — the complex multi-layer structure cannot be copied with normal print methods.",
  },
  emerald: {
    whatToLookFor: "A shimmering light effect moves upward through the denomination numeral.",
    howToCheck: [
      "Hold the note in normal light.",
      "Tilt the note gently towards you.",
      "Watch for a shimmering 'emerald' light moving from bottom to top of the numeral.",
      "Static numerals without shimmer indicate a fake.",
    ],
    tool: "tilt",
    difficulty: "easy",
    toolIcon: "ri-shake-hands-line",
    funFact: "The Emerald Number uses a special printing process that creates an animated light effect — one of the most advanced overt security features on the new Euro series.",
  },
  micro: {
    whatToLookFor: "Tiny text (microprinting) readable only under magnification.",
    howToCheck: [
      "Find a small area listed in the feature description (edge, collar, thread).",
      "Use a magnifying glass (10x or more) or your phone camera in macro mode.",
      "Look for tiny but perfectly printed text, not blurry lines.",
      "Counterfeit microtext is usually blurry or becomes a solid line at low resolution.",
    ],
    tool: "eyes",
    difficulty: "medium",
    toolIcon: "ri-zoom-in-line",
    funFact: "Microprinting requires special intaglio printing presses — most commercial printers can't reproduce text smaller than 0.2mm clearly.",
  },
  serial: {
    whatToLookFor: "A unique number printed in a specific format and ink colour.",
    howToCheck: [
      "Locate the serial number on the note.",
      "For INR: check if the font size increases from left to right (ascending format).",
      "Verify the ink is sharp, bright, and consistent — not faded or smudged.",
      "Look for any gaps, missing digits, or irregular spacing.",
    ],
    tool: "eyes",
    difficulty: "easy",
    toolIcon: "ri-eye-line",
    funFact: "Every banknote has a globally unique serial number — databases allow central banks to track genuine note circulation.",
  },
  uv: {
    whatToLookFor: "Security fibres and markings that glow under ultraviolet light.",
    howToCheck: [
      "Use a UV/black light torch (widely available or built into detection pens).",
      "In a dark room, shine the UV light on the note.",
      "Look for brightly glowing fibres, patterns, or text invisible in normal light.",
      "Counterfeit notes under UV appear completely dull or show printed (not embedded) marks.",
    ],
    tool: "uv",
    difficulty: "advanced",
    toolIcon: "ri-flashlight-line",
    funFact: "UV-reactive security fibres are randomly distributed during paper manufacturing — the exact pattern differs for every note.",
  },
  intaglio: {
    whatToLookFor: "Raised, tactile print on the portrait, seal, and main text areas.",
    howToCheck: [
      "Run your fingertip across the portrait and main text areas.",
      "You should feel a clear ridged, raised texture — not flat.",
      "Rub your fingernail gently — genuine intaglio creates a scraping sensation.",
      "Flat, smooth printing over these areas is a counterfeit sign.",
    ],
    tool: "touch",
    difficulty: "easy",
    toolIcon: "ri-fingerprint-line",
    funFact: "Intaglio printing presses apply over 100 tonnes of pressure to emboss ink into the paper — the tactile feel is impossible to fake with inkjet or laser printing.",
  },
  paper: {
    whatToLookFor: "Special substrate with unique weight, feel, and embedded fibres.",
    howToCheck: [
      "Crinkle the note gently — genuine notes have a crisp, snappy feel.",
      "Look at the note's edge in bright light for coloured security fibres.",
      "Wet one corner slightly — genuine security paper doesn't immediately disintegrate or go limp.",
      "Compare the weight and texture with known genuine notes.",
    ],
    tool: "touch",
    difficulty: "medium",
    toolIcon: "ri-fingerprint-line",
    funFact: "Banknote paper contains 75% cotton and 25% linen, with embedded coloured fibres — the exact mix is a closely guarded state secret.",
  },
};

// Tool display names and colours
export const TOOL_META: Record<ToolNeeded, { label: string; color: string; bg: string; toolIcon: string }> = {
  eyes:  { label: "Naked Eye",   color: "text-primary-700",    bg: "bg-primary-50",    toolIcon: "ri-eye-line" },
  light: { label: "Hold to Light", color: "text-accent-800",   bg: "bg-accent-50",     toolIcon: "ri-sun-line" },
  tilt:  { label: "Tilt Note",   color: "text-secondary-700",  bg: "bg-secondary-50",  toolIcon: "ri-shake-hands-line" },
  uv:    { label: "UV Light",    color: "text-foreground-700", bg: "bg-background-100", toolIcon: "ri-flashlight-line" },
  touch: { label: "Touch/Feel",  color: "text-primary-700",    bg: "bg-primary-50",    toolIcon: "ri-fingerprint-line" },
};

export const DIFFICULTY_META: Record<Difficulty, { label: string; color: string; bg: string }> = {
  easy:     { label: "Easy",     color: "text-primary-700",    bg: "bg-primary-100" },
  medium:   { label: "Medium",   color: "text-accent-800",     bg: "bg-accent-100" },
  advanced: { label: "Advanced", color: "text-foreground-700", bg: "bg-background-200" },
};