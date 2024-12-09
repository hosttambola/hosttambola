const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const nodeHtmlToImage = require("node-html-to-image");

// Helper to ensure directory existence
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const downloadPDF = async (req, res) => {
  try {
    const { website } = req.body;

    // Read websites data
    const websitesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../utils/website.json"), "utf8")
    );

    // Check legitimacy
    const certCode = websitesData.verifiedWebsites[website];
    if (!certCode) {
      return res.status(400).send("Website is not legitimate.");
    }

    const currentDate = new Date().toLocaleString();

    // Generate PDF content
    const pdfContent = `
      <!DOCTYPE html>
      <html lang="en">

      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Certificate</title>
          <style>
             body {
            font-family: Roboto, sans-serif;
            background-color: #f8f9fa;
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            width: fit-content;
            height: fit-content;
        }
              .certificate-container {
                  width: 900px;
                  padding: 30px;
                  background: #fff;
                  border: 15px solid #0C5280;
                  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
                  position: relative;
              }
              .certificate {
                  padding: 20px;
                  border: 5px solid #ffd700;
                  position: relative;
                  text-align: center;
              }
              h1 {
                  font-weight: 700;
                  font-size: 36px;
                  color: #009b01;
              }
              .certCode {
                  font-size: 10px;
                  color: #0C5280;
                  font-weight: bold;
                  position: absolute;
                  right: 40px;
                  top: 60px;
              }
              .dateTime {
                  font-size: 10px;
                  color: #0C5280;
                  font-weight: bold;
                  position: absolute;
                  left: 40px;
                  top: 60px;
              }
              .website-name {
                  font-size: 20px;
                  margin: 10px 0;
              }
              .website-name strong {
                  color: #009b01;
              }
              .highlight {
                  background-color: #ffd700;
                  font-weight: bold;
              }
              .certificate-content {
                  margin: 20px auto;
                  width: 80%;
                  line-height: 1.6;
                  color: #333;
              }
              .bigName1 {
                  font-size: 20px;
                  color: #009b01;
              }
              .bigName2 {
                  font-size: 30px;
                  color: #009b01;
              }
              .certificate-footer {
                  margin-top: 20px;
                  font-size: 14px;
                  color: #555;
              }
              .link {
                  color: #0C5280;
                  text-decoration: none;
                  font-weight: bold;
              }
              .link:hover {
                  text-decoration: underline;
              }
              .text-muted {
                  font-size: 12px;
                  color: #777;
              }
              .logo {
                  width: 150px;
                  height: 150px;
                  margin: auto;
              }
          </style>
      </head>

      <body>
          <div class="certificate-container">
              <div class="certificate">
<img src="data:image/svg+xml;base64,${fs.readFileSync(
      path.join(__dirname, "../public/images/certified.min.svg"),
      "base64"
    )}" class="logo" alt="Certificate Logo">
                  <p class="certCode">Certificate Code: <strong>${certCode}</strong></p>
                  <p class="dateTime">Downloaded on: ${currentDate}</p>
                  <h1>CERTIFICATE OF TECHNICAL LEGITIMACY</h1>
                  <p class="website-name">To: <strong class="bigName2">${website}</strong></p>
                  <div class="certificate-content">
                      <p>
                          This website <strong class="bigName1">${website}</strong> is certified by <span
                              class="highlight">HostTambola.in</span>,
                          ensuring it is technically legitimate. No winner fixing or unfair activities are conducted.
                      </p>
                      <p>
                          HostTambola.in-certified websites operate with pure chance, ensuring unbiased outcomes for all
                          users.
                      </p>
                      <p class="text-muted">
                          You can review how our system works by visiting our
                          <a href="https://hosttambola.in/code" class="link">code transparency page</a>. The random number
                          generation system uses <strong>Math.random()</strong>, ensuring complete randomness and fairness. Developers
                          cannot predict the next number or winners.
                      </p>
                  </div>
                  <div class="certificate-footer">
                      <p>Certified by: <strong>HostTambola.in</strong></p>
                      <p class="text-muted">Verify the certificate number at
                          <a href="https://hosttambola.in/legit" class="link">www.hosttambola.in/legit</a>
                      </p>
                  </div>
              </div>
          </div>
      </body>

      </html>
    `;

    // Ensure tmp directory exists
    const tmpDir = path.join(__dirname, "../tmp");
    ensureDirectoryExists(tmpDir);

    const pdfPath = path.join(tmpDir, "certificate.pdf");

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(pdfContent);
    const dimensions = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;

      return {
        width: Math.max(body.scrollWidth, html.scrollWidth),
        height: Math.max(body.scrollHeight, html.scrollHeight),
      };
    });
    await page.pdf({
      path: pdfPath,
      width: `${dimensions.width}px`,
      height: `${dimensions.height}px`,
      printBackground: true,
    });
    await browser.close();

    // Send the file to the user and clean up
    res.download(pdfPath, "certificate.pdf", () => {
      fs.unlinkSync(pdfPath); // Delete the temporary file after download
    });
  } catch (error) {
    console.error("Error generating PDF certificate:", error);
    res
      .status(500)
      .send("An error occurred while generating the PDF certificate.");
  }
};

