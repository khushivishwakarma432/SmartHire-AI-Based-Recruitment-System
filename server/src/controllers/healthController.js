const getHealthStatus = (req, res) => {
  res.status(200).send('Server is running');
};

module.exports = {
  getHealthStatus,
};
