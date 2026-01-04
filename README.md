# Portfolio Backend API

A Cloudflare Workers-based backend API for the portfolio website, built with Hono framework and MongoDB.

## Overview

This backend serves as the API layer for the portfolio frontend, handling:
- **Profile Information**: Personal profile data and information
- **Works/Projects**: Individual projects and applications with app store integration
- **Experiences/Companies**: Work experience and company information
- **Educations**: Educational background and qualifications
- **Certifications**: Professional certifications and credentials
- **Skills**: Technical skills organized by categories
- **App store data fetching**: iOS App Store + Google Play Store integration
- **Contact form**: Email processing for user inquiries
- **Statistics**: Portfolio analytics and calculations
- **Database operations**: Optimized MongoDB queries

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Database**: MongoDB Atlas
- **Language**: TypeScript
- **Deployment**: Wrangler CLI

## Environment Variables

Create a `.env` file in the backend root directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Email Configuration (for contact form)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# CORS Configuration
FRONTEND_URL=https://sumit.codes
```

## Development

### Prerequisites

- Node.js 18+
- Bun (recommended) or npm
- Cloudflare account
- MongoDB Atlas account

### Installation

```bash
# Install dependencies
bun install
# or
npm install

# Generate Cloudflare types
bun run cf-typegen
# or
npm run cf-typegen
```

### Local Development

```bash
# Start development server
bun run dev
# or
npm run dev
```

The API will be available at `http://localhost:8787`

### Deployment

```bash
# Deploy to Cloudflare Workers
bun run deploy
# or
npm run deploy
```

## API Endpoints

### Health Check

**GET** `/api/health`

Check the health status of the API and its dependencies.

**Legacy endpoint:** `/health` (for backward compatibility)

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "mongodb": "connected"
  }
}
```

**Status Codes:**
- `200` - All services healthy
- `503` - One or more services unavailable

---

### Works (Projects)

#### Get All Works

**GET** `/api/works`

Retrieve all works/projects from the database. Works are automatically enriched with app store data (screenshots, ratings, categories) when available.

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "eazydukan",
      "name": "EazyDukan",
      "description": {
        "short": "Multilingual retail management platform...",
        "long": "Developed a multilingual retail management app..."
      },
      "icon": "",
      "category": "",
      "type": "MULTI_PLATFORM",
      "appStoreId": null,
      "playStoreId": "com.eazydukan",
      "isInternal": false,
      "featured": false,
      "companyId": "lovepack",
      "technologies": ["React Native", "React.js", "Next.js", "TypeScript", "Redux", "Zustand", "WebSocket", "Firebase", "Razorpay", "Thermal Printers", "Bluetooth", "Axios", "GitLab", "Tailwind"],
      "rating": 0,
      "screenshots": [""],
      "webUrls": ["https://www.eazydukan.com", "https://shop.eazydukan.com/"],
      "sourceCode": null,
      "googleGroupUrl": null
    }
  ]
}
```

**Features:**
- Automatically fetches and enriches with Play Store data if `playStoreId` is provided
- Automatically fetches and enriches with App Store data if `appStoreId` is provided
- Screenshots are merged from both database and app stores
- Ratings and categories are updated from app stores when available

**Testing Phase Indicator:**
- If `googleGroupUrl` is not `null`, it indicates the app is currently in testing phase
- The frontend should display steps for users to:
  1. Join the Google Group using the provided `googleGroupUrl`
  2. After joining, they can download the app from the Play Store (if `playStoreId` is available)
- This allows controlled access to apps that are not yet publicly available

#### Get Work by ID

**GET** `/api/works/{id}`

Retrieve a specific work/project by ID.

