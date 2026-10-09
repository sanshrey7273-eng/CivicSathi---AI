# Google Stitch Design System: Nagrik Mitra

- **Stitch Project ID:** `18435860108530741254`
- **Project Title:** Nagrik Mitra Voice Complaint App
- **Design Theme:** Nagrik Mitra Civic Trust
- **Visual Source of Truth:** Google Stitch Project `18435860108530741254`

---

## 1. Design Tokens (Tailwind Configuration)

```javascript
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#00466e",
        "primary-container": "#1b5e8c",
        "on-primary": "#ffffff",
        "on-primary-container": "#abd6ff",
        secondary: "#914d00",
        "secondary-container": "#fc9430",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#663500",
        tertiary: "#004d26",
        "tertiary-container": "#006835",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#7ce79c",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        background: "#fcf9f8",
        surface: "#fcf9f8",
        "surface-container": "#f0eded",
        "surface-container-low": "#f6f3f2",
        "surface-container-high": "#eae7e7",
        "surface-container-highest": "#e5e2e1",
        "surface-container-lowest": "#ffffff",
        "on-surface": "#1c1b1b",
        "on-surface-variant": "#41474f",
        outline: "#717880",
        "outline-variant": "#c1c7d0",
        "mic-saffron": "#F28C28",
        "mic-active": "#D97316"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
        full: "9999px"
      },
      fontFamily: {
        headline: ["Public Sans", "sans-serif"],
        body: ["Inter", "Noto Sans Devanagari", "sans-serif"]
      }
    }
  }
};
```

---

## 2. Screen Catalog (Stitch Project Screens)

| Screen Name | Device | Resource ID / Preview |
|---|---|---|
| **Nagrik Mitra - Home** | Desktop/Mobile | `screens/13fbb5ac6d754393b4405da57ac81f79` |
| **Nagrik Mitra - Speak Your Complaint** | Mobile / Desktop | `screens/4247ca2c4a304c3a84d3f865b75b8371` / `screens/ede7e7d2b5694e8ea3b87a5fce0ceec5` |
| **Nagrik Mitra - Listening to Your Complaint** | Mobile / Desktop | `screens/146c2aacd0c14b91bf8ab426ff95506a` / `screens/cdf96e05d3e34c269a83427a75609f1a` |
| **Nagrik Mitra - Review Your Complaint** | Mobile / Desktop | `screens/97c255197bd54dd29189d66f837ac6c4` / `screens/ee4ac8eed51b478daf4d1054b2a26f45` |
| **Nagrik Mitra - Location and Details** | Desktop / Mobile | `screens/e0fa7a01a5eb4f1d97ecd5c4b8d70485` |
| **Nagrik Mitra - Confirm Complaint** | Desktop | `screens/5e6c381b61aa4eaa92f97c01e5b43273` |
| **Nagrik Mitra - Complaint Submitted Successfully** | Mobile / Desktop | `screens/021f04c339e741efa87d3ee636ef3fbc` / `screens/fbccabfb21b24b409871041789cade48` |
| **Nagrik Mitra - Voice Recording Error** | Mobile / Desktop | `screens/a82310b97a9d4ccf9283c0afa9c6e90b` / `screens/6352778c0ad34595b478653d4558c744` |

---

## 3. UI/UX Core Rules for Antigravity Frontend

1. **Max Width Container**: `max-w-[720px]` centered horizontally for focus on mobile and desktop.
2. **Hero Saffron Mic**: 200px diameter circular button (`#F28C28`) with pulse animation rings during listening state (`#D97316`).
3. **Typography**: High legibility with `Public Sans` for bold headlines and `Inter` + `Noto Sans Devanagari` for body.
4. **Touch Targets**: Minimum 44px to 64px physical target size for elderly and first-time smartphone users.
5. **No Clutter**: Never more than 3 primary interactive areas per step.
