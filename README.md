# ChuweyWebDev AI Assistant

A professional AI chat assistant with code playground capabilities, specifically designed for developers. It provides an interactive interface for communicating with AI models hosted by Ollama.

## Features

- Clean and professional UI with dark/light mode
- Support for multiple AI models (Phi, DeepSeek Coder, Mistral)
- Code highlighting for multiple programming languages
- Interactive code playground for HTML
- Responsive design for both desktop and mobile
- Chat history saving
- Copy code functionality
- Markdown and code formatting support

## Models Supported

- `phi:latest` (3B parameters) - Default model, fast responses for general questions
- `deepseek-coder:6.7b-instruct` (6.7B parameters) - Specialized for programming and code assistance
- `mistral:latest` (7.2B parameters) - Advanced reasoning and comprehensive responses

## Setup Instructions

### Prerequisites

- Docker and Docker Compose
- NVIDIA GPU with CUDA support (for optimal performance)
- Internet connection for pulling Docker images

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/chuweywebdev-ai-assistant.git
   cd chuweywebdev-ai-assistant
   ```

2. Start the services:
   ```
   docker-compose up -d
   ```

3. Pull the required models:
   ```
   docker exec -it ollama ollama pull phi:latest
   docker exec -it ollama ollama pull deepseek-coder:6.7b-instruct
   docker exec -it ollama ollama pull mistral:latest
   ```

4. Access the web interface:
   ```
   http://localhost:1001
   ```

## Usage

- Select an AI model from the dropdown
- Type your message and press Enter or click the send button
- Clear your chat history using the trash icon
- Toggle between light and dark modes with the theme button
- Use the code playground to edit and preview HTML code
- Copy code snippets to the clipboard with the copy button

## Development

To modify the project:

1. Edit the HTML, CSS, and JavaScript in the `site` directory
2. Customize Nginx settings in `nginx/conf.d/default.conf`
3. Adjust container configurations in `docker-compose.yml`

## License

MIT License - See LICENSE file for details

## Credits

- Tailwind CSS for styling
- Highlight.js for code highlighting
- Font Awesome for icons
- Ollama for AI model hosting 