# SubTrackPay – Subscription & Bill Tracking Platform

## CI Information
**Build Status:** GitHub Actions (lint + tests on every pull request)

---

## Project Summary

SubTrackPay is a **local-first web application** that helps users track recurring subscriptions and bills, calculate monthly spending, and receive reminders for upcoming renewals or overdue payments.

Unlike many commercial personal finance tools, SubTrackPay avoids bank integrations and third-party services. Instead, it emphasizes **transparency, privacy, and explicit user control**. Users manually define subscriptions and billing cycles, making costs and renewal logic easy to understand.

A key innovation of the project is its **Synthetic Data Engine**, which generates realistic subscription and billing activity (including churn, payment failures, and retries). This enables robust testing, analytics, and demonstrations without using real financial data.

This project is developed as part of **SOEN 490 (Capstone Software Engineering Project)** at Concordia University and is intended to demonstrate **engineering design and implementation for a complex, open-ended problem**, in accordance with CEAB requirements.

---

## Motivation & Problem Statement

Recurring subscriptions and bills are easy to forget and difficult to reason about over time. Existing tools often:
- Require invasive bank integrations
- Hide billing logic behind opaque automation
- Add unnecessary features that increase complexity

SubTrackPay addresses this problem by providing a **simple, user-managed system** where users explicitly define, track, and understand their recurring financial commitments.

---

## Key Features

- **Subscription Management**  
  Create and manage subscriptions with service name, category, cost, billing frequency, and lifecycle dates.

- **Bill Generation & Tracking**  
  Generate bill occurrences and track payment status (paid, late, failed).

- **Reminder & Retry Logic**  
  Detect upcoming renewals, overdue bills, and retry failed payments.

- **Spending Analytics**  
  Dashboards showing monthly totals, upcoming obligations, and top cost drivers.

- **Synthetic Data Engine**  
  Deterministic, seeded simulations of subscriptions, churn, and billing behavior for testing and experimentation.

---

## Engineering Design Philosophy

This project is intentionally **engineering-driven**, not feature-driven.

### Design Principles
- Local-first and privacy-friendly architecture  
- Clear separation of concerns  
- Fail-fast, risk-driven development  
- Deterministic behavior for testing  
- Continuous integration and logging from day one  

The system is designed to be **understandable, testable, and maintainable**, even with a small team.

---

## Technology Stack

### Frontend
- React
- Vite
- TypeScript

### Backend
- Node.js
- Express
- TypeScript

### Database
- PostgreSQL
- Prisma ORM

### Infrastructure & Tooling
- Docker & Docker Compose
- JWT + bcrypt (authentication)
- Zod (input and environment validation)
- Pino (structured logging)
- Jest & Supertest (testing)
- GitHub Actions (CI)

---

## Developer Getting Started Guide

### Prerequisites
- Docker
- Docker Compose
- Git
- Node.js (optional for local development)

---

### Quick Setup


git clone <repository-url>
cd SubTrackPay
docker-compose up --build


---

## Wiki Table of Contents

All engineering documentation, planning artifacts, and design decisions are maintained in the GitHub Wiki.

- [Project Overview](https://github.com/Ava-Samimi/SubTrackPay/wiki/Project-Overview)
- [Architecture & Design](https://github.com/Ava-Samimi/SubTrackPay/wiki/Architecture-&-Design)
- [Personas](https://github.com/Ava-Samimi/SubTrackPay/wiki/Personas)
- [Risk Management](https://github.com/Ava-Samimi/SubTrackPay/wiki/Risk-Management)
- [Agile Planning & Estimation](https://github.com/Ava-Samimi/SubTrackPay/wiki/Agile-Planning-&-Estimation)
- [Testing Plan & Continuous Integration](https://github.com/Ava-Samimi/SubTrackPay/wiki/Testing-Plan-&-Continuous-Integration)
- [Metrics, Logging & Empirical Data](https://github.com/Ava-Samimi/SubTrackPay/wiki/Metrics,-Logging-&-Empirical-Data)
- [Competition & Novelty](https://github.com/Ava-Samimi/SubTrackPay/wiki/Competition-&-Novelty)
- [Security](https://github.com/Ava-Samimi/SubTrackPay/wiki/Security)
- [Legal & Ethical Issues](https://github.com/Ava-Samimi/SubTrackPay/wiki/Legal-&-Ethical-Issues)
- [Iteration & Release Notes](https://github.com/Ava-Samimi/SubTrackPay/wiki/Iteration-&-Release-Notes)
