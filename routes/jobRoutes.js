const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const router = express.Router();

// Set up multer to handle file uploads
const upload = multer({ dest: 'uploads/' });

// POST endpoint to upload resume
router.post("/upload", upload.single("resume"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
    }

    const resumePath = req.file.path;
    console.log("Resume uploaded:", resumePath);

    try {
        const recommendedJobs = await getRecommendedJobs(resumePath);
        res.json({ jobs: recommendedJobs });
    } catch (error) {
        console.error("Error in job recommendation:", error);
        res.status(500).json({ error: error.message });
    }
});

// Function to call Python script and get job recommendations
function getRecommendedJobs(resumePath) {
    return new Promise((resolve, reject) => {
        const python = spawn("python", ["scripts/job_Recommendation.py", resumePath]);

        python.stdout.on("data", (data) => {
            const jobRecommendations = JSON.parse(data.toString());
            resolve(jobRecommendations);
        });

        python.stderr.on("data", (data) => {
            console.error("Python script error:", data.toString());
            reject(data.toString());
        });
    });
}

module.exports = router;
