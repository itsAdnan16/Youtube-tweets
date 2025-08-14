# YouTube and Tweets Backend API

A comprehensive backend API for a YouTube-like video platform with social features, built using Node.js, Express, and MongoDB.

## 🚀 Features

### User Management
- User registration and authentication
- JWT-based authentication with access and refresh tokens
- Password hashing with bcrypt
- User profile management (avatar, cover image, account details)
- Watch history tracking

### Video Management
- Video upload and publishing
- Thumbnail management
- Video metadata (title, description, duration)
- View counting
- Video status toggling (published/unpublished)
- Pagination and search functionality

### Social Features
- User subscriptions and channel management
- Comment system on videos
- User channel profiles with subscriber counts
- Subscription management (subscribe/unsubscribe)

### File Management
- Cloudinary integration for media uploads
- Support for video files and images
- Automatic file cleanup after upload

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer + Cloudinary
- **Password Hashing**: bcryptjs
- **Validation**: Mongoose validation + custom error handling

## 📁 Project Structure

```
src/
├── config/
│   └── env.config.js          # Environment configuration
├── controller/
│   ├── user.controller.js      # User management logic
│   ├── video.controller.js     # Video management logic
│   ├── comment.controller.js   # Comment management logic
│   └── subscription.controller.js # Subscription management logic
├── db/
│   └── index.js               # Database connection
├── middlewares/
│   ├── auth.middleware.js     # JWT authentication
│   └── multer.middleware.js   # File upload handling
├── models/
│   ├── user.model.js          # User schema and methods
│   ├── video.model.js         # Video schema
│   ├── comment.model.js       # Comment schema
│   └── subscription.model.js  # Subscription schema
├── routes/
│   ├── user.routes.js         # User endpoints
│   ├── video.routes.js        # Video endpoints
│   ├── comment.routes.js      # Comment endpoints
│   └── subscription.routes.js # Subscription endpoints
├── utils/
│   ├── ApiError.js            # Custom error class
│   ├── ApiResponse.js         # Standardized response format
│   ├── asyncHandler.js        # Async error handling wrapper
│   └── cloudinary.js          # Cloudinary integration
├── app.js                     # Express app configuration
├── constants.js               # Application constants
└── index.js                   # Server entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Cloudinary account for media storage

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd YoutubeAndTweets
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Server Configuration
   PORT=8000
   NODE_ENV=development
   
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017
   
   # JWT Configuration
   ACCESS_TOKEN_SECRET=your_secure_access_token_secret
   REFRESH_TOKEN_SECRET=your_secure_refresh_token_secret
   ACCESS_TOKEN_EXPIRY=1d
   REFRESH_TOKEN_EXPIRY=10d
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:8000`

## 📚 API Endpoints

### Authentication Routes (`/api/v1/users`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /refresh` - Refresh access token
- `POST /change-password` - Change password (protected)
- `GET /current-user` - Get current user info (protected)
- `PATCH /update-account` - Update account details (protected)
- `PATCH /update-avatar` - Update avatar (protected)
- `PATCH /update-cover-image` - Update cover image (protected)
- `GET /c/:username` - Get user channel profile (protected)
- `GET /watch-history` - Get user watch history (protected)

### Video Routes (`/api/v1/videos`)
- `GET /` - Get all published videos (public)
- `POST /` - Upload and publish video (protected)
- `GET /:videoId` - Get video by ID (protected)
- `PATCH /:videoId` - Update video (protected)
- `DELETE /:videoId` - Delete video (protected)
- `PATCH /:videoId/toggle-status` - Toggle video status (protected)

### Comment Routes (`/api/v1/comments`)
- `GET /:videoId` - Get video comments (public)
- `POST /:videoId` - Add comment (protected)
- `PATCH /:commentId` - Update comment (protected)
- `DELETE /:commentId` - Delete comment (protected)

### Subscription Routes (`/api/v1/subscriptions`)
- `POST /toggle/:channelId` - Toggle subscription (protected)
- `GET /subscribers/:channelId` - Get channel subscribers (protected)
- `GET /subscribed` - Get subscribed channels (protected)

## 🔐 Authentication

The API uses JWT-based authentication with the following flow:

1. **Login/Register**: User receives access and refresh tokens
2. **Protected Routes**: Include `Authorization: Bearer <token>` header or use cookies
3. **Token Refresh**: Use refresh token to get new access token when expired

## 📁 File Upload

### Supported Formats
- **Videos**: MP4, AVI, MOV, etc.
- **Images**: JPG, PNG, GIF, etc.

### Upload Process
1. Files are temporarily stored locally using Multer
2. Uploaded to Cloudinary for permanent storage
3. Local files are automatically cleaned up
4. Cloudinary URLs are stored in the database

## 🗄️ Database Models

### User Model
- Basic info (username, email, fullName, password)
- Media (avatar, coverImage)
- Watch history tracking
- JWT token management

### Video Model
- Media files (videoFile, thumbnail)
- Metadata (title, description, duration)
- Statistics (views, isPublished)
- Owner reference

### Comment Model
- Content and video reference
- Owner information
- Timestamps

### Subscription Model
- Subscriber and channel references
- Timestamps for subscription tracking

## 🚨 Error Handling

The API includes comprehensive error handling:

- **Custom Error Classes**: `ApiError` and `ApiResponse`
- **Global Error Middleware**: Catches and formats all errors
- **Validation Errors**: Mongoose validation with custom messages
- **JWT Errors**: Token validation and expiration handling
- **File Upload Errors**: Cloudinary integration error handling

## 🧪 Testing

To test the API endpoints:

1. **Start the server**: `npm run dev`
2. **Use Postman or similar tool** to test endpoints
3. **Test authentication flow**:
   - Register a user
   - Login to get tokens
   - Use tokens for protected routes

## 🔧 Development

### Scripts
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (to be implemented)

### Code Style
- ES6+ syntax
- Async/await pattern
- Consistent error handling
- Middleware-based architecture

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8000 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | localhost:27017 |
| `ACCESS_TOKEN_SECRET` | JWT access token secret | - |
| `REFRESH_TOKEN_SECRET` | JWT refresh token secret | - |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | - |
| `CLOUDINARY_API_KEY` | Cloudinary API key | - |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | - |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:3000 |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Adnan Hasan**

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the error logs

---

**Note**: This is a backend API. You'll need a frontend application to interact with these endpoints.
