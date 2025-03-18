const express = require('express');
const path = require('path');
const app = express();

// Set PUG as the view engine
app.set('view engine', 'pug');

// Define the 'views' folder where PUG templates are stored
app.set('views', path.join(__dirname, 'views'));

// Example route that renders a PUG template
app.get('/', (req, res) => {
    res.render('index', {
        title: 'Welcome to Study Buddies',
        message: 'Find your study partner today!'
    });
});

// Serve static files (e.g., CSS, JS) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Start the server on port 3000
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