**Parameters:**
- `id` (string) - The work ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "eazydukan",
    "name": "EazyDukan",
    "description": {
      "short": "Multilingual retail management platform (mobile & web) with subscription tiers, multi-outlet management, full POS system, and AI-powered features.",
      "long": "Developed a multilingual retail management app (mobile & web) featuring subscription tiers, multi-outlet and staff management, a full POS system with real-time inventory tracking, and support for cash, QR code, and Razorpay SMS payments."
    },
      "icon": "",
      "category": "",
      "type": "MULTI_PLATFORM",
      "appStoreId": null,
      "playStoreId": "com.eazydukan",
      "isInternal": false,
      "featured": false,
      "companyId": "lovepack",
      "technologies": ["React Native", "React.js", "Next.js", "TypeScript", "Redux", "Zustand", "WebSocket", "Firebase", "Razorpay", "Thermal Printers", "Bluetooth", "Axios", "GitLab", "Tailwind"],
      "rating": 0,
      "screenshots": [""],
    "webUrls": ["https://www.eazydukan.com", "https://shop.eazydukan.com/"],
    "sourceCode": null,
    "googleGroupUrl": null
  }
}
```

**Note:** If `googleGroupUrl` is not `null`, the app is in testing phase. The frontend should display instructions for users to join the Google Group and then download the app.

**Status Codes:**
- `200` - Work found
- `404` - Work not found
- `500` - Server error

**Legacy endpoint:** `/works` (for backward compatibility)

---

### Experiences (Companies)

#### Get All Experiences

**GET** `/api/experiences`

Retrieve all work experiences/companies from the database.

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "ariveguru",
      "name": "AriveGuru Technology Solutions Pvt. Ltd.",
      "role": "Frontend Engineer",
      "workStart": "2024-03-14",
      "workEnd": "2024-07-23",
      "location": "Bangalore",
      "description": "Developed apps for medical firms, enhancing user health tracking and assessments. Built RHIA, an AI assistant for tasks like user registration, appointment scheduling, and task management. Created a JSON to React Native component converter.",
      "color": "from-green-500 to-teal-500",
      "type": "FULL_TIME",
      "works": ["bvmrf", "rhia"]
    }
  ]
}
```

#### Get Experience by ID

**GET** `/api/experiences/{id}`

Retrieve a specific work experience by ID.

**Parameters:**
- `id` (string) - The experience ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "ariveguru",
    "name": "AriveGuru Technology Solutions Pvt. Ltd.",
    "role": "Frontend Engineer",
    "workStart": "2024-03-14",
    "workEnd": "2024-07-23",
    "location": "Bangalore",
    "description": "Developed apps for medical firms, enhancing user health tracking and assessments. Built RHIA, an AI assistant for tasks like user registration, appointment scheduling, and task management.",
      "color": "from-green-500 to-teal-500",
      "type": "FULL_TIME",
      "works": ["bvmrf", "rhia"]
  }
}
```

**Status Codes:**
- `200` - Experience found
- `404` - Experience not found
- `500` - Server error

---

### App Store Data

#### Get App Store App Data

**GET** `/api/apps/app-store/{id}`

Fetch iOS App Store app data by app ID.

**Parameters:**
- `id` (string) - App Store app ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123456789",
    "name": "App Name",
    "description": "App description...",
    "icon": "https://is1-ssl.mzstatic.com/...",
    "screenshots": ["https://...", "https://..."],
    "appStoreUrl": "https://apps.apple.com/app/...",
    "version": "1.0.0",
    "rating": 4.5,
    "ratingCount": 1234,
    "price": 0,
    "currency": "USD",
    "developer": "Developer Name",
    "category": "Productivity",
    "releaseDate": "2024-01-01T00:00:00Z",
    "size": 52428800
  }
}
```

#### Get Play Store App Data

**GET** `/api/apps/play-store/{id}`

Fetch Google Play Store app data by app ID.

**Parameters:**
- `id` (string) - Play Store app ID (package name)
- `lang` (query, optional) - Language code (default: "en")
- `country` (query, optional) - Country code (default: "us")

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "com.example.app",
    "title": "App Name",
    "description": "App description...",
    "summary": "Short summary...",
    "icon": "https://play-lh.googleusercontent.com/...",
    "screenshots": ["https://...", "https://..."],
    "playStoreUrl": "https://play.google.com/store/apps/details?id=...",
    "version": "1.0.0",
    "rating": 4.5,
    "ratingCount": 1234,
    "installs": "1,000,000+",
    "price": 0,
    "free": true,
    "developer": "Developer Name",
    "category": "Productivity",
    "releaseDate": "2024-01-01",
    "size": "50 MB",
    "androidVersion": "8.0 and up",
    "contentRating": "Everyone"
  }
}
```

**Status Codes:**
- `200` - App data retrieved successfully
- `404` - App not found
- `500` - Server error or external API failure

---

### Contact Form

#### Send Contact Email

**POST** `/api/contact`

Send a contact form email.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello, I'd like to discuss..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Your message has been sent successfully! I'll get back to you soon."
}
```

