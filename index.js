const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// In-memory URL list (to be scraped)
const urlList = [];

// Function to scrape a website
async function scrapeWebsite(url) {
    try {
        // Fetch the HTML of the provided website
        const { data } = await axios.get(url);

        // Load the HTML using Cheerio for parsing/manipulating the HTML
        const $ = cheerio.load(data);

        // Extract the title of the page as an example
        const pageTitle = $('title').text();

        // Prepare email content
        const toEmail = 'litnitimounsef@gmail.com'; // Replace with actual recipient email
        const subject = `Scraped Data from ${url}`;
        const message = `
            <h1>${pageTitle}</h1>
            <p>Scraped HTML content:</p>
            <pre>${data}</pre>
        `;
        const isHtml = true;

        // Send the email
        await sendEmail(toEmail, subject, message, isHtml);

        console.log(`Scraping and email sent successfully for URL: ${url}`);
    } catch (error) {
        console.error(`Error scraping URL (${url}):`, error.message);
    }
}

// Function to send email
async function sendEmail(toEmail, subject, message, isHtml) {
    try {
        const response = await axios.post('https://mail-api-mounsef.vercel.app/api/send-email', {
            to: toEmail,
            subject: subject,
            message: message,
            isHtml: isHtml,
        }, {
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.status === 200) {
            console.log('Email sent successfully!');
        } else {
            console.log('Failed to send email:', response.data.error);
        }
    } catch (error) {
        console.error('Error sending email:', error.message);
    }
}

// API endpoint to add a new URL to the list
app.post('/add-url', (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ message: 'Please provide a valid URL in the request body.' });
    }

    // Add the URL to the list if not already present
    if (!urlList.includes(url)) {
        urlList.push(url);
        console.log(`URL added: ${url}`);
    }

    res.status(200).json({
        message: 'URL added successfully!',
        url: url,
    });
});

// Schedule the scraping function to run every 15 minutes
cron.schedule('*/15 * * * *', () => {
    console.log('Running scheduled task...');
    urlList.forEach((url) => {
        scrapeWebsite(url);
    });
});

// Default route
app.get('/', (req, res) => {
    res.send('Loop Scraper API is running. Use POST /add-url to add URLs for scraping.');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
