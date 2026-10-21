# tuben. — Frontend

React + TypeScript frontend built with Vite.

## Run locally

```powershell
npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:5080`. See the backend repository for API setup. Deploy this repository root to Azure Static Web Apps.

For production, set the Static Web App build variable `VITE_API_BASE_URL` to the public base URL of the .NET API (for example, `https://your-api.azurewebsites.net`). Set `FrontendOrigins` in the backend App Service configuration to the Static Web App origin. These settings are required because the frontend and API deploy separately.

Visit [Kollatuben.se](https://gray-cliff-099bc6d03.1.azurestaticapps.net/)
