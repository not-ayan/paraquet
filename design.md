# Paraquet — Design System and UI Direction

## Overview

Paraquet is a community equipment lending and booking platform.

The visual direction is inspired by modern curation platforms and contemporary studio galleries:
- **Clean studio aesthetic**: Warm chalk/alabaster backgrounds (`#F5F5F3` / `#FAFAF8`) with crisp card surfaces (`#FFFFFF` / `#EFEFEF`).
- **Typography**: Variable sans-serif typography using **Aspekta** (`/fonts/AspektaVF.woff2`) with dynamic fluid font sizing (`clamp()`) across all screens.
- **Card architecture**: High-contrast, beautifully framed media cards with rounded corners (`24px`), floating frosted pill badges (`#FFFFFF/90`), subtle arrows (`↗`), and minimalist metadata baselines (`Title ........... Category / Status`).
- **Micro-elements**: Minimal status indicators (`● Available`, `★ 4.9 Verified`), pill action buttons, and clear interactive focus rings.

---

## 1. Core Visual Tokens

### Color Palette

| Token | Hex Value | Role & Usage |
|---|---|---|
| `--background` | `#F5F5F3` | Warm chalk canvas background |
| `--surface` | `#FFFFFF` | Primary card panels & dialogs |
| `--surface-muted` | `#EBEBE8` | Secondary surfaces & inactive pill buttons |
| `--surface-card` | `#EDEDEA` | Inset media frame background |
| `--border` | `#E2E2DE` | Subtle element borders & dividers |
| `--text-primary` | `#111110` | High-contrast body text & titles |
| `--text-secondary` | `#70706B` | Supporting metadata & labels |
| `--text-muted` | `#9C9C96` | Captions & subtle placeholders |
| `--accent-green` | `#1B7A42` | Status: Available / Verified |
| `--accent-green-bg` | `#E8F5EB` | Available badge fill |
| `--accent-amber` | `#B25E09` | Status: Pending Review |
| `--accent-amber-bg` | `#FEF3C7` | Pending badge fill |
| `--accent-blue` | `#1D4ED8` | Status: Active Checkout |
| `--accent-blue-bg` | `#EFF6FF` | Active badge fill |
| `--accent-red` | `#DC2626` | Status: Rejected / Unavailable |
| `--accent-red-bg` | `#FEE2E2` | Rejected badge fill |

---

## 2. Dynamic Fluid Typography (Aspekta)

Font family: **Aspekta Variable** (`font-family: 'Aspekta', sans-serif`).

| Level | Dynamic Fluid Size | Weight | Tracking |
|---|---|---|---|
| **Display Title** | `clamp(2rem, 5vw + 1rem, 4.5rem)` | 700 / 800 | `-0.03em` |
| **Section Heading** | `clamp(1.5rem, 3vw + 0.5rem, 2.5rem)` | 650 | `-0.025em` |
| **Card Heading** | `clamp(1.05rem, 1.5vw + 0.2rem, 1.35rem)` | 600 | `-0.015em` |
| **Body Large** | `clamp(0.95rem, 1vw + 0.2rem, 1.125rem)` | 400 / 500 | `-0.01em` |
| **Body Regular** | `clamp(0.85rem, 0.5vw + 0.5rem, 0.95rem)` | 400 / 500 | `0` |
| **Micro / Metadata** | `clamp(0.7rem, 0.3vw + 0.45rem, 0.8rem)` | 500 / 600 | `+0.01em` |

---

## 3. Component Design System

### Cards
- Rounded corners: `border-radius: clamp(16px, 2vw, 24px)`
- Minimalist framing: clean inset padding (`12px – 20px`), background `#FFFFFF` or `#EDEDEA`, subtle 1px border.
- Hover lift: slight elevation `translateY(-2px)` with subtle ambient shadow.

### Buttons & Pills
- Pill radius: `border-radius: 9999px`
- Primary Button: Solid black `#111110` with white text, or dark forest tint on hover.
- Secondary Button: Outline border `#E2E2DE` on white/transparent background.
- Floating image badges: Frosted backdrop (`backdrop-blur-md bg-white/85 text-xs font-semibold px-3 py-1 rounded-full`).
