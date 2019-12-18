# Send message to Slack action

Posts and updates messages in Slack.

## Environment Variables

**Required** `SLACK_BOT_TOKEN` The Slack bot user OAuth access token
**Required** `SLACK_CHANNEL` The name of the Slack channel to post to
**Required** `EVENT_PAYLOAD` Value must be `${{ github.event }}`

## Inputs

### `status`

Type: `string`
**Required**

The current status of the check run. Auto-capitalises string.

### `ts`

Type: `number`

The timestamp of a posted Slack message. This can be obtained by assigning an `id` to the first Slack notification step of this job, then setting the value of `ts` using `${{ steps.{ID}.outputs.ts }}`. See example below.

## Example usage

```yaml
jobs:
  build:
    runs_on: ubuntu-latest
    env:
      SLACK_CHANNEL_ID: channel-name
      SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
    steps:
      - name: Notify Slack of check run starting
        id: message
        uses: olicarter/slack-message-action@master
        with:
          status: Check run starting

      - name: Notify Slack of build starting
        uses: olicarter/slack-message-action@master
        with:
          status: Building
          ts: ${{ steps.message.outputs.ts }}
```
