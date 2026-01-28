# StickerBot

Voice to AI-generated stickers, printed instantly.

A web application that converts voice descriptions into AI-generated sticker designs and prints them using a thermal Bluetooth printer.

## Features

- **Voice Input** - Hold the microphone button and describe what you want
- **AI Generation** - Uses OpenAI DALL-E 3 to create sticker-ready images
- **Thermal Printing** - Print directly to a connected Cat Printer via Bluetooth

## Tech Stack

- Next.js 14 / React 18 / TypeScript
- Tailwind CSS
- OpenAI API (DALL-E 3)
- Web Bluetooth API
- Web Speech API

## Requirements

- Node.js 18+
- OpenAI API key
- Chrome or Edge browser (required for Web Bluetooth and Web Speech APIs)
- Cat Printer thermal sticker printer (optional, for printing)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` and add your OpenAI API key:

```
OPENAI_API_KEY=sk-your-api-key-here
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in Chrome or Edge.

## Usage

1. Click and hold the microphone button
2. Describe the sticker you want (e.g., "a happy cat with sunglasses")
3. Release to generate the sticker
4. Connect your thermal printer via the "Connect Printer" button
5. Print your sticker

## Project Structure

```
app/
  api/generate/route.ts  # DALL-E image generation endpoint
  page.tsx               # Main page
components/
  MicButton.tsx          # Voice recording button
  ImageDisplay.tsx       # Generated sticker display
  PrinterControls.tsx    # Bluetooth printer controls
lib/
  catPrinter.ts          # Bluetooth printer driver
  imageProcessor.ts      # Image processing for thermal printing
  speech.ts              # Speech recognition wrapper
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT
