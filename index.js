const core = require('@actions/core');
const fetch = require('node-fetch');

const {
  env: {
    GITHUB_ACTOR,
    GITHUB_REF,
    GITHUB_REPOSITORY,
    GITHUB_SHA,
    SLACK_BOT_TOKEN,
    SLACK_CHANNEL_ID,
  },
} = process;

// Pluck branch name from push git ref
const branchName = GITHUB_REF.replace(/refs\/heads\//, '');

// Get blocks input JSON string and replace vars
const blocks = core
  .getInput('blocks')
  .replace(/{{\s*BRANCH\s*}}/g, branchName)
  .replace(/{{\s*ACTOR\s*}}/g, GITHUB_ACTOR)
  .replace(/{{\s*REPOSITORY\s*}}/g, GITHUB_REPOSITORY)
  .replace(/{{\s*SHA\s*}}/g, GITHUB_SHA);

// Create Slack message object
const body = {
  payload: {
    channel: SLACK_CHANNEL_ID,
    token: SLACK_BOT_TOKEN,
    attachments: [{ blocks: JSON.parse(blocks) }],
  },
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
