# MyTrip Ride Sharing Backend

MyTrip Ride Sharing Backend is a RESTful API service for managing ride sharing operations, including user authentication, ride requests, driver management, and trip tracking.
## Useful Links

- **Live Server:** [https://mytrip-ride-sharing-backend.example.com](https://mytrip-ride-sharing-backend.example.com)
- **Postman Documentation:** [https://documenter.getpostman.com/view/your-doc-id/MyTrip-Ride-Sharing-API](https://documenter.getpostman.com/view/your-doc-id/MyTrip-Ride-Sharing-API)
- **Video Explanation:** [YouTube - MyTrip Backend Overview](https://youtu.be/your-video-id)
## Features

🔒 **JWT Authentication** with role-based access (Admin, Driver, Rider)  
🚗 **Ride Management** - Request, track, and cancel rides  
👤 **User Profiles** - Personal and driver accounts  
💰 **Earnings Tracking** - For drivers  
📊 **Admin Dashboard** - Manage users, drivers, and rides  
🔐 **Security** - Bcrypt password hashing, request validation  

Built with a modular architecture following RESTful principles.

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
| Method | Endpoint           | Description              | Access Control |
|--------|--------------------|--------------------------|----------------|
| POST   | `/signup`          | User registration        | Public         |
| POST   | `/login`           | User login               | Public         |
| POST   | `/refresh-token`   | Refresh access token     | Authenticated  |
| POST   | `/logout`          | User logout              | Authenticated  |

## User Management (`/users`)
| Method | Endpoint          | Description                     | Access Control       |
|--------|-------------------|---------------------------------|----------------------|
| POST   | `/create`         | Create new user                 | Public               |
| GET    | `/all-users`      | List all users                  | ADMIN, SUPER_ADMIN   |
| GET    | `/me`             | Get current user profile        | All roles            |
| GET    | `/:userId`        | Get specific user               | ADMIN, SUPER_ADMIN   |
| PATCH  | `/:userId`        | Update user information         | Owner/Admin          |
| DELETE | `/:userId`        | Delete user                     | ADMIN, SUPER_ADMIN   |

## Ride Management (`/rides`)
| Method | Endpoint            | Description                     | Access Control |
|--------|---------------------|---------------------------------|----------------|
| POST   | `/request`          | Request new ride                | RIDER          |
| GET    | `/`                 | List all rides                  | ADMIN          |
| GET    | `/history`          | View ride history               | RIDER          |
| GET    | `/earnings`         | View driver earnings            | DRIVER         |
| PATCH  | `/:rideId/status`   | Update ride status              | DRIVER         |
| PATCH  | `/:rideId/cancel`   | Cancel ride                     | RIDER          |

## Driver Management (`/drivers`)
| Method | Endpoint                          | Description                     | Access Control       |
|--------|-----------------------------------|---------------------------------|----------------------|
| POST   | `/apply-driver`                   | Apply as driver                 | RIDER                |
| GET    | `/driver-application`             | List driver applications        | ADMIN, SUPER_ADMIN   |
| GET    | `/driver`                         | List approved drivers           | ADMIN, SUPER_ADMIN   |
| PATCH  | `/driver-application/:id/status`  | Update application status       | ADMIN, SUPER_ADMIN   |
| PATCH  | `/:driverId/availability`         | Update availability status      | DRIVER               |

## Analytics (`/analytics`)
| Method | Endpoint  | Description                     | Access Control       |
|--------|-----------|---------------------------------|----------------------|
| GET    | `/stats`  | Get platform analytics          | ADMIN, SUPER_ADMIN   |

## Key Features
🔐 **Secure Authentication** - JWT with role-based access  
📊 **Comprehensive Analytics** - Platform statistics for admins  
🚕 **Ride Lifecycle** - Full ride management from request to completion  
👤 **Role-Specific Features** - Tailored functionality for each user type  
⚙️ **Admin Controls** - User and driver management  

> **Note**: All endpoints require JWT authentication unless marked as "Public".  
> Request validation and error handling are implemented throughout the API.
    
```

## 🗂️ Project Structure
The project follows a modular architecture to keep the codebase clean, scalable, and easy to maintain.

```
🗂️ src/
├── app.ts                      # Creates and configures the Express application
├── server.ts                   # Connects to the database and starts the server
│
├── app/
│   ├── modules/
│   │   ├── auth/               # Handles authentication logic
│   │   ├── user/               # Handles user management logic
│   │   ├── driver/             # Handles driver-specific logic
│   │   ├── ride/               # Handles ride management logic
│   │   └── analytics/          # Handles data analytics for admins
│   │
│   ├── middlewares/            # Contains global middlewares
│   ├── utils/                  # Contains shared utility functions
│   └── config/                 # Contains environment variables and config
│
├── errorHelpers/               # Contains the custom AppError class
│   └── AppError.ts
│
├── helpers/                    # Contains specific error handling functions
│   ├── handleCastError.ts
│   ├── handleDuplicateError.ts
│   ├── handleValidationError.ts
│   └── handleZodError.ts
│
└── ...                         # Other directories as needed

```

<br> </br>