/**
 * Database Configuration & Mongoose Connection Manager
 * VulnX - Web-Based Automated VAPT Platform
 */

import mongoose from 'mongoose';

export interface DbStatus {
  connected: boolean;
  uri: string;
  host?: string;
  database?: string;
  error?: string;
  lastAttempt: string;
}

const DEFAULT_MONGO_URI = 'mongodb://localhost:27017/VulnX';

export let dbStatus: DbStatus = {
  connected: false,
  uri: process.env.MONGO_URI || DEFAULT_MONGO_URI,
  lastAttempt: new Date().toISOString()
};

export const connectDB = async (): Promise<boolean> => {
  const mongoUri = process.env.MONGO_URI || DEFAULT_MONGO_URI;

  dbStatus.lastAttempt = new Date().toISOString();

  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    dbStatus = {
      connected: true,
      uri: mongoUri.replace(
        /:\/\/([^:]+):([^@]+)@/,
        '://$1:****@'
      ),
      host: conn.connection.host,
      database: conn.connection.name,
      lastAttempt: new Date().toISOString()
    };

    console.log(
      `[VulnX DB] Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`
    );

    return true;

  } catch (err: any) {

    dbStatus = {
      connected: false,
      uri: mongoUri.replace(
        /:\/\/([^:]+):([^@]+)@/,
        '://$1:****@'
      ),
      error: err.message || 'Failed to connect to MongoDB',
      lastAttempt: new Date().toISOString()
    };

    console.error(
      `[VulnX DB] MongoDB connection failed: ${err.message}`
    );

    return false;
  }
};

mongoose.connection.on('connected', () => {
  console.log('[VulnX DB] MongoDB connection established.');
});

mongoose.connection.on('disconnected', () => {
  dbStatus.connected = false;
  console.log('[VulnX DB] MongoDB disconnected.');
});

mongoose.connection.on('error', (error) => {
  dbStatus.connected = false;
  console.error('[VulnX DB] MongoDB error:', error.message);
});

export default connectDB;