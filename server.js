import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= VIEW ENGINE ================= */
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));

/* ================= MONGODB ================= */
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://vsowndharya2000_db_user:PDUJ5GD59QAgUHQB@cluster0.tua5tj5.mongodb.net/jobPortal?retryWrites=true&w=majority";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.error("❌ MongoDB Error:", err);
    process.exit(1);
  });

/* ================= UPLOADS ================= */
const UPLOADS_FOLDER = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_FOLDER)) {
  fs.mkdirSync(UPLOADS_FOLDER);
}

const storage = multer.diskStorage({
  destination: UPLOADS_FOLDER,
  filename: (req, file, cb) => cb(null, file.originalname),
});

const upload = multer({ storage });

/* ================= SCHEMAS ================= */
const Job = mongoose.model(
  "Job",
  new mongoose.Schema(
    {
      title: String,
      location: String,
      type: String,
      salary: String,
    },
    { timestamps: true }
  )
);

const Application = mongoose.model(
  "Application",
  new mongoose.Schema({
    jobId: String,
    name: String,
    email: String,
    resumePath: String,
    appliedAt: { type: Date, default: Date.now },
  })
);

/* ================= ROUTES ================= */
app.get("/", (req, res) => {
  res.send("Backend server is running 🚀");
});

app.get("/admin", async (req, res) => {
  try {
    const jobs = await Job.find();
    const applications = await Application.find();

    res.render("adminDashboard", {
      jobs,
      applications,
      stats: { totalApplications: applications.length },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Admin Dashboard Error");
  }
});

app.post("/apply", upload.single("resume"), async (req, res) => {
  try {
    const application = new Application({
      ...req.body,
      resumePath: req.file?.originalname,
    });

    await application.save();
    res.json({ message: "Application submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Application failed" });
  }
});

app.use("/uploads", express.static(UPLOADS_FOLDER));

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
