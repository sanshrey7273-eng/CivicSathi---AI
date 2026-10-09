# 01 STITCH PROMPTS (design)

Use order: S0 (style) -> S1 ... S8 (screens, one by one) -> export. Mobile (360 px) design mode. After all screens, export the **zip** (HTML/CSS + screenshots) and keep it for Antigravity.

## S0: Design system / overall style
```
Design a mobile-first civic-tech app called "Nagrik Mitra" for citizens of Pune, India. Voice-first: the main action is speaking a complaint in Marathi or Hindi. Style: clean, trustworthy, friendly government-service look, not corporate. Colors: civic blue #1B5E8C primary, saffron #F28C28 accent for the mic button, background #F7F9FB, white cards with 16px radius, success green #2E9E5B, warning amber #E0A800, info blue #3B82F6, danger red #D64545. Typography: Noto Sans Devanagari for Marathi/Hindi text, Inter for Latin. Body text minimum 16px. Large touch targets (44px+). Show real Marathi text, not lorem ipsum.
```

## S1: Home
```
Home screen. Top: app logo "नागरिक मित्र" and a language toggle (मराठी | हिन्दी | EN). Center: a huge circular saffron microphone button with caption "बोला, आम्ही तक्रार तयार करतो" (Speak, we will prepare your complaint). Below: a secondary button "फोटो काढा" (Take a photo) with a camera icon. Below that, three small chips showing supported issues: खड्डा (pothole), कचरा (garbage), रेशन कार्ड (ration card). Bottom: link "सार्वजनिक डॅशबोर्ड पहा" (View public dashboard).
```

## S2: Listening
```
Listening screen. Large pulsing microphone with animated waveform rings, status text "ऐकत आहे..." (Listening...). Live transcript area showing Marathi text "माझ्या घराजवळ रस्त्यात मोठा खड्डा आहे". A red Stop button and a text link "टाइप करा" (Type instead).
```

## S3: Review transcript
```
Review screen. Title "तुमची तक्रार" (Your complaint). Editable text box with the Marathi transcript, a photo thumbnail of a pothole with a remove button, and a primary full-width button "तपासा" (Analyze). Stepper at top showing 3 steps: बोला (Speak), तपासा (Verify), सबमिट (Submit), step 1 done.
```

## S4: Result (classification)
```
Result screen after AI analysis. Show a category chip "खड्डा / Pothole" with a road icon and a High severity badge in red. A department card: "पुणे महानगरपालिका पथ विभाग" with a small building icon. A short summary paragraph in Marathi. A "आवश्यक कागदपत्रे" (Required documents) checklist with 3 checkboxes. Primary button "पुढे जा" (Continue). Stepper step 2.
```

## S5: Location + details
```
Location screen. Top half: an OpenStreetMap-style map with a draggable saffron pin over Pune, a floating "माझे स्थान वापरा" (Use my location) button. Below: a card showing detected address "FC Road, Shivajinagar" and ward "Shivajinagar-Ghole Road". Inputs: name (नाव), phone (मोबाईल नंबर). Primary button "तक्रार सबमिट करा" (Submit complaint). Stepper step 3.
```

## S6: Success
```
Success screen. Green check animation, text "तक्रार तयार आहे!" (Your complaint is ready), reference number card "NM-PUNE-20261009-0042" with a copy icon. Buttons: "PDF डाउनलोड करा" (primary), "WhatsApp वर शेअर करा", and a link "स्थिती ट्रॅक करा" (Track status). Small PDF preview thumbnail of an A4 Marathi letter.
```

## S7: Public dashboard
```
Public dashboard screen. Top: filters row with Ward dropdown, Status dropdown, Category dropdown. A large map of Pune with clustered colored pins (grey submitted, amber in review, blue in progress, green resolved). Below the map: summary stat tiles (Total, Pending, Resolved this week). Then a ward table with columns Ward, Total, Pending, Resolved and small progress bars. Then a "Recent complaints" list of cards with category icon, ward, status badge and time ago.
```

## S8: Complaint detail / track
```
Complaint detail screen. Header with reference number and status badge. Vertical timeline: Submitted, In review, In progress, Resolved with timestamps and notes. Small map showing the pin, photo thumbnail, department, and a "PDF पहा" (View PDF) button.
```

## Export checklist
- [ ] All 8 screens generated and consistent
- [ ] Marathi text renders properly
- [ ] Export as zip (code + images) and save as `stitch-export.zip`
