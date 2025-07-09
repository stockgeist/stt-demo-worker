# Deployment Guide

This project uses GitHub Actions to automatically deploy to Cloudflare Workers for the STT Demo Proxy.

## Prerequisites

1. A Cloudflare account with Workers enabled
2. A GitHub repository with this code

## Setup

### 1. Get Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **My Profile** → **API Tokens**
3. Click **Create Token**
4. Use the **Custom token** template
5. Configure the token with the following permissions:
   - **Account** → **Cloudflare Workers** → **Edit**
   - **Zone** → **Zone** → **Read** (if using custom domains)
6. Set the **Account Resources** to include your account
7. Create the token and copy it

### 2. Get Cloudflare Account ID

1. In the Cloudflare Dashboard, look at the URL when you're logged in
2. The Account ID is the 32-character string in the URL: `https://dash.cloudflare.com/<ACCOUNT_ID>`
3. Copy this Account ID

### 3. Set GitHub Secrets and Variables

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**

#### Secrets (for sensitive data):

3. Click **New repository secret** and add:

   - **Name**: `CLOUDFLARE_API_TOKEN`
     **Value**: Your Cloudflare API token from step 1

   - **Name**: `STT_TOKEN`
     **Value**: Your STT token value

#### Variables (for non-sensitive data):

4. Click **Variables** tab, then **New repository variable** and add:

   - **Name**: `CLOUDFLARE_ACCOUNT_ID`
     **Value**: Your Cloudflare Account ID from step 2

## Deployment Process

The GitHub Actions workflow will:

1. **On Pull Requests**: Run tests to ensure code quality
2. **On Push to main/master**:
   - Run tests
   - Deploy to Cloudflare Workers if tests pass

## Manual Deployment

If you need to deploy manually:

```bash
# Install dependencies
pnpm install

# Deploy to Cloudflare Workers
pnpm deploy
```

## Environment Variables

The following environment variables are configured in `wrangler.jsonc`:

- `STT_URL`: Speech-to-text service URL

### Setting up STT_TOKEN as a Cloudflare Secret

For security, the `STT_TOKEN` is stored as a Cloudflare secret rather than in the configuration file. To set it up:

```bash
# Set the STT token as a secret
wrangler secret put STT_TOKEN
```

When prompted, enter your STT token value: `nt-stt-158796341514457`

### Alternative: Set via GitHub Actions

You can also set the secret via GitHub Actions by adding it to your repository secrets:

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Add a new secret:
   - **Name**: `STT_TOKEN`
   - **Value**: Your STT token value
3. Update the GitHub Actions workflow to set the secret during deployment

## Troubleshooting

### Common Issues

1. **Authentication Error**: Ensure your `CLOUDFLARE_API_TOKEN` has the correct permissions
2. **Account ID Error**: Verify your `CLOUDFLARE_ACCOUNT_ID` is correct
3. **Build Failures**: Check that all dependencies are properly installed and tests pass

### Logs

- GitHub Actions logs are available in the **Actions** tab of your repository
- Cloudflare Workers logs are available in the Cloudflare Dashboard under **Workers** → **stt-demo-proxy** → **Logs**
