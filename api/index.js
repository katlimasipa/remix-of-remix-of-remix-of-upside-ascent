
import { toNodeHandler } from 'srvx/node';
import serverEntry from '../dist/server/assets/server-Nxdwz_RJ.js';

// Replicate the error wrapping from src/server.ts if needed, 
// but for now let's just bridge the core handler.
export default toNodeHandler(serverEntry.fetch || serverEntry.default?.fetch || serverEntry);