**Validation:**
- `name`: Required, minimum 2 characters
- `email`: Required, valid email format
- `message`: Required, minimum 10 characters

**Status Codes:**
- `200` - Email sent successfully
- `400` - Validation error
- `500` - Email sending failed

---

### Statistics

#### Get Portfolio Statistics

**GET** `/api/stats`

Retrieve calculated statistics about the portfolio.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalExperience": "2 years 3 months",
    "totalCompanies": 3,
    "totalProjects": 15,
    "totalTechnologies": 25,
    "currentPosition": true,
    "lastUpdated": "2024-01-15T00:00:00Z"
  }
}
```

**Status Codes:**
- `200` - Statistics retrieved successfully
- `500` - Server error

---

### Utilities

#### Format Experience Date

**GET** `/api/utils/format-date/{date}`

Format a date string for display in experience sections.

**Parameters:**
- `date` (string) - Date string in ISO format or "null" for current/present dates

**Response:**
```json
{
  "success": true,
  "data": {
    "formatted": "Jan 2024"
  }
}
```

**Examples:**
- `GET /api/utils/format-date/2024-01-15` → `"Jan 2024"`
- `GET /api/utils/format-date/null` → `"Present"`

**Status Codes:**
- `200` - Date formatted successfully
- `500` - Server error

---

### Educations

#### Get All Educations

**GET** `/api/educations`

Retrieve all educational qualifications from the database, sorted by end date (most recent first).

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "6946e7af3f00b5c4c4553b91",
      "schoolName": "Relevel by Unacademy",
      "startDate": "Sep 2022",
      "endDate": "Sep 2023",
      "degreeName": "",
      "notes": "",
      "activities": ""
    }
  ]
}
```

**Sorting:**
- Educations are sorted by end date (most recent first)
- Ongoing educations (no end date) are prioritized and sorted by start date

#### Get Education by ID

**GET** `/api/educations/{id}`

Retrieve a specific education by ID.

**Parameters:**
- `id` (string) - The education ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "6946e7af3f00b5c4c4553b91",
    "schoolName": "Relevel by Unacademy",
    "startDate": "Sep 2022",
    "endDate": "Sep 2023",
    "degreeName": "",
    "notes": "",
    "activities": ""
  }
}
```

**Status Codes:**
- `200` - Education found
- `404` - Education not found
- `500` - Server error

---

### Certifications

#### Get All Certifications

**GET** `/api/certifications`

Retrieve all certifications from the database, sorted by date (most recent first).

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "6946e7b53f00b5c4c4553b95",
      "name": "Problem Solving (Basic) Certification",
      "issuer": "HackerRank",
      "date": "Nov 2023",
      "credentialID": "C7B03CF78DFF",
      "link": "https://www.hackerrank.com/certificates/c7b03cf78dff"
    }
  ]
}
```

**Sorting:**
- Certifications are sorted by date (most recent first)

#### Get Certification by ID

**GET** `/api/certifications/{id}`

Retrieve a specific certification by ID.

**Parameters:**
- `id` (string) - The certification ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "6946e7b53f00b5c4c4553b95",
    "name": "Problem Solving (Basic) Certification",
    "issuer": "HackerRank",
    "date": "Nov 2023",
    "credentialID": "C7B03CF78DFF",
    "link": "https://www.hackerrank.com/certificates/c7b03cf78dff"
  }
}
```

**Status Codes:**
- `200` - Certification found
- `404` - Certification not found
- `500` - Server error

---

### Skills

#### Get All Skills

**GET** `/api/skills`

Retrieve all skills from the database, organized by categories.

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "6946dfb63f00b5c4c4553b83",
      "title": "Programming Languages",
      "icon": "Code",
      "skills": [
        {
          "name": "JavaScript",
          "experience": 2,
          "description": "Core language for all my projects and development"
        },
        {
          "name": "TypeScript",
          "experience": 1,
          "description": "Type-safe development for scalable applications"
        }
      ]
    },
    {
      "_id": "6946dfb63f00b5c4c4553b84",
      "title": "Libraries & Frameworks",
      "icon": "Palette",
      "skills": [
        {
          "name": "React",
          "experience": 2,
          "description": "Component-based UI development and hooks"
        }
      ]
    }
  ]
}
```

