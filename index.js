const _ = require('lodash')
const path = require('path')
const nodemailer = require('nodemailer')
const { getDate, format: formatDate } = require('date-fns')
const config = require('./config')
const request = require('request-promise-native')

const { top8, top4, biweeklyTop4 } = config
const sections = [top8, top4, biweeklyTop4[getDate > 15 ? 1 : 0]]

const baseUrl = 'https://www.reddit.com'

const EmailTemplate = require('email-templates').EmailTemplate
const templateDir = path.join(__dirname, 'template')

async function fetchTopPosts({ subreddit, limit = 4, period = 'week' }){
  const uri = `/r/${subreddit}/top.json`
  const serializedPayload = await request.get({ baseUrl, uri, qs: { t: period, limit } })
  const payload = JSON.parse(serializedPayload)
  return _.merge(payload, {
    data: {
      children: _.map(payload.data.children, (post) => ({
        data: {
          imageUrl: extractImageUrl(post.data.url)
        }
      }))
    }
  })
}

function sendDigestEmail({ html }){
  const transporter = nodemailer.createTransport({
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail'
  })
  transporter.sendMail({
    from: `Reddit Digest <${config.sendmail.from}>`,
    to: config.sendmail.to,
    subject: `Reddit Digest for ${formatDate(new Date, 'dddd D MMMM')}`,
    html
  }, (err, info) => {
    console.log(info.envelope)
  })
}

function extractImageUrl(url){
  const imageUrl = url.replace(/^https?:\/\/(imgur.*)/, 'https://i.$1.jpg')
  return imageUrl.match(/\.(jpg|png|gif)$/) ? imageUrl : null
}

async function main(){
  const allSubreddits = _.flatten([...sections, 'pics'])
  const fetchSubredditData = _.map(allSubreddits, function(subreddit){
    const limit = _.includes(top8, subreddit) ? 8 : 4
    const period = _.includes(biweeklyTop4, subreddit) ? 'month' : 'week'
    return fetchTopPosts({ subreddit, limit })
  })
  const subredditData = await Promise.all(fetchSubredditData)

  const templateContext = {
    sections: sections.map(subreddits =>
      _.fromPairs(_.map(subreddits, subreddit =>
        [subreddit, subredditData[allSubreddits.indexOf(subreddit)]]
      ))
    ),
    pics: subredditData[allSubreddits.indexOf('pics')],
    extractImageUrl,
    currentDate: new Date()
  }

  const newsletter = new EmailTemplate(templateDir)
  newsletter.render(templateContext, function (err, result) {
    // require('fs').writeFileSync('docs/index.html', result.html)
    sendDigestEmail({ html: result.html })
  })
}

main()