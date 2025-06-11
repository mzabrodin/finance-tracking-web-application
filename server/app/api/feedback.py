
from flask import Blueprint, request, current_app
from flask_mail import Mail, Message
from pydantic import BaseModel, ValidationError, EmailStr, validator
from datetime import datetime
import os

from app.utils.responses import create_response
from app.utils.decorators import logged_in_required
from app.models.user_model import User
from flask_jwt_extended import get_jwt_identity
from app import mail  # Імпортуємо глобальний mail

# Створюємо Blueprint
feedback = Blueprint('feedback', __name__)

# Pydantic схема для валідації
class FeedbackSchema(BaseModel):
    name: str
    email: EmailStr
    rating: int
    feedback: str
    category: str

    class Config:
        str_strip_whitespace = True

    @validator('rating')
    def validate_rating(cls, v):
        v = int(v) if isinstance(v, str) else v
        if not 1 <= v <= 5:
            raise ValueError('Rating має бути від 1 до 5')
        return v

def create_admin_html_template(feedback_data):
    """HTML шаблон для адміністратора"""
    category_names = {
        'general': 'Загальний відгук',
        'bug': 'Повідомлення про помилку',
        'feature': 'Пропозиція функції',
        'ui': 'Інтерфейс користувача',
        'performance': 'Продуктивність'
    }
    rating_stars = '★' * feedback_data['rating'] + '☆' * (5 - feedback_data['rating'])

    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">🎯 Новий відгук від користувача</h2>
        <h3>👤 Контактна інформація</h3>
        <p><strong>Ім'я:</strong> {feedback_data['name']}</p>
        <p><strong>Email:</strong> {feedback_data['email']}</p>
        <p><strong>Дата:</strong> {datetime.now().strftime('%d.%m.%Y о %H:%M')}</p>
        <h3>📊 Деталі відгуку</h3>
        <p><strong>Категорія:</strong> {category_names.get(feedback_data['category'], feedback_data['category'])}</p>
        <p><strong>Оцінка:</strong> {rating_stars} ({feedback_data['rating']}/5)</p>
        <h3>💬 Текст відгуку</h3>
        <p>{feedback_data['feedback']}</p>
        <hr>
        <p style="font-size: 0.9em; color: #666;">
            💡 <em>Ви можете відповісти безпосередньо на цей email - відповідь піде користувачу.</em>
        </p>
        <p style="font-size: 0.9em; color: #666;">
            Цей email було автоматично згенеровано системою зворотного зв'язку.
        </p>
    </div>
    """

def create_admin_text_template(feedback_data):
    """Текстовий шаблон для адміністратора"""
    category_names = {
        'general': 'Загальний відгук',
        'bug': 'Повідомлення про помилку',
        'feature': 'Пропозиція функції',
        'ui': 'Інтерфейс користувача',
        'performance': 'Продуктивність'
    }

    return f"""
🎯 НОВИЙ ВІДГУК ВІД КОРИСТУВАЧА

👤 КОНТАКТНА ІНФОРМАЦІЯ:
Ім'я: {feedback_data['name']}
Email: {feedback_data['email']}
Дата: {datetime.now().strftime('%d.%m.%Y о %H:%M')}

📊 ДЕТАЛІ ВІДГУКУ:
Категорія: {category_names.get(feedback_data['category'], feedback_data['category'])}
Оцінка: {feedback_data['rating']}/5

💬 ТЕКСТ ВІДГУКУ:
{feedback_data['feedback']}

---
Цей email було автоматично згенеровано системою зворотного зв'язку.
Ви можете відповісти безпосередньо на цей email.
    """

def create_user_confirmation_template(feedback_data):
    """HTML шаблон підтвердження для користувача"""
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">✅ Дякуємо за ваш відгук!</h2>
        <p style="font-size: 1.1em;">Ваша думка дуже важлива для нас</p>
        <p>Шановний(на) {feedback_data['name']},</p>
        <p>Дякуємо, що знайшли час поділитися своїми думками про наш застосунок! Ваш відгук допоможе нам стати кращими.</p>
        <h3>📝 Ваш відгук:</h3>
        <p><strong>Оцінка:</strong> {'★' * feedback_data['rating']}{'☆' * (5 - feedback_data['rating'])} ({feedback_data['rating']}/5)</p>
        <p><strong>Категорія:</strong> {feedback_data['category']}</p>
        <p><strong>Дата подання:</strong> {datetime.now().strftime('%d.%m.%Y о %H:%M')}</p>
        <h3>🚀 Що далі?</h3>
        <ul>
            <li>Ми розглянемо ваш відгук протягом 24-48 годин</li>
            <li>За необхідності зв'яжемося з вами для уточнень</li>
            <li>Постараємося врахувати ваші пропозиції в наступних оновленнях</li>
        </ul>
        <p>Ще раз дякуємо за вашу підтримку та довіру!</p>
        <p>З повагою,<br>Команда розробки</p>
        <hr>
        <p style="font-size: 0.9em; color: #666;">
            Цей лист було відправлено автоматично. Будь ласка, не відповідайте на нього.
            Якщо у вас є питання, напишіть нам на <a href="mailto:tttkhaimyk@gmail.com">tttkhaimyk@gmail.com</a>
        </p>
    </div>
    """

