const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function diagnose() {
    console.log('🔍 DIAGNOSING UPLOAD ISSUE...\n');
    
    // Check database
    try {
        await mongoose.connect('mongodb://localhost:27017/ai-evaluation');
        console.log('✅ Database connected');
        
        const File = require('./models/File');
        const files = await File.find();
        console.log(`📊 Files in database: ${files.length}`);
        
        files.forEach(file => {
            console.log(`   - ${file.filename} (${file.filePath})`);
        });
    } catch (error) {
        console.log('❌ Database error:', error.message);
    }
    
    // Check uploads directory
    const uploadsDir = path.join(__dirname, 'uploads');
    console.log(`\n📁 Uploads directory: ${uploadsDir}`);
    
    if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        console.log(`💾 Files on disk: ${files.length}`);
        files.forEach(file => {
            console.log(`   - ${file}`);
        });
    } else {
        console.log('❌ Uploads directory does not exist');
    }
    
    process.exit();
}

diagnose();