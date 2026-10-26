// The deployed build: the git commit on Vercel, a fixed value when developing.
export const APP_VERSION = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.VERCEL_DEPLOYMENT_ID ?? "dev";