def create_user_text_template(feedback_data):
    """Текстовий шаблон для користувача"""
    return f"""
✅ ДЯКУЄМО ЗА ВАШ ВІДГУК!

Шановний(на) {feedback_data['name']},

Дякуємо, що знайшли час поділитися своїми думками про наш застосунок!

📝 ВАШ ВІДГУК:
Оцінка: {feedback_data['rating']}/5
Категорія: {feedback_data['category']}
Дата: {datetime.now().strftime('%d.%m.%Y о %H:%M')}

🚀 ЩО ДАЛІ?
• Ми розглянемо ваш відгук протягом 24-48 годин
• За необхідності зв'яжемося з вами
• Постараємося врахувати ваші пропозиції

З повагою,
Команда розробки

---
Якщо у вас є питання, напишіть на: tttkhaimyk@gmail.com
    """

def send_feedback_emails(feedback_data):
    """Відправляє email адміністратору та користувачу"""
    sender_email = current_app.config.get('MAIL_DEFAULT_SENDER')
    if not sender_email:
        print("Помилка: MAIL_DEFAULT_SENDER не налаштовано в конфігурації")
        return False

    recipient_email = os.getenv('FEEDBACK_RECIPIENT_EMAIL')
    if not recipient_email:
        print("Помилка: FEEDBACK_RECIPIENT_EMAIL не налаштовано в змінних середовища")
        return False

    print(f"Спроба відправити email для {feedback_data['email']} з відправником {sender_email}")
    try:
        # Лист для адміна
        msg_admin = Message(
            subject=f"Новий відгук від {feedback_data['name']}",
            sender=sender_email,
            recipients=[recipient_email],
            body=create_admin_text_template(feedback_data),
            html=create_admin_html_template(feedback_data)
        )
        mail.send(msg_admin)
        print("Email адміну відправлено")

        # Лист для користувача
        msg_user = Message(
            subject="Дякуємо за ваш відгук!",
            sender=sender_email,
            recipients=[feedback_data['email']],
            body=create_user_text_template(feedback_data),
            html=create_user_confirmation_template(feedback_data)
        )
        mail.send(msg_user)
        print("Email користувачу відправлено")

        return True
    except Exception as e:
        print(f"Помилка відправки email: {str(e)}")
        return False

@feedback.route('/feedback', methods=['POST'])
def submit_feedback():
    """Endpoint для отримання відгуків від користувачів"""
    try:
        # Отримуємо дані з запиту
        data = request.get_json()
        if not data:
            return create_response(
                status_code=400,
                message='Не надано даних'
            )

        print(f"Отримано feedback: {data.get('name', 'Невідомо')} - {data.get('rating', 0)}/5")

        # Валідуємо дані
        try:
            validated_data = FeedbackSchema(**data)
        except ValidationError as e:
            print(f"Помилка валідації: {e.errors()}")
            return create_response(
                status_code=400,
                message='Неправильні дані форми',
                details=e.errors()
            )

        feedback_data = validated_data.dict()
        feedback_data['submitted_at'] = datetime.now().isoformat()

        # Відправляємо emails
        emails_sent = send_feedback_emails(feedback_data)

        return create_response(
            status_code=200,
            message='Відгук успішно відправлено! Дякуємо за вашу думку.',
            data={
                'submitted_at': feedback_data['submitted_at'],
                'emails_sent': emails_sent,
                'confirmation_sent': emails_sent
            }
        )

    except Exception as e:
        print(f"Загальна помилка в feedback: {str(e)}")
        return create_response(
            status_code=500,
            message='Внутрішня помилка сервера',
            details=str(e)
        )

@feedback.route('/feedback/stats', methods=['GET'])
@logged_in_required
def get_feedback_stats():
    """Отримання статистики відгуків (тільки для авторизованих користувачів)"""
    return create_response(
        status_code=200,
        message='Статистика відгуків',
        data={
            'total_feedback': 0,
            'average_rating': 0,
            'categories': {},
            'note': 'Статистика буде доступна після додавання бази даних для збереження відгуків'
        }
    )