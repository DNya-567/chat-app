const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Chat Application API",
      version: "1.0.0",
      description: "Real-time chat application API with user authentication, messaging, and reactions",
      contact: {
        name: "Chat App Support",
        email: "support@chatapp.com",
      },
      license: {
        name: "ISC",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
      {
        url: "https://api.chatapp.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtained from login endpoint",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
              description: "MongoDB user ID",
            },
            username: {
              type: "string",
              example: "john123",
              description: "Unique username (3-30 alphanumeric characters)",
            },
            email: {
              type: "string",
              example: "john@example.com",
              description: "User email address",
            },
            avatar: {
              type: "string",
              example: "https://cloudinary.com/avatar.jpg",
              description: "Avatar image URL",
            },
          },
        },
        Chat: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439013",
              description: "Chat ID",
            },
            participants: {
              type: "array",
              items: {
                $ref: "#/components/schemas/User",
              },
              description: "Array of users in the chat",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2024-01-27T10:30:00Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2024-01-27T10:30:00Z",
            },
          },
        },
        Message: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439015",
              description: "Message ID",
            },
            chatId: {
              type: "string",
              example: "507f1f77bcf86cd799439013",
              description: "Chat ID this message belongs to",
            },
            sender: {
              type: "object",
              properties: {
                _id: { type: "string" },
                username: { type: "string" },
                avatar: { type: "string" },
              },
            },
            text: {
              type: "string",
              example: "Hello! How are you?",
              description: "Message content (1-5000 characters)",
            },
            reactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  emoji: { type: "string" },
                  userId: { type: "string" },
                },
              },
              description: "Array of emoji reactions",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        ValidationError: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Validation failed",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                    example: "email",
                  },
                  message: {
                    type: "string",
                    example: "Email must be a valid email address",
                  },
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Error message",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
