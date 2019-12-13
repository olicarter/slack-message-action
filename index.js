const core = require('@actions/core');
const fetch = require('node-fetch');

const {
  env: {
    GIPHY_API_KEY,
    GITHUB_ACTOR,
    GITHUB_REF,
    GITHUB_REPOSITORY,
    GITHUB_SHA,
    SLACK_BOT_TOKEN,
    SLACK_CHANNEL,
  },
} = process;

// Pluck branch name from push git ref
const branchName = GITHUB_REF.replace(/refs\/heads\//, '');

// Get blocks input JSON string and replace vars
let blocks = core
  .getInput('blocks')
  .replace(/{{\s*BRANCH\s*}}/g, branchName)
  .replace(/{{\s*ACTOR\s*}}/g, GITHUB_ACTOR)
  .replace(/{{\s*REPOSITORY\s*}}/g, GITHUB_REPOSITORY)
  .replace(/{{\s*SHA\s*}}/g, GITHUB_SHA);

const GIFKeywordRegex = /{{\s*GIF\|(\w+)\s*}}/g;

// Replace GIF variables with random GIF URLs
let GIFKeywords = GIFKeywordRegex.exec(blocks);
var promises = [];
while (GIFKeywords !== null) {
  const GIFKeyword = GIFKeywords[1];
  promises.push(
    new Promise(async function(resolve) {
      const res = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${GIFKeyword}&limit=1`,
        { method: 'GET' },
      );
      const { data } = await res.json();
      const GIFURL = data[0].url;
      blocks.replace(GIFKeywordRegex, GIFURL);
      resolve();
    }),
  );
  GIFKeywords = GIFKeywordRegex.exec(blocks);
}

Promise.all(promises).then(function() {
  // Create Slack message object
  const body = {
    channel: SLACK_CHANNEL,
    attachments: [{ blocks: JSON.parse(blocks) }],
  };

  // Send Slack message
  (async () => {
    console.log('Sending message');
    console.log('body', JSON.stringify(body));
    try {
      await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Message sent');
      process.exit(0);
    } catch (err) {
      console.error(err.message);
      console.error(err.response.data);
      process.exit(1);
    }
  })();
});
