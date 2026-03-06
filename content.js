console.log("LeetCode to GitHub: URL Poller loaded.");

let lastProcessedUrl = "";

function checkSubmission() {
  const currentUrl = window.location.href;
  const match = currentUrl.match(/\/submissions\/(\d+)/);

  if (match && match[1]) {
    const submissionId = match[1];
    
    if (currentUrl !== lastProcessedUrl) {
      console.log(`🎯 CAPTURED SUBMISSION ID: ${submissionId}`);
      lastProcessedUrl = currentUrl;
      
      chrome.runtime.sendMessage({
        type: "NEW_SUBMISSION",
        submissionId: submissionId
      });
    }
  }
}

// Run the check every 1 second
setInterval(checkSubmission, 1000);