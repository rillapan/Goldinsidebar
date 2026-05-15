/**
 * PM2 Ecosystem Config — GoldMind AI (Windows + Linux compatible)
 *
 * Cara pakai:
 *   pm2 start ecosystem.config.js          # jalankan semua
 *   pm2 start ecosystem.config.js --only ai-engine
 *   pm2 restart ecosystem.config.js
 *   pm2 stop ecosystem.config.js
 *   pm2 logs
 */

module.exports = {
  apps: [
    {
      name: "ai-engine",
      // Python uvicorn — gunakan python -m agar bekerja di Windows maupun Linux
      script: "python",
      args: "-X utf8 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload",
      cwd: "./ai-engine",
      interpreter: "none",
      env: {
        NODE_ENV: "development",
      },
      // Restart jika crash, tunggu 3 detik
      restart_delay: 3000,
      max_restarts: 10,
      // Log output
      out_file: "../logs/ai-engine-out.log",
      error_file: "../logs/ai-engine-error.log",
      merge_logs: true,
      time: true,
    },
    {
      name: "backend",
      script: "npm",
      args: "run dev",
      cwd: "./backend",
      interpreter: "none",
      restart_delay: 3000,
      max_restarts: 10,
      out_file: "../logs/backend-out.log",
      error_file: "../logs/backend-error.log",
      merge_logs: true,
      time: true,
    },
    {
      name: "frontend",
      script: "npm",
      args: "run dev",
      cwd: "./frontend",
      interpreter: "none",
      restart_delay: 3000,
      max_restarts: 10,
      out_file: "../logs/frontend-out.log",
      error_file: "../logs/frontend-error.log",
      merge_logs: true,
      time: true,
    },
  ],
};
