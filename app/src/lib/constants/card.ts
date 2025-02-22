import { Swords, Sparkles, PawPrint, SquareUserRound, Cog, Scroll, Zap, WandSparkles, TreePine, UserRound } from "lucide-react";

export const CARD_TYPE_ICONS = {
    Battle: Swords,
    Planeswalker: Sparkles,
    Creature: PawPrint,
    Instant: Zap,
    Sorcery: WandSparkles,
    Artifact: Cog,
    Enchantment: Scroll,
    Land: TreePine,
} as const;

export const CARD_TYPES = [
    "Battle",
    "Planeswalker",
    "Creature",
    "Instant",
    "Sorcery",
    "Artifact",
    "Enchantment",
    "Land",
] as const;