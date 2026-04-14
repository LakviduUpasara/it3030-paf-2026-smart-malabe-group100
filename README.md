# it3030-paf-2026-smart-campus-groupXX

## Project Overview

This repository is a starter scaffold for the Smart Campus Operations Hub university assignment. It separates the backend, frontend, documentation, and CI workflow setup so the project is easy to extend as a team.

## Tech Stack

- Backend: Java Spring Boot
- Frontend: React
- Database: MongoDB
- Version Control: Git
- CI: GitHub Actions

## Folder Structure

```text
it3030-paf-2026-smart-campus-groupXX/
├── README.md
├── .gitignore
├── docs/
│   ├── diagrams/
│   ├── api/
│   ├── testing/
│   ├── contribution/
│   └── ai-usage-disclosure.md
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/example/app/
│   │   │   │   ├── controller/
│   │   │   │   ├── service/
│   │   │   │   ├── repository/
│   │   │   │   ├── entity/
│   │   │   │   ├── dto/
│   │   │   │   ├── security/
│   │   │   │   ├── exception/
│   │   │   │   ├── config/
│   │   │   │   └── util/
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       └── application-dev.properties
│   │   └── test/
│   └── pom.xml
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── routes/
│   │   ├── context/
│   │   ├── utils/
│   │   └── App.js
│   └── package.json
└── .github/
    └── workflows/
        ├── backend-ci.yml
        └── frontend-ci.yml
```

## Local Setup

### Backend

1. Install Java 21 and Maven.
2. Start MongoDB locally. The project includes a Docker Compose file for this.
3. Open a terminal in the project root and run `docker compose up -d`.
4. Open a second terminal in `backend/`.
5. Run `mvn spring-boot:run`.

The backend starts on `http://localhost:18081`.

### Frontend

1. Install Node.js 20 or newer.
2. Open a terminal in `frontend/`.
3. Run `npm install`.
4. Run `npm run dev`.

The frontend starts on `http://localhost:3000`.

## How To Run Locally

Start the backend first:

```bash
docker compose up -d

cd backend
mvn spring-boot:run
```

Then start the frontend:

```bash
cd frontend
npm install
npm run dev
```

The backend auth flow now uses MongoDB collections for:

- pending sign-up requests
- approved user accounts
- session tokens
- 2-step verification challenges

## Team Contribution

| Member | Role | Contribution |
|---|---|---|
| Member 1 | Placeholder | Backend module ownership |
| Member 2 | Placeholder | Frontend module ownership |
| Member 3 | Placeholder | Documentation and testing |
| Member 4 | Placeholder | Integration and deployment |
