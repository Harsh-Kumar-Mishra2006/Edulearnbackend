// routes/courseRoutes.js
const Course = require('../models/courseModel');

router.post('/seed-courses', async (req, res) => {
  try {
    const coursesData = [
      {
    id: 1,
    title: "Web Development",
    description: "Learn full-stack web development with modern technologies like React, Node.js, and MongoDB. Build real-world projects and become a professional web developer.",
    image: "webdev.webp",
    instructor: "....",
    duration: "12 weeks",
    level: "Beginner to Advanced",
    price: 299,
    rating: 4.8,
    students: "##",
    category: "Development",
    features: ["HTML/CSS", "JavaScript", "React", "Node.js", "MongoDB", "Deployment"],
    popular: true
  },
  {
    id: 2,
    title: "Microsoft Office",
    description: "Master Microsoft Office suite including Word, Excel, PowerPoint, and Outlook. Boost your productivity and professional skills.",
    image: "office.png",
    instructor: "....",
    duration: "6 weeks",
    level: "All Levels",
    price: 99,
    rating: 4.6,
    students: "##",
    category: "Productivity",
    features: ["Word", "Excel", "PowerPoint", "Outlook", "Advanced Formulas", "Automation"],
    popular: false
  },
  {
    id: 3,
    title: "Mobile App Development",
    description: "Create cross-platform mobile applications using React Native and Flutter. Learn to build for both iOS and Android.",
    image: "appdev.webp",
    instructor: "....",
    duration: "10 weeks",
    level: "Intermediate",
    price: 349,
    rating: 4.7,
    students: "##",
    category: "Development",
    features: ["React Native", "Flutter", "API Integration", "App Store Deployment", "UI/UX"],
    popular: true
  },
  {
    id: 4,
    title: "UI/UX Design",
    description: "Learn user interface and user experience design principles. Create beautiful and functional designs using Figma and Adobe XD.",
    image: "uiux.webp",
    instructor: "....",
    duration: "8 weeks",
    level: "Beginner",
    price: 249,
    rating: 4.9,
    students: "###",
    category: "Design",
    features: ["Figma", "User Research", "Wireframing", "Prototyping", "Design Systems"],
    popular: true
  },
  {
    id: 5,
    title: "Digital Marketing",
    description: "Master digital marketing strategies including SEO, social media marketing, email campaigns, and analytics.",
    image: "digimark.png",
    instructor: ".....",
    duration: "7 weeks",
    level: "All Levels",
    price: 199,
    rating: 4.5,
    students: "###",
    category: "Marketing",
    features: ["SEO", "Social Media", "Google Ads", "Analytics", "Content Strategy"],
    popular: false
  },
  {
    id: 6,
    title: "Graphic Design",
    description: "Learn graphic design fundamentals and tools like Adobe Photoshop, Illustrator, and InDesign. Create stunning visuals.",
    image: "graphic design.webp",
    instructor: "....",
    duration: "9 weeks",
    level: "Beginner to Intermediate",
    price: 229,
    rating: 4.7,
    students: "###",
    category: "Design",
    features: ["Photoshop", "Illustrator", "Typography", "Branding", "Print Design"],
    popular: false
  }
    ];

    await Course.deleteMany({});
    const courses = await Course.insertMany(coursesData);

    res.json({
      success: true,
      message: "Courses seeded successfully",
      count: courses.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add to your courseRoutes.js
router.get('/check-courses', async (req, res) => {
  try {
    const courses = await Course.find({});
    res.json({
      success: true,
      count: courses.length,
      courses: courses.map(c => ({ title: c.title, price: c.price }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});