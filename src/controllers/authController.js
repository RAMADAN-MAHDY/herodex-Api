import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import { registerSchema, loginSchema, googleLoginSchema } from '../validators/userValidator.js';
import axios from 'axios';
import crypto from 'crypto';

const GOOGLE_AUTH_BASE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

const getOauthStateSecret = () => process.env.GOOGLE_OAUTH_STATE_SECRET || process.env.JWT_SECRET || '';

const createSignedState = () => {
  const secret = getOauthStateSecret();
  if (!secret) return '';

  const issuedAt = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = `${issuedAt}.${nonce}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${signature}`;
};

const verifySignedState = (state, maxAgeMs = 10 * 60 * 1000) => {
  const secret = getOauthStateSecret();
  if (!secret) return false;
  if (!state || typeof state !== 'string') return false;

  const parts = state.split('.');
  if (parts.length !== 3) return false;

  const [issuedAt, nonce, signature] = parts;
  if (!issuedAt || !nonce || !signature) return false;

  const issuedAtMs = Number(issuedAt);
  if (!Number.isFinite(issuedAtMs)) return false;
  if (Date.now() - issuedAtMs > maxAgeMs) return false;

  const payload = `${issuedAt}.${nonce}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
};

const appendQueryParams = (baseUrl, params) => {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
};

const getGoogleRedirectUri = (req) =>
  process.env.GOOGLE_CALLBACK_URL || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

export const loginUser = async (req, res) => {
  const { error } = loginSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return errorResponse(res, 'Validation Error', errorMessages, 400);
  }

  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.comparePassword(password))) {
    return successResponse(res, 'Login successful', {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } else {
    return errorResponse(res, 'Invalid email or password', [], 401);
  }
};

export const registerUser = async (req, res) => {
  const { error } = registerSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return errorResponse(res, 'Validation Error', errorMessages, 400);
  }

  const { name, email, password, role } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists) return errorResponse(res, 'User already exists', [], 400);

  const user = await User.create({ name, email, password, role });
  if (user) {
    return successResponse(res, 'User registered', {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    }, 201);
  } else {
    return errorResponse(res, 'Invalid user data', [], 400);
  }
};

export const googleLogin = async (req, res) => {
  const { error } = googleLoginSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return errorResponse(res, 'Validation Error', errorMessages, 400);
  }

  const { email, name } = req.body;
  let user = await User.findOne({ email });

  if (!user) {
    const randomPassword = crypto.randomBytes(32).toString('hex');
    user = await User.create({
      name,
      email,
      password: randomPassword,
      role: 'user',
    });
  }

  return successResponse(res, 'Login successful', {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id)
  });
};

export const googleAuthStart = async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return errorResponse(res, 'Google OAuth is not configured', ['GOOGLE_CLIENT_ID is missing'], 500);

  const redirectUri = getGoogleRedirectUri(req);
  const state = createSignedState();
  if (!state) return errorResponse(res, 'Google OAuth is not configured', ['GOOGLE_OAUTH_STATE_SECRET (or JWT_SECRET) is missing'], 500);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'consent'
  });

  const authUrl = `${GOOGLE_AUTH_BASE_URL}?${params.toString()}`;
  return res.redirect(authUrl);
};

export const googleAuthCallback = async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return errorResponse(res, 'Google OAuth is not configured', ['GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET is missing'], 500);
  }

  const { code, state, error } = req.query;

  const failureRedirect = process.env.GOOGLE_AUTH_FAILURE_REDIRECT || process.env.FRONTEND_URL;
  const successRedirect = process.env.GOOGLE_AUTH_SUCCESS_REDIRECT || process.env.FRONTEND_URL;

  if (error) {
    if (failureRedirect) return res.redirect(appendQueryParams(failureRedirect, { error: String(error) }));
    return errorResponse(res, 'Google OAuth failed', [String(error)], 400);
  }

  if (!code || typeof code !== 'string') {
    if (failureRedirect) return res.redirect(appendQueryParams(failureRedirect, { error: 'missing_code' }));
    return errorResponse(res, 'Google OAuth failed', ['Missing code'], 400);
  }

  if (!verifySignedState(state)) {
    if (failureRedirect) return res.redirect(appendQueryParams(failureRedirect, { error: 'invalid_state' }));
    return errorResponse(res, 'Google OAuth failed', ['Invalid state'], 400);
  }

  try {
    const redirectUri = getGoogleRedirectUri(req);

    const tokenResponse = await axios.post(
      GOOGLE_TOKEN_URL,
      new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token: accessToken } = tokenResponse.data || {};
    if (!accessToken) {
      if (failureRedirect) return res.redirect(appendQueryParams(failureRedirect, { error: 'missing_access_token' }));
      return errorResponse(res, 'Google OAuth failed', ['Missing access token'], 400);
    }

    const userinfoResponse = await axios.get(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const { email, email_verified: emailVerified, name, picture } = userinfoResponse.data || {};

    if (!email) {
      if (failureRedirect) return res.redirect(appendQueryParams(failureRedirect, { error: 'missing_email' }));
      return errorResponse(res, 'Google OAuth failed', ['Missing email'], 400);
    }

    if (emailVerified === false) {
      if (failureRedirect) return res.redirect(appendQueryParams(failureRedirect, { error: 'email_not_verified' }));
      return errorResponse(res, 'Google OAuth failed', ['Email is not verified'], 400);
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: crypto.randomBytes(32).toString('hex'),
        avatar: picture || '',
        role: 'user'
      });
    } else if (!user.avatar && picture) {
      user.avatar = picture;
      await user.save();
    }

    const token = generateToken(user._id);

    if (successRedirect) {
      return res.redirect(appendQueryParams(successRedirect, { token, provider: 'google' }));
    }

    return successResponse(res, 'Login successful', {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    });
  } catch (e) {
    const failureRedirect2 = process.env.GOOGLE_AUTH_FAILURE_REDIRECT || process.env.FRONTEND_URL;
    if (failureRedirect2) return res.redirect(appendQueryParams(failureRedirect2, { error: 'oauth_exchange_failed' }));
    return errorResponse(res, 'Google OAuth failed', [e?.message || 'OAuth exchange failed'], 500);
  }
};

export const getMe = async (req, res) => {
  if (!req.user) return errorResponse(res, 'Not authorized', [], 401);

  return successResponse(res, 'User fetched', {
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    avatar: req.user.avatar || ''
  });
};
