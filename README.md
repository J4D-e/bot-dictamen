# bot-dictamen

Bot de Telegram que automatiza la generación de dictámenes de equipo de cómputo a partir de oficios.

## Stack
Node.js · Telegram Bot API · OpenAI · docxtemplater

## Requisitos
Node.js 18+

## Instalación
git clone https://github.com/J4D-e/bot-dictamen.git
cd bot-dictamen
npm install
cp .env.example .env   # completa tus claves
npm start

## Variables de entorno
| Variable | Descripción |
|---|---|
| TELEGRAM_TOKEN | Token de @BotFather |
| OPENAI_API_KEY | Clave de OpenAI |

## Uso
1. Envía el oficio al bot.
2. El bot extrae los datos y genera el dictamen en .docx.

## Estructura
(breve árbol de carpetas)

## Licencia
MIT
