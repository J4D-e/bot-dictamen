# Dictamen Bot

Bot de Telegram que genera dictámenes técnicos de equipo de cómputo a partir de un oficio (PDF, Word o foto). Lee el oficio con IA, pide solo los datos que faltan y devuelve un `.docx` listo para imprimir, con una hoja de dictamen por equipo.

## Qué hace

- Recibe el oficio por Telegram en **PDF, Word (.docx) o imagen**.
- Extrae con IA (Gemini) el número y fecha del oficio, remitente, cargo y la tabla de equipos (tipo, marca, modelo, serie e inventario), aunque el formato cambie según el área.
- Detecta lo que no venga en el oficio y lo pide en **un solo mensaje**, únicamente los campos que faltan. El inventario es opcional y sale como `S/N`.
- Pide los datos propios del dictamen: número de oficio de respuesta, número inicial de dictamen, iniciales de los técnicos y motivo. Las iniciales se pueden escribir directamente o por nombre, usando una lista de técnicos.
- Genera el documento a partir de una plantilla Word fija:
  - Hoja 1: oficio de respuesta con la tabla de todos los equipos.
  - Una hoja de dictamen por cada equipo, con numeración consecutiva.
- Todo lo que agrega va en mayúsculas, excepto la fecha del encabezado y las iniciales.
- Acomoda el cargo del remitente en líneas tipo escalera y mantiene el minutario y las iniciales juntos al pie de la hoja.
- Guarda una copia de cada dictamen en disco, nombrada con el número de oficio, para buscarla después.

## Flujo

```
Telegram ──► oficio (PDF/DOCX/foto)
               │
               ▼
        extract.js  ──► Gemini (JSON con schema)
               │
               ▼
   ¿faltan datos? ──sí──► mensaje a Telegram ──► respuesta "campo: valor"
               │no
               ▼
        generate.js ──► docxtemplater sobre plantilla ──► .docx
               │
               ▼
        Telegram ◄── dictamen + copia en data/dictamenes/
```

## Stack

- Node.js (ES modules)
- [Telegraf](https://telegraf.js.org/): bot de Telegram
- Gemini API: extracción estructurada de PDF e imágenes
- [mammoth](https://github.com/mwilliamson/mammoth.js): lectura de `.docx`
- [docxtemplater](https://docxtemplater.com/) + PizZip: generación del documento
- PM2: ejecución continua en un VPS

## Estructura

```
.
├── index.js              # Bot: recepción de archivos, conversación y envío
├── extract.js            # Extracción con Gemini y detección de campos faltantes
├── generate.js           # Render de la plantilla Word
├── layout.js             # Cargo en escalera y ajuste de espacios de la firma
├── tecnicos.js           # Resolución de iniciales por nombre o iniciales
├── tecnicos.example.json # Ejemplo de la lista de técnicos
├── templates/            # Plantilla dictamen.docx (no se versiona)
├── data/                 # Dictámenes generados (no se versiona)
├── .env.example
└── package.json
```

## Instalación

Requiere Node.js 20 o superior, un bot de Telegram (token de [@BotFather](https://t.me/BotFather)) y una API key de [Google AI Studio](https://aistudio.google.com/).

```bash
git clone https://github.com/J4D-e/bot-dictamen
cd dictamen-bot
npm install
cp .env.example .env
cp tecnicos.example.json tecnicos.json
```

Edita `.env`:

| Variable | Descripción |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Token del bot |
| `GEMINI_API_KEY` | API key de Google AI Studio |
| `GEMINI_MODELS` | Modelos a intentar en orden, separados por coma. Si uno está saturado o no existe, pasa al siguiente |
| `DICTAMEN_TEMPLATE_PATH` | Ruta de la plantilla, por defecto `./templates/dictamen.docx` |
| `DATA_DIR` | Carpeta donde se guardan los dictámenes, por defecto `./data` |

Coloca tu plantilla en `templates/dictamen.docx` (ver siguiente sección).

## Ejecución

```bash
node index.js
```

En producción, con PM2:

```bash
pm2 start index.js --name dictamen-bot
pm2 save
pm2 logs dictamen-bot
```

El bot usa polling, así que no necesita dominio ni puertos abiertos.

## Uso

1. Envía el oficio al bot como archivo (PDF o Word) o como foto.
2. El bot responde con los datos que faltan. Contesta en líneas `campo: valor`:

   ```
   numero_oficio: 1/2026
   dictamen_inicial: 400
   iniciales: igf/dsa
   motivo: OBSOLESCENCIA TECNOLÓGICA
   equipo_2_numero_serie: ABC123
   ```

3. Con todos los datos completos, el bot genera el dictamen y lo envía por el mismo chat.

Las iniciales aceptan iniciales (`igf/dsa`) o nombres de la lista `tecnicos.json` (`Iván, David`). Para un motivo distinto en un equipo usa `equipo_N_motivo`.

## Plantilla

La plantilla es un `.docx` con etiquetas de [docxtemplater](https://docxtemplater.com/docs/tag-types/). No se incluye en el repositorio porque lleva logotipos y texto institucional.

| Etiqueta | Contenido |
|---|---|
| `{numero_oficio}` | Número del oficio de respuesta |
| `{fecha_larga}` / `{fecha_larga_mayus}` | Fecha del día, en minúsculas y en mayúsculas |
| `{nombre_remitente}`, `{cargo_remitente}` | Datos de quien envió el oficio |
| `{oficio_recibido}`, `{fecha_oficio_recibido}` | Oficio al que se responde |
| `{frase_equipos}` | "del siguiente equipo" o "de los siguientes equipos" |
| `{iniciales}` | Iniciales de los técnicos |
| `{#equipos}…{/equipos}` | Bucle: una fila de la tabla y una hoja de dictamen por equipo |
| `{num_dictamen}`, `{tipo_equipo}`, `{marca}`, `{modelo}`, `{numero_serie}`, `{numero_inventario}`, `{motivo}`, `{otros_componentes}` | Datos dentro del bucle |
| `{#sp_a1}` … `{#sp_b2}` | Párrafos de espacio que se quitan cuando la firma no cabe en la hoja |

## Limitaciones conocidas

- El ajuste de espacios de la firma es una **estimación** del tamaño de la hoja; Word no permite medirla antes de abrir el archivo. En casos límite la firma puede pasar completa a la hoja siguiente. Las constantes están al inicio de `layout.js`.
- El plan gratuito de la API de Gemini tiene límites de uso y Google puede usar lo enviado para mejorar sus modelos. Si los oficios contienen información sensible, usa un proyecto con facturación activa.
- Solo se procesa una foto por oficio; para oficios de varias páginas conviene enviar un PDF.
