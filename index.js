const { exportVariable, getInput } = require('@actions/core');
const fetch = require('node-fetch');

const {
  env: {
    GITHUB_ACTOR,
    GITHUB_REF,
    GITHUB_REPOSITORY,
    GITHUB_SHA,
    SLACK_BOT_TOKEN,
    SLACK_CHANNEL,
    SLACK_MESSAGE_TIMESTAMP,
  },
} = process;

// Pluck branch name from push git ref
const GITHUB_BRANCH = GITHUB_REF.replace(/refs\/heads\//, '');

try {
  if (!SLACK_BOT_TOKEN) {
    throw Error('SLACK_BOT_TOKEN environemnt variable is required');
  }

  if (!SLACK_CHANNEL) {
    throw Error('SLACK_CHANNEL environemnt variable is required');
  }

  const complete = getInput('complete') || false;
  const status =
    getInput('status') || complete === true
      ? 'Workflow complete'
      : 'Workflow running';

  // Create Slack message object
  const body = {
    channel: SLACK_CHANNEL,
    color: complete ? '#32cd32' : '#ffd700',
    attachments: [
      {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${GITHUB_ACTOR} pushed to ${GITHUB_REPOSITORY}\n\n*${status}*`,
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'Workflow' },
                url: `https://github.com/${GITHUB_REPOSITORY}/commit/${GITHUB_SHA}/checks`,
              },
              {
                type: 'button',
                text: { type: 'plain_text', text: 'Repo' },
                url: `https://github.com/${GITHUB_REPOSITORY}`,
              },
              {
                type: 'button',
                text: { type: 'plain_text', text: 'Branch' },
                url: `https://github.com/${GITHUB_REPOSITORY}/tree/${GITHUB_BRANCH}`,
              },
              {
                type: 'button',
                text: { type: 'plain_text', text: 'Commit' },
                url: `https://github.com/${GITHUB_REPOSITORY}/commit/${GITHUB_SHA}`,
              },
            ],
          },
        ],
      },
    ],
  };

  // Set timestamp of message to update if a message has already been sent from this workflow
  if (SLACK_MESSAGE_TIMESTAMP) {
    body.ts = SLACK_MESSAGE_TIMESTAMP;
  }

  // Send or update Slack message
  (async () => {
    const url = SLACK_MESSAGE_TIMESTAMP
      ? 'https://slack.com/api/chat.update'
      : 'https://slack.com/api/chat.postMessage';

    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const { ts } = await res.json();

    // Set SLACK_MESSAGE_TIMESTAMP environment variable so we can update message in future steps of workflow
    exportVariable('SLACK_MESSAGE_TIMESTAMP', ts);

    process.exit(0);
  })();
} catch (err) {
  console.error(err.message);
  console.error(err.response.data);
  process.exit(1);
}
