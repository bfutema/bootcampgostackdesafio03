import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, addMonths } from 'date-fns';
import User from '../models/User';
import Student from '../models/Student';
import Plan from '../models/Plan';
import Enrollment from '../models/Enrollment';

import WelcomeMail from '../jobs/WelcomeMail';
import Queue from '../../lib/Queue';

class EnrollmentController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const enrollments = await Enrollment.findAll({
      order: ['created_at'],
      limit: 20,
      offset: (page - 1) * 20,
      attributes: ['id', 'start_date', 'end_date', 'price'],
      include: [
        {
          model: Plan,
          as: 'plan',
          attributes: ['id', 'title', 'duration', 'price'],
        },
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email', 'age', 'weight', 'height'],
        },
      ],
    });

    return res.json(enrollments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      start_date: Yup.date().required(),
      plan_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res
        .status(400)
        .json({ error: 'Falha na validação, verifique seus dados!' });
    }

    const user = await User.findByPk(req.userId);

    if (!user.administrator) {
      return res.status(401).json({
        error: 'Apenas administradores podem criar matrículas.',
      });
    }

    const { student_id, plan_id, start_date } = req.body;

    const dateStart = startOfHour(parseISO(start_date));

    if (isBefore(dateStart, new Date())) {
      return res
        .status(400)
        .json({ error: 'Datas passadas não são permitidas.' });
    }

    const student = await Student.findByPk(student_id);

    if (!student) {
      return res.status(400).json({ error: 'Aluno não encontrado!' });
    }

    const planExists = await Plan.findByPk(plan_id);

    if (!planExists) {
      return res.status(400).json({ error: 'Plano não encontrado!' });
    }

    const dateEnd = addMonths(dateStart, planExists.duration);
    const totalPrice = planExists.price * planExists.duration;

    const enrollment = await Enrollment.create({
      student_id,
      plan_id,
      start_date: dateStart,
      end_date: dateEnd,
      price: totalPrice,
    });

    const enrollmentDetails = await Enrollment.findOne({
      where: { student_id },
      attributes: ['id', 'start_date', 'end_date', 'price'],
      include: [
        {
          model: Plan,
          as: 'plan',
          attributes: ['id', 'title', 'duration', 'price'],
        },
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email', 'age', 'weight', 'height'],
        },
      ],
    });

    await Queue.add(WelcomeMail.key, {
      enrollmentDetails,
    });

    return res.json(enrollment);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      start_date: Yup.date(),
      plan_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res
        .status(400)
        .json({ error: 'Falha na validação, verifique seus dados!' });
    }

    return res.json({ message: 'Rota de atualização' });
  }

  async delete(req, res) {
    const enrollment = await Enrollment.findByPk(req.params.id, {
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['name', 'email'],
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['title', 'duration', 'price'],
        },
      ],
      attributes: ['id', 'start_date', 'end_date', 'price', 'cancelled_at'],
    });

    const user = await User.findByPk(req.userId);

    if (!user.administrator) {
      return res.status(401).json({
        error: 'Apenas administradores podem cancelar uma matrícula.',
      });
    }

    if (enrollment.cancelled_at !== null) {
      return res
        .status(401)
        .json({ error: 'Essa matrícula já foi cancelada!' });
    }

    enrollment.cancelled_at = new Date();

    await enrollment.save();

    return res.json(enrollment);
  }
}

export default new EnrollmentController();
