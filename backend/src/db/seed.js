const { pool } = require('./pool');

async function seed() {
  console.log('Seed concluido. O app nao usa autenticacao de usuarios.');
}

seed()
  .then(() => pool.end())
  .catch((error) => {
    console.error(error);
    pool.end();
    process.exit(1);
  });
