// This file acts as the single source of truth for all database-related types.

// 1. Import the generated types from the new types file
import { Database as DB } from './lib/database.types';

// 2. Re-export the Database interface
export type Database = DB;
