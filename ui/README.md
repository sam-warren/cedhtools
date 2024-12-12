# cedhtools frontend

This is the frontend repository for the **cedhtools** application. Built with **React** and **Vite**, it connects to a backend API for managing the application functionality.

**Note**: This project uses **MUI Joy** as its component and styling library.

## Getting Started

Follow the steps below to set up and run the application locally.

### Prerequisites

Ensure you have the following tools installed:

- [Node.js](https://nodejs.org/) (version 16 or later)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sam-warren/cedhtools.git
   cd ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create an `.env` file in the root directory and add the following:
   ```env
   VITE_CEDHTOOLS_API_BASE_URL=http://localhost:8000
   ```
### Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:5173` to view the application.

## Environment Variables

The application relies on the `.env` file for configuration. Ensure you provide the following environment variable:

- `VITE_CEDHTOOLS_API_BASE_URL`: Base URL for the backend API.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue to suggest improvements or report bugs.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
