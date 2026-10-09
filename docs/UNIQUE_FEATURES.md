# Unique features: Nagrik Mitra

Pitch line: other apps create a ticket. Nagrik Mitra writes the Marathi or Hindi letter a citizen can hand in at the office the next morning.

Compare against government portals (Aaple Sarkar, PMC complaint, CPGRAMS), photo-report apps (Swachhata, Meri Sadak), and generic "AI civic complaint" demos. The public [CivicSathi](https://github.com/sanshrey7273-eng/CivicSathi---AI) repo is only a one-line README, so do not claim a feature-by-feature win over it.

## Different from existing projects

1. Voice comes first. The home screen hero is the microphone. Aaple Sarkar, PMC complaint, CPGRAMS, and Swachhata start with an English or long form.
2. The whole path is in Marathi or Hindi: speak, edit the transcript, read the summary, see the document list, and download the PDF. Translating only the buttons is not the same.
3. The department is chosen immediately. A pothole goes to the Road Department, garbage to Solid Waste, a ration-card error to Food and Civil Supplies. It is not one generic "municipal complaint" bucket.
4. Ration card sits in the same app as road and garbage. Most civic apps only cover streets and cleanliness. A wrong name or member on a ration card is a different office, and this demo includes it.
5. The output is a ready PDF, not only a ticket trapped inside the app. The citizen can give the letter to the ward office or a corporator. The demo does not auto-submit into PMC systems.
6. The document checklist follows the category. Ration needs the card, Aadhaar, and address proof. A pothole needs a photo and the location. The citizen does not have to guess.
7. There is no login and no OTP. Name and phone are enough. A senior citizen does not create an account.
8. The transcript is shown and can be edited. A bad speech result is corrected before submit. A blind recording is not sent straight to a department.
9. Only three complaint types are accepted. Anything else gets a polite "not supported in this demo" message. Generic AI apps accept every sentence and then assign the wrong department.
10. The public ward map never shows the phone number. A journalist or corporator can see area status. Name, phone, and email stay off the public list.
11. WhatsApp share and a track link. The PDF or reference can be forwarded without another portal login.
12. The demo still works if the mic fails. The citizen can type, or send audio to the Groq Whisper fallback. If the model fails, keywords still pick the category.

## Not unique — do not claim these

- Photo upload and a GPS pin. Swachhata, Meri Sadak, and FixMyStreet already do this.
- A ward-wise public map. Common in city dashboards and hackathon projects.
- "AI classifies the complaint." Common in 2025–2026 student projects. Classification here matters because it picks one of three real departments and fills a formal letter.
