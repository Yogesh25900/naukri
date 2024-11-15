const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
require('dotenv').config(); // Load environment variables from .env

const app = express();
app.use(cors());

const corsOptions = {
  origin: 'http://localhost:5500', // Replace with your frontend URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));
const port = process.env.PORT || 5000;

// PostgreSQL database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD ,
  port: process.env.DB_PORT
});

// Create the uploads folder if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Set up multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Save file in the "uploads" folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only PDF files are allowed.'));
    }
    cb(null, true);
  },
});

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Serve static files from the "uploads" directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Define the route for handling file upload
app.post('/upload', upload.single('resume'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const resumePath = req.file.path;
  console.log('Resume uploaded:', resumePath);

  const pythonScriptPath = path.join(__dirname, 'scripts', 'extract_skills.py');

  // Run the Python script to extract skills
  const python = spawn('python', [pythonScriptPath, resumePath]);

  let stdout = '';
  let stderr = '';

  python.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  python.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  python.on('close', (code) => {
    if (code !== 0) {
      console.error('Python script error:', stderr);
      return res.status(500).json({ error: 'Error extracting skills.' });
    }

    try {
      const extractedSkills = JSON.parse(stdout);

      // Save extracted skills to PostgreSQL (Commented out)
      
      pool.query(
        'INSERT INTO extracted_skills (resume_path, skills) VALUES ($1, $2)',
        [resumePath, JSON.stringify(extractedSkills.skills)],
        (dbErr, dbRes) => {
          if (dbErr) {
            console.error('Error saving skills to database:', dbErr);
          } else {
            console.log('Skills saved to database:', dbRes.rowCount);
          }
        }
      );
      
      console.log('Responding with:', extractedSkills.skills);

      res.json({
        message: 'File uploaded and skills extracted successfully!',
        skills: extractedSkills.skills, // Return the extracted skills
      });
    } catch (parseError) {
      console.error('Error parsing Python script output:', parseError);
      res.status(500).json({ error: 'Error parsing Python script output.' });
    }
  });
}); // Close the route handler properly

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
