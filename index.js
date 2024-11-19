const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const cron = require('node-cron');

// Enable CORS middleware
const enableCors = cors({ origin: '*' });

// In-memory URL list
const urlList = new Set(); // Using a Set to prevent duplicate URLs

// Function to scrape a website
async function scrapeWebsite(url) {
    try {
        // Validate URL format
        if (!/^https?:\/\/.+$/.test(url)) {
            console.error(`Invalid URL: ${url}`);
            return;
        }

        // Fetch the HTML of the provided website
        const { data } = await axios.get(url);

        // Load the HTML using cheerio for parsing
        const $ = cheerio.load(data);

        // Extract the title of the page as an example
        const pageTitle = $('title').text() || 'No Title Found';

        // Prepare email content
        const toEmail = 'litnitimounsef@gmail.com'; // Replace with actual recipient email
        const subject = `Scraped Data: ${pageTitle}`;
        const message = `
            <h1>${pageTitle}</h1>
            <p>Scraped HTML content snippet:</p>
            <pre>${data.substring(0, 1000)}...</pre>
        `;
        const isHtml = true;

        // Send the email
        await sendEmail(toEmail, subject, message, isHtml);

        console.log(`Scraping successful for URL: ${url}`);
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
            },
        });

        if (response.status === 200) {
            console.log('Email sent successfully!');
        } else {
            console.error('Failed to send email:', response.data);
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

    if (urlList.has(websiteUrl)) {
        return res.status(409).json({ message: 'URL is already in the list.', url: websiteUrl });
    }

    // Add the URL to the list
    urlList.add(websiteUrl);

    res.status(200).json({
        message: 'URL added successfully!',
        url: websiteUrl,
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
