# Talk, Photo, & Video for Checklists (Web Edition)

## Category
ai-solution

## Role
All Roles

## Problem Statement

Build a web application that allows users to create a checklist within a project, then use natural language (voice and text) in combination with photos and video, in order to update the completion state of items on that checklist. The app should be mobile-friendly and accessible from any device with a browser.

## Functional Requirements

Users should be able to:

- **Create a Project.** Each project has a name and contains one or more checklists.
- **Add a checklist to the project.** Checklists contain ordered items that can be checked off.
- **Talk to their device to check items on the list.** Using the browser microphone via Web Speech API / MediaRecorder, the user speaks naturally (e.g., "Just got out of the carwash") and the system checks off the matching item ("Wash Car").
- **Upload or capture a photo to check items off the list.** Using the browser camera via `getUserMedia` or file upload, the user provides a photo (e.g., a photo of a clean room) and the system checks off the matching item ("Clean bedroom").
- **Ask questions about the project/list.** Natural language queries such as "What's next?" return the next uncompleted item on the list.

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js (App Router) | Server components + client components for media access |
| Language | TypeScript | Strict mode |
| UI | shadcn/ui + Tailwind CSS v4 | Mobile-first responsive design |
| Backend API | Rails 7 (API mode) | REST API, same as original spec |
| AI | Anthropic Claude (single-turn tool use) | `check_items` and `answer_question` tools |
| Observability | Langfuse | Tracing all AI calls |
| Speech-to-text | Web Speech API (browser) | Falls back to MediaRecorder + server-side transcription |
| Camera | `navigator.mediaDevices.getUserMedia()` | HTTPS required in production |
| Deployment | Vercel (frontend) + Railway (API) | Or unified on Railway |

## Non-Functional Requirements

- **HTTPS required** — camera and microphone APIs only work over secure contexts.
- **Mobile-first design** — primary use case is field workers on phones.
- **Progressive Web App (PWA)** — installable via "Add to Home Screen" for app-like experience.
- **Browser support** — Chrome (Android/desktop), Safari (iOS/desktop), Firefox. Chrome is the primary target for best Web Speech API support.

## Key Differences from React Native Version

| Concern | React Native (original) | Next.js Web (this PRD) |
|---------|------------------------|------------------------|
| Distribution | App store / Expo Go | URL — no install needed |
| Camera | expo-camera | getUserMedia API |
| Microphone | expo-speech / native | Web Speech API / MediaRecorder |
| Offline | Built-in | Service worker (optional, stretch goal) |
| UI framework | React Native primitives | HTML/CSS via shadcn/ui |

## Required Languages

Ruby/Rails, TypeScript/Next.js
