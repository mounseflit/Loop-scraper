const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

// Enable CORS middleware
const enableCors = cors({ origin: '*' });

async function scrapeWebsite(req, res) {
  const websiteUrl = req.query.url;

  if (!websiteUrl) {
    return res.status(400).json({ message: 'Please provide a valid URL as a query parameter (e.g., ?url=https://example.com)' });
  }

  try {
    // Fetch the HTML of the provided website
    const { data } = await axios.get(websiteUrl);

    // Optionally, load the HTML using cheerio for parsing/manipulating the HTML
    const $ = cheerio.load(data);

    // Extract the title of the page as an example
    const pageTitle = $('title').text();

    // Return the HTML content and title
    res.status(200).json({
      message: 'Scraping successful!',
      title: pageTitle,
      html: data
    });
  } catch (error) {
    console.error('Error fetching the URL:', error);
    res.status(500).json({
      message: 'Error occurred during scraping',
      error: error.message
    });
  }
}

// Export the function for Vercel with CORS enabled
module.exports = (req, res) => enableCors(req, res, () => scrapeWebsite(req, res));
