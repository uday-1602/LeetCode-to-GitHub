document.addEventListener('DOMContentLoaded', () => {
  const tokenInput = document.getElementById('githubToken');
  const repoInput = document.getElementById('targetRepo');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  // 1. Load existing credentials when the popup opens
  chrome.storage.local.get(['githubToken', 'targetRepo'], (result) => {
    if (result.githubToken) tokenInput.value = result.githubToken;
    if (result.targetRepo) repoInput.value = result.targetRepo;
  });

  // 2. Save credentials when the button is clicked
  saveBtn.addEventListener('click', () => {
    const token = tokenInput.value.trim();
    const repo = repoInput.value.trim();

    if (!token || !repo) {
      statusDiv.textContent = "Please fill in both fields.";
      statusDiv.style.color = "red";
      return;
    }

    chrome.storage.local.set({ 
      githubToken: token, 
      targetRepo: repo 
    }, () => {
      statusDiv.textContent = "Credentials saved securely!";
      statusDiv.style.color = "green";
      
      // Clear the success message after 2 seconds
      setTimeout(() => {
        statusDiv.textContent = "";
      }, 2000);
    });
  });
});