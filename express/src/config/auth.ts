export const authConfig = {
  jwt: {
    expire: +process.env.JWT_EXPIRES_IN || 60,
    secret: process.env.JWT_SECRET || 'secret',
  },
  bcrypt: {
    saltRounds: 12,
  },
};
