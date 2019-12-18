const core = require('@actions/core');
const fetch = require('node-fetch');

const {
  env: {
    EVENT_CONTEXT,
    GITHUB_ACTOR,
    GITHUB_REF,
    GITHUB_REPOSITORY,
    GITHUB_SHA,
    SLACK_BOT_TOKEN,
    SLACK_CHANNEL,
  },
} = process;

const { commits = [], pusher = {}, sender = {} } =
  JSON.parse(EVENT_CONTEXT) || {};

// Pluck branch name from push git ref
const BRANCH_NAME = GITHUB_REF.replace(/refs\/heads\//, '');

let status = core.getInput('status').toLowerCase();
const ts = core.getInput('ts');

const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

let color;

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

const actorString = sender.html_url
  ? `<${sender.html_url}|${GITHUB_ACTOR}>`
  : GITHUB_ACTOR;

let commitsString = '';
commits.forEach(({ message, url }) => {
  commitsString += `\n- <${url}|${message}>`;
});

// Create Slack message object
const body = {
  channel: SLACK_CHANNEL,
  as_user: false,
  icon_url: sender.avatar_url,
  username: pusher.name,
  attachments: [
    {
      color,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${actorString} pushed to <https://github.com/${GITHUB_REPOSITORY}/tree/${BRANCH_NAME}|${GITHUB_REPOSITORY}>${commitsString}`,
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
