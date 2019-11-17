import * as Yup from 'yup';

import User from '../models/User';
import Student from '../models/Student';

class StudentController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().required(),
      age: Yup.required(),
      weight: Yup.required(),
      height: Yup.required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res
        .status(401)
        .json({ error: 'Falha na validação, verifique seus dados!' });
    }

    const user = await User.findByPk(req.userId);

    if (!user.administrator) {
      return res.status(401).json({
        error: 'Apenas usuários administradores podem cadastrar os alunos!',
      });
    }

    const { email } = req.body;

    const studentExists = await Student.findOne({ where: { email } });

    if (studentExists) {
      return res
        .status(401)
        .json({ error: 'Este estudante já foi cadastrado!' });
    }

    const { id, name, age, weight, height } = await Student.create(req.body);

    return res.json({
      id,
      name,
      email,
      age,
      weight,
      height,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.email().string(),
    });

    if (!(await schema.isValid(req.body))) {
      return res
        .status(401)
        .json({ error: 'Falha na validação, verifique seus dados!' });
    }

    const user = await User.findByPk(req.userId);

    if (!user.administrator) {
      return res.status(401).json({
        error: 'Apenas usuários administradores podem editar os registros!',
      });
    }

    const { email } = req.body;

    const studentExists = await Student.findOne({ where: { email } });

    if (!studentExists) {
      return res
        .status(401)
        .json({ error: 'Este aluno ainda não foi cadastrado!' });
    }

    const { id, name, age, weight, height } = await Student.update(req.body);

    return res.json({
      id,
      name,
      email,
      age,
      weight,
      height,
    });
  }
}

export default new StudentController();