**Sorting:**
- Skills within each category are sorted by experience (highest first), then by name

#### Get Skills by Category

**GET** `/api/skills/category/{category}`

Retrieve skills filtered by a specific category.

**Parameters:**
- `category` (string) - The category name to filter by

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "6946dfb63f00b5c4c4553b83",
      "title": "Programming Languages",
      "icon": "Code",
      "skills": [
        {
          "name": "JavaScript",
          "experience": 2,
          "description": "Core language for all my projects and development"
        },
        {
          "name": "TypeScript",
          "experience": 1,
          "description": "Type-safe development for scalable applications"
        },
        {
          "name": "HTML",
          "experience": 2,
          "description": "Semantic markup and accessibility standards"
        },
        {
          "name": "CSS",
          "experience": 2,
          "description": "Modern styling with flexbox, grid, and animations"
        }
      ]
    }
  ]
}
```

#### Get Skill by ID

**GET** `/api/skills/{id}`

Retrieve a specific skill category by ID.

**Parameters:**
- `id` (string) - The skill category ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "6946dfb63f00b5c4c4553b83",
    "title": "Programming Languages",
    "icon": "Code",
    "skills": [
      {
        "name": "JavaScript",
        "experience": 2,
        "description": "Core language for all my projects and development"
      },
      {
        "name": "TypeScript",
        "experience": 1,
        "description": "Type-safe development for scalable applications"
      },
      {
        "name": "HTML",
        "experience": 2,
        "description": "Semantic markup and accessibility standards"
      },
      {
        "name": "CSS",
        "experience": 2,
        "description": "Modern styling with flexbox, grid, and animations"
      }
    ]
  }
}
```

**Status Codes:**
- `200` - Skill found
- `404` - Skill not found
- `500` - Server error

---

### Profile Information

#### Get Profile Information

**GET** `/api/me`

Retrieve profile information from the info collection.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "6946e6673f00b5c4c4553b8a",
    "type": "profile",
    "firstName": "Sumit",
    "lastName": "C.",
    "headline": "Frontend Lead | Mobile/Web Apps",
    "summary": "Passionate developer with 2 years of experience crafting polished mobile and web applications.",
    "industry": "Software Development",
    "location": "Guwahati, Assam, India",
    "birthDate": "Nov 17",
    "website": "sumit.codes",
    "twitterHandles": []
  }
}
```

**Status Codes:**
- `200` - Profile found
- `404` - Profile not found
- `500` - Server error

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable

## CORS Configuration

The API is configured to accept requests from:
- `https://sumit.codes` (production)
- `http://localhost:3000` (development)

## Rate Limiting

Rate limiting is implemented to prevent abuse:
- Contact form: 5 requests per minute per IP
- App store APIs: 100 requests per minute per IP
- Experience APIs: 1000 requests per minute per IP
- Works APIs: 1000 requests per minute per IP
- Educations APIs: 1000 requests per minute per IP
- Certifications APIs: 1000 requests per minute per IP
- Skills APIs: 1000 requests per minute per IP
- Statistics API: 500 requests per minute per IP

## Caching

- **App store data**: 5 minutes cache to reduce external API calls
- **Statistics data**: 1 hour cache for performance
- **Works data**: Real-time with automatic app store enrichment
- **Educations, Certifications, Skills**: Real-time queries with optimized sorting

## Database Schema

**Database Usage:**
- **Works**: Explicitly uses `portfolio2` database
- **Other collections** (Experiences, Educations, Certifications, Skills, Info): Use the default database from connection (typically `portfolio` or as specified in connection string)

**Note:** The connection string may specify a different database name, which takes precedence over the hardcoded `portfolio` in connection.ts

### Works Collection

