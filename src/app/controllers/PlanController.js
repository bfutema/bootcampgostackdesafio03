import * as Yup from 'yup';

import Plan from '../models/Plan';
import User from '../models/User';

class PlansController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const plans = await Plan.findAll({
      order: ['created_at'],
      limit: 20,
      offset: (page - 1) * 20,
      attributes: ['id', 'title', 'duration', 'price'],
    });

    return res.json(plans);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      duration: Yup.number().required(),
      price: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res
        .status(400)
        .json({ error: 'Falha na validação, verifique seus dados' });
    }

    const checkIsAdministrator = await User.findOne({
      where: { id: req.userId, administrator: true },
    });

    if (!checkIsAdministrator) {
      return res.status(401).json({
        error: 'Somente usuários administradores podem criar novos planos.',
      });
    }

    const plan = await Plan.create(req.body);

    return res.json(plan);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string(),
      duration: Yup.number(),
      price: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res
        .status(400)
        .json({ erorr: 'Falha na validação, verifique os dados!' });
    }

    const plan = await Plan.findByPk(req.params.id);

    if (!plan) {
      return res
        .status(401)
        .json({ error: 'Este plano ainda não foi cadastrado!' });
    }

    const { id, title, duration, price } = await plan.update(req.body);

    return res.json({
      id,
      title,
      duration,
      price,
    });
  }

  async delete(req, res) {
    const plan = await Plan.findByPk(req.params.id);

    const user = await User.findByPk(req.userId);

    if (!user.administrator) {
      return res.status(401).json({
        error: 'Você não tem permissão para deletar um plano.',
      });
    }

    await Plan.destroy({
      where: { id: plan.id },
    });

    return res.json({
      success: true,
      message: 'Plano deletado com sucesso!',
    });
  }
}
export default new PlansController();
