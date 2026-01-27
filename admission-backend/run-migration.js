const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const sql = fs.readFileSync(
      path.join(__dirname, 'add-meeting-link-type.sql'),
      'utf8'
    );

    await client.query(sql);
    console.log('✅ Migration completed successfully!');
    console.log('✅ MEETING_LINK type added to MessageType enum');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
