const { kanbanConfigService } = require('../services/kanbanConfigService');

const kanbanConfigController = {
  async getSettings(req, res) {
    try {
      const data = await kanbanConfigService.getConfig();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Erreur interne du serveur' });
    }
  },

  async saveSettings(req, res) {
    try {
      const { colors, currentLang } = req.body;
      await kanbanConfigService.saveConfig({ colors, currentLang });
      res.json({ message: 'Configuration enregistrée avec succès !' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur interne lors de la sauvegarde' });
    }
  }
};

module.exports = { kanbanConfigController };