const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const cron = require('node-cron');

// Enable CORS middleware
const enableCors = cors({ origin: '*' });

// In-memory URL list
const urlList = [];

// Function to scrape a website
async function scrapeWebsite(url) {
    try {
        // Fetch the HTML of the provided website
        const { data } = await axios.get(url);

        // Optionally, load the HTML using cheerio for parsing/manipulating the HTML
        const $ = cheerio.load(data);

        // Extract the title of the page as an example
        const pageTitle = $('title').text();

        // Prepare email content
        const toEmail = 'litnitimounsef@gmail.com'; // Replace with actual recipient email
        const subject = 'Scraped Data';
        const message = `
            <h1>${pageTitle}</h1>
            <p>Scraped HTML content:</p>
            <pre>${data}</pre>
        `;
        const isHtml = true;

        // Send the email
        await sendEmail(toEmail, subject, message, isHtml);

        console.log(`Scraping successful for URL: ${url}`);
    } catch (error) {
        console.error('Error fetching the URL:', error.message);
    }
}

// Function to send email
async function sendEmail(toEmail, subject, message, isHtml) {
    try {
        const response = await axios.post('https://mail-api-mounsef.vercel.app/api/send-email', {
            to: toEmail,
            subject: subject,
            message: message,
            isHtml: isHtml
        }, {
            headers: {
                'Content-Type': 'application/json'
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

// Function to handle incoming requests
async function handleRequest(req, res) {
    const websiteUrl = req.query.url;

    if (!websiteUrl) {
        return res.status(400).json({ message: 'Please provide a valid URL as a query parameter (e.g., ?url=https://example.com)' });
    }

    // Add the URL to the list
    urlList.push(websiteUrl);

    res.status(200).json({
        message: 'URL added successfully!',
        url: websiteUrl
    });
}

// Schedule the scraping function to run every 15 minutes
cron.schedule('*/15 * * * *', () => {
    console.log('Running scheduled task...');
    urlList.forEach(url => {
        scrapeWebsite(url);
    });
});

// Export the function for Vercel with CORS enabled
module.exports = (req, res) => enableCors(req, res, () => handleRequest(req, res));
