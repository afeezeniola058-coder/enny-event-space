

# Plan: Generate Defense Presentation (.pptx) for Eventify

## What We're Building
A professionally designed PowerPoint presentation (downloadable .pptx) for an academic defense of the **Eventify** event management platform — a National Diploma project.

## Design Philosophy
**"Warm Precision"** — A rich, dark-toned palette (deep navy + warm gold accent) reflecting the premium event planning brand. Clean layouts with bold stat callouts, system diagrams, and structured content. Professional and academic in tone.

## Slide Structure (approx. 12-14 slides)

1. **Title Slide** — Project title, student info placeholder, institution, date
2. **Problem Statement** — Manual event planning challenges in Nigeria
3. **Objectives** — 4-5 clear project objectives
4. **Literature Review Summary** — Brief comparison of existing solutions vs Eventify
5. **System Architecture** — Tech stack diagram (React, Supabase, Paystack, Edge Functions)
6. **Entity Relationship Diagram** — Key tables: bookings, halls, catering_packages, decoration_packages, profiles, notifications, reviews, user_roles
7. **Key Features (1)** — Hall booking with real-time availability, catering & decoration packages, budget calculator
8. **Key Features (2)** — Paystack payment integration, AI package recommender, automated email reminders
9. **Key Features (3)** — Admin dashboard, user dashboard, notification system, reviews
10. **Security & Architecture** — RLS policies, role-based access, input validation, CORS
11. **Testing & Results** — Summary of functional testing outcomes
12. **Demo Screenshots** — Placeholder for app screenshots
13. **Challenges & Future Work** — Limitations and recommendations
14. **Conclusion & Q&A** — Summary and thank you

## Technical Approach
- Use `pptxgenjs` via Node.js script
- Dark navy (#1E2761) primary, gold (#D4A843) accent, ice blue (#CADCFC) secondary
- Embed the 4 UML diagrams from `/public/diagrams/` where relevant
- Font pairing: Arial Black (headers) + Arial (body)
- Output to `/mnt/documents/eventify-defense-presentation.pptx`
- QA via LibreOffice PDF conversion + visual inspection

## Files Produced
- `/mnt/documents/eventify-defense-philosophy.md` — Design philosophy document
- `/mnt/documents/eventify-defense-presentation.pptx` — Final presentation

