# Entity Relationship Diagram — Eventify

## What gets produced
A single ERD covering all 15 database tables, delivered as:
1. A **Mermaid diagram** rendered inline in chat (downloadable `.mmd`)
2. A **high-resolution PNG** saved to documents, suitable for pasting into the defense report/slides

## Entities to include
- **profiles**, **user_roles** (app_role enum: admin/moderator/user) — identity and access
- **bookings** — the central table, linking user, hall, catering package, decoration package, promo code
- **halls**, **catering_packages**, **decoration_packages** — bookable inventory
- **promo_codes** — discounts applied to bookings
- **reviews** — tied to a user, a booking, and a hall
- **waitlist** — user + hall + date when a hall is fully booked
- **notifications** — per-user in-app alerts
- **email_reminders**, **email_tracking** — booking-linked email events
- **blog_posts**, **past_events** — content tables (blog posts link to an author)

Each entity lists its columns with types, primary keys, and foreign keys. Relationships are labelled with cardinality (e.g. one hall has many bookings; one booking has zero-or-one catering package).

## Layout
Central `bookings` entity with inventory tables feeding in from one side, user/identity tables from the other, and communication/content tables grouped separately, so the diagram reads cleanly at report size.

## Technical details
- Source of truth: the live database schema (tables, columns, enums, foreign keys) — read directly, not guessed
- Mermaid `erDiagram` syntax for the chat/downloadable version
- PNG rendered via mermaid CLI at high DPI, saved to `/mnt/documents/`
- Optionally dropped into `/public/diagrams/` alongside the existing UML diagrams if you want it served by the app

## Not included (say the word to add)
- RLS policy annotations per table
- Data-flow or sequence diagrams (the booking/payment flow)
