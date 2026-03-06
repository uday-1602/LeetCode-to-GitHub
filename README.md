# LeetCode to GitHub Auto-Sync 🚀

A lightweight Chrome Extension that seamlessly integrates your LeetCode grind with your GitHub profile. 

Instead of manually copying and pasting your successful submissions, this extension runs silently in the background. The moment your code passes all test cases and is marked as **"Accepted"**, it is instantly pushed to your designated GitHub repository.

## ✨ Features
* **100% Automated:** Triggers automatically upon a successful LeetCode submission. No manual clicking required.
* **Smart Versioning:** If you solve the same problem again with a better approach, it won't overwrite your old code. It automatically creates a new version (e.g., `0001-two-sum_2.cpp`).
* **Duplicate Prevention:** Intelligently compares your new submission with the existing file on GitHub. If the code is identical, it skips the push to keep your commit history clean.
* **Neat Organization:** Files are automatically formatted with their zero-padded LeetCode ID and title slug (e.g., `0217-contains-duplicate.py`).

## 🛠️ Prerequisites
Before installing, you need two things from GitHub:
1. **A Target Repository:** Create an empty repository on GitHub to store your solutions (e.g., `LeetCode-Solutions`). *Tip: Initialize it with a README.*
2. **A Personal Access Token (PAT):** * Go to GitHub Settings > Developer Settings > Personal access tokens > Tokens (classic).
   * Generate a new token and ensure you check the **`repo`** scope box. 
   * *Copy this token immediately, you will need it later.*

## 📦 Installation Instructions

1. **Get the Code**
   * Clone this repository to your local machine or download it as a ZIP file and extract it.
   
2. **Load into Chrome**
   * Open Google Chrome and navigate to `chrome://extensions/`.
   * Turn on **Developer mode** using the toggle switch in the top right corner.
   * Click the **Load unpacked** button in the top left.
   * Select the folder containing the extension files (the folder containing `manifest.json`).

## ⚙️ Configuration
1. Pin the extension to your Chrome toolbar for easy access.
2. Click the extension icon to open the popup.
3. Paste your **GitHub Personal Access Token**.
4. Enter your target repository in the format `username/repository-name` (e.g., `uday-1602/LeetCode-Solutions`).
5. Click **Save Credentials**.

## 💻 Usage
Just code! 
1. Go to any LeetCode problem.
2. Write your solution and click **Submit**.
3. If your solution is **Accepted**, the extension will fetch the code via LeetCode's GraphQL API and commit it directly to your GitHub repo. 
4. Check your GitHub repository to see your fresh green squares. 🟩

## 🐛 Troubleshooting
* **Nothing is pushing:** Ensure your GitHub PAT hasn't expired and has the correct `repo` permissions. Open the extension popup to re-save your credentials.
* **Extension context invalidated:** If you recently reloaded the extension in the developer dashboard, simply refresh your LeetCode tab to reconnect the content scripts.
* **Check the Logs:** You can view the extension's background activity by going to `chrome://extensions/` and clicking the "service worker" link on the extension card.

## 📬 Contact
Created by [uday-1602](https://github.com/uday-1602). Feel free to open an issue or submit a pull request if you have ideas for improvements!