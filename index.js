const core = require('@actions/core');
const fetch = require('node-fetch');

const {
  env: {
    GITHUB_ACTOR,
    GITHUB_REF,
    GITHUB_REPOSITORY,
    GITHUB_SHA,
    SLACK_BOT_TOKEN,
    SLACK_CHANNEL,
  },
} = process;

// Pluck branch name from push git ref
const BRANCH_NAME = GITHUB_REF.replace(/refs\/heads\//, '');

let status = core.getInput('status');
const ts = core.getInput('ts');

const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

let color;

console.log('status', status);
console.log('status == success', status == 'success');
console.log('status.trim == success', status.trim() == 'success');
console.log(
  'status.lc.trim == success',
  status.toLowerCase().trim() == 'success',
);

if (status == 'success') {
  color = '#32CD32'; // limegreen
} else if (status == 'failure') {
  color = '#DC143C'; // crimson
} else if (status == 'cancelled') {
  color = '#DDDDDD'; // default Slack attachment grey color
} else {
  color = '#FFD700'; // gold
  status += '...';
}

console.log('color', color);

// Create Slack message object
const body = {
  channel: SLACK_CHANNEL,
  attachments: [
    {
      color,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${GITHUB_ACTOR} pushed to ${GITHUB_REPOSITORY}`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: capitalize(status),
            },
          ],
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Workflow' },
              url: `https://github.com/${GITHUB_REPOSITORY}/commit/${GITHUB_SHA}/checks`,
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Repo' },
              url: `https://github.com/${GITHUB_REPOSITORY}`,
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Branch' },
              url: `https://github.com/${GITHUB_REPOSITORY}/tree/${BRANCH_NAME}`,
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Commit' },
              url: `https://github.com/${GITHUB_REPOSITORY}/commit/${GITHUB_SHA}`,
            },
          ],
        },
      ],
    },
  ],
};

// If message has already been posted to Slack, update existing message
if (ts) body.ts = ts;

// Send Slack message
(async () => {
  console.log('Sending message');
  try {
    const url = `https://slack.com/api/chat.${ts ? 'update' : 'postMessage'}`;
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();
    if (!ts) core.setOutput('ts', data.ts.trim());
    console.log('Message sent');
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    console.error(err.response.data);
    process.exit(1);
  }
})();
