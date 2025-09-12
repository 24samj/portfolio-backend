# Portfolio Backend API

A Cloudflare Workers-based backend API for the portfolio website, built with Hono framework and MongoDB.

## Overview

This backend serves as the API layer for the portfolio frontend, handling:
- Experience/company data management
- App store data fetching (iOS App Store + Google Play Store)
- Contact form email processing
- Closed testing app management
- Statistics and calculations
- Database operations

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

**GET** `/health`

Check the health status of the API and its dependencies.

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

### Experiences

#### Get All Experiences

**GET** `/experiences`

Retrieve all work experiences/companies from the database.

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "company_id_1",
      "name": "Company Name",
      "role": "Software Engineer",
      "workStart": "2023-01-01",
      "workEnd": null,
      "location": "Remote",
      "highlights": ["Built scalable APIs", "Led team of 5"],
      "description": "Worked on...",
      "technologies": ["React", "Node.js", "MongoDB"],
      "color": "#8b5cf6",
      "type": "FULL_TIME",
      "appStoreApps": ["123456789"],
      "playStoreApps": ["com.example.app"],
      "webApps": ["https://example.com"]
    }
  ]
}
```

#### Get Experience by ID

**GET** `/experiences/{id}`

Retrieve a specific work experience by ID.

**Parameters:**
- `id` (string) - The experience ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "company_id_1",
    "name": "Company Name",
    "role": "Software Engineer",
    // ... other fields
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

**GET** `/apps/app-store/{id}`

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

**GET** `/apps/play-store/{id}`

Fetch Google Play Store app data by package name.

**Parameters:**
- `id` (string) - Play Store package name

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "com.example.app",
    "name": "App Name",
    "description": "App description...",
    "summary": "App summary...",
    "icon": "https://play-lh.googleusercontent.com/...",
    "screenshots": ["https://...", "https://..."],
    "playStoreUrl": "https://play.google.com/store/apps/...",
    "version": "1.0.0",
    "rating": 4.3,
    "ratingCount": 5678,
    "installs": "10,000+",
    "price": 0,
    "free": true,
    "developer": "Developer Name",
    "category": "Productivity",
    "releaseDate": "2024-01-01",
    "size": "50 MB",
    "androidVersion": "5.0",
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

**POST** `/contact`

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

### Closed Tests

#### Get All Closed Tests

**GET** `/closed-tests`

Retrieve all apps currently in closed testing.

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "test_id_1",
      "appName": "FrameFight",
      "packageName": "codes.sumit.framefight",
      "description": "A photo editing app for creating stunning frames",
      "icon": "https://play-lh.googleusercontent.com/...",
      "googleGroup": "framefight-testers@googlegroups.com",
      "playStoreUrl": "https://play.google.com/store/apps/details?id=codes.sumit.framefight",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T00:00:00Z"
    }
  ]
}
```

#### Get Closed Test by ID

**GET** `/closed-tests/{id}`

Retrieve detailed information about a specific closed test.

**Parameters:**
- `id` (string) - The closed test ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "test_id_1",
    "appName": "FrameFight",
    "packageName": "codes.sumit.framefight",
    "description": "A photo editing app for creating stunning frames",
    "icon": "https://play-lh.googleusercontent.com/...",
    "googleGroup": "framefight-testers@googlegroups.com",
    "playStoreUrl": "https://play.google.com/store/apps/details?id=codes.sumit.framefight",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T00:00:00Z"
  }
}
```

#### Check App Testing Status

**GET** `/closed-tests/check/{packageName}`

Check if an app is currently in closed testing by attempting to fetch its Play Store data.

**Parameters:**
- `packageName` (string) - The app's package name (e.g., "codes.sumit.framefight")

**Response:**
```json
{
  "success": true,
  "isInClosedTesting": true,
  "appData": {
    "name": "FrameFight",
    "packageName": "codes.sumit.framefight",
    "isAvailable": false,
    "error": "App not found or in closed testing"
  }
}
```

**Status Codes:**
- `200` - Check completed
- `404` - App not found
- `500` - Server error

---

### Statistics

#### Get Portfolio Statistics

**GET** `/stats`

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
- Closed tests APIs: 200 requests per minute per IP
- Statistics API: 500 requests per minute per IP

## Caching

- **App store data**: 5 minutes cache to reduce external API calls
- **Statistics data**: 1 hour cache for performance
- **Closed tests data**: 30 minutes cache with real-time updates

## Database Schema

### Companies Collection

```typescript
interface Company {
  _id: string;
  name: string;
  role: string;
  workStart: string;
  workEnd: string | null;
  location: string;
  highlights: string[];
  description: string;
  technologies: string[];
  color: string;
  type: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "FREELANCE";
  appStoreApps: string[] | null;
  playStoreApps: string[] | null;
  webApps: string[] | null;
}
```

### Closed Tests Collection

```typescript
interface ClosedTest {
  _id: string;
  appName: string;
  packageName: string;
  description: string;
  icon: string;
  googleGroup: string;
  playStoreUrl: string;
  isActive: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
```

**Collection Name:** `closed_tests`

**Indexes:**
- `packageName` (unique) - For quick lookups by package name
- `isActive` - For filtering active tests
- `createdAt` - For sorting by creation date

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
- Database connections are optimized for serverless
- External API calls are cached to reduce latency
- All endpoints are async and handle errors gracefully

## Closed Testing Detection

The system automatically detects if an app is in closed testing by:

1. **Attempting to fetch app data** using the Google Play Scraper
2. **Checking the response**:
   - If successful: App is publicly available
   - If error/empty: App is likely in closed testing
3. **Updating database** with the current status
4. **Providing appropriate instructions** based on testing status

This allows the system to automatically manage which apps show up in the closed tests section without manual intervention.

## Support

For issues or questions:
- Email: hi@sumit.codes
- Repository: [GitHub Link]