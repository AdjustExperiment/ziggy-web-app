# Welcome to the Ziggy Web-App

## Ownership & Copyright

**© 2011-2025 Justus Aryani. All Rights Reserved.**

The Ziggy Online Debate platform, including all source code, designs, user interfaces, and intellectual property, is the exclusive creative work and property of Justus Aryani. Licensed for operation under Galactic Horizons LLC – Series 1 – Ziggy Online Debate, Protected Series.

Unauthorized copying, modification, or distribution is strictly prohibited.

---

## Project info

[<img alt="Deployed with FTP Deploy Action" src="https://img.shields.io/badge/Deployed With-FTP DEPLOY ACTION-%3CCOLOR%3E?style=for-the-badge&color=0077b6">](https://github.com/SamKirkland/FTP-Deploy-Action)

 **URL**: newsite.ziggyonlinedebate.com

## How can I edit this code?

There are several ways of editing this application.

**Use Lovable** 

If you want to make easy, AI-prompted edits, feel free to use Lovable AI. Simply reach out and ask for user credentials, and you will be able to push automatic updates via a prompt-line or typescript edits. Simply visit the [Lovable Project](https://lovable.dev/projects/a22e01e1-f2bf-4852-a270-d223c2e06c1a) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use a preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

This is naturally more complex, but is quite easy with basic IDE experience. 

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Prayer

## How can I deploy this project?


**Option 1: Manual cPanel Upload**

1. **Generate the site files:**
   - Go to the [Actions tab](../../actions) in this GitHub repository
   - Click on "Manual Export" in the left sidebar
   - Click "Run workflow" → "Run workflow" button
   - Wait for the workflow to complete (green checkmark)

2. **Download the site archive:**
   - Click on the completed workflow run
   - In the "Artifacts" section, download `site-dist`
   - Extract the `site-dist.zip` file on your computer

3. **Upload to cPanel:**
   - Log into your cPanel File Manager
   - Navigate to your domain's document root (usually `public_html/` or similar)
   - **Important:** Enable "Show Hidden Files" in File Manager settings
   - Upload the `site-dist.zip` file to the document root
   - Extract the ZIP file directly in the document root
   - Verify that `index.html` and `.htaccess` are now in the document root
   - Delete the uploaded ZIP file (optional cleanup)
   - Test your site - both the homepage and deep links should work

**Note:** As of 9/8/25, the 'Build and Deploy' function makes the manual export obselete. It automatically pushes a fresh version of the build everytime a commit is added via github or lovable via FTPS.

-Justus


