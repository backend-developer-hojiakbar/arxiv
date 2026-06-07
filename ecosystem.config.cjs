module.exports = {
  apps: [
    {
      name: "arxiv",
      script: "dist/server.cjs",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
