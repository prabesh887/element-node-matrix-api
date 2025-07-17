const axios = require("axios");
const { synapseMatrixPool } = require("../db/pool");

exports.getUserEmail = async (matrixUserId) => {
  const headers = {
    "x-api-key": process.env.GUARDII_API_KEY,
    "Content-Type": "application/json",
  };

  try {
    const res = await axios.get(
      `${
        process.env.GUARDII_API_URL
      }/api/matrix-user/admin?matrixUserId=${encodeURIComponent(matrixUserId)}`,
      { headers }
    );

    return res.data;
  } catch (error) {
    console.error(
      "Error fetching user email:",
      error.response?.data || error.message
    );
    throw error;
  }
};

exports.addThreePidEmail = async (userId, email) => {
  const currentTimeMs = Date.now();
  const query = `
    INSERT INTO user_threepids (user_id, medium, address, validated_at, added_at)
    VALUES ($1, 'email', $2, $3, $4)
  `;

  await synapseMatrixPool.query(query, [
    userId,
    email,
    currentTimeMs,
    currentTimeMs,
  ]);

  return {
    status: "success",
    user_id: userId,
    medium: "email",
    address: email,
    validated_at: currentTimeMs,
    added_at: currentTimeMs,
  };
};
