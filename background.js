// Map LeetCode language names to file extensions
const LANGUAGES = {
  "cpp": "cpp", "java": "java", "python": "py", "python3": "py",
  "c": "c", "csharp": "cs", "javascript": "js", "typescript": "ts",
  "php": "php", "swift": "swift", "kotlin": "kt", "dart": "dart",
  "go": "go", "ruby": "rb", "scala": "scala", "rust": "rs",
  "racket": "rkt", "erlang": "erl", "elixir": "ex"
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "NEW_SUBMISSION") {
    const submissionId = message.submissionId;
    console.log(`Received Submission ID: ${submissionId}`);

    chrome.storage.local.get(['githubToken', 'targetRepo'], async (data) => {
      const { githubToken, targetRepo } = data;
      if (!githubToken || !targetRepo) {
        console.error("❌ Credentials missing!");
        return;
      }
      
      // --- THE BOUNCER: Verify it's actually an Accepted solution! ---
      const isAccepted = await verifyAcceptedStatus(submissionId);
      if (isAccepted) {
         fetchLeetCodeSubmission(submissionId, githubToken, targetRepo);
      }
    });
  }
});

// The new function that checks LeetCode's backend
async function verifyAcceptedStatus(submissionId, retries = 5) {
  if (retries === 0) return false;

  try {
    const url = `https://leetcode.com/submissions/detail/${submissionId}/check/`;
    const response = await fetch(url);
    const data = await response.json();
    
    // If it's still grading, wait 1 second and check again
    if (data.state === "PENDING" || data.state === "STARTED") {
       console.log("Submission is grading... waiting 1s");
       await new Promise(resolve => setTimeout(resolve, 1000));
       return await verifyAcceptedStatus(submissionId, retries - 1);
    }

    if (data.status_msg === "Accepted") {
      console.log("✅ API Confirmed: Solution was Accepted!");
      return true;
    } else {
      console.log(`🛑 Ignored: Solution was '${data.status_msg}'. No push needed.`);
      return false;
    }
  } catch (error) {
    console.error("❌ Failed to verify status:", error);
    return false;
  }
}

async function fetchLeetCodeSubmission(submissionId, token, repo) {
  const query = `
    query submissionDetails($submissionId: Int!) {
      submissionDetails(submissionId: $submissionId) {
        code
        timestamp
        lang { name }
        question { questionFrontendId, titleSlug, title }
      }
    }
  `;

  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { submissionId: parseInt(submissionId) } })
    });

    const result = await response.json();
    if (result.data && result.data.submissionDetails) {
      console.log(`✅ Extracted code for submission ${submissionId}`);
      pushToGitHub(result.data.submissionDetails, token, repo);
    }
  } catch (error) {
    console.error("❌ Error fetching from LeetCode:", error);
  }
}

async function pushToGitHub(details, token, repo) {
  const { code, lang, question } = details;
  const fileExt = LANGUAGES[lang.name] || "txt";
  const id = question.questionFrontendId.padStart(4, '0');
  const baseName = `${id}-${question.titleSlug}`;
  
  let version = 1;
  let fileName = `${baseName}.${fileExt}`;

  // Check for duplicates or existing files
  while (true) {
    const checkUrl = `https://api.github.com/repos/${repo}/contents/${fileName}`;
    const response = await fetch(checkUrl, {
      headers: { 
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3.raw',
        'Cache-Control': 'no-cache'
      }
    });

    if (response.status === 404) {
      console.log(`✨ New file name found: ${fileName}`);
      break; 
    } else if (response.ok) {
      const existingCode = await response.text();
      if (existingCode.trim() === code.trim()) {
        console.log(`🛑 Duplicate detected at ${fileName}. No update needed.`);
        return; 
      }
      version++;
      fileName = `${baseName}_${version}.${fileExt}`;
    } else {
      console.error("❌ Error checking file:", await response.text());
      return; 
    }
  }

  // Encode and Push
  const content = btoa(encodeURIComponent(code).replace(/%([0-9A-F]{2})/g, 
    (match, p1) => String.fromCharCode('0x' + p1)
  ));

  const uploadUrl = `https://api.github.com/repos/${repo}/contents/${fileName}`;
  const body = {
    message: `Solved: ${question.title} (ID: ${question.questionFrontendId})`,
    content: content
  };

  try {
    const pushResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (pushResponse.ok) {
      console.log(`🎉 SUCCESS! Pushed ${fileName} to GitHub.`);
    } else {
      console.error("❌ GitHub Push Failed:", await pushResponse.json());
    }
  } catch (error) {
    console.error("❌ Network Error pushing to GitHub:", error);
  }
}