module.exports = (req, res) => {
  if (req.method === "GET") {
    return res.status(200).json({
      mensaje: "Webhook Grajalito activo"
    });
  }

  return res.status(200).json({
    fulfillmentText: "Webhook funcionando desde Vercel."
  });
};