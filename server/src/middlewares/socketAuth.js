import { verifyAuthToken } from "./authMiddleware.js";

const parseCookieHeader = (cookieHeader = "") => {
  return cookieHeader.split(";").reduce((cookies, cookiePair) => {
    const [key, value] = cookiePair.split("=").map((item) => item && item.trim());
    if (key && value) {
      cookies[key] = decodeURIComponent(value);
    }
    return cookies;
  }, {});
};

const socketAuth = async (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie;
    const cookies = parseCookieHeader(cookieHeader);
    const token = cookies.token;

    const user = await verifyAuthToken(token);
    socket.user = user;
    next();
  } catch (error) {
    console.error("Socket authentication failed:", error.message);
    next(new Error("Invalid token"));
  }
};

export default socketAuth;
