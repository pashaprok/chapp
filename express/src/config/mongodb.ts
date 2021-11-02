export const mongodbConfig = {
  link: process.env.DBLINK.replace('<password>', process.env.DBPASS),
};
