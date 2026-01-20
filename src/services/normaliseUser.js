// src/services/normaliseUser.js
export const normaliseUser = (raw) => {
  if (!raw) return null;
  const id = raw._id ?? raw.id;
  return { ...raw, id, _id: id };
};
