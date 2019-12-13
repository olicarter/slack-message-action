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
const blocksContainsGIF = GIFKeywordRegex.test(blocks);

// Replace GIF variables with random GIF URLs
if (blocksContainsGIF) {
  let GIFKeywords = GIFKeywordRegex.exec(blocks);
  var promises = [];
  console.log('blocks', blocks);
  console.log('GIFKeywords', GIFKeywords);
  while (GIFKeywords !== null) {
    const GIFKeyword = GIFKeywords[1];
    console.log('GIFKeyword', GIFKeyword);
    promises.push(
      new Promise(async function(resolve) {
        const res = await fetch(
          `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${GIFKeyword}&limit=1`,
          { method: 'GET' },
        );
        console.log('GIPHY res', res);
        const { data } = await res.json();
        console.log('GIPHY data', data);
        const GIFURL = data[0].url;
        console.log('GIFURL', GIFURL);
        blocks.replace(GIFKeywordRegex, GIFURL);
        GIFKeywords = GIFKeywordRegex.exec(blocks);
        console.log('GIFKeywords', GIFKeywords);
        resolve();
      }),
    );
  }
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
