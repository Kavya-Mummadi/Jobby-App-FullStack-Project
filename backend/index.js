const express = require("express");
const path = require("path");

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json())

const cors = require('cors');
app.use(cors({
    origin: '*', // This allows all origins (easiest for testing deployment)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
const dbPath = path.join(__dirname, "jobbyApp.db");

let db = null;

const initializeDBAndServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        })

        // Use the port Render gives you, or 5000 for local testing
        const port = process.env.PORT || 5000;

        app.listen(port, () => {
            console.log(`Server Running at Port ${port}`);
        });

    } catch (e) {
        console.log(`DB Error: ${e.message}`)
        process.exit(1)
    }
}

initializeDBAndServer()

const authenticateToken = (request, response, next) => {
    let jwtToken;
    const authHeader = request.headers["authorization"];
    if (authHeader !== undefined) {
        jwtToken = authHeader.split(" ")[1];
    }
    if (jwtToken === undefined) {
        response.status(401);
        response.send("Invalid JWT Token");
    } else {
        jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
            if (error) {
                response.status(401);
                response.send("Invalid JWT Token");
            } else {
                request.user = payload;
                next();
            }
        });
    }
};

app.post("/signup", async (request, response) => {
    const { name, email, password, phone_number, bio } = request.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user exists using parameterized query for security
    const selectUserQuery = `SELECT * FROM users WHERE email = ?`;
    const dbUser = await db.get(selectUserQuery, [email]);

    if (dbUser === undefined) {
        const createUserQuery = `
            INSERT INTO 
                users (name, email, password, phone_number, short_bio) 
            VALUES (?, ?, ?, ?, ?)`;

        await db.run(createUserQuery, [name, email, hashedPassword, phone_number, bio]);

        // ADD THIS: Send a success response
        response.status(201).send({ message: "User created successfully" });
    } else {
        response.status(400).send({ error_msg: "User already exists" });
    }
});


app.post("/login", async (request, response) => {
    const { name, email, password } = request.body;
    const selectUserQuery = `SELECT * FROM users WHERE name = '${name}' AND email='${email}'`;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
        response.status(400);
        response.send("Invalid User");
    } else {
        const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
        if (isPasswordMatched === true) {
            const payload = {
                id: dbUser.id,
                name: name
            };
            const jwt_token = jwt.sign(payload, "MY_SECRET_TOKEN");
            response.send({ jwt_token });
        } else {
            response.status(400);
            response.send("Invalid Password");
        }
    }
});

