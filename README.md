# Send message to Slack action

This action sends a Slack message

## Environment Variables

**Required** `SLACK_BOT_TOKEN` The Slack bot user OAuth access token
**Required** `SLACK_CHANNEL` The name of the Slack channel to post to

## Inputs

### `complete`

Default: `false`

A boolean indicating whether workflow is complete. If true, `step` defaults to 'Workflow complete'

### `status`

Default: 'Workflow running' or 'Workflow complete'

A verbal string representing the current status of the workflow

## Example usage

```yaml
name: Send Slack message
  env:
    SLACK_CHANNEL_ID: channel-name
    SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
uses: olicarter/slack-message-action@master
with:
  complete: true
  status: 'Workflow successful'
```
