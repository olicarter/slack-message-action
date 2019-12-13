# Send message to Slack action

This action prints "Hello World" or "Hello" + the name of a person to greet to the log.

## Inputs

### `blocks`

**Required** This is the blocks array generated at https://api.slack.com/tools/block-kit-builder.

Make sure double-quotes are escaped, and the string is in one line surrounded by single quotes.

#### Interpolated variables

Certain variables in double braces `{{ VAR_NAME }}` will be interpolated.

- `ACTOR`: The name of the person or app that initiated the workflow. For example, `octocat`.
- `BRANCH`: The name of branch taken from the push git ref. `push` events only.
- `REPOSITORY`: The owner and repository name. For example, `octocat/Hello-World`.
- `SHA`: The commit SHA that triggered the workflow. For example, `ffac537e6cbbf934b08745a378932722df287a53`.

## Example usage

```yaml
uses: actions/slack-message-action@v1
with:
  blocks: '[{\"type\": \"section\",\"text\": {\"type\": \"mrkdwn\",\"text\": \"Some text\"}}]'
```
