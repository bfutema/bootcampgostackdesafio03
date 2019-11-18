import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class WelcomeMail {
  get key() {
    return 'WelcomeMail';
  }

  async handle({ data }) {
    const { enrollmentDetails } = data;

    await Mail.sendMail({
      to: `${enrollmentDetails.student.name} <${enrollmentDetails.student.email}>`,
      subject: 'Bem vindo!',
      template: 'welcome',
      context: {
        student: enrollmentDetails.student.name,
        plan: enrollmentDetails.plan,
        endDate: format(
          parseISO(enrollmentDetails.end_date),
          "'dia' dd 'de' MMMM' de' yyyy",
          { locale: pt }
        ),
        price: enrollmentDetails.price,
      },
    });
  }
}

export default new WelcomeMail();
