
import dns from 'node:dns';
import mongoose from 'mongoose';

// Ensure IPv4 is prioritized for stable MongoDB Atlas SRV connectivity
if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
}

// Robust public resolver fallback for querySrv ECONNREFUSED resilience
try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (dnsErr) {
    console.warn('[MongoDB] Custom DNS setServers skipped, using system DNS:', dnsErr.message);
}

mongoose.set('bufferCommands', false);

export async function connectDB() {
    try {
        console.log('[MongoDB] Starting connection...');

        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
        });

        console.log('[MongoDB] Connection state:', mongoose.connection.readyState);
        console.log('[MongoDB] Host:', mongoose.connection.host);
        console.log('[MongoDB] Database:', mongoose.connection.name);
    } catch (error) {
        console.error('[MongoDB] Connection failed:', error.message);
        throw error;
    }
}
