// Map LeetCode language names to file extensions
const LANGUAGES = {
  "cpp": "cpp",
  "java": "java",
  "python": "py",
  "python3": "py",
  "c": "c",
  "csharp": "cs",
  "javascript": "js",
  "typescript": "ts",
  "php": "php",
  "swift": "swift",
  "kotlin": "kt",
  "dart": "dart",
  "go": "go",
  "ruby": "rb",
  "scala": "scala",
  "rust": "rs",
  "racket": "rkt",
  "erlang": "erl",
  "elixir": "ex"
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "NEW_SUBMISSION") {
    const submissionId = message.submissionId;
    
    chrome.storage.local.get(['githubToken', 'targetRepo'], (data) => {
      const { githubToken, targetRepo } = data;
      if (!githubToken || !targetRepo) {
        console.error("Credentials missing!");
        return;
      }
      fetchLeetCodeSubmission(submissionId, githubToken, targetRepo);
    });
  }
});

async function fetchLeetCodeSubmission(submissionId, token, repo) {
  const query = `
    query submissionDetails($submissionId: Int!) {
      submissionDetails(submissionId: $submissionId) {
        code
        timestamp
        lang { name }
        question { 
          questionFrontendId 
          titleSlug
          title 
        }
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
      console.log(`Extracted code for submission ${submissionId}`);
      pushToGitHub(result.data.submissionDetails, token, repo);
    }
  } catch (error) {
    console.error("Error fetching from LeetCode:", error);
  }
}

async function pushToGitHub(details, token, repo) {
  const { code, lang, question } = details;
  const fileExt = LANGUAGES[lang.name] || "txt";
  const id = question.questionFrontendId.padStart(4, '0');
  const baseName = `${id}-${question.titleSlug}`;
  
  let version = 1;
  let fileName = `${baseName}.${fileExt}`;

  // --- NEW INTELLIGENT LOOP ---
  while (true) {
    const checkUrl = `https://api.github.com/repos/${repo}/contents/${fileName}`;

    // We request the "application/vnd.github.v3.raw" header.
    // This tells GitHub to give us the PLAIN TEXT code, not JSON.
    const response = await fetch(checkUrl, {
      headers: { 
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3.raw', // Request raw text
        'Cache-Control': 'no-cache'
      }
    });

    if (response.status === 404) {
      // CASE 1: File does not exist at all.
      // This means we found a free "slot". We break the loop to create this new file.
      console.log(`New file name found: ${fileName}`);
      break; 

    } else if (response.ok) {
      // CASE 2: File exists. We must compare the content.
      const existingCode = await response.text();
      
      // Compare strictly. (Trim whitespace to be safe)
      if (existingCode.trim() === code.trim()) {
        console.log(`Duplicate detected at ${fileName}. No update needed.`);
        return; // EXIT FUNCTION IMMEDIATELY
      }

      // CASE 3: File exists, but the code is different.
      // This is a new version of the solution. Increment and try the next slot.
      console.log(`${fileName} exists but code is different. Checking next version...`);
      version++;
      fileName = `${baseName}_${version}.${fileExt}`;
      
    } else {
      console.error("Error checking file:", await response.text());
      return; 
    }
  }
  // ----------------------------
  // If we broke out of the loop, it means we found a NEW, unique filename.
  // Proceed to upload.

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
      console.error("GitHub Push Failed:", await pushResponse.json());
    }
  } catch (error) {
    console.error("Network Error pushing to GitHub:", error);
  }
}