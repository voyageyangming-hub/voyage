/**
 * 執行這個腳本取得 Google Calendar Refresh Token
 * 用法：node get-google-token.js
 *
 * 需要先在 .env.local 填入：
 * GOOGLE_CALENDAR_CLIENT_ID
 * GOOGLE_CALENDAR_CLIENT_SECRET
 */

require('dotenv').config({ path: '.env.local' })
const { google } = require('googleapis')
const readline = require('readline')

const CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('請先在 .env.local 設定 GOOGLE_CALENDAR_CLIENT_ID 和 GOOGLE_CALENDAR_CLIENT_SECRET')
  process.exit(1)
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob'
)

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/calendar'],
})

console.log('\n請在瀏覽器開啟以下網址並授權：\n')
console.log(authUrl)
console.log()

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
rl.question('授權後將 code 貼在這裡：', async (code) => {
  rl.close()
  try {
    const { tokens } = await oauth2Client.getToken(code.trim())
    console.log('\n✅ 成功！請將以下 refresh_token 填入 .env.local：\n')
    console.log('GOOGLE_CALENDAR_REFRESH_TOKEN=' + tokens.refresh_token)
  } catch (err) {
    console.error('取得 token 失敗：', err.message)
  }
})