const downloadImage = async (req, res) => {
  try {
    const { website } = req.body;

    // Read websites data
    const websitesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../utils/website.json"), "utf8")
    );

    // Check legitimacy
    const certCode = websitesData.verifiedWebsites[website];
    if (!certCode) {
      return res.status(400).send("Website is not legitimate.");
    }

    // Define the HTML template
    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificate</title>
        <style>
            body {
                font-family: Roboto, sans-serif;
                background-color: #f8f9fa;
                margin: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                width: fit-content;
                height: fit-content;
            }
            .certificate-container {
                width: 360px;
                padding: 10px;
                background: #fff;
                border: 15px solid #0C5280;
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
                position: relative;
            }
            .certificate {
                padding: 10px;
                border: 5px solid #ffd700;
                position: relative;
                text-align: center;
            }
            h1 {
                font-weight: 700;
                font-size: 36px;
                color: #009b01;
            }
            .certCode {
                font-size: 10px;
                color: #0C5280;
                font-weight: bold;
                position: absolute;
                right: 40px;
                top: 60px;
            }
            .dateTime {
                font-size: 10px;
                color: #0C5280;
                font-weight: bold;
                position: absolute;
                left: 40px;
                top: 60px;
            }
            .website-name {
                font-size: 20px;
                margin: 10px 0;
            }
            .website-name strong {
                color: #009b01;
            }
            .highlight {
                background-color: #ffd700;
                font-weight: bold;
            }
            .certificate-content {
                margin: 20px auto;
                width: 99%;
                line-height: 1.6;
                color: #333;
            }
            .bigName1 {
                font-size: 20px;
                color: #009b01;
            }
            .bigName2 {
                font-size: 30px;
                color: #009b01;
            }
            .certificate-footer {
                margin-top: 20px;
                font-size: 14px;
                color: #555;
            }
            .link {
                color: #0C5280;
                text-decoration: none;
                font-weight: bold;
            }
            .link:hover {
                text-decoration: underline;
            }
            .text-muted {
                font-size: 12px;
                color: #777;
            }
            .logo {
                width: 150px;
                height: 150px;
                margin: auto;
            }
        </style>
    </head>
    <body>
        <div class="certificate-container">
            <div class="certificate">
<img src="data:image/svg+xml;base64,${fs.readFileSync(
      path.join(__dirname, "../public/images/certified.min.svg"),
      "base64"
    )}" class="logo" alt="Certificate Logo">
            <p class="website-name"><strong class="bigName2">${website}</strong></p>
                <div class="certificate-content">
                    <p>
                        This website <strong class="bigName1">${website}</strong> is certified by <span
                            class="highlight">HostTambola.in</span>,
                        ensuring it is technically legitimate. No winner fixing or unfair activities are conducted.
                    </p>
                    <p>
                        HostTambola.in-certified websites operate with pure chance, ensuring unbiased outcomes for all
                        users.
                    </p>
                    <p class="text-muted">
                        You can review how our system works by visiting our
                        <a href="https://hosttambola.in/code" class="link">code transparency page</a>.
                    </p>
                </div>
                <div class="certificate-footer">
                    <p>Certified by: <strong>HostTambola.in</strong></p>
                    <p class="text-muted">Verify the certificate number at
                        <a href="https://hosttambola.in/legit" class="link">www.hosttambola.in/legit</a>
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    // Generate image
    const tmpDir = path.join(__dirname, "../tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

    const imagePath = path.join(tmpDir, "certificate.png");

    await nodeHtmlToImage({
      output: imagePath,
      html: htmlTemplate,
    });

    // Send image as download
    res.download(imagePath, "certificate.png", () => {
      fs.unlinkSync(imagePath); // Delete the temporary file after download
    });
  } catch (error) {
    console.error("Error generating image certificate:", error);
    res
      .status(500)
      .send("An error occurred while generating the image certificate.");
  }
};

module.exports = { downloadPDF, downloadImage };
