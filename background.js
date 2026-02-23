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
    console.log(`Received Submission ID: ${submissionId}`);

    chrome.storage.local.get(['githubToken', 'targetRepo'], (data) => {
      const { githubToken, targetRepo } = data;
      if (!githubToken || !targetRepo) {
        console.error("❌ Credentials missing!");
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
      console.log("✅ Fetched code from LeetCode!");
      pushToGitHub(result.data.submissionDetails, token, repo);
    }
  } catch (error) {
    console.error("❌ Error fetching from LeetCode:", error);
  }
}

async function pushToGitHub(details, token, repo) {
  const { code, lang, question } = details;
  const fileExt = LANGUAGES[lang.name] || "txt";
  
  // 1. Get the Question Number
  // "questionFrontendId" is the string number (e.g., "1", "102")
  const id = question.questionFrontendId;
  const paddedId = id.padStart(4, '0'); // Zero-pad to 4 digits (e.g., "0001")

  // 2. Construct the new base filename (e.g., "0001-two-sum")
  const baseName = `${paddedId}-${question.titleSlug}`;
  
  let version = 1;
  let fileName = `${baseName}.${fileExt}`;

  // 3. Check for filename collisions (Incrementing strategy)
  while (true) {
    const checkUrl = `https://api.github.com/repos/${repo}/contents/${fileName}`;
    
    // We intentionally ignore cache to ensure we see the latest repo state
    const response = await fetch(checkUrl, {
      headers: { 
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache'
      }
    });

    if (response.status === 404) {
      // File does not exist, safe to use
      break; 
    } else if (response.ok) {
      // File exists, try next version (e.g., 0001-two-sum_2.cpp)
      version++;
      fileName = `${baseName}_${version}.${fileExt}`;
      console.log(`⚠️ ${fileName} exists. Trying next version...`);
    } else {
      console.error("❌ Error checking file existence:", await response.text());
      return; 
    }
  }

  // 4. Encode Content properly
  const content = btoa(encodeURIComponent(code).replace(/%([0-9A-F]{2})/g, 
    (match, p1) => String.fromCharCode('0x' + p1)
  ));

  const uploadUrl = `https://api.github.com/repos/${repo}/contents/${fileName}`;
  const body = {
    message: `Solved: ${question.title} (ID: ${id})`, // Updated commit message
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
      const errorData = await pushResponse.json();
      console.error("❌ GitHub Push Failed:", errorData);
    }
  } catch (error) {
    console.error("❌ Network Error pushing to GitHub:", error);
  }
}