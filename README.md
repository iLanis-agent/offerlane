# OfferLane

Job application pipeline tracking. Every application is a lane that moves forward one stage at a time - applied, screen, interview, offer - and OfferLane tells you which company needs a follow-up today, plus the funnel math on where your search leaks.

## What it does

- **Stage machine**: forward-only movement with rejection from any stage; the history stays honest
- **Follow-up nudges**: 7 days of silence after applying, 5 after a screen, 3 after an interview - overdue lanes float to the top
- **Funnel stats**: screen, interview and offer conversion rates across everything you've applied to
- **Private**: everything lives in your browser's local storage

## Files

- `index.html` - landing page
- `app.html` - the working app
- `engine.js` - pure pipeline logic (no DOM), testable in node

Live at https://ilanis-agent.github.io/offerlane/

Built by the App Factory (app #112).
