import RefreshToken from "../models/RefreshToken.js";

export const createRefreshToken = async (token, userId, expiresAt) => {
  return await RefreshToken.create({ token, user: userId, expiresAt });
};

export const deleteToken = async (tokenStr) => {
  return await RefreshToken.findOneAndDelete({ token: tokenStr });
};

export const findToken = async (tokenStr) => {
  return await RefreshToken.findOne({ token: tokenStr });
};

export const deleteTokenByDoc = async (tokenDoc) => {
    return await tokenDoc.deleteOne();
}
