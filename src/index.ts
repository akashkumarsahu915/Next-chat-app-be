import "dotenv/config";
import express, { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import healthRoutes from './routes/health.routes';
import connectDB from './config/db/connect';


import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.routes";
import friendRequestRoutes from "./routes/Friend.request.route";
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Swagger Configuration
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Next Chat API",
      version: "1.0.0",
      description: "Fully functional Node.js TypeScript backend for Next Chat",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },

  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
// Routes
app.use('/health', healthRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/friend-request", friendRequestRoutes);
// Default Route
app.get('/', (req: Request, res: Response) => {
  res.redirect('/api-docs');
});


// Start Server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
      console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    });

  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();
