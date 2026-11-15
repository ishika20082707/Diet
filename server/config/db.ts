import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer: MongoMemoryServer | null = null;

export async function connectDB(): Promise<void> {
  const configuredUri = process.env.MONGO_URI?.trim();
  const useConfigured =
    configuredUri &&
    !configuredUri.includes('MY_') &&
    configuredUri.startsWith('mongodb');

  if (useConfigured) {
    try {
      await mongoose.connect(configuredUri, {
        serverSelectionTimeoutMS: 4000,
      });
      console.log(`MongoDB connected: ${mongoose.connection.host}`);
      return;
    } catch (err) {
      console.warn(
        'Configured MONGO_URI unreachable, falling back to embedded MongoMemoryServer:',
        (err as Error).message
      );
    }
  }

  memoryServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'verdant_bowl',
    },
  });
  const uri = memoryServer.getUri();
  await mongoose.connect(uri);
  console.log(`MongoDB Memory Server running at ${uri}`);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
