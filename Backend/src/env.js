// to load the environment variables at very start while importing, we have created this separate file
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if(process.env.NODE_ENV != "production") { 
    dotenv.config({ path: join(__dirname, '../.env') });
}

export default dotenv;