app.get("/jobs", authenticateToken, async (request, response) => {
    try {
        const { employment_type, minimum_package, search } = request.query;

        // Base query
        let query = `SELECT * FROM jobs WHERE 1=1`;
        const params = [];

        // Filter by employment type (comma-separated)
        // Filter by employment type
        if (employment_type && employment_type.length > 0) {
            const types = employment_type.split(',');
            // Only apply the filter if the array isn't just one empty string
            if (types[0] !== "") {
                query += ` AND employment_type IN (${types.map(() => '?').join(',')})`;
                params.push(...types);
            }
        }

        // Filter by minimum package
        if (minimum_package) {
            query += `
    AND CAST(REPLACE(package_per_annum, ' LPA', '') AS INTEGER) >= ?
  `
            params.push(Number(minimum_package))
        }


        // Search by job title or description
        if (search) {
            query += ` AND (title LIKE ? OR job_description LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        // Execute query
        const jobsArray = await db.all(query, params);

        // Map DB fields to frontend format (camelCase)
        const jobs = jobsArray.map(job => ({
            id: job.id,
            title: job.title,
            rating: job.rating,
            companyLogoUrl: job.company_logo_url,
            companyWebsiteUrl: job.company_website_url,
            location: job.location,
            employmentType: job.employment_type,
            packagePerAnnum: job.package_per_annum,
            jobDescription: job.job_description,
        }));
        response.status(200).send({ jobs });
    } catch (error) {
        console.error(error);
        response.status(500).send({ error_msg: "Server Error" });
    }
});


app.get("/jobs/:id", authenticateToken, async (request, response) => {
    try {
        const { id } = request.params;

        // Fetch main job details
        const jobQuery = `
            SELECT *
            FROM jobs
            WHERE id = ?
        `;
        const job = await db.get(jobQuery, [id]);

        if (!job) {
            return response.status(404).send({ error_msg: "Job Not Found" });
        }

        // Fetch life at company
        const lifeQuery = `
            SELECT description, image_url
            FROM life_at_company
            WHERE job_id = ?
        `;
        const lifeAtCompany = await db.get(lifeQuery, [id]) || { description: "", image_url: "" };

        // Fetch skills
        const skillsQuery = `
            SELECT s.name, s.image_url
            FROM skills s
            INNER JOIN job_skills js ON s.id = js.skill_id
            WHERE js.job_id = ?
        `;
        const skillsArray = await db.all(skillsQuery, [id]);

        // Fetch similar jobs (same employment type, excluding current job)
        const similarJobsQuery = `
            SELECT *
            FROM jobs
            WHERE employment_type = ? AND id != ?
            LIMIT 3
        `;
        const similarJobsArray = await db.all(similarJobsQuery, [job.employment_type, id]);

        // Format main job data
        const jobDetails = {
            id: job.id,
            title: job.title,
            rating: job.rating,
            company_logo_url: job.company_logo_url,
            company_website_url: job.company_website_url,
            location: job.location,
            employment_type: job.employment_type,
            package_per_annum: job.package_per_annum, is_applied: job.is_applied,
            job_description: job.job_description,
            life_at_company: {
                description: lifeAtCompany.description,
                image_url: lifeAtCompany.image_url,
            },
            skills: skillsArray.map(skill => ({
                name: skill.name,
                image_url: skill.image_url,
            })),
        };

        // Format similar jobs
        const similarJobs = similarJobsArray.map(job => ({
            id: job.id,
            title: job.title,
            rating: job.rating,
            company_logo_url: job.company_logo_url,
            employment_type: job.employment_type,
            location: job.location,
            job_description: job.job_description,
        }));

        response.status(200).send({ job_details: jobDetails, similar_jobs: similarJobs });
    } catch (error) {
        console.error(error);
        response.status(500).send({ error_msg: "Server Error" });
    }
});


app.get("/profile", authenticateToken, async (request, response) => {
    try {
        const { name } = request.user   // comes from JWT payload

        const getProfileQuery = `
            SELECT name, profile_image_url, short_bio
            FROM users
            WHERE name = ?
        `
        const profile = await db.get(getProfileQuery, [name])

        if (!profile) {
            return response.status(404).send({ error_msg: "Profile Not Found" })
        }

        response.status(200).send({
            profile_details: {
                name: profile.name,
                profile_image_url: profile.profile_image_url,
                short_bio: profile.short_bio,
            }
        })
    } catch (error) {
        console.error(error)
        response.status(500).send({ error_msg: "Server Error" })
    }
})

app.get('/applied-jobs/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params

    try {
        const appliedJobs = await db.all(
            `
      SELECT
        jobs.id AS job_id,
        jobs.company_logo_url,
        jobs.company_website_url,
        jobs.title AS role,
        jobs.location,
        jobs.package_per_annum
      FROM applied_jobs
      JOIN jobs ON applied_jobs.job_id = jobs.id
      WHERE applied_jobs.user_id = ?
      ORDER BY applied_jobs.applied_at DESC
      `,
            [userId]
        )

        res.json(appliedJobs)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch applied jobs' })
    }
})

app.post('/applied-jobs', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { jobId } = req.body;

    if (!jobId) {
        return res.status(400).json({ error: 'jobId is required' });
    }

    try {
        // Check if already applied
        const existing = await db.get(
            `SELECT id FROM applied_jobs WHERE user_id = ? AND job_id = ?`,
            [userId, jobId]
        );

        if (existing) {
            return res.status(400).json({ message: 'Already applied for this job' });
        }

        // Insert into applied_jobs
        await db.run(
            `INSERT INTO applied_jobs (user_id, job_id) VALUES (?, ?)`,
            [userId, jobId]
        );

        // Update jobs table: set is_applied = 1 for this job
        await db.run(
            `UPDATE jobs SET is_applied = 1 WHERE id = ?`,
            [jobId]
        );

        res.status(201).json({ message: 'Job applied successfully' });
    } catch (error) {
        console.error('Error applying for job:', error);
        res.status(500).json({ error: 'Failed to apply job' });
    }
});

