import mongoose from "mongoose";
import { Article } from "@/models/Article";
import { Feed } from "@/models/Feed";
import { getEnv } from "@/lib/env";

// Get validated environment variables
const env = getEnv();
const MONGODB_URI = env.MONGODB_URI;

// Parse MongoDB URI to extract components for modern connection
function parseMongoURI(uri: string) {
  try {
    // Handle special case for localhost without protocol
    if (uri.startsWith("localhost") || uri.match(/^\d+\.\d+\.\d+\.\d+/)) {
      uri = `mongodb://${uri}`;
    }

    const url = new URL(uri);
    const protocol = url.protocol;
    const hostname = url.hostname;
    const port = url.port ? parseInt(url.port) : 27017;
    const pathname = url.pathname.replace(/^\//, "");

    return {
      protocol,
      hostname,
      port,
      pathname,
      username: url.username,
      password: url.password,
    };
  } catch (error) {
    console.error("Invalid MongoDB URI format:", error);
    return null;
  }
}

const cached: {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
} = { conn: null, promise: null };

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    // Use modern connection options
    const parsedURI = parseMongoURI(MONGODB_URI);

    if (parsedURI) {
      const connectionOptions: mongoose.ConnectOptions = {
        bufferCommands: false,
        dbName: parsedURI.pathname || "rss_project",
      };

      // Use modern connection approach
      if (
        MONGODB_URI.includes("mongodb+srv") ||
        MONGODB_URI.includes("mongodb://")
      ) {
        // Use the URI directly for standard connection strings
        cached.promise = mongoose.connect(MONGODB_URI, connectionOptions);
      } else {
        // Build connection using individual components
        const { hostname, port, username, password } = parsedURI;
        const auth = username && password ? `${username}:${password}@` : "";
        const uri = `mongodb://${auth}${hostname}:${port}/${
          parsedURI.pathname || "rss_project"
        }`;
        cached.promise = mongoose.connect(uri, connectionOptions);
      }
    } else {
      // Fallback to direct connection
      cached.promise = mongoose.connect(MONGODB_URI, {
        bufferCommands: false,
      });
    }
  }

  try {
    cached.conn = await cached.promise;
    console.log("MongoDB connected successfully");
  } catch (e) {
    cached.promise = null;
    console.error("MongoDB connection error:", e);
    throw e;
  }

  return cached.conn;
}

export { Article, Feed };
export default connectToDatabase;
