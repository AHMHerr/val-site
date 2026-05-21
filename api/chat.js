module.exports = async (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  res.status(200).json({ 
    hasKey: !!key,
    keyStart: key ? key.substring(0, 10) : 'VAZIO'
  });
};
