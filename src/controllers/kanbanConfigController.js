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
  },

  async saveCosts(req, res) {
    try {
      const { ticket_id, amount, label, date } = req.body;
      if (!ticket_id) {
        return res.status(400).json({ message: "L'identifiant du ticket (ticket_id) est manquant." });
      }
      const result = await kanbanConfigService.saveCout(ticket_id, amount, label, date);
      res.json({ message: 'Coût d\'intervention enregistré avec succès !', id: result.id });
    } catch (error) {
      res.status(500).json({ message: 'Erreur interne lors de la sauvegarde du coût' });
    }
  },

  async getAllCosts(req, res) {
    try {
      const data = await kanbanConfigService.getAllCosts();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique des coûts.' });
    }
  },

  async cancelCosts(req, res) {
    const { ticket_id } = req.params; 
    if (!ticket_id) {
      return res.status(400).json({ message: "L'identifiant du ticket (ticket_id) est manquant." });
    }
    try {
      await kanbanConfigService.cancelLastCosts(ticket_id);
      res.json({ message: 'Le dernier coût enregistré a été annulé avec succès.' });
    } catch (error) {
      console.error("Erreur dans cancelCosts:", error);
      res.status(500).json({ message: 'Erreur lors de la suppression du dernier coût.' });
    }
  },

async reopenCosts(req, res) {
    try {
      // 🌟 Extraction de 'mode' depuis le body de la requête
      const { ticket_id, percentage, mode } = req.body; 
      
      if (!ticket_id) {
        return res.status(400).json({ message: "L'identifiant du ticket (ticket_id) est manquant." });
      }
      
      // 🌟 Transmission du mode à ton service de configuration
      const result = await kanbanConfigService.addReopeningCost(ticket_id, percentage, mode);
      res.json({ message: 'Surcoût de réouverture enregistré avec succès !', id: result.id });
    } catch (error) {
      res.status(500).json({ message: 'Erreur interne lors de la réouverture du coût.' });
    }
  },

async resetWholeDatabase(req, res) {
    try {
      await kanbanConfigService.resetFullDatabase();
      res.json({ message: 'La base de données SQLite locale a été intégralement remise à zéro !' });
    } catch (error) {
      console.error("Erreur dans resetWholeDatabase:", error);
      res.status(500).json({ message: 'Erreur interne lors de la remise à zéro complète.' });
    }
  }
};
module.exports = { kanbanConfigController };