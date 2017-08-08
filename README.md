# Reddit Digest

Send yourself a weekly email with top posts from your selected subreddits.

See [docs/index.html](https://mbixby.github.io/reddit-digest/) for an example.

## Setup

1. copy config.example.js to config.js
  - `top8` / `top4` is a list of subreddits with top 8 or 4 posts. `biweeklyTop4` is for less active subreddits.
  - update sendmail config as needed
2. add `0 18 * * 5 node /path/to/reddit-digest` to crontab
3. make sure it doesn't end up in spam
  - if using Google Mail, go to Settings > Filters, search by `bot@redditdigest.com` sender and create a filter to never send it to spam
4. read the code in `index.js` to make sure I don't install a keylogger on your system
  - it's fine, you probably have one already anyway
4. run `node index.js` to test

Star the project if you want to make this easy to use.