```typescript
interface Work {
  _id: string;
  name: string;
  description: {
    short: string;
    long: string;
  };
  icon?: string;
  category?: string;
  type: string; // e.g., "MULTI_PLATFORM", "MOBILE", "WEB"
  appStoreId?: string | null;
  playStoreId?: string | null;
  isInternal: boolean;
  featured: boolean;
  companyId?: string;
  technologies: string[];
  rating: number;
  screenshots: string[]; // Auto-enriched from app stores
  webUrls?: string[] | null;
  sourceCode?: string | null;
  googleGroupUrl?: string | null;
}
```

**Collection Name:** `works`

**Features:**
- Automatically enriched with app store data (screenshots, ratings, categories)
- Supports multiple platforms (iOS, Android, Web)
- Can be linked to companies via `companyId`

**Testing Phase:**
- `googleGroupUrl`: If not `null`, indicates the app is in testing phase
  - Frontend should show instructions to join the Google Group
  - After joining, users can access the app via Play Store (if `playStoreId` is available)
  - Set to `null` when the app becomes publicly available

### Companies/Experiences Collection

```typescript
interface Company {
  _id: string;
  name: string;
  role: string;
  workStart: string;
  workEnd?: string | null;
  location?: string;
  description: string;
  works?: string[]; // Array of work IDs
  logo?: string;
  website?: string;
  type?: string; // "FULL_TIME" | "PART_TIME" | "CONTRACT" | "FREELANCE"
  color?: string; // Theme color for UI
}
```

**Collection Name:** `companies` (as defined in code constants)

**Note:** The ExperienceService uses the `companies` collection name from constants. The actual MongoDB collection may be named `experiences` in the database, but the code queries using `companies`.

**Features:**
- Links to works via `works` array
- Optional `logo` and `website` fields (defined in TypeScript type but may not be present in all documents)
- Color coding for UI theming

### Educations Collection

```typescript
interface Education {
  _id: string; // ObjectId as string
  schoolName: string;
  startDate: string;
  endDate?: string | null;
  degreeName?: string;
  notes?: string;
  activities?: string;
}
```

**Collection Name:** `educations`

**Sorting:**
- Sorted by end date (most recent first)
- Ongoing educations prioritized

### Certifications Collection

```typescript
interface Certification {
  _id: string; // ObjectId as string
  name: string;
  issuer: string;
  date: string;
  credentialID?: string | null;
  link?: string;
  description?: string;
  expiryDate?: string | null;
}
```

**Collection Name:** `certifications`

**Sorting:**
- Sorted by date (most recent first)

### Skills Collection

```typescript
interface SkillCategory {
  _id: string; // ObjectId as string
  title: string;
  icon: string;
  skills: Array<{
    name: string;
    experience: number; // Years of experience
    description: string;
  }>;
}
```

**Collection Name:** `skills`

**Structure:**
- Skills are organized by categories
- Each category contains multiple skills
- Skills sorted by experience (highest first), then by name

### Info Collection

```typescript
interface Info {
  _id: string; // ObjectId as string
  type: string; // e.g., "profile"
  firstName: string;
  lastName: string;
  headline: string;
  summary: string;
  industry?: string;
  location?: string;
  birthDate?: string;
  website?: string;
  twitterHandles?: string[];
}
```

**Collection Name:** `info`

**Features:**
- Contains profile/personal information
- Accessed via `/api/me` endpoint
- Typically contains one document with `type: "profile"`

## External Dependencies

- **iTunes Search API**: For iOS App Store data
- **Google Play Scraper**: For Google Play Store data
- **MongoDB Atlas**: For data persistence
- **SMTP**: For email delivery

## Security Considerations

- Input validation on all endpoints
- Rate limiting to prevent abuse
- CORS configuration for allowed origins
- Environment variables for sensitive data
- Error messages don't expose internal details

## Monitoring and Logging

- Health check endpoint for monitoring
- Structured logging for debugging
- Error tracking and reporting
- Performance metrics

## Development Notes

- The backend uses Cloudflare Workers runtime
- Database connections are optimized for serverless (connections closed after each request)
- External API calls are cached to reduce latency
- All endpoints are async and handle errors gracefully
- Works are automatically enriched with app store data (screenshots, ratings, categories)
- Database queries have 5-second timeout protection
- All MongoDB ObjectIds are converted to strings in responses
- The API uses the `portfolio2` database

## Support

For issues or questions:
- Email: hi@sumit.codes
- Repository: [GitHub Link]