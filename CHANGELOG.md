# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-16

### Added
- **Production Dashboard Release**: Full real-time observability panel for AI agents and chat assistants.
- **KPI Metrics Engine**: Live calculations for total requests, success rates, average latency, and estimated token costs (in Toman).
- **Interactive Analytics**:
  - Response latency area chart + token consumption timeline.
  - Platform distribution (Telegram, MiniApp, Web).
  - Latency heatmap donut breakdown (<10s, 10-30s, >30s).
  - Heaviest tools performance breakdown.
  - Top users leaderboard with interaction frequency and token expenditure.
  - Role-based financial attribution chart.
- **AI Integrations (Google Gemini 2.5 Flash)**:
  - Smart semantic search across conversation logs.
  - Executive managerial briefing generator for leadership.
  - On-demand conversation analysis in transaction detail modal.
- **Data Export**: UTF-8 BOM CSV / Excel export for auditing.
- **DevOps & Containerization**:
  - Multi-stage Dockerfile with Node 20 and Alpine Nginx.
  - Production `docker-compose.yml` with healthchecks.
  - Comprehensive `.env.example` and environment variable decoupling.
  - Automated GitHub Actions CI pipeline (lint, typecheck, build).
- **Design System**:
  - Sleek glassmorphism visual styling with dark and light theme toggle.
  - Persian (Farsi) RTL-first layout with Vazirmatn typography.
