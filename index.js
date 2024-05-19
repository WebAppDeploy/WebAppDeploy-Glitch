const express = require('express');
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to handle repository cloning
app.use('/app/:repoName/:user', async (req, res, next) => {
  const { repoName, user } = req.params;
  const repoUrl = `https://github.com/${user}/${repoName}.git`; // Construct the repository URL
  const repoPath = path.join(__dirname, 'repos', user, repoName);

  // Check if the repository is already cloned
  if (!fs.existsSync(repoPath)) {
    try {
      await simpleGit().clone(repoUrl, repoPath);
      console.log(`Repository ${repoName} from user ${user} cloned successfully.`);
    } catch (err) {
      console.error(`Failed to clone repository ${repoName} from user ${user}: ${err.message}`);
      return res.status(500).send(`Error: Unable to download the repository.`);
    }
  }

  // Serve static files from the cloned repository
  app.use(`/app/${repoName}/${user}`, express.static(path.join(repoPath, 'public')));

  next();
});

// Catch-all route to serve index.html or any static files
app.get('/app/:repoName/:user/*', (req, res) => {
  const { repoName, user } = req.params;
  const filePath = path.join(__dirname, 'repos', user, repoName, 'public', req.params[0]);

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(`Error sending file for repository ${repoName} from user ${user}: ${err.message}`);
      res.status(404).send(`Error: File not found.`);
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
