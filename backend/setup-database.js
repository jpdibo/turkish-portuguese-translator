const { initializeDatabase, importWords } = require('./database');

async function setupDatabase() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    
    console.log('Importing words...');
    const count = await importWords();
    
    console.log(`✅ Database setup complete! Imported ${count} words.`);
    console.log('Your Turkish-Portuguese translator is ready to use!');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase(); 