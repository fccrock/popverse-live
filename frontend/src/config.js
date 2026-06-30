// Central API config - fallback ensures deployed app always hits real backend
// VITE_API_BASE_URL should be set in Amplify env vars, but this fallback catches any gaps
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://popverse.ap-south-1.elasticbeanstalk.com";
