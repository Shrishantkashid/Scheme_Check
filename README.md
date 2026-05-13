# Scheme Check

Expo React Native frontend with a Node.js/Express backend for scheme recommendations.

## AWS/Expo API configuration

Physical Android/iOS devices cannot call `localhost` or `127.0.0.1` on your development machine or EC2 server. Configure the Expo app with the deployed AWS backend URL instead:

```bash
EXPO_PUBLIC_API_URL=http://YOUR_EC2_PUBLIC_IP:5000/api
```

Update `YOUR_EC2_PUBLIC_IP` to your EC2 public IP, public DNS, or HTTPS domain. If you later add a domain or load balancer, change the value to something like:

```bash
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api
```

The fallback placeholder is documented in `constants/config.ts`; prefer using `.env`/EAS environment variables instead of editing code for each deployment. `app.json` keeps `android.usesCleartextTraffic` enabled so HTTP EC2 URLs can be tested on Android, but HTTPS is recommended for production.

## Backend environment

Create `backend/.env` from `backend/.env.example` and set:

- `PORT=5000`
- `MONGODB_URI=...`
- `GROQ_API_KEY=...`
- `CORS_ORIGIN=...` optional comma-separated web origins. Leave unset for Expo/mobile development.

The backend listens on `0.0.0.0` so it can receive traffic on AWS EC2.

## AWS EC2 security group

For the mobile app to reach the backend, the EC2 security group must allow inbound TCP traffic for your backend port, usually `5000`. For production, put the API behind HTTPS on ports `443`/`80` through Nginx, a load balancer, or API Gateway, and point `EXPO_PUBLIC_API_URL` to the HTTPS URL.

## Development

```bash
npm install
npm run web
```

```bash
cd backend
npm install
npm start
```
