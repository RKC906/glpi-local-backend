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

  // 🛠️ ACTION 1 : ANNULATION (Supprime la dernière ligne)
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

  // 🛠️ ACTION 2 : RÉOUVERTURE (Calcule et insère le pourcentage)
  async reopenTicket(req, res) {
    const { ticket_id, percentage } = req.body;
    if (!ticket_id) {
      return res.status(400).json({ message: "L'identifiant du ticket est manquant." });
    }
    try {
      const lastCostRow = await kanbanConfigService.getLastCost(ticket_id);
      const lastCostAmount = lastCostRow ? parseFloat(lastCostRow.amount || 0) : 0;

      // Calcul du montant basé sur le pourcentage renseigné
      const calculatedReopenAmount = lastCostAmount * (parseFloat(percentage || 0) / 100);

      // Enregistrement de la nouvelle ligne avec le label distinctif 'Réouverture'
      await kanbanConfigService.saveCout(
        ticket_id,
        calculatedReopenAmount,
        'Réouverture',
        new Date().toISOString().slice(0, 10)
      );

      res.json({
        message: 'Ticket réouvert. Coût de réouverture enregistré.',
        addedAmount: calculatedReopenAmount
      });
    } catch (error) {
      console.error("Erreur dans reopenTicket:", error);
      res.status(500).json({ message: 'Erreur lors de l\'application du coût de réouverture.' });
    }
  }
};

module.exports = { kanbanConfigController };
