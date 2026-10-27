import dns from 'node:dns';

dns.setServers(['8.8.8.8']);

await import('./server.js');
