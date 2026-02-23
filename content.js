console.log("LeetCode to GitHub: URL Poller loaded.");

let lastProcessedUrl = "";

// Function to check the URL and Page Content
function checkSubmission() {
  const currentUrl = window.location.href;

  // 1. Check if the URL contains a submission ID (e.g., /submissions/123456/)
  // The regex looks for "/submissions/" followed by digits
  const match = currentUrl.match(/\/submissions\/(\d+)/);

  if (match && match[1]) {
    const submissionId = match[1];

    // 2. Only proceed if we haven't processed this exact URL yet
    if (currentUrl !== lastProcessedUrl) {
      
      // 3. Look for the word "Accepted" anywhere on the page
      // We wait a tiny bit to ensure the text has rendered
      const pageText = document.body.innerText;
      
      if (pageText.includes("Accepted")) {
        console.log(`✅ Success Detected! URL: ${currentUrl}`);
        console.log(`🎯 CAPTURED SUBMISSION ID: ${submissionId}`);

        lastProcessedUrl = currentUrl;

        // Send to background script
        chrome.runtime.sendMessage({
          type: "NEW_SUBMISSION",
          submissionId: submissionId
        });
      }
    }
  }
}

// Run the check every 1 second
setInterval(checkSubmission, 1000);