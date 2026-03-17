# vulnerable-node-app

A simple REST API for managing personal notes.

> **Note:** This repository contains intentional security vulnerabilities
> and is intended for evaluation purposes only. Do not deploy this application.

## Setup

1. Clone the repo
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in values
4. Run `npm start`

## Endpoints

| Method | Route | Auth required |
|--------|-------|---------------|
| POST | /auth/register | No |
| POST | /auth/login | No |
| GET | /users | No |
| GET | /notes | Yes |
| POST | /notes | Yes |
| GET | /notes/search?q= | Yes |
| PUT | /notes/:id | Yes |
| DELETE | /notes/:id | Yes |
