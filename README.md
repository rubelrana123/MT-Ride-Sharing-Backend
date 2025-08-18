# MyTrip Ride Sharing Backend

MyTrip Ride Sharing Backend is a RESTful API service for managing ride sharing operations, including user authentication, ride requests, driver management, and trip tracking.

## Features

- User registration and authentication (JWT)
- Ride request and matching system
- Driver and rider management
- Trip status tracking (requested, accepted, completed, cancelled)
- RESTful API endpoints
- MongoDB database support

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Mongoose

### Installation

```bash
git clone https://github.com/yourusername/MyTrip-Ride-Sharing-Backend.git
cd MyTrip-Ride-Sharing-Backend
npm install
```

### Configuration

Create a `.env` file in the root directory and set the following variables:

```env
PORT=5000
DB_URI=your_database_uri
JWT_SECRET=your_jwt_secret
```

### Running the Server

```bash
npm run dev
```
# API Endpoints Documentation

## Authentication
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/logout` - User logout

## User Routes (`/api/v1/users`)
| Method | Endpoint               | Description                              | Access Control               |
|--------|------------------------|------------------------------------------|------------------------------|
| POST   | `/create`              | Create a new user                        | Public                       |
| GET    | `/all-users`           | Get all users                            | ADMIN, SUPER_ADMIN           |
| GET    | `/me`                  | Get current user profile                 | All authenticated users      |
| GET    | `/:userId`             | Get single user by ID                    | ADMIN, SUPER_ADMIN           |
| PATCH  | `/:userId`             | Update user information                  | All authenticated users      |
| DELETE | `/:userId`             | Delete user                              | ADMIN, SUPER_ADMIN           |

## Ride Routes (`/api/v1/rides`)
| Method | Endpoint                     | Description                              | Access Control |
|--------|------------------------------|------------------------------------------|----------------|
| POST   | `/request`                   | Request a new ride                       | RIDER          |
| GET    | `/`                          | Get all rides                            | ADMIN, SUPER_ADMIN |
| GET    | `/history`                   | View ride history                        | RIDER          |
| GET    | `/earnings`                  | View earnings history                    | DRIVER         |
| PATCH  | `/:rideId/status`            | Update ride status                       | DRIVER         |
| PATCH  | `/:rideId/cancel`            | Cancel a ride                            | RIDER          |

## Driver Routes (`/api/v1/drivers`)
| Method | Endpoint                                     | Description                              | Access Control       |
|--------|----------------------------------------------|------------------------------------------|----------------------|
| POST   | `/apply-driver`                              | Apply to become a driver                 | RIDER                |
| GET    | `/driver-application`                        | Get all driver applications              | ADMIN, SUPER_ADMIN   |
| GET    | `/driver`                                    | Get all approved drivers                 | ADMIN, SUPER_ADMIN   |
| PATCH  | `/driver-application/:applicationId/status`  | Update driver application status         | ADMIN, SUPER_ADMIN   |
| PATCH  | `/:driverId/availability`                    | Update driver availability status        | DRIVER               |

## Notes
- All endpoints require JWT authentication unless marked as "Public"
- Authorization is role-based as specified in the "Access Control" column
- Request validation is implemented for all relevant endpoints