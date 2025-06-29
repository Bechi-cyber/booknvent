/**
 * Simple MongoDB Connection Test
 * 
 * Tests basic connection to MongoDB Atlas
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testConnection() {
  console.log('🔄 Testing MongoDB Atlas Connection...\n');
  
  const uri = process.env.MONGODB_URI;
  console.log('Connection URI:', uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
  
  // Try different connection configurations
  const configs = [
    {
      name: 'Standard Config',
      options: {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 10000,
        maxPoolSize: 1
      }
    },
    {
      name: 'With TLS Config',
      options: {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 10000,
        maxPoolSize: 1,
        tls: true,
        tlsInsecure: false
      }
    },
    {
      name: 'Minimal Config',
      options: {
        serverSelectionTimeoutMS: 15000
      }
    }
  ];

  for (const config of configs) {
    console.log(`\n--- Trying ${config.name} ---`);
    const client = new MongoClient(uri, config.options);

    try {
      console.log('Attempting to connect...');
      await client.connect();
      console.log('✅ Connected to MongoDB Atlas!');

      // Test database access
      const db = client.db(process.env.MONGODB_DB_NAME || 'lesavot_db');
      console.log(`✅ Accessed database: ${db.databaseName}`);

      // Test admin command
      const adminDb = client.db().admin();
      const result = await adminDb.ping();
      console.log('✅ Ping successful:', result);

      // List collections
      const collections = await db.listCollections().toArray();
      console.log(`📁 Found ${collections.length} collections`);

      // Test creating a simple document
      const testCollection = db.collection('connection_test');
      const testDoc = {
        message: 'Connection test successful',
        timestamp: new Date(),
        nodeVersion: process.version,
        config: config.name
      };

      const insertResult = await testCollection.insertOne(testDoc);
      console.log('✅ Test document inserted:', insertResult.insertedId);

      // Read the document back
      const foundDoc = await testCollection.findOne({ _id: insertResult.insertedId });
      console.log('✅ Test document retrieved:', foundDoc.message);

      // Clean up test document
      await testCollection.deleteOne({ _id: insertResult.insertedId });
      console.log('✅ Test document cleaned up');

      console.log(`\n🎉 MongoDB Atlas connection test successful with ${config.name}!`);
      await client.close();
      return; // Exit on first successful connection

    } catch (error) {
      console.error(`❌ ${config.name} failed:`, error.message);
      if (error.cause) {
        console.error('Underlying cause:', error.cause.message);
      }
    } finally {
      await client.close();
    }
  }

  console.log('\n❌ All connection attempts failed');
}

// Run the test
testConnection().catch(console.error);
