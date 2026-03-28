# Release Notes - 2026-03-28

This delivery consolidates the latest NeuralConsult Sevrage platform changes across the frontend, backend, AI service, and deployment stack.

## What changed

- Added a clinical notes intelligence workflow in the AI service with:
  - structured medical summary generation
  - complementary attention note generation
  - validation-first persistence flow
  - RAG-ready knowledge base integration points
- Added backend clinical notes orchestration:
  - note entity and repository
  - controller and service layer
  - AI service client and DTOs
  - HTTP client configuration for inter-service communication
- Updated the database schema to persist generated clinical notes.
- Updated Docker Compose to wire the backend to the AI service and to define publishable image names:
  - `aymantantani/neuralconsult-backend:latest`
  - `aymantantani/neuralconsult-frontend:latest`
  - `aymantantani/neuralconsult-ai-service:latest`
- Redesigned the frontend with the new "Modern Clinical Darkness" direction:
  - immersive landing page
  - redesigned authentication flow
  - clinical workstation layout with sidebar and topbar
  - refined dashboard and plan pages
  - updated global styling and interaction system

## Deployment note

After pulling this version, rebuild and restart the stack with Docker Compose to ensure the new frontend bundle, backend logic, and AI service endpoints are active.
