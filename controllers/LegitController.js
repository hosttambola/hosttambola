const fs = require("fs");
const path = require("path");

const showLegitPage = (req, res) => {
  const { isLegit, website, certCode, error, operationType } = req.session;

  // Prevent caching
  res.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");

  console.log("Session:", req.session); // Debug log

  // Clear session values before rendering to avoid stale data
  req.session.isLegit = null;
  req.session.website = null;
  req.session.certCode = null;
  req.session.error = null;
  req.session.operationType = null;

  // Render page with session data
  res.render("legit", {
    isLegit: isLegit !== undefined ? isLegit : null,
    website: website || "",
    certCode: certCode || null,
    error: error || null,
    operationType: operationType || "", // Differentiate between operations
  });
};

const checkLegitimacy = (req, res) => {
  const { website } = req.body;

  try {
    const websitesData = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "..", "utils", "website.json"),
        "utf8"
      )
    );

    if (
      !websitesData.verifiedWebsites ||
      typeof websitesData.verifiedWebsites !== "object"
    ) {
      req.session.error =
        "Internal error: Verified websites data is not available.";
      return res.redirect("/legit");
    }

    let hostname;
    try {
      const parsedUrl = new URL(
        website.includes("://") ? website : `http://${website}`
      );
      hostname = parsedUrl.hostname.toLowerCase();
    } catch (error) {
      req.session.error = "Invalid URL format. Please enter a valid website.";
      return res.redirect("/legit");
    }

    const certCode = websitesData.verifiedWebsites[hostname];
    const isLegit = !!certCode;

    req.session.isLegit = isLegit;
    req.session.website = hostname;
    req.session.certCode = isLegit ? certCode : null;
    req.session.operationType = "legitimacy";

    return res.redirect("/legit");
  } catch (error) {
    console.error("Error processing legitimacy check:", error);
    req.session.error = "Unexpected error occurred. Please try again later.";
    return res.redirect("/legit");
  }
};

const checkCertificate = (req, res) => {
  const { certCode } = req.body;

  try {
    const websitesData = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "..", "utils", "website.json"),
        "utf8"
      )
    );

    if (
      !websitesData.verifiedWebsites ||
      typeof websitesData.verifiedWebsites !== "object"
    ) {
      req.session.error =
        "Internal error: Verified websites data is not available.";
      return res.redirect("/legit");
    }

    const website = Object.keys(websitesData.verifiedWebsites).find(
      (key) => websitesData.verifiedWebsites[key] === certCode
    );

    const isCertified = !!website;

    req.session.isLegit = isCertified;
    req.session.website = website || null;
    req.session.certCode = isCertified ? certCode : null;
    req.session.operationType = "certificate";

    return res.redirect("/legit");
  } catch (error) {
    console.error("Error processing certificate check:", error);
    req.session.error = "Unexpected error occurred. Please try again later.";
    return res.redirect("/legit");
  }
};

const checkLegitimacyByUrl = (req, res) => {
  let { websitename } = req.params;

  try {
    const websitesData = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "..", "utils", "website.json"),
        "utf8"
      )
    );

    if (
      !websitesData.verifiedWebsites ||
      typeof websitesData.verifiedWebsites !== "object"
    ) {
      req.session.error =
        "Internal error: Verified websites data is not available.";
      return res.redirect("/legit");
    }

    // Decode websitename if it is URL-encoded
    websitename = decodeURIComponent(websitename);

    let hostname;
    try {
      // Normalize the URL
      const parsedUrl = new URL(
        websitename.includes("://") ? websitename : `http://${websitename}`
      );
      hostname = parsedUrl.hostname.toLowerCase();
    } catch (error) {
      req.session.error = "Invalid URL format. Please enter a valid website.";
      return res.redirect("/legit");
    }

    // Check legitimacy
    const certCode = websitesData.verifiedWebsites[hostname];
    const isLegit = !!certCode;

    req.session.isLegit = isLegit;
    req.session.website = hostname;
    req.session.certCode = isLegit ? certCode : null;
    req.session.operationType = "legitimacy";

    console.log(
      "Website:",
      hostname,
      "Is Legit:",
      isLegit,
      "Cert Code:",
      certCode
    ); // Debug log

    // Redirect to the '/legit' page to show the result
    return res.redirect("/legit");
  } catch (error) {
    console.error("Error processing legitimacy check by URL:", error);
    req.session.error = "Unexpected error occurred. Please try again later.";
    return res.redirect("/legit");
  }
};

module.exports = {
  showLegitPage,
  checkLegitimacy,
  checkLegitimacyByUrl,
  checkCertificate,
};
