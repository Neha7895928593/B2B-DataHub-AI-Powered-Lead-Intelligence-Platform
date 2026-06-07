type AiErrorLike = {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
  message?: string;
};

const normalize = (value: string) => value.toLowerCase();

export const getFriendlyAiErrorMessage = (error: unknown, fallback = "AI is temporarily unavailable. Please try again in a moment.") => {
  const rawMessage =
    ((error as AiErrorLike)?.response?.data?.error ||
      (error as AiErrorLike)?.response?.data?.message ||
      (error as AiErrorLike)?.message ||
      fallback).trim();

  const message = normalize(rawMessage);

  if (
    message.includes("quota") ||
    message.includes("limit exceeded") ||
    message.includes("rate limit") ||
    message.includes("resource exhausted") ||
    message.includes("too many requests")
  ) {
    return "AI usage limit reached for now. Please try again later.";
  }

  if (
    message.includes("invalid api key") ||
    message.includes("api key invalid") ||
    message.includes("not configured") ||
    message.includes("expired")
  ) {
    return "AI is not configured correctly right now. Please check the API key on the server.";
  }

  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("connect") ||
    message.includes("timeout")
  ) {
    return "AI service connection is slow or unavailable. Please retry shortly.";
  }

  if (rawMessage && rawMessage !== fallback) {
    return rawMessage;
  }

  return fallback;
};
