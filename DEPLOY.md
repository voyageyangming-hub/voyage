# 部署指南

## 步驟 1：建立 Supabase 資料庫

1. 前往 https://supabase.com 建立免費帳號與新專案
2. 進入 SQL Editor，執行 `supabase-schema.sql` 的內容
3. 到 Project Settings → API，複製：
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

## 步驟 2：取得 Google Calendar API 憑證

1. 前往 https://console.cloud.google.com 建立專案
2. 啟用 Google Calendar API
3. 建立 OAuth 2.0 用戶端 ID（類型：桌面應用程式）
4. 下載 credentials.json，執行以下指令取得 Refresh Token：

```bash
node get-google-token.js
```

5. 複製輸出的 refresh_token

## 步驟 3：部署到 Vercel

1. 將此資料夾推送到 GitHub
2. 前往 https://vercel.com，Import 此 repo
3. 在 Environment Variables 填入所有 .env.example 的欄位：

| 變數名稱 | 說明 |
|---------|------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase Project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anon key |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key |
| LINE_CHANNEL_ID | LINE Messaging API Channel ID |
| LINE_CHANNEL_SECRET | LINE Channel Secret |
| LINE_CHANNEL_ACCESS_TOKEN | LINE Channel Access Token |
| GOOGLE_CALENDAR_CLIENT_ID | Google OAuth Client ID |
| GOOGLE_CALENDAR_CLIENT_SECRET | Google OAuth Client Secret |
| GOOGLE_CALENDAR_REFRESH_TOKEN | Google Refresh Token |
| GOOGLE_CALENDAR_ID | voyageyangming@gmail.com |
| ADMIN_PASSWORD | 自訂管理後台密碼 |
| CRON_SECRET | 自訂排程安全金鑰（任意字串）|
| NEXT_PUBLIC_APP_URL | 部署後的網址（例如 https://voyage-booking.vercel.app）|

4. 部署完成後，到 LINE Developers → Messaging API → Webhook URL，設定為：
   `https://你的網址.vercel.app/api/webhook/line`

## 頁面網址

- 預約表單：`/`
- 預約成功：`/success?id=xxx`
- 管理後台：`/admin`
